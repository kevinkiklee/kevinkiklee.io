import type { Image, Node, Root } from 'mdast';
import { visit } from 'unist-util-visit';

type JsxAttr = { type: string; name: string; value: unknown };
type JsxNode = { type: string; name: string; attributes: JsxAttr[] };

function attrValue(node: JsxNode, name: string): string | null {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
  if (!attr || attr.type !== 'mdxJsxAttribute') return null;
  return typeof attr.value === 'string' ? attr.value : null;
}

export function remarkImgAlt() {
  return (tree: Root, file: { fail: (msg: string, node?: Node) => never }) => {
    visit(tree, (node) => {
      if (node.type === 'image') {
        const img = node as Image;
        if (img.alt === undefined || img.alt === null) {
          file.fail(`image missing alt: ${img.url}`, node);
        }
        if (img.alt === '') {
          file.fail(
            `image has empty alt without decorative intent (use <img alt="" role="presentation"> instead): ${img.url}`,
            node,
          );
        }
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const jsx = node as unknown as JsxNode;
        if (jsx.name !== 'img') return;
        const alt = attrValue(jsx, 'alt');
        const role = attrValue(jsx, 'role');
        if (alt === null) {
          file.fail('<img> missing alt attribute', node);
        }
        if (alt === '' && role !== 'presentation' && role !== 'none') {
          file.fail('<img> has empty alt without role="presentation"', node);
        }
      }
    });
  };
}
