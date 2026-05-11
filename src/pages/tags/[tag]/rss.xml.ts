import rss from '@astrojs/rss';
import type { APIContext, GetStaticPaths } from 'astro';
import { getPublishedPosts, sortByDateDesc, tagCounts } from '~/lib/posts';

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return Object.keys(tagCounts(posts)).map((tag) => ({ params: { tag } }));
}) satisfies GetStaticPaths;

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
  return rss({
    title: `kevinkiklee.io — #${tag}`,
    description: `Posts tagged ${tag}.`,
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
      // Stable, opaque GUID — a slug rename mustn't resurface the post in
      // feed readers as new. Mirrors the per-item GUID emitted by /rss.xml.
      customData: `<guid isPermaLink="true">${new URL(`/posts/${p.id}`, site).toString()}</guid>`,
    })),
    customData: `<language>en-US</language><lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
  });
}
