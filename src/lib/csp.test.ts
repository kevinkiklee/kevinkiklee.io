import { describe, expect, it } from 'vitest';
import { CSP } from './csp';

describe('CSP header', () => {
  it('contains the critical hardening directives', () => {
    expect(CSP).toContain("frame-ancestors 'none'");
    expect(CSP).toContain("default-src 'self'");
    expect(CSP).toContain('upgrade-insecure-requests');
    expect(CSP).toContain("base-uri 'self'");
    expect(CSP).toContain("form-action 'self'");
  });

  it('whitelists known third parties', () => {
    expect(CSP).toContain('https://giscus.app');
    expect(CSP).toContain('https://*.vercel-insights.com');
    expect(CSP).toContain('https://webmention.io');
    expect(CSP).toContain('https://*.google-analytics.com');
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
      'connect-src',
      'font-src',
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

  it('matches a stable shape (snapshot)', () => {
    expect(CSP).toMatchInlineSnapshot(
      `"default-src 'self'; script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://giscus.app https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://giscus.app; img-src 'self' data: https://*.giscus.app https://*.gravatar.com https://avatars.githubusercontent.com; frame-src https://giscus.app; connect-src 'self' https://*.vercel-insights.com https://*.google-analytics.com https://webmention.io; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"`,
    );
  });
});
