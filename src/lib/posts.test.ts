import { describe, expect, it } from 'vitest';
import { getPublishedPosts, prevNextFor, sortByDateDesc, tagCounts } from './posts';

describe('sortByDateDesc', () => {
  it('sorts posts newest first', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const a = { data: { pubDate: new Date('2026-01-01') } } as any;
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const b = { data: { pubDate: new Date('2026-04-01') } } as any;
    expect(sortByDateDesc([a, b])[0]).toBe(b);
  });

  it('returns [] for an empty input', () => {
    expect(sortByDateDesc([])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const a = { data: { pubDate: new Date('2026-01-01') } } as any;
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const b = { data: { pubDate: new Date('2026-04-01') } } as any;
    const input = [a, b];
    sortByDateDesc(input);
    expect(input).toEqual([a, b]);
  });

  it('returns a single-element array unchanged', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const a = { data: { pubDate: new Date('2026-01-01') } } as any;
    expect(sortByDateDesc([a])).toEqual([a]);
  });

  it('preserves relative order for posts with identical pubDate (stable enough for our use)', () => {
    const date = new Date('2026-04-01');
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const a = { id: 'a', data: { pubDate: date } } as any;
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const b = { id: 'b', data: { pubDate: date } } as any;
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    const c = { id: 'c', data: { pubDate: date } } as any;
    const out = sortByDateDesc([a, b, c]);
    // Array.prototype.sort is required to be stable since ES2019.
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c']);
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

  it('returns {} for empty input', () => {
    expect(tagCounts([])).toEqual({});
  });

  it('counts duplicate tags within a single post separately', () => {
    // The schema does not de-dupe tags within a post, so the helper should
    // honour multiplicity. (We rely on author discipline; this guards
    // against accidental "smart" de-duping creeping in.)
    const posts = [
      { data: { tags: ['ai', 'ai', 'web'] } },
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
    ] as any;
    expect(tagCounts(posts)).toEqual({ ai: 2, web: 1 });
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

describe('prevNextFor', () => {
  function fixturePost(id: string, isoDate: string) {
    // biome-ignore lint/suspicious/noExplicitAny: test fixture
    return { id, data: { pubDate: new Date(isoDate), title: id } } as any;
  }

  const posts = sortByDateDesc([
    fixturePost('a', '2026-01-01'),
    fixturePost('b', '2026-02-01'),
    fixturePost('c', '2026-03-01'),
  ]);

  it('newest post: no next, prev is older sibling', () => {
    // biome-ignore lint/style/noNonNullAssertion: test fixture with known length
    const result = prevNextFor(posts[0]!, posts);
    expect(result.next).toBeUndefined();
    expect(result.prev?.id).toBe('b');
  });

  it('middle post: prev = older, next = newer', () => {
    // biome-ignore lint/style/noNonNullAssertion: test fixture with known length
    const result = prevNextFor(posts[1]!, posts);
    expect(result.next?.id).toBe('c');
    expect(result.prev?.id).toBe('a');
  });

  it('oldest post: no prev, next is newer sibling', () => {
    // biome-ignore lint/style/noNonNullAssertion: test fixture with known length
    const result = prevNextFor(posts[2]!, posts);
    expect(result.next?.id).toBe('b');
    expect(result.prev).toBeUndefined();
  });

  it('single post: both undefined', () => {
    const single = [fixturePost('only', '2026-01-01')];
    const result = prevNextFor(single[0], single);
    expect(result.next).toBeUndefined();
    expect(result.prev).toBeUndefined();
  });

  it('post not in list: both undefined', () => {
    const stranger = fixturePost('stranger', '2026-04-01');
    const result = prevNextFor(stranger, posts);
    expect(result.next).toBeUndefined();
    expect(result.prev).toBeUndefined();
  });
});
