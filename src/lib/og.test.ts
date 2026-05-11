import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html';
import { ogTemplate } from './og';
import { SITE } from './site-config';

describe('ogTemplate', () => {
  it('builds for a normal title without throwing', () => {
    const tree = ogTemplate({
      title: 'Hello World',
      date: '2026-04-29',
      tags: ['ai', 'devrel'],
    });
    expect(tree).toBeTruthy();
  });

  it('builds for a long title', () => {
    const tree = ogTemplate({
      title: 'a really really really long title that wraps across multiple lines'.repeat(2),
      date: '2026-04-29',
      tags: ['perf'],
    });
    expect(tree).toBeTruthy();
  });

  it('builds with empty tags', () => {
    const tree = ogTemplate({
      title: 'No tags here',
      date: '2026-04-29',
      tags: [],
    });
    expect(tree).toBeTruthy();
  });

  it('escapes HTML in title to prevent satori-html injection', () => {
    // satori-html parses the template, so anything we emit must already be
    // valid HTML. This test just asserts ogTemplate returns SOMETHING for a
    // hostile title without throwing — escape-html's own tests cover the
    // escaping contract directly.
    const hostile = '<script>alert(1)</script>';
    expect(escapeHtml(hostile)).toContain('&lt;script&gt;');
    expect(ogTemplate({ title: hostile, date: '2026-04-29', tags: [] })).toBeTruthy();
  });
});

describe('ogTemplate footer + wordmark', () => {
  // Pull a representative tree and walk it for the strings we expect to
  // appear in the rendered card. Locks the OG card to site-config so any
  // future jobTitle / org rename can't silently drift the social preview.
  function flatText(node: unknown): string {
    if (typeof node === 'string') return node;
    if (!node || typeof node !== 'object') return '';
    const n = node as { children?: unknown[]; props?: { children?: unknown[] } };
    const kids = n.props?.children ?? n.children ?? [];
    return (Array.isArray(kids) ? kids : [kids]).map(flatText).join(' ');
  }
  it('renders the site wordmark in uppercase', () => {
    const tree = ogTemplate({ title: 't', date: '2026-04-29', tags: [] });
    expect(flatText(tree)).toContain(SITE.title.toUpperCase());
  });
  it('renders a footer derived from SITE.jobTitle and SITE.org', () => {
    const tree = ogTemplate({ title: 't', date: '2026-04-29', tags: [] });
    const text = flatText(tree);
    expect(text).toContain(SITE.jobTitle.toLowerCase());
    expect(text).toContain(SITE.org.toLowerCase());
  });
});
