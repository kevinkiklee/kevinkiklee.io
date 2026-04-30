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
});
