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
  // String.slice counts UTF-16 code units, so slicing in the middle of a
  // surrogate pair (any emoji, every CJK supplementary character) corrupts
  // the trailing glyph. Iterate by code point instead so emoji-laden
  // webmentions clip cleanly.
  const cps = Array.from(s);
  if (cps.length <= max) return s;
  return `${cps.slice(0, max - 1).join('')}…`;
}

/**
 * The webmention spec dates back to ~2014; anything published before that
 * is almost certainly a bad upstream timestamp (epoch zero, "1970",
 * etc.). Likewise, future-dated mentions more than a day ahead of build
 * time are nonsense — we drop both so a corrupt record can't surface as
 * a phantom 1969 or 2999 reply on the live site.
 */
const MIN_WM_YEAR = 2010;
const FUTURE_SLACK_MS = 86_400_000;

/**
 * Return the input as an ISO-string only when it parses to a finite date
 * inside a plausible window. Webmention.io occasionally returns an empty
 * string or a non-RFC date for the `published` field — surfacing those
 * raw would crash `new Date(...).toISOString()` at render time and fail
 * the whole post build. Dates outside the sanity window are also rejected
 * so a corrupt upstream record can't render a phantom 1969 or 9999 reply.
 */
function safeIsoDate(raw: string | undefined, now: number = Date.now()): string | undefined {
  if (!raw) return undefined;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return undefined;
  const d = new Date(t);
  if (d.getUTCFullYear() < MIN_WM_YEAR) return undefined;
  if (t > now + FUTURE_SLACK_MS) return undefined;
  return d.toISOString();
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
    const out: Webmention[] = [];
    for (const c of children) {
      // Drop mentions with no parseable `published` timestamp — the schema
      // requires a valid ISO date for rendering <time datetime=…>. A bad
      // upstream record would otherwise crash the build at render time.
      const published = safeIsoDate(c.published);
      if (!published) continue;
      out.push({
        source: safeHttpUrl(c.url) ?? '',
        author: {
          name: clip(c.author?.name, AUTHOR_NAME_MAX) ?? 'Anonymous',
          photo: safeHttpUrl(c.author?.photo),
          url: safeHttpUrl(c.author?.url) ?? '',
        },
        content: { text: clip(c.content?.text, CONTENT_TEXT_MAX) ?? '' },
        published,
        type:
          c['wm-property'] === 'in-reply-to'
            ? 'reply'
            : c['wm-property'] === 'like-of'
              ? 'like'
              : c['wm-property'] === 'repost-of'
                ? 'repost'
                : 'mention',
        url: safeHttpUrl(c.url) ?? '',
      });
    }
    return out;
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
