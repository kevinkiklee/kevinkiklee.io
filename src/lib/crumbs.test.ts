import { describe, expect, it } from 'vitest';
import { crumbsFor } from './crumbs';

describe('crumbsFor', () => {
  it('returns empty for home and 404', () => {
    expect(crumbsFor('/')).toEqual([]);
    expect(crumbsFor('/404')).toEqual([]);
  });

  it('builds a single-segment trail', () => {
    expect(crumbsFor('/about')).toEqual([
      { name: '~', url: '/' },
      { name: 'about', url: '/about' },
    ]);
  });

  it('builds posts index trail', () => {
    expect(crumbsFor('/posts')).toEqual([
      { name: '~', url: '/' },
      { name: 'posts', url: '/posts' },
    ]);
  });

  it('builds paginated posts trail', () => {
    expect(crumbsFor('/posts/page/3')).toEqual([
      { name: '~', url: '/' },
      { name: 'posts', url: '/posts' },
      { name: 'page 3', url: '/posts/page/3' },
    ]);
  });

  it('builds post-detail trail using the title (truncated to 50 chars)', () => {
    const title = 'A'.repeat(60);
    const result = crumbsFor('/posts/my-slug', { title });
    expect(result).toHaveLength(3);
    expect(result[2]?.name).toBe(`${'A'.repeat(49)}…`);
    expect(result[2]?.url).toBe('/posts/my-slug');
  });

  it('keeps short titles intact', () => {
    const result = crumbsFor('/posts/my-slug', { title: 'Short Title' });
    expect(result[2]?.name).toBe('Short Title');
  });

  it('builds tag-detail trail', () => {
    expect(crumbsFor('/tags/perf')).toEqual([
      { name: '~', url: '/' },
      { name: 'tags', url: '/tags' },
      { name: 'perf', url: '/tags/perf' },
    ]);
  });

  it('builds projects, tags index, privacy', () => {
    expect(crumbsFor('/projects').map((c) => c.name)).toEqual(['~', 'projects']);
    expect(crumbsFor('/tags').map((c) => c.name)).toEqual(['~', 'tags']);
    expect(crumbsFor('/privacy').map((c) => c.name)).toEqual(['~', 'privacy']);
  });

  it('truncates surrogate-pair titles cleanly (no lone surrogates)', () => {
    // 49 ASCII chars + 2 emoji. Code-point length is 51 (49 + 2). UTF-16-naive
    // `slice(0, 49)` would emit `A…A…A` followed by a lone high surrogate
    // (U+D83C) at the cut. The code-point-aware truncate keeps the cut on a
    // visual character boundary instead.
    const title = `${'A'.repeat(49)}🎉🎉`;
    const result = crumbsFor('/posts/my-slug', { title });
    const name = result[2]?.name ?? '';
    expect(name.endsWith('…')).toBe(true);
    // Iterate by code point and verify no lone surrogates leaked through.
    for (let i = 0; i < name.length; i++) {
      const code = name.charCodeAt(i);
      const isHigh = code >= 0xd800 && code <= 0xdbff;
      const isLow = code >= 0xdc00 && code <= 0xdfff;
      if (isHigh) {
        const next = name.charCodeAt(i + 1);
        expect(next >= 0xdc00 && next <= 0xdfff).toBe(true);
        i += 1; // skip the matched low surrogate
      } else {
        expect(isLow).toBe(false);
      }
    }
  });
});
