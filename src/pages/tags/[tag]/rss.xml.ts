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
  const posts = sortByDateDesc(
    (await getPublishedPosts()).filter((p) => p.data.tags.includes(tag)),
  );
  return rss({
    title: `kevinkiklee.io — #${tag}`,
    description: `Posts tagged ${tag}.`,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
    })),
  });
}
