import { describe, expect, it } from 'vitest';
import { sortByDateDesc, tagCounts } from './posts';

describe('sortByDateDesc', () => {
  it('sorts posts newest first', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const a = { data: { pubDate: new Date('2026-01-01') } } as any;
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const b = { data: { pubDate: new Date('2026-04-01') } } as any;
    expect(sortByDateDesc([a, b])[0]).toBe(b);
  });
});

describe('tagCounts', () => {
  it('counts tags across posts', () => {
    const posts = [
      { data: { tags: ['ai', 'devrel'] } },
      { data: { tags: ['ai'] } },
      { data: { tags: [] } },
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
    ] as any;
    expect(tagCounts(posts)).toEqual({ ai: 2, devrel: 1 });
  });
});
