import rss from '@astrojs/rss';
import type { APIContext, GetStaticPaths } from 'astro';
import { getPublishedPosts, sortByDateDesc, tagCounts } from '~/lib/posts';

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return Object.keys(tagCounts(posts)).map((tag) => ({ params: { tag } }));
}) satisfies GetStaticPaths;

/**
 * Mirror of /rss.xml's `xmlAttrEscape`. Kept inline (rather than imported
 * from a shared helper) because the rss.xml route is the only other
 * consumer and the two-line cost of duplication beats wiring a new
 * `lib/xml-escape.ts` shared module.
 */
function xmlAttrEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(context: APIContext) {
  const tag = context.params.tag;
  if (!tag) throw new Error('tag param missing');
  if (!context.site) throw new Error('astro.config site must be set');
  const site = context.site;
  const posts = sortByDateDesc(
    (await getPublishedPosts()).filter((p) => p.data.tags.includes(tag)),
  );
  // Match the per-feed envelope on /rss.xml: newest pubDate/updatedDate or
  // "now" for an empty tag, so feed validators don't reject missing lastBuild.
  const newest = posts.reduce<number>(
    (acc, p) => Math.max(acc, (p.data.updatedDate ?? p.data.pubDate).getTime()),
    0,
  );
  const lastBuild = newest > 0 ? new Date(newest) : new Date();
  // Per-tag feed URL, escaped for safe interpolation into the raw
  // `customData` XML below. <atom:link rel="self"> tells aggregators which
  // canonical URL serves this feed — required by the W3C feed validator
  // and mirrors the same line on the global /rss.xml route.
  const feedUrl = xmlAttrEscape(new URL(`/tags/${tag}/rss.xml`, site).toString());
  return rss({
    title: `kevinkiklee.io — #${tag}`,
    description: `Posts tagged ${tag}.`,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
      // Stable, opaque GUID — a slug rename mustn't resurface the post in
      // feed readers as new. Mirrors the per-item GUID emitted by /rss.xml.
      customData: `<guid isPermaLink="true">${xmlAttrEscape(new URL(`/posts/${p.id}`, site).toString())}</guid>`,
    })),
    customData: `<language>en-US</language><lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate><atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
  });
}
