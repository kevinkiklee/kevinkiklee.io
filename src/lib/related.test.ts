import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { relatedPosts } from './related';

type Post = CollectionEntry<'posts'>;

function mkPost(id: string, tags: string[], pubDate: string): Post {
  return {
    id,
    data: { tags, pubDate: new Date(pubDate) },
    // biome-ignore lint/suspicious/noExplicitAny: test fixture only needs id/data
  } as any;
}

describe('relatedPosts', () => {
  it('excludes the target post', () => {
    const target = mkPost('a', ['x'], '2026-01-01');
    const others = [target, mkPost('b', ['x'], '2026-02-01')];
    const out = relatedPosts(target, others, 5);
    expect(out.map((p) => p.id)).not.toContain('a');
  });

  it('ranks by tag overlap, then by recency', () => {
    const target = mkPost('a', ['x', 'y'], '2026-01-01');
    const candidates = [
      mkPost('b', ['x', 'y', 'z'], '2026-01-02'), // overlap 2
      mkPost('c', ['x'], '2026-04-01'), // overlap 1, newer
      mkPost('d', ['x'], '2026-02-01'), // overlap 1, older
      mkPost('e', ['q'], '2026-05-01'), // overlap 0
    ];
    const out = relatedPosts(target, candidates, 3);
    expect(out.map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('falls back to recency when not enough overlap', () => {
    const target = mkPost('a', ['x'], '2026-01-01');
    const candidates = [
      mkPost('b', ['x'], '2026-01-02'), // overlap 1
      mkPost('c', ['q'], '2026-04-01'), // overlap 0
      mkPost('d', ['r'], '2026-03-01'), // overlap 0
    ];
    const out = relatedPosts(target, candidates, 3);
    expect(out.map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('returns [] when there are no candidates', () => {
    const target = mkPost('a', ['x'], '2026-01-01');
    expect(relatedPosts(target, [target], 3)).toEqual([]);
    expect(relatedPosts(target, [], 3)).toEqual([]);
  });

  it('returns at most `limit` posts', () => {
    const target = mkPost('a', ['x'], '2026-01-01');
    const candidates = [
      mkPost('b', ['x'], '2026-01-02'),
      mkPost('c', ['x'], '2026-01-03'),
      mkPost('d', ['x'], '2026-01-04'),
      mkPost('e', ['x'], '2026-01-05'),
    ];
    expect(relatedPosts(target, candidates, 2)).toHaveLength(2);
  });

  it('breaks ties by recency descending when overlap counts are equal', () => {
    // All three candidates have the same overlap (1 tag in common).
    // Tie-break must be newest pubDate first.
    const target = mkPost('a', ['x'], '2026-01-01');
    const candidates = [
      mkPost('older', ['x'], '2026-01-02'),
      mkPost('newest', ['x'], '2026-04-15'),
      mkPost('middle', ['x'], '2026-02-10'),
    ];
    const out = relatedPosts(target, candidates, 3);
    expect(out.map((p) => p.id)).toEqual(['newest', 'middle', 'older']);
  });

  it('excludes the source post even when it appears with high overlap', () => {
    // Self-match would otherwise score perfectly on every tag.
    const target = mkPost('self', ['x', 'y', 'z'], '2026-01-01');
    const out = relatedPosts(target, [target, mkPost('b', ['x', 'y'], '2026-01-02')], 5);
    expect(out.map((p) => p.id)).toEqual(['b']);
    expect(out.map((p) => p.id)).not.toContain('self');
  });

  it('breaks ties by id when overlap and pubDate are identical', () => {
    // Two same-day posts must produce stable ordering across runs (otherwise
    // /posts/{slug} pages with identical published dates would shuffle on
    // every build, churning hashes / sitemap lastmods).
    const target = mkPost('a', ['x'], '2026-01-01');
    const candidates = [
      mkPost('zeta', ['x'], '2026-02-01'),
      mkPost('alpha', ['x'], '2026-02-01'),
      mkPost('mu', ['x'], '2026-02-01'),
    ];
    const out = relatedPosts(target, candidates, 3);
    expect(out.map((p) => p.id)).toEqual(['alpha', 'mu', 'zeta']);
  });
});
