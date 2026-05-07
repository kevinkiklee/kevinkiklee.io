import type { Element, Root } from 'hast';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { rehypeAssertImgDims } from './assert-img-dims.ts';

const img = (props: Record<string, unknown>): Element => ({
  type: 'element',
  tagName: 'img',
  properties: props as Element['properties'],
  children: [],
});

const tree = (...children: Element[]): Root => ({ type: 'root', children });

function run(t: Root, path = 'test.mdx'): void {
  const processor = unified().use(rehypeAssertImgDims);
  // runSync executes the plugin's transformer against the supplied tree.
  // The plugin only reads `.path` from the file for its error message.
  processor.runSync(t, { path } as Parameters<typeof processor.runSync>[1]);
}

describe('rehypeAssertImgDims', () => {
  it('passes when an img has width and height', () => {
    expect(() => run(tree(img({ src: 'a.png', width: 800, height: 600 })))).not.toThrow();
  });

  it('passes when there are no images', () => {
    expect(() => run(tree())).not.toThrow();
  });

  it('throws when an img has no width or height', () => {
    expect(() => run(tree(img({ src: 'bare.png' })))).toThrow(/missing width\/height/);
  });

  it('throws when only width is set', () => {
    expect(() => run(tree(img({ src: 'x.png', width: 100 })))).toThrow(/missing width\/height/);
  });

  it('throws when only height is set', () => {
    expect(() => run(tree(img({ src: 'x.png', height: 100 })))).toThrow(/missing width\/height/);
  });

  it('mentions the file path in the error so authors can find it', () => {
    expect(() => run(tree(img({ src: 'x.png' })), 'src/content/posts/2026-01-01-foo.mdx')).toThrow(
      /2026-01-01-foo\.mdx/,
    );
  });

  it('uses <no src> placeholder when src is missing', () => {
    expect(() => run(tree(img({})))).toThrow(/<no src>/);
  });
});
