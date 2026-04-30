import type { APIContext } from 'astro';

export const prerender = false;

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
  if (auth !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return new Response('no hook configured', { status: 503 });
  const r = await fetch(url, { method: 'POST' });
  return new Response(JSON.stringify({ ok: r.ok }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
