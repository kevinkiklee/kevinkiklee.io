import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function tagCounts(posts: Post[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of posts) for (const t of p.data.tags) out[t] = (out[t] ?? 0) + 1;
  return out;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const { getCollection } = await import('astro:content');
  const env = import.meta.env;
  const vercelEnv = env.VERCEL_ENV as string | undefined;
  return getCollection('posts', ({ data }) => {
    if (env.PROD && vercelEnv !== 'preview') return data.draft !== true;
    return true;
  });
}
