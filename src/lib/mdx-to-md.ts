import type { Root } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Parse MDX → mdast → strip MDX-only nodes → serialize as plain markdown.
 *
 * Behavior:
 * - `mdxjsEsm` (import/export statements) are removed.
 * - `mdxJsxFlowElement` and `mdxJsxTextElement` are replaced with their
 *   text-children's text content (or removed if empty/self-closing).
 * - All standard markdown nodes (headings, paragraphs, code fences, lists,
 *   blockquotes, links) are preserved.
 */
export async function mdxToMarkdown(source: string): Promise<string> {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as Root;

  visit(tree, (node, index, parent) => {
    if (!parent || typeof index !== 'number') return;

    if (node.type === 'mdxjsEsm') {
      parent.children.splice(index, 1);
      return ['skip', index];
    }

    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const text = extractText(node);
      if (text.trim().length === 0) {
        parent.children.splice(index, 1);
        return ['skip', index];
      }
      parent.children.splice(index, 1, {
        type: 'paragraph',
        children: [{ type: 'text', value: text }],
      } as never);
      return ['skip', index + 1];
    }
    return undefined;
  });

  return toMarkdown(tree, { bullet: '-', fences: true, listItemIndent: 'one' });
}

function extractText(node: unknown): string {
  if (typeof node !== 'object' || node === null) return '';
  if ('value' in node && typeof (node as { value: unknown }).value === 'string') {
    return (node as { value: string }).value;
  }
  if ('children' in node && Array.isArray((node as { children: unknown[] }).children)) {
    return (node as { children: unknown[] }).children.map(extractText).join('');
  }
  return '';
}
