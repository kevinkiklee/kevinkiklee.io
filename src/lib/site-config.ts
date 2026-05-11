/**
 * Centralised site-wide constants. Use these instead of hard-coding values
 * (Mastodon URL, GitHub handle, tagline) so we have a single source of truth.
 *
 * Optional env vars (read via `astro:env`) override the defaults at the
 * call site — see `BaseHead.astro`, `Footer.astro`, `about.astro`.
 */
export const SITE = {
  title: 'kevinkiklee.io',
  url: 'https://kevinkiklee.io',
  tagline: 'Field notes from a Chrome DevRel',
  description: 'Field notes from a Chrome DevRel — AI, web platform, and tangents.',
  bio: 'Developer Relations Engineer at Google Chrome. Writes about the web platform, AI tooling, and browser internals.',
  defaultMastodon: 'https://mastodon.social/@kevinkiklee',
  bsky: 'https://bsky.app/profile/kevinkiklee.bsky.social',
  github: 'https://github.com/kevinkiklee',
  linkedin: 'https://www.linkedin.com/in/kevinkiklee/',
  locale: 'en_US',
  /** Set to a portrait URL to enable Person.image in JSON-LD. */
  portraitUrl: undefined as string | undefined,
  /** Set to a license URL (e.g. CC-BY) to emit license/copyrightYear on posts. */
  license: undefined as string | undefined,
} as const;

/**
 * Default OG card asset shipped from `/public`. Single source of truth so
 * head metadata and the OG-function fallback never drift.
 */
export const DEFAULT_OG_IMAGE = '/og-default.png';

/**
 * Resolve the user-visible Mastodon profile URL. The optional env var lets
 * deploys override the default without touching code; fall through to the
 * baked-in `SITE.defaultMastodon` otherwise.
 *
 * Kept as a tiny helper instead of inlining `?? SITE.defaultMastodon` at
 * each call site — the choice ought to be made in one place so a change
 * (e.g. adding URL validation, or a per-locale override) lands once.
 */
export function resolveMastodonProfile(envValue: string | undefined): string {
  return envValue ?? SITE.defaultMastodon;
}
