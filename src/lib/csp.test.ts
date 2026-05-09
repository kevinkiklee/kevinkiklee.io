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
    expect(CSP).toContain('https://webmention.io');
    expect(CSP).toContain('https://*.google-analytics.com');
  });

  it('does not allow giscus origins (Giscus removed in favour of Mastodon-only)', () => {
    expect(CSP).not.toContain('giscus.app');
    expect(CSP).not.toContain('frame-src');
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
      `"default-src 'self'; script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.gravatar.com https://avatars.githubusercontent.com; manifest-src 'self'; connect-src 'self' https://*.vercel-insights.com https://*.google-analytics.com https://webmention.io; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"`,
    );
  });
});
