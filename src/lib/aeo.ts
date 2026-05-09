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

  const updated = lastUpdatedDate(posts);

  return [
    `# ${SITE.title}`,
    `> ${SITE.description}`,
    '',
    // Updated stamp lets AI crawlers detect freshness without re-fetching the
    // archive. Omitted on an empty-archive build so we don't lie with `now`.
    ...(updated ? [`Updated: ${updated}`, ''] : []),
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

export const LLMS_FULL_DEFAULT_CAP = 50;

export function buildLlmsFull(posts: Post[], cap = LLMS_FULL_DEFAULT_CAP): string {
  // A negative or zero cap would silently produce a header-only document or,
  // worse, accidentally omit the last post via Array.slice's negative-index
  // semantics. Coerce to >= 1 instead of throwing — this is a build-time path
  // and we'd rather emit *something* than fail the build on a misconfigured
  // caller.
  const safeCap = Number.isFinite(cap) && cap >= 1 ? Math.floor(cap) : LLMS_FULL_DEFAULT_CAP;
  const published = posts
    .filter((p) => p.data.draft !== true)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, safeCap);

  const header = [
    `# ${SITE.title} — full content snapshot`,
    '',
    `Snapshot of the ${safeCap} most-recent published posts. The canonical index is`,
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

/** Most recent pubDate among published posts, ISO-trimmed to YYYY-MM-DD.
 *  Used by /llms.txt to expose a content version stamp so AI agents can tell
 *  when their cached copy went stale. */
export function lastUpdatedDate(posts: Post[]): string | null {
  const published = posts.filter((p) => p.data.draft !== true);
  if (published.length === 0) return null;
  const latest = published.reduce((acc, p) => {
    const candidate = p.data.updatedDate ?? p.data.pubDate;
    return candidate.getTime() > acc.getTime() ? candidate : acc;
  }, new Date(0));
  return latest.toISOString().slice(0, 10);
}
