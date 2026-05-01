import { describe, expect, it } from 'vitest';
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
});
