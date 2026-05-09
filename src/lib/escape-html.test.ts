import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html';

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

  it('escapes & first so subsequent escapes do not double-encode', () => {
    // `&` -> `&amp;`. If we escaped `<` to `&lt;` first then ran the `&`
    // pass on the result, we'd produce `&amp;lt;`. Belt-and-braces test.
    expect(escapeHtml('<&>')).toBe('&lt;&amp;&gt;');
  });

  it('preserves whitespace (does not collapse newlines)', () => {
    expect(escapeHtml('a\n  b')).toBe('a\n  b');
  });
});
