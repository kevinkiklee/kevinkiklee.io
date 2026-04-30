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
  defaultMastodon: 'https://mastodon.social/@kevinkiklee',
  bsky: 'https://bsky.app/profile/kevinkiklee.bsky.social',
  github: 'https://github.com/kevinkiklee',
  linkedin: 'https://www.linkedin.com/in/kevinkiklee/',
  locale: 'en_US',
} as const;
