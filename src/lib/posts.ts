import { type CollectionEntry, getCollection } from 'astro:content';

type Post = CollectionEntry<'posts'>;

/**
 * Number of posts shown per archive page. The first page (`/posts`) shows the
 * latest `POSTS_PER_PAGE` posts year-grouped, then `/posts/page/2..N` paginate
 * the older entries. Both surfaces import this constant so the slicing logic
 * stays in lockstep — a drift would silently overlap (duplicate posts shown
 * on page 1 and page 2) or skip (a post missing from both).
 */
export const POSTS_PER_PAGE = 30;

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

/**
 * Given a post and the full sorted list (newest-first), return its prev/next
 * siblings. Convention: `next` = newer post (chronological forward),
 * `prev` = older post.
 *
 * The input list MUST be sortByDateDesc-ordered.
 */
export function prevNextFor(post: Post, sortedPosts: Post[]): { prev?: Post; next?: Post } {
  const i = sortedPosts.findIndex((p) => p.id === post.id);
  if (i === -1) return {};
  const newer = sortedPosts[i - 1];
  const older = sortedPosts[i + 1];
  const out: { prev?: Post; next?: Post } = {};
  if (newer) out.next = newer;
  if (older) out.prev = older;
  return out;
}
