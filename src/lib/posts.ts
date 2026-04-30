import { type CollectionEntry, getCollection } from 'astro:content';

type Post = CollectionEntry<'posts'>;

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function tagCounts(posts: Post[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of posts) for (const t of p.data.tags) out[t] = (out[t] ?? 0) + 1;
  return out;
}

/**
 * Returns posts visible in the current environment.
 *
 * - Production builds: drafts are filtered out.
 * - Vercel preview deployments (`VERCEL_ENV=preview`): drafts are included
 *   so authors can review unpublished work pre-merge.
 * - Local dev: all posts (drafts included).
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const env = import.meta.env;
  const vercelEnv = env.VERCEL_ENV as string | undefined;
  const showDrafts = !env.PROD || vercelEnv === 'preview';
  return getCollection('posts', ({ data }) => {
    if (showDrafts) return true;
    return data.draft !== true;
  });
}
