import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

const SITE = 'https://kevinkiklee.io';
const TAGLINE = 'Field notes from a Chrome DevRel — AI, web platform, and tangents.';

export function buildLlmsIndex(posts: Post[]): string {
  const published = posts
    .filter((p) => p.data.draft !== true)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const postsBlock = published
    .map((p) => `- [${p.data.title}](${SITE}/posts/${p.id}.md): ${p.data.description}`)
    .join('\n');

  return [
    '# kevinkiklee.io',
    `> ${TAGLINE}`,
    '',
    '## About',
    `- [About Kevin Lee](${SITE}/about): DevRel at Google Chrome.`,
    '',
    '## Posts',
    postsBlock,
    '',
    '## Feeds',
    `- RSS: ${SITE}/rss.xml`,
    `- JSON Feed: ${SITE}/feed.json`,
    `- Sitemap: ${SITE}/sitemap-index.xml`,
    '',
  ].join('\n');
}

export function buildLlmsFull(posts: Post[], cap = 50): string {
  const published = posts
    .filter((p) => p.data.draft !== true)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, cap);

  const header = [
    '# kevinkiklee.io — full content snapshot',
    '',
    `Snapshot of the ${cap} most-recent published posts. The canonical index is`,
    `at ${SITE}/llms.txt; per-post markdown lives at ${SITE}/posts/<slug>.md.`,
    '',
    '---',
    '',
  ].join('\n');

  const bodies = published.map((p) =>
    [
      `# ${p.data.title}`,
      `Date: ${p.data.pubDate.toISOString().slice(0, 10)}`,
      `URL: ${SITE}/posts/${p.id}`,
      '',
      p.body ?? '',
    ].join('\n'),
  );

  return header + bodies.join('\n\n---\n\n');
}
