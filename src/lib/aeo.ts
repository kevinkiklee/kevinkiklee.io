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
