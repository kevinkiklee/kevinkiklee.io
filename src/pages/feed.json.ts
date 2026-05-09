import type { APIContext } from 'astro';
import { getPublishedPosts, sortByDateDesc } from '~/lib/posts';

export async function GET(context: APIContext) {
  if (!context.site) throw new Error('astro.config site must be set');
  const site = context.site;
  const posts = sortByDateDesc(await getPublishedPosts());
  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'kevinkiklee.io',
    home_page_url: site.toString(),
    feed_url: new URL('/feed.json', site).toString(),
    description: 'Field notes from a Chrome DevRel.',
    language: 'en-US',
    // JSON Feed 1.1 supports `icon` (large square, ≥512px) and `favicon`
    // (~64px). Readers display these in the feed list / sidebar.
    icon: new URL('/favicon-512.png', site).toString(),
    favicon: new URL('/favicon-32.png', site).toString(),
    authors: [{ name: 'Kevin Lee', url: site.toString() }],
    items: posts.map((p) => ({
      id: new URL(`/posts/${p.id}`, site).toString(),
      url: new URL(`/posts/${p.id}`, site).toString(),
      title: p.data.title,
      summary: p.data.description,
      // JSON Feed 1.1 requires `content_html` OR `content_text`. We ship the
      // raw markdown body as plain text (readers strip the formatting) and
      // fall back to the description when the body is unavailable (e.g. in
      // older content layer snapshots).
      content_text: p.body || p.data.description,
      date_published: p.data.pubDate.toISOString(),
      date_modified: (p.data.updatedDate ?? p.data.pubDate).toISOString(),
      tags: p.data.tags,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
