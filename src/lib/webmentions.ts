import { WEBMENTION_TOKEN } from 'astro:env/server';

export type Webmention = {
  source: string;
  author: { name: string; photo?: string | undefined; url: string };
  content: { text: string };
  published: string;
  type: 'reply' | 'like' | 'repost' | 'mention';
  url: string;
};

type Jf2Child = {
  url?: string;
  author?: { name?: string; photo?: string; url?: string };
  content?: { text?: string };
  published?: string;
  'wm-property'?: string;
};

/**
 * Fetch webmentions for a target URL from webmention.io. Runs at build time
 * for static pages. Returns an empty array if the token is missing or the
 * request fails — never throws — so a transient network failure does not
 * crash the build.
 */
export async function fetchWebmentions(target: string): Promise<Webmention[]> {
  if (!WEBMENTION_TOKEN) return [];
  const url = new URL('https://webmention.io/api/mentions.jf2');
  url.searchParams.set('target', target);
  url.searchParams.set('per-page', '100');
  url.searchParams.set('token', WEBMENTION_TOKEN);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const json = (await res.json()) as { children?: Jf2Child[] };
    const children = json.children ?? [];
    return children.map((c) => ({
      source: c.url ?? '',
      author: {
        name: c.author?.name ?? 'Anonymous',
        photo: c.author?.photo,
        url: c.author?.url ?? '',
      },
      content: { text: c.content?.text ?? '' },
      published: c.published ?? '',
      type:
        c['wm-property'] === 'in-reply-to'
          ? 'reply'
          : c['wm-property'] === 'like-of'
            ? 'like'
            : c['wm-property'] === 'repost-of'
              ? 'repost'
              : 'mention',
      url: c.url ?? '',
    }));
  } catch {
    return [];
  }
}
