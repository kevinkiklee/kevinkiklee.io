import { describe, expect, it } from 'vitest';
import { CSP } from './csp';

describe('CSP header', () => {
  it('contains the critical hardening directives', () => {
    expect(CSP).toContain("frame-ancestors 'none'");
    expect(CSP).toContain("default-src 'self'");
    expect(CSP).toContain('upgrade-insecure-requests');
    expect(CSP).toContain("base-uri 'self'");
    expect(CSP).toContain("form-action 'self'");
    expect(CSP).toContain("object-src 'none'");
  });

  it('whitelists known third parties', () => {
    expect(CSP).toContain('https://*.vercel-insights.com');
    expect(CSP).toContain('https://*.google-analytics.com');
  });

  it('does not whitelist webmention.io (build-time only — no client fetch)', () => {
    // Regression guard: webmention.io is contacted from the build server in
    // lib/webmentions.ts, not from the visitor's browser. The `<link
    // rel="webmention">` in BaseHead is a discovery declaration, not a
    // fetch. Adding it back to connect-src widens the attack surface for
    // no benefit.
    expect(CSP).not.toContain('webmention.io');
  });

  it('does not allow giscus origins (Giscus removed in favour of Mastodon-only)', () => {
    expect(CSP).not.toContain('giscus.app');
  });

  it('forbids embed surfaces we never use (frame / media / worker / child)', () => {
    expect(CSP).toContain("frame-src 'none'");
    expect(CSP).toContain("media-src 'none'");
    expect(CSP).toContain("worker-src 'none'");
    expect(CSP).toContain("child-src 'none'");
  });

  it('has no empty directive (a stray "; ;" or trailing ";")', () => {
    const parts = CSP.split(';').map((p) => p.trim());
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  it('every directive starts with a known token', () => {
    const known = new Set([
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'frame-src',
      'media-src',
      'worker-src',
      'child-src',
      'manifest-src',
      'connect-src',
      'font-src',
      'object-src',
      'base-uri',
      'form-action',
      'frame-ancestors',
      'upgrade-insecure-requests',
    ]);
    for (const part of CSP.split(';').map((p) => p.trim())) {
      const head = part.split(/\s+/)[0] ?? '';
      expect(known.has(head)).toBe(true);
    }
  });

  it('does not whitelist origins that are not actually used', () => {
    // Defense in depth: every origin in the CSP should map to a real
    // third-party we load from. cdn.jsdelivr.net was a Pagefind safety
    // net we never relied on — Pagefind ships under /pagefind/ from our
    // own origin.
    expect(CSP).not.toContain('cdn.jsdelivr.net');
  });

  it('matches a stable shape (snapshot)', () => {
    expect(CSP).toMatchInlineSnapshot(
      `"default-src 'self'; script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.gravatar.com https://avatars.githubusercontent.com; frame-src 'none'; media-src 'none'; worker-src 'none'; child-src 'none'; manifest-src 'self'; connect-src 'self' https://*.vercel-insights.com https://*.google-analytics.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"`,
    );
  });
});
