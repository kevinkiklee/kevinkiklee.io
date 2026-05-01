import { describe, expect, it } from 'vitest';
import { mdxToMarkdown } from './mdx-to-md';

describe('mdxToMarkdown', () => {
  it('drops import statements', async () => {
    const input = "import Foo from './foo';\n\n# Title\n\nBody.";
    const out = await mdxToMarkdown(input);
    expect(out).not.toContain('import');
    expect(out).toContain('# Title');
    expect(out).toContain('Body.');
  });

  it('drops JSX flow elements but keeps inner text', async () => {
    const input = "# Title\n\n<Note type='info'>Inner text here.</Note>\n\nAfter.";
    const out = await mdxToMarkdown(input);
    expect(out).not.toContain('<Note');
    expect(out).toContain('Inner text here.');
    expect(out).toContain('After.');
  });

  it('drops self-closing JSX flow elements entirely', async () => {
    const input = '# Title\n\n<Image src="/foo.png" alt="x" />\n\nAfter.';
    const out = await mdxToMarkdown(input);
    expect(out).not.toContain('<Image');
    expect(out).toContain('After.');
  });

  it('keeps code fences with language tags', async () => {
    const input = '# Title\n\n```ts\nconst x = 1;\n```\n';
    const out = await mdxToMarkdown(input);
    expect(out).toContain('```ts');
    expect(out).toContain('const x = 1;');
  });

  it('keeps lists, blockquotes, headings unchanged', async () => {
    const input = '# T\n\n## H2\n\n- one\n- two\n\n> quote\n';
    const out = await mdxToMarkdown(input);
    expect(out).toMatch(/^# T/m);
    expect(out).toMatch(/^## H2/m);
    expect(out).toContain('- one');
    expect(out).toContain('- two');
    expect(out).toContain('> quote');
  });
});
