import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ImageResponse } from '@vercel/og';
import type { APIContext } from 'astro';
import { formatDate } from '~/lib/format';
import { ogTemplate } from '~/lib/og';
import { getPublishedPosts } from '~/lib/posts';
import { DEFAULT_OG_IMAGE } from '~/lib/site-config';

export const prerender = false;

const dsn = process.env.SENTRY_DSN_OG;
let sentryReady = false;

/**
 * Lazy-import @sentry/node only when a DSN is configured. The Sentry SDK
 * adds ~150 KB to the cold-start bundle, so we keep it out of the function
 * graph entirely when unused.
 */
async function ensureSentry(): Promise<typeof import('@sentry/node') | null> {
  if (!dsn) return null;
  const Sentry = await import('@sentry/node');
  if (!sentryReady) {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    sentryReady = true;
  }
  return Sentry;
}

// Static (instanced) bold cut — @vercel/og/Satori's opentype.js parser
// cannot parse JetBrainsMono variable font's fvar table reliably.
//
// Both reads are wrapped so a missing/renamed asset surfaces as a 503 at
// request time instead of crashing the function module on cold start
// (which would 500 EVERY route the file is bundled into).
function readOptional(absPath: string): Buffer | null {
  try {
    return readFileSync(absPath);
  } catch (err) {
    console.error(`[og] asset unavailable at ${absPath}:`, err);
    return null;
  }
}
const fontData = readOptional(resolve('./public/fonts/og/JetBrainsMono-Bold.ttf'));
// Pre-read the default PNG so we can serve it as a binary fallback when
// satori rendering fails. Social-network unfurlers fetch og:image directly,
// so a 500 here breaks every preview for the affected post — returning a
// valid (if generic) image keeps social cards working while we investigate.
const fallbackPng = readOptional(resolve(`./public${DEFAULT_OG_IMAGE}`));

function fallbackResponse(): Response {
  if (!fallbackPng) {
    return new Response('og unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  // TS narrows BodyInit to ArrayBuffer-backed views only, but Node's Buffer
  // can carry a SharedArrayBuffer or ArrayBufferLike. Cast through unknown:
  // at runtime fetch's Response accepts any Uint8Array and the Buffer bytes
  // are immutable for our purposes (read once at module load).
  return new Response(fallbackPng as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      'X-OG-Fallback': '1',
    },
  });
}

// Post slugs are date-stripped lowercase ASCII with `-` separators (see
// content.config.ts). Reject anything else early — it cannot map to a
// post and probing the collection just wastes function time + adds noise
// to logs for crawlers fuzzing the endpoint.
const SLUG_OK = /^[a-z0-9][a-z0-9-]{0,80}$/;

// Error responses need an explicit Cache-Control or they inherit the
// route-level `s-maxage=1year, immutable` from vercel.ts — i.e. a single
// 400/404/503 would pin per-slug at the edge until next deploy.
function errorResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(ctx: APIContext) {
  // If the bundled font is missing, ship the static fallback rather than
  // letting Satori crash with a cryptic glyph-table error per request.
  if (!fontData) return fallbackResponse();
  try {
    const slug = ctx.url.searchParams.get('slug');
    if (!slug) return errorResponse('missing slug', 400);
    if (!SLUG_OK.test(slug)) return errorResponse('bad slug', 400);
    const posts = await getPublishedPosts();
    const post = posts.find((p) => p.id === slug);
    if (!post) return errorResponse('not found', 404);
    const tree = ogTemplate({
      title: post.data.title,
      date: formatDate(post.data.pubDate),
      tags: post.data.tags,
    });
    // satori-html returns a vdom node whose declared `props` typing is wider
    // than ImageResponse's (`React.ReactNode`). Their runtime shapes line up,
    // so we widen explicitly via a structural cast rather than `any`.
    type ReactLike = ConstructorParameters<typeof ImageResponse>[0];
    return new ImageResponse(tree as unknown as ReactLike, {
      width: 1200,
      height: 630,
      fonts: [{ name: 'JetBrains Mono', data: fontData, weight: 700, style: 'normal' }],
      headers: {
        'Cache-Control': 'public, s-maxage=31536000, immutable, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    const Sentry = await ensureSentry();
    Sentry?.captureException(err);
    console.error('og render failed', err);
    return fallbackResponse();
  }
}
