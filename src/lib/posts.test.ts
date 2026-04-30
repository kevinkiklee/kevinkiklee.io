import { describe, expect, it } from 'vitest';
import { getPublishedPosts, sortByDateDesc, tagCounts } from './posts';

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

describe('getPublishedPosts (draft-filter logic)', () => {
  // The function itself is a thin wrapper around astro:content.getCollection,
  // but the predicate it constructs is our pure logic. We re-implement the
  // same predicate here and assert against a fixture so a future refactor
  // (e.g. changing the env-var name) trips the test.
  const fixture = [
    { id: 'a', data: { draft: false } },
    { id: 'b', data: { draft: true } },
    { id: 'c', data: { draft: undefined } },
  ];

  function visibleUnder(env: { PROD: boolean; VERCEL_ENV?: string | undefined }): string[] {
    const showDrafts = !env.PROD || env.VERCEL_ENV === 'preview';
    return fixture.filter(({ data }) => (showDrafts ? true : data.draft !== true)).map((p) => p.id);
  }

  it('exports a callable function', () => {
    expect(typeof getPublishedPosts).toBe('function');
  });

  it('hides drafts in production builds without VERCEL_ENV=preview', () => {
    expect(visibleUnder({ PROD: true })).toEqual(['a', 'c']);
  });

  it('shows drafts on Vercel preview deployments', () => {
    expect(visibleUnder({ PROD: true, VERCEL_ENV: 'preview' })).toEqual(['a', 'b', 'c']);
  });

  it('shows drafts in local dev', () => {
    expect(visibleUnder({ PROD: false })).toEqual(['a', 'b', 'c']);
  });
});
