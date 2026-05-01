import type { Root } from 'mdast';
import { describe, expect, it } from 'vitest';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { unified } from 'unified';
import { remarkAeo } from './remark-aeo';

function parse(source: string): Root {
  return unified().use(remarkParse).use(remarkMdx).parse(source) as Root;
}

function runPlugin(
  source: string,
  file = { path: '/x.mdx', data: { astro: { frontmatter: { title: 'T', description: 'D' } } } },
): Root {
  const tree = parse(source);
  remarkAeo()(tree, file as never);
  return tree;
}

describe('remark-aeo: lead detection', () => {
  it('attaches className="lead" to the first paragraph after h1', () => {
    const tree = runPlugin('# Title\n\nFirst para.\n\nSecond.\n\n## H2\n\nBody.');
    const para = tree.children.find((n) => n.type === 'paragraph') as Record<string, unknown>;
    expect(para).toBeDefined();
    const data = para.data as { hProperties?: { className?: string[] } } | undefined;
    expect(data?.hProperties?.className).toContain('lead');
  });

  it('skips leading image/figure/blockquote and lands on the first paragraph', () => {
    const tree = runPlugin('# Title\n\n![alt](x.png)\n\nFirst para.\n\n## H2');
    const paras = tree.children.filter((n) => n.type === 'paragraph') as Record<string, unknown>[];
    const lead = paras.find((p) => {
      const data = p.data as { hProperties?: { className?: string[] } } | undefined;
      return data?.hProperties?.className?.includes('lead');
    });
    expect(lead).toBeDefined();
  });

  it('throws when no h1 is found', () => {
    expect(() => runPlugin('No heading here.')).toThrow(/h1/i);
  });

  it('throws when no paragraph follows h1', () => {
    expect(() => runPlugin('# Title\n\n## H2 only')).toThrow(/TL;DR|paragraph/i);
  });
});

describe('remark-aeo: h2 outline', () => {
  it('throws when no h2 follows the lead', () => {
    expect(() => runPlugin('# Title\n\nLead paragraph.\n\nMore prose, no headings.')).toThrow(
      /h2/i,
    );
  });

  it('passes when at least one h2 exists', () => {
    expect(() => runPlugin('# Title\n\nLead.\n\n## Section\n\nBody.')).not.toThrow();
  });
});

describe('remark-aeo: image attributes', () => {
  it('throws when raw <img> is missing required attrs', () => {
    expect(() => runPlugin('# Title\n\nLead.\n\n## H2\n\n<img src="/x.png" alt="x" />')).toThrow(
      /img/i,
    );
  });

  it('throws when <Image /> MDX is missing required attrs', () => {
    expect(() => runPlugin('# Title\n\nLead.\n\n## H2\n\n<Image src="/x.png" alt="x" />')).toThrow(
      /Image/,
    );
  });

  it('passes when raw <img> has all required attrs', () => {
    const ok = `# Title\n\nLead.\n\n## H2\n\n<img src="/x.png" alt="x" width="100" height="50" loading="lazy" decoding="async" />`;
    expect(() => runPlugin(ok)).not.toThrow();
  });

  it('passes when <Image /> has all required attrs', () => {
    const ok = `# Title\n\nLead.\n\n## H2\n\n<Image src="/x.png" alt="x" width={100} height={50} loading="lazy" decoding="async" />`;
    expect(() => runPlugin(ok)).not.toThrow();
  });
});

describe('remark-aeo: frontmatter limits', () => {
  it('throws on title > 60', () => {
    const file = {
      path: '/x.mdx',
      data: { astro: { frontmatter: { title: 'a'.repeat(61), description: 'OK' } } },
    };
    expect(() => runPlugin('# Title\n\nLead.\n\n## H2\n\nBody.', file)).toThrow(/title/i);
  });

  it('throws on description > 160', () => {
    const file = {
      path: '/x.mdx',
      data: { astro: { frontmatter: { title: 'OK', description: 'a'.repeat(161) } } },
    };
    expect(() => runPlugin('# Title\n\nLead.\n\n## H2\n\nBody.', file)).toThrow(/description/i);
  });
});
