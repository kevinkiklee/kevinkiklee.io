import type { Element, Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: fail the build if any <img> lacks width and height attrs.
 * Catches MDX-author mistakes that would cause CLS in production.
 *
 * Astro's image pipeline (`![alt](./relative.png)`) sets these
 * automatically. A bare `<img src="...">` in MDX with no explicit
 * dims is the failure case.
 */
export const rehypeAssertImgDims: Plugin<[], Root> = () => {
  return (tree, file) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;
      const props = node.properties ?? {};
      if (props.width === undefined || props.height === undefined) {
        const src = typeof props.src === 'string' ? props.src : '<no src>';
        const where = file.path ?? '<unknown>';
        throw new Error(
          `[mobile-experience] <img src="${src}"> is missing width/height — would cause CLS in production. In MDX, write \`![alt](./relative-path.png)\` so Astro's image pipeline sets dims automatically. File: ${where}`,
        );
      }
    });
  };
};
