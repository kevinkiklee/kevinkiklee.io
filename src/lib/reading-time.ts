import type { Root } from 'mdast';
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

export function computeReadingTime(markdown: string): number {
  return Math.max(1, Math.round(computeWordCount(markdown) / WPM));
}

export const remarkReadingTime: Plugin<[], Root> = () => (tree, file) => {
  const text = mdastToString(tree);
  const wordCount = computeWordCount(text);
  const minutes = Math.max(1, Math.round(wordCount / WPM));
  // Astro injects astro.frontmatter into file.data
  const data = file.data as { astro?: { frontmatter?: Record<string, unknown> } };
  data.astro ??= {};
  data.astro.frontmatter ??= {};
  data.astro.frontmatter.minutesRead = minutes;
  data.astro.frontmatter.wordCount = wordCount;
};
