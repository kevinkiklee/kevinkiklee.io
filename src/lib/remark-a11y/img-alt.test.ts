import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { remarkImgAlt } from './img-alt.ts';

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkImgAlt)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remarkImgAlt', () => {
  it('passes ![alt](src)', async () => {
    await expect(process('![cat](cat.jpg)')).resolves.toBeDefined();
  });
  it('fails ![](src) without explicit decorative role', async () => {
    await expect(process('![](cat.jpg)')).rejects.toThrow(/missing alt|empty alt/);
  });
  it('passes <img alt="" role="presentation">', async () => {
    await expect(
      process('<img src="cat.jpg" alt="" role="presentation" />'),
    ).resolves.toBeDefined();
  });
  it('fails <img> with no alt attribute', async () => {
    await expect(process('<img src="cat.jpg" />')).rejects.toThrow(/missing alt/);
  });
  it('passes <img alt="" role="none">', async () => {
    await expect(process('<img src="cat.jpg" alt="" role="none" />')).resolves.toBeDefined();
  });
});
