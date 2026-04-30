/**
 * Content-Security-Policy header value, joined into a single string at build
 * time. Each directive lists every allowed origin with a short comment
 * explaining why — this makes audits trivial when adding new third parties.
 */
export const CSP = [
  // No directive means deny-by-default; `default-src 'self'` is our floor.
  "default-src 'self'",
  [
    'script-src',
    "'self'",
    // Astro inlines small bootstrap scripts (theme + view transitions);
    // these are tiny and trusted, so we accept the unsafe-inline tradeoff.
    "'unsafe-inline'",
    // Vercel Web Analytics + Speed Insights beacons.
    'https://*.vercel-insights.com',
    // Giscus comment widget script (loaded only on post pages).
    'https://giscus.app',
    // Google Tag Manager + GA4 (proxied via Partytown).
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    // Pagefind-UI runtime + WASM are self-hosted under /pagefind/, but we
    // also allow the jsdelivr CDN as a safety net for any sub-loaded dep.
    'https://cdn.jsdelivr.net',
  ].join(' '),
  [
    'style-src',
    "'self'",
    // Astro emits scoped style attributes; we allow inline styles globally.
    "'unsafe-inline'",
    // Giscus injects its own stylesheet inside the iframe wrapper.
    'https://giscus.app',
  ].join(' '),
  [
    'img-src',
    "'self'",
    // OG previews and inline base64 thumbnails.
    'data:',
    // Giscus loads avatars under varied subdomains (e.g. cdn.giscus.app).
    'https://*.giscus.app',
    // Gravatar avatars used by Webmention.io comment authors.
    'https://*.gravatar.com',
    // GitHub avatars (Giscus + webmentions from GH issues).
    'https://avatars.githubusercontent.com',
  ].join(' '),
  // Giscus iframe origin.
  'frame-src https://giscus.app',
  [
    'connect-src',
    "'self'",
    // Vercel Web Analytics + Speed Insights ingestion endpoint
    // (vitals.vercel-insights.com is also covered by this wildcard).
    'https://*.vercel-insights.com',
    // GA4 measurement protocol.
    'https://*.google-analytics.com',
    // Webmention.io API for comment fetches at build time AND from the client.
    'https://webmention.io',
  ].join(' '),
  // Self-hosted JetBrains Mono + IBM Plex Mono — no third-party fonts.
  "font-src 'self'",
  // Lock <base href> to ourselves; any hijack attempts get blocked.
  "base-uri 'self'",
  // Forms post only to ourselves.
  "form-action 'self'",
  // Defense in depth against clickjacking (X-Frame-Options superset).
  "frame-ancestors 'none'",
  // Auto-rewrite any accidentally-coded http:// asset URLs to https://.
  'upgrade-insecure-requests',
].join('; ');
