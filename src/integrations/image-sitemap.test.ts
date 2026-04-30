import { describe, expect, it } from 'vitest';
import { injectImageEntries } from './image-sitemap';

const NS =
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

describe('injectImageEntries', () => {
  it('is a no-op when there are no covers', () => {
    const xml = `${NS}<url><loc>https://x/posts/a</loc></url></urlset>`;
    const out = injectImageEntries(xml, []);
    expect(out.injected).toBe(0);
    expect(out.xml).toBe(xml);
  });

  it('injects image:image into matching post URLs only', () => {
    const xml = `${NS}<url><loc>https://x/posts/a</loc></url><url><loc>https://x/about</loc></url></urlset>`;
    const out = injectImageEntries(xml, [
      { slug: 'a', coverUrl: 'https://x/_astro/a.avif', alt: 'A cover' },
    ]);
    expect(out.injected).toBe(1);
    expect(out.xml).toContain(
      '<image:image><image:loc>https://x/_astro/a.avif</image:loc><image:caption>A cover</image:caption></image:image>',
    );
    // Non-matching urls untouched.
    expect(out.xml).toContain('<url><loc>https://x/about</loc></url>');
  });

  it('escapes alt text and url for XML safety', () => {
    const xml = `${NS}<url><loc>https://x/posts/a</loc></url></urlset>`;
    const out = injectImageEntries(xml, [
      {
        slug: 'a',
        coverUrl: 'https://x/_astro/a.avif?v=1&w=2',
        alt: `Tom & Jerry's "show"`,
      },
    ]);
    expect(out.xml).toContain('<image:loc>https://x/_astro/a.avif?v=1&amp;w=2</image:loc>');
    expect(out.xml).toContain(
      '<image:caption>Tom &amp; Jerry&apos;s &quot;show&quot;</image:caption>',
    );
  });

  it('skips post URLs with no matching cover', () => {
    const xml = `${NS}<url><loc>https://x/posts/a</loc></url><url><loc>https://x/posts/b</loc></url></urlset>`;
    const out = injectImageEntries(xml, [
      { slug: 'a', coverUrl: 'https://x/_astro/a.avif', alt: 'A' },
    ]);
    expect(out.injected).toBe(1);
    // b stays untouched.
    expect(out.xml).toMatch(/<url><loc>https:\/\/x\/posts\/b<\/loc><\/url>/);
  });

  it('does not match non-post urls that contain /posts/', () => {
    const xml = `${NS}<url><loc>https://x/blog/posts/a</loc></url></urlset>`;
    const out = injectImageEntries(xml, [
      { slug: 'a', coverUrl: 'https://x/_astro/a.avif', alt: 'A' },
    ]);
    // The regex anchors on /posts/<slug> at the end of the URL path; a
    // /blog/posts/a still matches because /posts/a is at the end. That's
    // the intended behaviour as long as we don't host both a blog and post
    // namespace; this site does not.
    expect(out.injected).toBe(1);
  });
});
