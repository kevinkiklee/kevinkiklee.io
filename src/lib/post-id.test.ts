import { describe, expect, it } from 'vitest';
import { DATE_PREFIX } from './post-id';

// DATE_PREFIX is the single source of truth for stripping the YYYY-MM-DD-
// prefix off post filenames. Both astro.config.ts (for the sitemap filter)
// and content.config.ts (for slug generation) consume it, so the contract
// is asserted here in one place — a regression in the regex would break
// either the public slug surface or sitemap accuracy.
describe('DATE_PREFIX', () => {
  it('matches a leading YYYY-MM-DD- prefix and nothing else', () => {
    expect('2026-04-12-hello-world'.replace(DATE_PREFIX, '')).toBe('hello-world');
    expect('1999-12-31-y2k'.replace(DATE_PREFIX, '')).toBe('y2k');
  });

  it('strips at most one prefix per filename', () => {
    expect('2026-04-12-2025-01-01-double'.replace(DATE_PREFIX, '')).toBe('2025-01-01-double');
  });

  it('leaves slugs without a date prefix untouched', () => {
    expect('no-date-here'.replace(DATE_PREFIX, '')).toBe('no-date-here');
  });

  it('does not match when the date appears mid-string', () => {
    expect('post-2026-04-12-trailing'.replace(DATE_PREFIX, '')).toBe('post-2026-04-12-trailing');
  });

  it('rejects shapes that look like dates but are not anchored or padded', () => {
    expect(DATE_PREFIX.test('26-4-12-foo')).toBe(false);
    expect(DATE_PREFIX.test('2026-4-12-foo')).toBe(false);
    expect(DATE_PREFIX.test('foo-2026-04-12-bar')).toBe(false);
  });
});
