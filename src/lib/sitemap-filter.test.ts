import { describe, expect, it } from 'vitest';
import { shouldIncludeInSitemap } from './sitemap-filter';

const ORIGIN = 'https://kevinkiklee.io';
const SLUGS = new Set(['hello-world', 'second-post']);

function u(path: string) {
  return `${ORIGIN}${path}`;
}

describe('shouldIncludeInSitemap', () => {
  it('excludes /api/* and the 404 route', () => {
    expect(shouldIncludeInSitemap(u('/api/og'), SLUGS)).toBe(false);
    expect(shouldIncludeInSitemap(u('/api/refresh'), SLUGS)).toBe(false);
    expect(shouldIncludeInSitemap(u('/404'), SLUGS)).toBe(false);
  });

  it('includes published post detail URLs', () => {
    expect(shouldIncludeInSitemap(u('/posts/hello-world'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/posts/second-post'), SLUGS)).toBe(true);
  });

  it('excludes unknown post detail URLs (drafts in production)', () => {
    expect(shouldIncludeInSitemap(u('/posts/draft-only'), SLUGS)).toBe(false);
  });

  it('always includes /posts/page/N pagination URLs', () => {
    // Regression guard: an earlier version captured the trailing segment "2"
    // via POST_DETAIL_RE and dropped pagination URLs once the archive grew
    // past one page (since "2" is not a published slug). Pagination URLs
    // MUST stay in the sitemap regardless of published slugs.
    expect(shouldIncludeInSitemap(u('/posts/page/2'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/posts/page/3'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/posts/page/99'), SLUGS)).toBe(true);
  });

  it('keeps the rest of the site in the sitemap', () => {
    expect(shouldIncludeInSitemap(u('/'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/about'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/posts'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/tags/web-platform'), SLUGS)).toBe(true);
    expect(shouldIncludeInSitemap(u('/projects'), SLUGS)).toBe(true);
  });
});
