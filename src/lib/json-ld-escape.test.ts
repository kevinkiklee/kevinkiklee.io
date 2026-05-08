import { describe, expect, it } from 'vitest';
import { safeJsonLd } from './json-ld-escape';

describe('safeJsonLd', () => {
  it('escapes < and > so </script> cannot terminate the host element', () => {
    const out = safeJsonLd({ title: 'evil </script><img onerror=alert(1)>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<img');
    expect(out).toContain('\\u003c/script\\u003e');
  });

  it('still parses back to the original value via JSON.parse', () => {
    const data = {
      headline: 'Why <script> tags are tricky',
      author: { name: 'Kevin > Lee' },
      tags: ['ai', 'web-platform', '<not-a-tag>'],
    };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });

  it('escapes both < and > (defense in depth against HTML comments too)', () => {
    expect(safeJsonLd({ q: '<!--' })).toContain('\\u003c!--');
    expect(safeJsonLd({ q: '-->' })).toContain('--\\u003e');
  });

  it('handles primitives, arrays, and graphs without throwing', () => {
    expect(safeJsonLd('hello')).toBe('"hello"');
    expect(safeJsonLd(42)).toBe('42');
    expect(safeJsonLd(null)).toBe('null');
    expect(safeJsonLd([{ a: 1 }, { b: '<x>' }])).toBe('[{"a":1},{"b":"\\u003cx\\u003e"}]');
  });
});
