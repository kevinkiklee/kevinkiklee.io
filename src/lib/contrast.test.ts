import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.ts';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });
  it('returns 1 for white on white', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });
  it('returns ~4.54 for #767676 on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});
