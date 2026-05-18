import type { APIContext } from 'astro';
import { getPublishedPosts, sortByDateDesc } from '~/lib/posts';
import { SITE } from '~/lib/site-config';

/**
 * Per-item cap on `content_text` chars. JSON Feed 1.1 doesn't bound the
 * payload, and shipping every post body would push the feed past 1 MB for
 * a busy archive — slow for readers and pointless for clients that just
 * want a teaser before navigating to the canonical URL. 4 KB keeps the
 * teaser useful (≈600 words) without bloating the feed envelope.
 */
const FEED_CONTENT_TEXT_MAX = 4000;

function clipContent(raw: string | undefined, fallback: string): string {
  const src = raw && raw.length > 0 ? raw : fallback;
  // Iterate by code point so slicing a body containing emoji or CJK
  // supplementary characters doesn't cut a surrogate pair in half (which
  // would render `\uD83D` as a lone surrogate in feed readers that
  // surface byte-for-byte content).
  const cps = Array.from(src);
  if (cps.length <= FEED_CONTENT_TEXT_MAX) return src;
  return `${cps.slice(0, FEED_CONTENT_TEXT_MAX - 1).join('')}…`;
}

export async function GET(context: APIContext) {
  if (!context.site) throw new Error('astro.config site must be set');
  const site = context.site;
  const posts = sortByDateDesc(await getPublishedPosts());
  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.title,
    home_page_url: site.toString(),
    feed_url: new URL('/feed.json', site).toString(),
    description: SITE.description,
    language: 'en-US',
    // JSON Feed 1.1 supports `icon` (large square, ≥512px) and `favicon`
    // (~64px). Readers display these in the feed list / sidebar.
    icon: new URL('/favicon-512.png', site).toString(),
    favicon: new URL('/favicon-32.png', site).toString(),
    authors: [{ name: SITE.author, url: site.toString() }],
    items: posts.map((p) => ({
      id: new URL(`/posts/${p.id}`, site).toString(),
      url: new URL(`/posts/${p.id}`, site).toString(),
      title: p.data.title,
      summary: p.data.description,
      // JSON Feed 1.1 requires `content_html` OR `content_text`. We ship a
      // capped slice of the raw markdown body as plain text (readers strip
      // the formatting) and fall back to the description when the body is
      // unavailable (e.g. in older content layer snapshots).
      content_text: clipContent(p.body, p.data.description),
      date_published: p.data.pubDate.toISOString(),
      date_modified: (p.data.updatedDate ?? p.data.pubDate).toISOString(),
      tags: p.data.tags,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
