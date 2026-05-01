import { describe, expect, it } from 'vitest';
import type { Crumb } from './crumbs';
import {
  ENTITY_IDS,
  SPEAKABLE_SELECTORS,
  buildAuthorRef,
  buildBlog,
  buildBlogPosting,
  buildBreadcrumbs,
  buildCollectionPage,
  buildItemListOfBlogPostings,
  buildItemListOfDefinedTerms,
  buildItemListOfSoftwareSourceCode,
  buildPageGraph,
  buildPerson,
  buildSpeakable,
  buildWebPage,
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

describe('buildPerson', () => {
  it('produces a Person with sameAs links and filters undefined', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: 'https://github.com/kevinkiklee',
      bio: 'A developer and writer.',
    });
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Kevin Lee');
    expect(ld.sameAs).toEqual([
      'https://mastodon.social/@kevinkiklee',
      'https://github.com/kevinkiklee',
    ]);
  });

  it('includes linkedin and bluesky when provided', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: 'https://github.com/kevinkiklee',
      linkedin: 'https://www.linkedin.com/in/kevinkiklee/',
      bluesky: 'https://bsky.app/profile/kevinkiklee.bsky.social',
      bio: 'A developer and writer.',
    });
    expect(ld.sameAs).toHaveLength(4);
    expect((ld.sameAs as string[])[2]).toBe('https://www.linkedin.com/in/kevinkiklee/');
    expect((ld.sameAs as string[])[3]).toBe('https://bsky.app/profile/kevinkiklee.bsky.social');
  });

  it('filters empty-string sameAs entries', () => {
    const ld = buildPerson({
      mastodon: 'https://mastodon.social/@kevinkiklee',
      github: '',
      bio: 'A developer and writer.',
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

describe('buildBlog', () => {
  it('returns a Blog entity at the stable @id', () => {
    const out = buildBlog();
    expect(out['@type']).toBe('Blog');
    expect(out['@id']).toBe(ENTITY_IDS.blog);
    expect(out.name).toBe('kevinkiklee.io');
    expect(out.url).toBe('https://kevinkiklee.io/posts');
  });
});

describe('buildAuthorRef', () => {
  it('returns a {@id} reference to the canonical Person', () => {
    expect(buildAuthorRef()).toEqual({ '@id': ENTITY_IDS.person });
  });
});

describe('SPEAKABLE_SELECTORS / buildSpeakable', () => {
  it('exports lead and h1 as speakable selectors', () => {
    expect(SPEAKABLE_SELECTORS).toEqual(['.lead', 'h1']);
  });

  it('builds a SpeakableSpecification', () => {
    expect(buildSpeakable()).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.lead', 'h1'],
    });
  });
});

describe('buildBlogPosting (refactored)', () => {
  const base = {
    url: 'https://kevinkiklee.io/posts/x',
    title: 'Title',
    description: 'Desc',
    pubDate: new Date('2026-01-01'),
    tags: ['perf', 'web'],
    imageUrl: 'https://kevinkiklee.io/og/x.png',
    authorUrl: 'https://kevinkiklee.io/about',
  };

  it('uses author + publisher refs by @id', () => {
    const out = buildBlogPosting(base);
    expect(out.author).toEqual({ '@id': ENTITY_IDS.person });
    expect(out.publisher).toEqual({ '@id': ENTITY_IDS.person });
  });

  it('links isPartOf to Blog by @id', () => {
    expect(buildBlogPosting(base).isPartOf).toEqual({ '@id': ENTITY_IDS.blog });
  });

  it('sets articleSection from first tag', () => {
    expect(buildBlogPosting(base).articleSection).toBe('perf');
  });

  it('omits articleSection when no tags', () => {
    const out = buildBlogPosting({ ...base, tags: [] });
    expect(out.articleSection).toBeUndefined();
  });

  it('includes speakable + primaryImageOfPage', () => {
    const out = buildBlogPosting(base);
    expect(out.speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.lead', 'h1'],
    });
    expect(out.primaryImageOfPage).toEqual({ '@type': 'ImageObject', url: base.imageUrl });
  });

  it('throws on headline > 110 chars', () => {
    expect(() => buildBlogPosting({ ...base, title: 'a'.repeat(111) })).toThrow(/headline/);
  });

  it('embeds FAQPage when faq is provided', () => {
    const out = buildBlogPosting({
      ...base,
      faq: [{ q: 'Q1?', a: 'A1.' }],
    });
    expect(out.mainEntity).toEqual({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q1?',
          acceptedAnswer: { '@type': 'Answer', text: 'A1.' },
        },
      ],
    });
  });

  it('omits mainEntity when faq is empty/missing', () => {
    expect(buildBlogPosting(base).mainEntity).toBeUndefined();
    expect(buildBlogPosting({ ...base, faq: [] }).mainEntity).toBeUndefined();
  });

  it('emits license + copyrightYear when provided', () => {
    const out = buildBlogPosting({
      ...base,
      license: 'https://creativecommons.org/licenses/by/4.0/',
    });
    expect(out.license).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(out.copyrightYear).toBe(2026);
  });
});

