import { describe, expect, it } from 'vitest';
import { buildBlogPosting, buildBreadcrumbs, buildPerson, buildWebSite } from './schema';

describe('buildBlogPosting', () => {
  it('produces a valid BlogPosting', () => {
    const ld = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'Title',
      description: 'desc',
      pubDate: new Date('2026-04-12'),
      tags: ['ai'],
      imageUrl: 'https://kevinkiklee.io/api/og?slug=x',
      wordCount: 600,
      minutesRead: 3,
      authorUrl: 'https://kevinkiklee.io/about',
    });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('Title');
    expect(ld.timeRequired).toBe('PT3M');
    expect(ld.inLanguage).toBe('en-US');
    expect(ld.wordCount).toBe(600);
    expect(ld.datePublished).toBe(new Date('2026-04-12').toISOString());
    expect(ld.dateModified).toBe(new Date('2026-04-12').toISOString());
  });

  it('uses updatedDate for dateModified when provided', () => {
    const ld = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'Title',
      description: 'desc',
      pubDate: new Date('2026-04-12'),
      updatedDate: new Date('2026-04-20'),
      tags: ['ai'],
      imageUrl: 'https://kevinkiklee.io/og.png',
      authorUrl: 'https://kevinkiklee.io/about',
    });
    expect(ld.dateModified).toBe(new Date('2026-04-20').toISOString());
  });

  it('omits wordCount and timeRequired when not provided', () => {
    const ld = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'Title',
      description: 'desc',
      pubDate: new Date('2026-04-12'),
      tags: [],
      imageUrl: 'https://kevinkiklee.io/og.png',
      authorUrl: 'https://kevinkiklee.io/about',
    });
    expect('wordCount' in ld).toBe(false);
    expect('timeRequired' in ld).toBe(false);
  });
});

describe('buildBreadcrumbs', () => {
  it('builds breadcrumbs from path segments', () => {
    const ld = buildBreadcrumbs([
      { name: 'Home', url: 'https://kevinkiklee.io/' },
      { name: 'Posts', url: 'https://kevinkiklee.io/posts' },
      { name: 'Title', url: 'https://kevinkiklee.io/posts/x' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0]?.position).toBe(1);
    expect(ld.itemListElement[2]?.name).toBe('Title');
    expect(ld.itemListElement[2]?.item).toBe('https://kevinkiklee.io/posts/x');
  });
});

describe('buildPerson', () => {
  it('produces a Person with sameAs links and filters undefined', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevin',
      github: 'https://github.com/kevinkiklee',
    });
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Kevin Lee');
    expect(ld.sameAs).toEqual(['https://mastodon.social/@kevin', 'https://github.com/kevinkiklee']);
  });

  it('includes linkedin when provided', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevin',
      github: 'https://github.com/kevinkiklee',
      linkedin: 'https://www.linkedin.com/in/kevinkiklee/',
    });
    expect(ld.sameAs).toHaveLength(3);
    expect(ld.sameAs[2]).toBe('https://www.linkedin.com/in/kevinkiklee/');
  });
});

describe('buildWebSite', () => {
  it('produces a WebSite with SearchAction', () => {
    const ld = buildWebSite();
    expect(ld['@type']).toBe('WebSite');
    expect(ld.url).toBe('https://kevinkiklee.io');
    expect(ld.potentialAction['@type']).toBe('SearchAction');
    expect(ld.potentialAction.target.urlTemplate).toContain('/search?q={query}');
  });
});
