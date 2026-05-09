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
    const dateDelta = b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime();
    if (dateDelta !== 0) return dateDelta;
    // Stable tie-break by id so identical-date / identical-overlap posts
    // produce reproducible ordering across builds + tests.
    return a.post.id.localeCompare(b.post.id);
  });

  const withOverlap = scored.filter((s) => s.overlap > 0).map((s) => s.post);
  if (withOverlap.length >= limit) return withOverlap.slice(0, limit);

  // Fill remaining slots with most-recent non-target posts. Use a Set keyed
  // on post id to keep filler-eligibility check O(1) per candidate; the
  // previous Array.includes() walk was O(n²) on large archives.
  const overlapIds = new Set(withOverlap.map((p) => p.id));
  const filler = others
    .filter((p) => !overlapIds.has(p.id))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return [...withOverlap, ...filler].slice(0, limit);
}
