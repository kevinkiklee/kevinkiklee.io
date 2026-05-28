import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LLMS_FULL_DEFAULT_CAP, buildLlmsFull, buildLlmsIndex, lastUpdatedDate } from './aeo';

const fixturePosts = [
  {
    id: 'b',
    data: {
      title: 'B',
      description: 'Desc B',
      pubDate: new Date('2026-02-01'),
      draft: false,
      tags: ['ai', 'chrome'],
    },
  },
  {
    id: 'a',
    data: {
      title: 'A',
      description: 'Desc A',
      pubDate: new Date('2026-01-01'),
      draft: false,
      tags: ['web-platform'],
    },
  },
  {
    id: 'd',
    data: {
      title: 'Draft',
      description: 'X',
      pubDate: new Date('2026-03-01'),
      draft: true,
      tags: ['personal'],
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

  it('includes an Updated: stamp tied to the most-recent published post', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    // Most recent non-draft is "B" at 2026-02-01
    expect(out).toContain('Updated: 2026-02-01');
  });

  it('includes a Topics: line aggregated from published post tags', () => {
    const out = buildLlmsIndex(fixturePosts as never);
    expect(out).toContain('Topics: ai, chrome, web-platform');
    // Draft tags are excluded
    expect(out).not.toContain('personal');
  });

  it('omits Updated when the archive is empty', () => {
    const out = buildLlmsIndex([] as never);
    expect(out).not.toContain('Updated:');
  });
});

describe('lastUpdatedDate', () => {
  it('returns null on an empty array', () => {
    expect(lastUpdatedDate([] as never)).toBeNull();
  });

  it('prefers updatedDate over pubDate when present', () => {
    const posts = [
      {
        id: 'a',
        data: {
          pubDate: new Date('2026-01-01'),
          updatedDate: new Date('2026-04-15'),
          draft: false,
        },
      },
    ];
    expect(lastUpdatedDate(posts as never)).toBe('2026-04-15');
  });

  it('ignores drafts', () => {
    const posts = [
      { id: 'a', data: { pubDate: new Date('2026-03-01'), draft: true } },
      { id: 'b', data: { pubDate: new Date('2026-01-01'), draft: false } },
    ];
    expect(lastUpdatedDate(posts as never)).toBe('2026-01-01');
  });
});

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

  it('coerces a 0/negative cap to the default rather than emitting an empty body', () => {
    const out = buildLlmsFull(many as never, 0);
    const postEntries = (out.match(/^# Post /gm) ?? []).length;
    expect(postEntries).toBeGreaterThan(0);
  });

  it('floors a fractional cap', () => {
    const out = buildLlmsFull(many as never, 2.7);
    const postEntries = (out.match(/^# Post /gm) ?? []).length;
    expect(postEntries).toBe(2);
  });

  describe('safeCap coercion', () => {
    // Capture the console.warn the fallback emits so noise doesn't leak into
    // the suite output. We also assert the warn fires only on bad input.
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it('falls back to the default cap on NaN and warns', () => {
      const out = buildLlmsFull(many as never, Number.NaN);
      const postEntries = (out.match(/^# Post /gm) ?? []).length;
      expect(postEntries).toBe(Math.min(LLMS_FULL_DEFAULT_CAP, many.length));
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('falls back on Infinity and warns', () => {
      buildLlmsFull(many as never, Number.POSITIVE_INFINITY);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('falls back on a negative cap and warns', () => {
      buildLlmsFull(many as never, -5);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('does NOT warn for the default call signature', () => {
      buildLlmsFull(many as never);
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
