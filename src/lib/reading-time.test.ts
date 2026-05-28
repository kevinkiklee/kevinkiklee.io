import type { Root } from 'mdast';
import { describe, expect, it } from 'vitest';
import { computeWordCount, proseText } from './reading-time';

describe('computeWordCount', () => {
  it('counts words in plain prose', () => {
    expect(computeWordCount('one two three')).toBe(3);
    expect(computeWordCount('word '.repeat(200).trim())).toBe(200);
  });

  it('strips markdown syntax before counting', () => {
    expect(computeWordCount('# Title\n\n[link](url) text')).toBe(3);
  });

  it('returns 0 for empty input', () => {
    expect(computeWordCount('')).toBe(0);
  });

  it('ignores fenced code blocks', () => {
    const md = `${'word '.repeat(100)}\n\n\`\`\`\n${'noise '.repeat(1000)}\n\`\`\`\n`;
    expect(computeWordCount(md)).toBe(100);
  });

  it('counts 0 for markdown that is only a code block', () => {
    const md = '```ts\nconst x = 1;\nconst y = 2;\n```';
    expect(computeWordCount(md)).toBe(0);
  });
});

describe('proseText AST walker', () => {
  it('skips fenced code blocks', () => {
    const tree: Root = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'hello world' }] },
        { type: 'code', lang: 'ts', value: 'const a = 1; const b = 2;' },
      ],
    };
    expect(proseText(tree).trim()).toBe('hello world');
  });

  it('skips inline code', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'before ' },
            { type: 'inlineCode', value: 'noisy code value' },
            { type: 'text', value: ' after' },
          ],
        },
      ],
    };
    // Inline code value is stripped; surrounding text remains.
    const out = proseText(tree);
    expect(out).toContain('before');
    expect(out).toContain('after');
    expect(out).not.toContain('noisy');
  });

  it('handles deeply nested structures', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'blockquote',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: 'quoted prose' },
                { type: 'inlineCode', value: 'dropped' },
              ],
            },
          ],
        },
      ],
    };
    const out = proseText(tree);
    expect(out).toContain('quoted prose');
    expect(out).not.toContain('dropped');
  });
});
