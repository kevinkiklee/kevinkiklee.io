/**
 * Pure helpers for the @astrojs/sitemap `filter` + `serialize` callbacks.
 *
 * Extracted from astro.config.ts so they can be unit-tested without booting
 * the Astro runtime. The config wires these into the integration; the rules
 * are encoded here so a regression has a chance to fail in CI before it
 * ships an incomplete sitemap.
 */

/** Match a post-detail URL path and capture its single slug segment. */
export const POST_DETAIL_RE = /\/posts\/([^/]+)\/?$/;

/** Path prefix used by `/posts/page/N` pagination routes. */
export const POSTS_PAGINATION_PREFIX = '/posts/page/';

/**
 * Decide whether a sitemap candidate URL should be included.
 *
 * Rules, in order:
 *  1. `/api/*` and the 404 route are always excluded.
 *  2. Pagination URLs (`/posts/page/N`) are always included. They must be
 *     checked BEFORE the post-detail rule below, because the regex would
 *     otherwise capture `N` as a "slug" and drop the URL for not matching
 *     any published post.
 *  3. Post-detail URLs (`/posts/<slug>`) are included only if `<slug>` is a
 *     published post. Drafts come in via Astro's static-paths but are not
 *     in `publishedSlugs` during a production build.
 *  4. Everything else is included.
 */
export function shouldIncludeInSitemap(page: string, publishedSlugs: ReadonlySet<string>): boolean {
  if (page.includes('/api/')) return false;
  if (page.endsWith('/404')) return false;
  const pathOnly = new URL(page).pathname;
  if (pathOnly.startsWith(POSTS_PAGINATION_PREFIX)) return true;
  const m = pathOnly.match(POST_DETAIL_RE);
  if (m?.[1] && !publishedSlugs.has(m[1])) return false;
  return true;
}
