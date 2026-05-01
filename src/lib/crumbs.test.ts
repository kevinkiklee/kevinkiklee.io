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
});
