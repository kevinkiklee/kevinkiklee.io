import { describe, expect, it } from 'vitest';
import { buildLlmsIndex } from './aeo';

const fixturePosts = [
  {
    id: 'b',
    data: {
      title: 'B',
      description: 'Desc B',
      pubDate: new Date('2026-02-01'),
      draft: false,
    },
  },
  {
    id: 'a',
    data: {
      title: 'A',
      description: 'Desc A',
      pubDate: new Date('2026-01-01'),
      draft: false,
    },
  },
  {
    id: 'd',
    data: {
      title: 'Draft',
      description: 'X',
      pubDate: new Date('2026-03-01'),
      draft: true,
    },
  },
];

describe('buildLlmsIndex', () => {
  it('starts with the site header and tagline blockquote', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    expect(out.startsWith('# kevinkiklee.io')).toBe(true);
    expect(out).toMatch(/^> /m);
  });

  it('lists posts newest-first, excludes drafts, links to .md URLs', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    expect(out).toContain('## Posts');
    const bIdx = out.indexOf('](https://kevinkiklee.io/posts/b.md)');
    const aIdx = out.indexOf('](https://kevinkiklee.io/posts/a.md)');
    expect(bIdx).toBeGreaterThan(-1);
    expect(aIdx).toBeGreaterThan(-1);
    expect(bIdx).toBeLessThan(aIdx); // newest first
    expect(out).not.toContain('Draft');
  });

  it('ends with a Feeds section pointing at RSS/JSON Feed/Sitemap', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    expect(out).toContain('## Feeds');
    expect(out).toContain('- RSS: https://kevinkiklee.io/rss.xml');
    expect(out).toContain('- JSON Feed: https://kevinkiklee.io/feed.json');
    expect(out).toContain('- Sitemap: https://kevinkiklee.io/sitemap-index.xml');
  });

  it('includes the About link', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    expect(out).toContain('## About');
    expect(out).toContain('](https://kevinkiklee.io/about)');
  });
});

import { buildLlmsFull } from './aeo';

describe('buildLlmsFull', () => {
  const many = Array.from({ length: 60 }, (_, i) => ({
    id: `p${i}`,
    body: `Lead ${i}.\n\n## H2\n\nBody.`,
    data: {
      title: `Post ${i}`,
      description: `D ${i}`,
      pubDate: new Date(2026, 0, 60 - i),
      draft: false,
      tags: ['tag'],
    },
  }));

  it('caps at 50 most-recent published posts', () => {
    const out = buildLlmsFull(many as never, 50);
    const sepCount = (out.match(/\n---\n/g) ?? []).length;
    // 50 posts → 49 separators in the body section.
    // Plus there's a separator in the header. So total expected: 50.
    // We only assert that it caps at 50 by checking the count of post entries.
    const postEntries = (out.match(/^# Post /gm) ?? []).length;
    expect(postEntries).toBeLessThanOrEqual(50);
    expect(postEntries).toBe(50);
  });

  it('separator pattern is "\\n\\n---\\n\\n" between posts', () => {
    const out = buildLlmsFull(many as never, 3);
    expect(out).toContain('\n\n---\n\n');
  });

  it('header references the canonical /llms.txt index', () => {
    const out = buildLlmsFull(many as never, 3);
    expect(out).toContain('https://kevinkiklee.io/llms.txt');
  });
});
