import type { APIContext } from 'astro';

export const prerender = false;

export async function GET(_ctx: APIContext) {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return new Response('no hook configured', { status: 503 });
  const r = await fetch(url, { method: 'POST' });
  return new Response(JSON.stringify({ ok: r.ok }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
