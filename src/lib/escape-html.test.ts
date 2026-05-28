import { describe, expect, it } from 'vitest';
import { escapeHtml, stripHtmlExceptMark } from './escape-html';

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

describe('stripHtmlExceptMark', () => {
  it('preserves <mark> and </mark> tags', () => {
    expect(stripHtmlExceptMark('hello <mark>world</mark> foo')).toBe(
      'hello <mark>world</mark> foo',
    );
  });

  it('strips other HTML tags', () => {
    expect(stripHtmlExceptMark('<img onerror="alert(1)">text<script>bad</script>')).toBe('textbad');
  });

  it('strips self-closing and attribute-laden tags', () => {
    expect(stripHtmlExceptMark('<br/><div class="x">hi</div>')).toBe('hi');
  });

  it('handles mixed mark and other tags', () => {
    expect(stripHtmlExceptMark('a <b>bold</b> <mark>hit</mark> <i>ital</i>')).toBe(
      'a bold <mark>hit</mark> ital',
    );
  });

  it('returns plain text unchanged', () => {
    expect(stripHtmlExceptMark('just text')).toBe('just text');
  });

  it('is case-insensitive for non-mark tags', () => {
    expect(stripHtmlExceptMark('<MARK>ok</MARK><SCRIPT>bad</SCRIPT>')).toBe('<MARK>ok</MARK>bad');
  });
});
