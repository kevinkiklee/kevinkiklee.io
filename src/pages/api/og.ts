import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ImageResponse } from '@vercel/og';
import type { APIContext } from 'astro';
import { formatDate } from '~/lib/format';
import { ogTemplate } from '~/lib/og';
import { getPublishedPosts } from '~/lib/posts';

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
const fontPath = resolve('./public/fonts/og/JetBrainsMono-Bold.ttf');
const fontData = readFileSync(fontPath);

// Pre-read the default PNG so we can serve it as a binary fallback when
// satori rendering fails. Social-network unfurlers fetch og:image directly,
// so a 500 here breaks every preview for the affected post — returning a
// valid (if generic) image keeps social cards working while we investigate.
const fallbackPath = resolve('./public/og-default.png');
const fallbackPng = readFileSync(fallbackPath);

export async function GET(ctx: APIContext) {
  try {
    const slug = ctx.url.searchParams.get('slug');
    if (!slug) return new Response('missing slug', { status: 400 });
    const posts = await getPublishedPosts();
    const post = posts.find((p) => p.id === slug);
    if (!post) return new Response('not found', { status: 404 });
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
    // Serve the default PNG as a binary fallback. Cache for 5 min so retries
    // hit a fresh dynamic render once whatever broke is fixed.
    return new Response(fallbackPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        'X-OG-Fallback': '1',
      },
    });
  }
}
