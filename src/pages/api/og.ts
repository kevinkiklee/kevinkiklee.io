import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCollection } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import type { APIContext } from 'astro';
import { ogTemplate } from '~/lib/og';

export const prerender = false;

// Static (instanced) bold cut — @vercel/og/Satori's opentype.js parser
// cannot parse JetBrainsMono variable font's fvar table reliably.
const fontPath = resolve('./public/fonts/og/JetBrainsMono-Bold.ttf');
const fontData = readFileSync(fontPath);

export async function GET(ctx: APIContext) {
  const slug = ctx.url.searchParams.get('slug');
  if (!slug) return new Response('missing slug', { status: 400 });
  const posts = await getCollection('posts');
  const post = posts.find((p) => p.id === slug);
  if (!post) return new Response('not found', { status: 404 });
  const tree = ogTemplate({
    title: post.data.title,
    date: post.data.pubDate.toISOString().slice(0, 10),
    tags: post.data.tags,
  });
  // biome-ignore lint/suspicious/noExplicitAny: satori-html returns a structure compatible with @vercel/og
  return new ImageResponse(tree as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'JetBrains Mono', data: fontData, weight: 700, style: 'normal' }],
    headers: {
      'Cache-Control': 'public, s-maxage=31536000, immutable, stale-while-revalidate=86400',
    },
  });
}
