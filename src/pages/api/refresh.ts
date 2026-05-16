import { timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';

export const prerender = false;

/**
 * Constant-time string compare so an attacker can't byte-by-byte time the
 * Authorization header. Buffers must be the same length, so we early-out
 * on length mismatch (length itself isn't secret) before the safe compare.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Vercel Cron-only endpoint that pings a deploy hook to rebuild the site.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
 * when CRON_SECRET is configured in the project's environment variables.
 * Anything else gets a 401. Without CRON_SECRET, the endpoint refuses to
 * run at all — fail closed rather than open.
 */
export async function GET(ctx: APIContext) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response('CRON_SECRET not configured', { status: 503 });
  }
  const auth = ctx.request.headers.get('authorization') ?? '';
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    return new Response('unauthorized', { status: 401 });
  }
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return new Response('no hook configured', { status: 503 });
  // Fail closed if the env var is corrupt or accidentally points at a non-
  // Vercel host. Vercel deploy hooks are always under api.vercel.com.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('malformed deploy hook URL', { status: 503 });
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.vercel.com') {
    console.error(`[refresh] deploy hook URL rejected: ${parsed.protocol}//${parsed.hostname}`);
    return new Response('deploy hook URL must be https://api.vercel.com/...', { status: 503 });
  }
  // Hard 10s timeout. The deploy-hook POST normally returns in <500ms; if
  // Vercel's upstream is wedged, we'd rather fail with an actionable 502
  // than let the function chew through its execution budget.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(url, { method: 'POST', signal: ctrl.signal });
    if (!r.ok) {
      console.error(`[refresh] deploy hook returned ${r.status} ${r.statusText}`);
    }
    return new Response(JSON.stringify({ ok: r.ok, status: r.status }), {
      status: r.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Don't 500 the cron — the hook URL itself or upstream Vercel may be
    // transiently unreachable, and a 502 keeps the cron run observable
    // without paging the platform's serverless error rate alarms. Log so
    // the failure shows up in Vercel function logs for the cron run.
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const message = isAbort
      ? 'timed out after 10000ms'
      : err instanceof Error
        ? err.message
        : 'unknown';
    console.error(`[refresh] deploy hook failed: ${message}`);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}
