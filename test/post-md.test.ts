import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { renderPostMarkdown } from '../src/pages/posts/[slug].md';

const fixturePost = {
  id: 'sample',
  body: "import Foo from 'x';\n\nLead.\n\n<Note>Hello</Note>\n\nBody paragraph.\n\n## H2\n\nMore.",
  data: {
    title: 'Sample Title',
    description: 'A sample post for tests.',
    pubDate: new Date('2026-04-01'),
    tags: ['perf', 'web'],
  },
};

function extractFrontmatter(md: string): Record<string, unknown> {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m?.[1]) throw new Error('no frontmatter');
  return parseYaml(m[1]) as Record<string, unknown>;
}

describe('renderPostMarkdown', () => {
  it('emits YAML frontmatter and clean markdown body', async () => {
    const out = await renderPostMarkdown(fixturePost as never);
    expect(out).toMatch(/^---\n/);
    expect(out).toContain('title: Sample Title');
    expect(out).toContain('date: 2026-04-01');
    expect(out).toContain('url: https://kevinkiklee.io/posts/sample');
    expect(out).toContain('Body paragraph.');
    expect(out).not.toContain('import Foo');
    expect(out).not.toContain('<Note');
    expect(out).toContain('Hello');
  });

  // Regression: the previous string-concat frontmatter would emit a title
  // containing a colon as `title: Field notes: foo`, which YAML parses as
  // a non-string mapping and breaks downstream consumers (LLM crawlers,
  // markdown viewers). The yaml.stringify path quotes it correctly.
  it('quotes YAML-significant chars in the title', async () => {
    const tricky = {
      ...fixturePost,
      data: {
        ...fixturePost.data,
        title: 'Field notes: building "kevinkiklee.io"',
        description: 'Has: colon, "quotes", and # hash.',
      },
    };
    const out = await renderPostMarkdown(tricky as never);
    const fm = extractFrontmatter(out);
    expect(fm.title).toBe('Field notes: building "kevinkiklee.io"');
    expect(fm.description).toBe('Has: colon, "quotes", and # hash.');
  });
});
