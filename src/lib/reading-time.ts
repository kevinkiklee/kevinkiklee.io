import type { Root, RootContent } from 'mdast';
import { toString as mdastToString } from 'mdast-util-to-string';
import type { Plugin } from 'unified';

const WPM = 200;

export function computeWordCount(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length === 0 ? 0 : stripped.split(/\s+/).length;
}

/**
 * Pull all renderable prose from an mdast tree, skipping fenced + inline code
 * (which `mdast-util-to-string` would otherwise concatenate as words). Walking
 * the AST is more accurate than `computeWordCount`'s regex strip because the
 * regex can't model nested fences, while the AST already knows where code
 * starts and ends.
 *
 * Exported only so tests can pin the contract — callers should prefer the
 * `remarkReadingTime` plugin.
 */
export function proseText(node: Root | RootContent): string {
  if (node.type === 'code' || node.type === 'inlineCode') return '';
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map(proseText).join(' ');
  }
  return mdastToString(node);
}

export const remarkReadingTime: Plugin<[], Root> = () => (tree, file) => {
  const text = proseText(tree);
  const wordCount = computeWordCount(text);
  const minutes = Math.max(1, Math.round(wordCount / WPM));
  // Astro injects astro.frontmatter into file.data
  const data = file.data as { astro?: { frontmatter?: Record<string, unknown> } };
  data.astro ??= {};
  data.astro.frontmatter ??= {};
  data.astro.frontmatter.minutesRead = minutes;
  data.astro.frontmatter.wordCount = wordCount;
};
