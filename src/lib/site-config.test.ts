import { describe, expect, it } from 'vitest';
import { SITE } from './site-config';

describe('SITE', () => {
  it('matches the expected shape', () => {
    expect(SITE).toMatchInlineSnapshot(`
      {
        "defaultMastodon": "https://mastodon.social/@kevin",
        "description": "Field notes from a Chrome DevRel — AI, web platform, and tangents.",
        "github": "https://github.com/kevinkiklee",
        "linkedin": "https://www.linkedin.com/in/kevinkiklee/",
        "locale": "en_US",
        "tagline": "Field notes from a Chrome DevRel",
        "title": "kevinkiklee.io",
      }
    `);
  });

  it('exposes string values for every key', () => {
    for (const v of Object.values(SITE)) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    }
  });
});
