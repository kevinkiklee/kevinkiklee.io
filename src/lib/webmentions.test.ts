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
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'like-of' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('like');
  });

  it('maps repost-of to "repost"', async () => {
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'repost-of' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('repost');
  });

  it('falls back to "mention" for unknown wm-property', async () => {
    mockFetch.mockResolvedValueOnce(jf2([{ 'wm-property': 'bookmark-of' }]));
    const out = await fetchWebmentions('https://kevinkiklee.io/posts/foo');
    expect(out[0]?.type).toBe('mention');
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
