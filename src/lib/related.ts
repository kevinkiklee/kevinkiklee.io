import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

/**
 * Rank candidate posts by relevance to a target post.
 *
 * Strategy:
 *  1. Exclude the target itself.
 *  2. Score by tag overlap (number of shared tags).
 *  3. Break ties by recency (newer first).
 *  4. Drop posts with zero overlap unless we don't have enough; in that
 *     case, fill from most-recent posts so we always return up to `limit`.
 *
 * Pure function — easy to unit test.
 */
export function relatedPosts(target: Post, candidates: Post[], limit = 3): Post[] {
  const targetTags = new Set(target.data.tags ?? []);
  const others = candidates.filter((p) => p.id !== target.id);

  const scored = others.map((p) => {
    const tags = p.data.tags ?? [];
    let overlap = 0;
    for (const t of tags) if (targetTags.has(t)) overlap += 1;
    return { post: p, overlap };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime();
  });

  const withOverlap = scored.filter((s) => s.overlap > 0).map((s) => s.post);
  if (withOverlap.length >= limit) return withOverlap.slice(0, limit);

  // Fill remaining slots with most-recent non-target posts.
  const filler = others
    .filter((p) => !withOverlap.includes(p))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return [...withOverlap, ...filler].slice(0, limit);
}
