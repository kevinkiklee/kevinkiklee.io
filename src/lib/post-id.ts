/**
 * Single source of truth for the YYYY-MM-DD- prefix that we strip from
 * post filenames to derive their slug. Both the Astro config (used for
 * sitemap filtering) and the content config (used for slug generation)
 * import this regex so the rule cannot drift between them.
 */
export const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;
