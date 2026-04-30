import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, sortByDateDesc } from '~/lib/posts';

export async function GET(context: APIContext) {
  if (!context.site) throw new Error('astro.config site must be set');
  const posts = sortByDateDesc(await getPublishedPosts());
  return rss({
    title: 'kevinkiklee.io',
    description: 'Field notes from a Chrome DevRel — AI, web platform, tangents.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
