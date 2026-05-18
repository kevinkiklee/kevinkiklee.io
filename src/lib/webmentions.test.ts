import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the env module BEFORE importing the SUT so the token can be controlled.
vi.mock('astro:env/server', () => ({
  WEBMENTION_TOKEN: 'test-token',
}));

const { fetchWebmentions } = await import('./webmentions');

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function jf2(children: Array<Record<string, unknown>>) {
  return { ok: true, json: async () => ({ children }) };
}

describe('fetchWebmentions wm-property mapping', () => {
  it('maps in-reply-to to "reply"', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          url: 'https://example.com/a',
          author: { name: 'A', url: 'https://a.example' },
          content: { text: 'hi' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('reply');
  });

  it('maps like-of to "like"', async () => {
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'like-of', published: '2026-01-01' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('like');
  });

  it('maps repost-of to "repost"', async () => {
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'repost-of', published: '2026-01-01' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('repost');
  });

  it('falls back to "mention" for unknown wm-property', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([{ 'wm-property': 'bookmark-of', published: '2026-01-01' }]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('mention');
  });
});

describe('fetchWebmentions strips unsafe URLs', () => {
  it('drops javascript: and data: photo URLs', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          url: 'https://example.com/a',
          author: {
            name: 'A',
            url: 'javascript:alert(1)',
            photo: 'data:image/svg+xml;base64,...',
          },
          content: { text: 'hi' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.author.url).toBe('');
    expect(out[0]?.author.photo).toBeUndefined();
  });

  it('keeps http(s) URLs intact', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          url: 'https://example.com/a',
          author: {
            name: 'A',
            url: 'https://a.example/',
            photo: 'https://gravatar.com/avatar/abc',
          },
          content: { text: 'hi' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.author.url).toBe('https://a.example/');
    expect(out[0]?.author.photo).toBe('https://gravatar.com/avatar/abc');
  });
});

describe('fetchWebmentions drops malformed published timestamps', () => {
  it('skips mentions with no published field', async () => {
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'in-reply-to' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });

  it('skips mentions with unparseable published date', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([{ 'wm-property': 'in-reply-to', published: 'not-a-date' }]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });

  it('normalises a valid date to ISO', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([{ 'wm-property': 'in-reply-to', published: '2026-01-01' }]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.published).toBe('2026-01-01T00:00:00.000Z');
  });

  // Webmention.io has been observed to return an `1970-01-01` for records
  // with a corrupt or missing upstream timestamp. The webmention protocol
  // dates back to ~2014 — anything pre-2010 is nonsense.
  it('rejects an epoch-zero (pre-2010) date as nonsense', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([{ 'wm-property': 'in-reply-to', published: '1970-01-01' }]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });

  it('rejects a far-future date so a corrupt record cannot ship', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([{ 'wm-property': 'in-reply-to', published: '9999-12-31' }]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });
});

describe('fetchWebmentions short-circuits', () => {
  it('returns [] when fetch responds with !ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });

  it('returns [] (catches) when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
  });
});

describe('fetchWebmentions length caps', () => {
  it('truncates names over 60 chars with an ellipsis', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          author: { name: 'A'.repeat(120), url: 'https://a.example' },
          content: { text: 'short' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.author.name.length).toBe(60);
    expect(out[0]?.author.name.endsWith('…')).toBe(true);
  });

  it('truncates content text over 600 chars with an ellipsis', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          author: { name: 'A', url: 'https://a.example' },
          content: { text: 'x'.repeat(1500) },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.content.text.length).toBe(600);
    expect(out[0]?.content.text.endsWith('…')).toBe(true);
  });

  it('clips by code-point so emoji surrogate pairs stay intact', async () => {
    // 😀 is U+1F600 — two UTF-16 code units, one code point. With code-unit
    // slicing, repeating 😀 60 times yields a 120-unit string and slicing
    // at 59 lands in the middle of a surrogate pair, producing an invalid
    // trailing char before the ellipsis.
    const name = '😀'.repeat(80);
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          author: { name, url: 'https://a.example' },
          content: { text: 'short' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    const clipped = out[0]?.author.name ?? '';
    // 59 emoji + 1 ellipsis = 60 code points, ellipsis present, no lone surrogates.
    expect([...clipped].length).toBe(60);
    expect(clipped.endsWith('…')).toBe(true);
    expect(clipped.slice(0, -1)).toBe('😀'.repeat(59));
  });

  it('keeps short names and content intact', async () => {
    mockFetch.mockResolvedValueOnce(
      jf2([
        {
          'wm-property': 'in-reply-to',
          author: { name: 'Kevin', url: 'https://a.example' },
          content: { text: 'great post!' },
          published: '2026-01-01',
        },
      ]),
    );
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.author.name).toBe('Kevin');
    expect(out[0]?.content.text).toBe('great post!');
  });
});

describe('fetchWebmentions missing-token short-circuit', () => {
  it('returns [] without calling fetch when token is empty', async () => {
    // Re-mock to simulate missing token, then re-import to get a fresh module.
    vi.resetModules();
    vi.doMock('astro:env/server', () => ({ WEBMENTION_TOKEN: '' }));
    const { fetchWebmentions: noTokenFetch } = await import('./webmentions');
    const out = await noTokenFetch('https://kevinkiklee.io/posts/foo');
    expect(out).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
    vi.doUnmock('astro:env/server');
  });
});
