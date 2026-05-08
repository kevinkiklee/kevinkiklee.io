import type { CollectionEntry } from 'astro:content';
import { formatDate } from './format';
import { SITE } from './site-config';

type Post = CollectionEntry<'posts'>;

export function buildLlmsIndex(posts: Post[]): string {
  const published = posts
    .filter((p) => p.data.draft !== true)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const postsBlock = published
    .map((p) => `- [${p.data.title}](${SITE.url}/posts/${p.id}.md): ${p.data.description}`)
    .join('\n');

  return [
    `# ${SITE.title}`,
    `> ${SITE.description}`,
    '',
    '## About',
    `- [About Kevin Lee](${SITE.url}/about): DevRel at Google Chrome.`,
    '',
    '## Posts',
    postsBlock,
    '',
    '## Feeds',
    `- RSS: ${SITE.url}/rss.xml`,
    `- JSON Feed: ${SITE.url}/feed.json`,
    `- Sitemap: ${SITE.url}/sitemap-index.xml`,
    '',
  ].join('\n');
}

export function buildLlmsFull(posts: Post[], cap = 50): string {
  const published = posts
    .filter((p) => p.data.draft !== true)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, cap);

  const header = [
    `# ${SITE.title} — full content snapshot`,
    '',
    `Snapshot of the ${cap} most-recent published posts. The canonical index is`,
    `at ${SITE.url}/llms.txt; per-post markdown lives at ${SITE.url}/posts/<slug>.md.`,
    '',
    '---',
    '',
  ].join('\n');

  const bodies = published.map((p) =>
    [
      `# ${p.data.title}`,
      `Date: ${formatDate(p.data.pubDate)}`,
      `URL: ${SITE.url}/posts/${p.id}`,
      '',
      p.body ?? '',
    ].join('\n'),
  );

  return header + bodies.join('\n\n---\n\n');
}