describe('buildPerson (refactored)', () => {
  const base = {
    mastodon: 'https://m.example/@k',
    github: 'https://github.com/k',
    bio: 'Field-notes writer.',
  };

  it('uses the canonical @id', () => {
    expect(buildPerson(base)['@id']).toBe(ENTITY_IDS.person);
  });

  it('exposes specific knowsAbout topics', () => {
    expect(buildPerson(base).knowsAbout).toEqual([
      'Web platform',
      'Chrome DevTools',
      'Developer Relations',
      'JavaScript',
      'AI tooling',
      'Web performance',
      'Browser engines',
    ]);
  });

  it('omits image when portraitUrl unset', () => {
    expect(buildPerson(base).image).toBeUndefined();
  });

  it('emits image when portraitUrl is set', () => {
    const out = buildPerson({ ...base, portraitUrl: 'https://example.com/p.jpg' });
    expect(out.image).toBe('https://example.com/p.jpg');
  });

  it('filters undefined sameAs entries', () => {
    const out = buildPerson({ ...base, linkedin: undefined, bluesky: undefined });
    expect(out.sameAs).toEqual([base.mastodon, base.github]);
  });

  it('includes description from bio', () => {
    expect(buildPerson(base).description).toBe(base.bio);
  });
});

describe('buildCollectionPage', () => {
  it('points mainEntity at the ItemList @id', () => {
    const out = buildCollectionPage({
      url: 'https://kevinkiklee.io/posts',
      name: 'Posts',
      description: 'All posts',
      itemListId: 'https://kevinkiklee.io/posts#list',
    });
    expect(out['@type']).toBe('CollectionPage');
    expect(out['@id']).toBe('https://kevinkiklee.io/posts');
    expect(out.mainEntity).toEqual({ '@id': 'https://kevinkiklee.io/posts#list' });
    expect(out.inLanguage).toBe('en-US');
  });
});

describe('buildItemListOfBlogPostings', () => {
  it('emits ListItem with @id refs to each post', () => {
    const out = buildItemListOfBlogPostings({
      id: 'https://kevinkiklee.io/posts#list',
      posts: [
        { url: 'https://kevinkiklee.io/posts/a', title: 'A' },
        { url: 'https://kevinkiklee.io/posts/b', title: 'B' },
      ],
    });
    expect(out['@type']).toBe('ItemList');
    expect(out['@id']).toBe('https://kevinkiklee.io/posts#list');
    expect(out.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        url: 'https://kevinkiklee.io/posts/a',
        name: 'A',
        item: { '@id': 'https://kevinkiklee.io/posts/a' },
      },
      {
        '@type': 'ListItem',
        position: 2,
        url: 'https://kevinkiklee.io/posts/b',
        name: 'B',
        item: { '@id': 'https://kevinkiklee.io/posts/b' },
      },
    ]);
  });
});

describe('buildItemListOfSoftwareSourceCode', () => {
  it('maps repoUrl → codeRepository, tech → programmingLanguage', () => {
    const out = buildItemListOfSoftwareSourceCode({
      id: 'https://kevinkiklee.io/projects#list',
      projects: [
        {
          name: 'photo-tools',
          url: 'https://github.com/k/photo-tools',
          repoUrl: 'https://github.com/k/photo-tools',
          blurb: 'A toolkit.',
          tech: ['nextjs', 'typescript'],
        },
      ],
    });
    expect(out.itemListElement).toHaveLength(1);
    const first = (out.itemListElement as Record<string, unknown>[])[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.position).toBe(1);
      expect(first.item).toMatchObject({
        '@type': 'SoftwareSourceCode',
        name: 'photo-tools',
        url: 'https://github.com/k/photo-tools',
        codeRepository: 'https://github.com/k/photo-tools',
        description: 'A toolkit.',
        programmingLanguage: ['nextjs', 'typescript'],
      });
    }
  });
});

describe('buildItemListOfDefinedTerms', () => {
  it('emits DefinedTerm items with name + url', () => {
    const out = buildItemListOfDefinedTerms({
      id: 'https://kevinkiklee.io/tags#list',
      tags: [{ name: 'perf', url: 'https://kevinkiklee.io/tags/perf' }],
    });
    const first = (out.itemListElement as Record<string, unknown>[])[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.item).toMatchObject({
        '@type': 'DefinedTerm',
        name: 'perf',
        url: 'https://kevinkiklee.io/tags/perf',
      });
    }
  });
});

describe('buildWebPage', () => {
  it('returns a WebPage with stable @id', () => {
    const out = buildWebPage({
      url: 'https://kevinkiklee.io/privacy',
      name: 'Privacy',
      description: 'Privacy policy',
    });
    expect(out).toMatchObject({
      '@type': 'WebPage',
      '@id': 'https://kevinkiklee.io/privacy',
      name: 'Privacy',
      description: 'Privacy policy',
      inLanguage: 'en-US',
    });
  });
});

describe('buildBreadcrumbs (refactored)', () => {
  it('maps Crumb[] to BreadcrumbList JSON-LD with absolute URLs', () => {
    const crumbs: Crumb[] = [
      { name: '~', url: '/' },
      { name: 'posts', url: '/posts' },
      { name: 'Hello', url: '/posts/hello' },
    ];
    const out = buildBreadcrumbs(crumbs, 'https://kevinkiklee.io');
    expect(out['@type']).toBe('BreadcrumbList');
    expect(out.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: '~', item: 'https://kevinkiklee.io/' },
      { '@type': 'ListItem', position: 2, name: 'posts', item: 'https://kevinkiklee.io/posts' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Hello',
        item: 'https://kevinkiklee.io/posts/hello',
      },
    ]);
  });
});
