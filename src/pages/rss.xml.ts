import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, sortByDateDesc } from '~/lib/posts';
import { SITE } from '~/lib/site-config';

export async function GET(context: APIContext) {
  if (!context.site) throw new Error('astro.config site must be set');
  const posts = sortByDateDesc(await getPublishedPosts());
  // RSS lastBuildDate = the newest pubDate or updatedDate across all posts.
  // Falls back to "now" for an empty archive so validators don't reject the
  // feed for missing the field.
  const newest = posts.reduce<number>(
    (acc, p) => Math.max(acc, (p.data.updatedDate ?? p.data.pubDate).getTime()),
    0,
  );
  const lastBuild = newest > 0 ? new Date(newest) : new Date();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
      // Explicit guid: stable, opaque identifier so a slug rename doesn't
      // resurface the post as new in feed readers.
      customData: `<guid isPermaLink="true">${new URL(`/posts/${p.id}`, context.site).toString()}</guid>`,
    })),
    customData: `<language>en-US</language><lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
  });
}
