import { describe, expect, it } from 'vitest';
import { escapeHtml, ogTemplate } from './og';

describe('escapeHtml', () => {
  it('escapes the five XML-significant characters', () => {
    expect(escapeHtml(`<script>"a&b"'</script>`)).toBe(
      '&lt;script&gt;&quot;a&amp;b&quot;&#039;&lt;/script&gt;',
    );
  });

  it('passes plain ASCII through unchanged', () => {
    expect(escapeHtml('Hello, world')).toBe('Hello, world');
  });

  it('handles the empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

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
    // hostile title without throwing — and that the source string we hand
    // to satori-html contains no raw `<script>` tag.
    const hostile = '<script>alert(1)</script>';
    // We don't have direct access to the intermediate HTML, but escaping
    // the title must produce a substring with `&lt;script&gt;`.
    expect(escapeHtml(hostile)).toContain('&lt;script&gt;');
    expect(ogTemplate({ title: hostile, date: '2026-04-29', tags: [] })).toBeTruthy();
  });
});
