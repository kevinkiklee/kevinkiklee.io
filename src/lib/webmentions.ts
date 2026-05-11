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
 * Hard timeout for the webmention.io fetch. The request runs once per
 * post during the build, so a slow API would otherwise stall the build
 * pipeline indefinitely. 8s is generous compared to the API's typical
 * 200-800ms response, while still bounding worst-case build time.
 */
const FETCH_TIMEOUT_MS = 8_000;

/** Display caps: webmention.io carries author-supplied free text. A 50 KB
 *  reply or 200-char name doesn't help readers and breaks the grid layout
 *  on phones. Truncate at render time; the canonical record stays upstream. */
const AUTHOR_NAME_MAX = 60;
const CONTENT_TEXT_MAX = 600;

function clip(s: string | undefined, max: number): string | undefined {
  if (!s) return s;
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * Pre-flight an http(s) URL string. Webmention.io aggregates third-party
 * sources, and we surface author-supplied photo + profile URLs straight
 * into the page. Reject anything that isn't a parseable http(s) URL so a
 * malformed source can't slip a `javascript:` or `data:` URL into the DOM
 * or trigger CSP report noise.
 */
function safeHttpUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

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

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    if (!res.ok) {
      console.warn(`[webmentions] ${target}: ${res.status} ${res.statusText}`);
      return [];
    }
    const json = (await res.json()) as { children?: Jf2Child[] };
    const children = json.children ?? [];
    return children.map((c) => ({
      source: safeHttpUrl(c.url) ?? '',
      author: {
        name: clip(c.author?.name, AUTHOR_NAME_MAX) ?? 'Anonymous',
        photo: safeHttpUrl(c.author?.photo),
        url: safeHttpUrl(c.author?.url) ?? '',
      },
      content: { text: clip(c.content?.text, CONTENT_TEXT_MAX) ?? '' },
      published: c.published ?? '',
      type:
        c['wm-property'] === 'in-reply-to'
          ? 'reply'
          : c['wm-property'] === 'like-of'
            ? 'like'
            : c['wm-property'] === 'repost-of'
              ? 'repost'
              : 'mention',
      url: safeHttpUrl(c.url) ?? '',
    }));
  } catch (err) {
    // Build-time fetch failures shouldn't crash the build, but they should
    // surface in CI logs so we know whether the page rendered with no
    // mentions because there really are none, or because the API was down.
    const isErr = err instanceof Error;
    const msg =
      isErr && err.name === 'AbortError'
        ? `timed out after ${FETCH_TIMEOUT_MS}ms`
        : isErr
          ? err.message
          : String(err);
    console.warn(`[webmentions] ${target}: ${msg}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
