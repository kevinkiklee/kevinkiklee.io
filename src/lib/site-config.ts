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
  /** Author / Person.name. Single source of truth for the byline. */
  author: 'Kevin Lee',
  /** Author's role, surfaced in JSON-LD (Person.jobTitle) and copy. */
  jobTitle: 'Lorem Ipsum Dolor',
  /** Author's employer / organisation; surfaced in JSON-LD (Person.worksFor). */
  org: 'Sit Amet',
  tagline: 'Lorem ipsum dolor sit amet',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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

/**
 * Build a window-tab title like `"Posts · kevinkiklee.io"`. Single source of
 * truth so the separator and site suffix can't drift across pages.
 */
export function pageTitle(name: string): string {
  return `${name} · ${SITE.title}`;
}
