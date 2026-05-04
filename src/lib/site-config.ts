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
  /** One-sentence "now" status shown on the home page. Update this when context changes. */
  nowStatus: 'TODO — Kevin to write a one-sentence "now" status before merge.',
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
