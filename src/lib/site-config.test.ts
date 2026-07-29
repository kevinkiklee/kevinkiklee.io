import { describe, expect, it } from 'vitest';
import { DEFAULT_OG_IMAGE, SITE, resolveMastodonProfile } from './site-config';

describe('SITE', () => {
  it('matches the expected shape', () => {
    expect(SITE).toMatchInlineSnapshot(`
      {
        "author": "Kevin Lee",
        "bio": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "bsky": "https://bsky.app/profile/kevinkiklee.bsky.social",
        "defaultMastodon": "https://mastodon.social/@kevinkiklee",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        "github": "https://github.com/kevinkiklee",
        "jobTitle": "Lorem Ipsum Dolor",
        "license": undefined,
        "linkedin": "https://www.linkedin.com/in/kevinkiklee/",
        "locale": "en_US",
        "org": "Sit Amet",
        "portraitUrl": undefined,
        "tagline": "Lorem ipsum dolor sit amet",
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

describe('resolveMastodonProfile', () => {
  it('returns the env override when provided', () => {
    expect(resolveMastodonProfile('https://hachyderm.io/@kevin')).toBe(
      'https://hachyderm.io/@kevin',
    );
  });
  it('falls back to the baked-in default when env value is undefined', () => {
    expect(resolveMastodonProfile(undefined)).toBe(SITE.defaultMastodon);
  });
});

describe('DEFAULT_OG_IMAGE', () => {
  it('points to an absolute, public-served PNG path', () => {
    expect(DEFAULT_OG_IMAGE).toMatch(/^\/[^/].*\.png$/);
  });
});
