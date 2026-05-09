import { describe, expect, it } from 'vitest';
import config from '../vercel';

describe('vercel.ts cache headers', () => {
  it('includes a rule matching llms.txt and llms-full.txt', () => {
    const headers = (config.headers ?? []).flat();
    const sources = headers.map((h) => (h as { source: string }).source);
    const match = sources.find((s) => /llms/.test(s));
    expect(match).toBeDefined();
  });

  it('includes a rule matching /posts/<slug>.md', () => {
    const headers = (config.headers ?? []).flat();
    const sources = headers.map((h) => (h as { source: string }).source);
    const match = sources.find((s) => /posts.*\.md/.test(s));
    expect(match).toBeDefined();
  });
});

describe('vercel.ts security headers', () => {
  type HeaderRule = { source: string; headers: { key: string; value: string }[] };
  function findGlobalRule(): HeaderRule | undefined {
    const flat = (config.headers ?? []).flat() as unknown as HeaderRule[];
    return flat.find((r) => r.source === '/(.*)' && Array.isArray(r.headers));
  }

  it('emits Cross-Origin-Resource-Policy: same-origin (defense-in-depth)', () => {
    const rule = findGlobalRule();
    expect(rule).toBeDefined();
    const corp = rule?.headers.find((h) => h.key === 'Cross-Origin-Resource-Policy');
    expect(corp?.value).toBe('same-origin');
  });

  it('locks down sensitive Permissions-Policy directives', () => {
    const rule = findGlobalRule();
    const pp = rule?.headers.find((h) => h.key === 'Permissions-Policy');
    expect(pp).toBeDefined();
    // Spot-check the high-risk directives that recently exposed APIs to
    // any embedded third-party. A blog needs none of these.
    for (const directive of [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'usb=()',
      'serial=()',
      'hid=()',
      'idle-detection=()',
      'browsing-topics=()',
      'interest-cohort=()',
      'payment=()',
    ]) {
      expect(pp?.value).toContain(directive);
    }
  });
});
