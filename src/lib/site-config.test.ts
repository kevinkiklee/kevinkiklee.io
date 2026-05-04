import { describe, expect, it } from 'vitest';
import { SITE } from './site-config';

describe('SITE', () => {
  it('matches the expected shape', () => {
    expect(SITE).toMatchInlineSnapshot(`
      {
        "bio": "Developer Relations Engineer at Google Chrome. Writes about the web platform, AI tooling, and browser internals.",
        "bsky": "https://bsky.app/profile/kevinkiklee.bsky.social",
        "defaultMastodon": "https://mastodon.social/@kevinkiklee",
        "description": "Field notes from a Chrome DevRel — AI, web platform, and tangents.",
        "github": "https://github.com/kevinkiklee",
        "license": undefined,
        "linkedin": "https://www.linkedin.com/in/kevinkiklee/",
        "locale": "en_US",
        "nowStatus": "TODO — Kevin to write a one-sentence "now" status before merge.",
        "portraitUrl": undefined,
        "tagline": "Field notes from a Chrome DevRel",
        "title": "kevinkiklee.io",
        "url": "https://kevinkiklee.io",
      }
    `);
  });

  it('exposes string values for every key (or undefined for optional fields)', () => {
    for (const v of Object.values(SITE)) {
      if (v !== undefined) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('url is a valid https URL with no trailing slash', () => {
    expect(SITE.url).toMatch(/^https:\/\/[^/]+$/);
  });
});
