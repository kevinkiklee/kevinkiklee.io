import { describe, expect, it } from 'vitest';
import {
  buildBlog,
  buildBlogPosting,
  buildBreadcrumbs,
  buildPageGraph,
  buildPerson,
  buildWebSite,
  ENTITY_IDS,
} from '../src/lib/schema';

describe('page @graph composition', () => {
  it('@id uniqueness: every entity in graph has a unique @id', () => {
    const graph = buildPageGraph([
      buildWebSite(),
      buildBlog(),
      buildPerson({ mastodon: 'm', github: 'g', bio: 'b' }),
      buildBreadcrumbs(
        [
          { name: '~', url: '/' },
          { name: 'about', url: '/about' },
        ],
        'https://kevinkiklee.io',
      ),
    ]);
    const ids = graph['@graph']
      .map((p) => (p as Record<string, unknown>)['@id'])
      .filter((id): id is string => typeof id === 'string');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Person ref + full Person dedupes to one full entity', () => {
    const ref = { '@id': ENTITY_IDS.person };
    const full = buildPerson({ mastodon: 'm', github: 'g', bio: 'b' });
    const graph = buildPageGraph([ref, full]);
    const persons = graph['@graph'].filter(
      (p) => (p as Record<string, unknown>)['@id'] === ENTITY_IDS.person,
    );
    expect(persons).toHaveLength(1);
    expect(persons[0]).toEqual(full);
  });

  it('FAQ schema mirrors visible Q/A list', () => {
    const faq = [
      { q: 'Q1?', a: 'A1.' },
      { q: 'Q2?', a: 'A2.' },
    ];
    const post = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'X',
      description: 'D',
      pubDate: new Date('2026-01-01'),
      tags: [],
      imageUrl: 'https://kevinkiklee.io/og/x.png',
      authorUrl: 'https://kevinkiklee.io/about',
      faq,
    });
    const main = post.mainEntity as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(main.mainEntity.map((m) => m.name)).toEqual(faq.map((f) => f.q));
    expect(main.mainEntity.map((m) => m.acceptedAnswer.text)).toEqual(faq.map((f) => f.a));
  });
});
