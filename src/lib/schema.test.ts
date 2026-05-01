import { describe, expect, it } from 'vitest';
import {
  ENTITY_IDS,
  buildBlogPosting,
  buildBreadcrumbs,
  buildPageGraph,
  buildPerson,
  buildWebSite,
} from './schema';

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

  it('omits wordCount when wordCount=0 (treats falsy as missing)', () => {
    // Documents the spread-with-`&&`-guard behaviour. wordCount=0 is falsy
    // and so is intentionally elided rather than emitted as 0; a 0-word
    // post is meaningless to schema.org consumers.
    const ld = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'Title',
      description: 'desc',
      pubDate: new Date('2026-04-12'),
      tags: [],
      imageUrl: 'https://kevinkiklee.io/og.png',
      wordCount: 0,
      minutesRead: 0,
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

  it('handles a single-item breadcrumb (just the current page)', () => {
    const ld = buildBreadcrumbs([{ name: 'Home', url: 'https://kevinkiklee.io/' }]);
    expect(ld.itemListElement).toHaveLength(1);
    expect(ld.itemListElement[0]?.position).toBe(1);
    expect(ld.itemListElement[0]?.name).toBe('Home');
  });

  it('returns an empty itemListElement for empty input', () => {
    const ld = buildBreadcrumbs([]);
    expect(ld.itemListElement).toEqual([]);
  });
});

describe('buildPerson', () => {
  it('produces a Person with sameAs links and filters undefined', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: 'https://github.com/kevinkiklee',
    });
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Kevin Lee');
    expect(ld.sameAs).toEqual([
      'https://mastodon.social/@kevinkiklee',
      'https://github.com/kevinkiklee',
    ]);
  });

  it('includes linkedin when provided', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: 'https://github.com/kevinkiklee',
      linkedin: 'https://www.linkedin.com/in/kevinkiklee/',
    });
    expect(ld.sameAs).toHaveLength(3);
    expect(ld.sameAs[2]).toBe('https://www.linkedin.com/in/kevinkiklee/');
  });

  it('drops empty-string sameAs entries (filter(Boolean))', () => {
    // The helper uses `.filter(Boolean)` which filters undefined AND
    // empty strings. This test pins that behaviour so a future refactor
    // (e.g. switching to `.filter((x) => x !== undefined)`) will trip.
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: '',
    });
    expect(ld.sameAs).toEqual(['https://mastodon.social/@kevinkiklee']);
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

describe('buildPageGraph', () => {
  it('exposes stable @ids', () => {
    expect(ENTITY_IDS.website).toBe('https://kevinkiklee.io#website');
    expect(ENTITY_IDS.person).toBe('https://kevinkiklee.io/about#person');
    expect(ENTITY_IDS.blog).toBe('https://kevinkiklee.io/posts#blog');
  });

  it('wraps parts in @context + @graph', () => {
    const out = buildPageGraph([{ '@type': 'WebPage', '@id': 'x' }]);
    expect(out['@context']).toBe('https://schema.org');
    expect(Array.isArray(out['@graph'])).toBe(true);
    expect(out['@graph']).toHaveLength(1);
  });

  it('deduplicates by @id, prefers full object over ref', () => {
    const ref = { '@id': 'https://example.com#x' };
    const full = { '@type': 'Person', '@id': 'https://example.com#x', name: 'A' };
    const out = buildPageGraph([ref, full, ref]);
    expect(out['@graph']).toHaveLength(1);
    expect(out['@graph'][0]).toEqual(full);
  });

  it('keeps entities without @id as-is (no dedup applies)', () => {
    const a = { '@type': 'Thing', name: 'A' };
    const b = { '@type': 'Thing', name: 'B' };
    const out = buildPageGraph([a, b]);
    expect(out['@graph']).toHaveLength(2);
  });
});
