import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX, TITLE_MAX, validateDescriptionLength, validateTitleLength } from './meta';

describe('meta length validators', () => {
  it('exposes 60 / 160 as constants', () => {
    expect(TITLE_MAX).toBe(60);
    expect(DESCRIPTION_MAX).toBe(160);
  });

  it('validateTitleLength accepts up to 60 chars', () => {
    expect(validateTitleLength('a'.repeat(60))).toBe(true);
    expect(validateTitleLength('a'.repeat(61))).toBe(false);
    expect(validateTitleLength('')).toBe(false);
  });

  it('validateDescriptionLength accepts up to 160 chars', () => {
    expect(validateDescriptionLength('a'.repeat(160))).toBe(true);
    expect(validateDescriptionLength('a'.repeat(161))).toBe(false);
    expect(validateDescriptionLength('')).toBe(false);
  });
});
