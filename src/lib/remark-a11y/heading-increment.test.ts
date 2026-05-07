import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { remarkHeadingIncrement } from './heading-increment.ts';

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkHeadingIncrement)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remarkHeadingIncrement', () => {
  it('passes h2 → h3 → h2 → h3', async () => {
    await expect(process('## a\n### b\n## c\n### d')).resolves.toBeDefined();
  });
  it('fails on h2 → h4 (skipped h3)', async () => {
    await expect(process('## a\n#### b')).rejects.toThrow(/skipped from h2 to h4/);
  });
});
