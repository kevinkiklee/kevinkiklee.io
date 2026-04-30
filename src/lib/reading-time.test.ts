import { describe, expect, it } from 'vitest';
import { computeReadingTime } from './reading-time';

describe('computeReadingTime', () => {
  it('rounds 200 wpm to nearest minute, minimum 1', () => {
    expect(computeReadingTime('one')).toBe(1);
    expect(computeReadingTime('word '.repeat(199))).toBe(1);
    expect(computeReadingTime('word '.repeat(200))).toBe(1);
    expect(computeReadingTime('word '.repeat(401))).toBe(2);
    expect(computeReadingTime('word '.repeat(1500))).toBe(8);
  });
  it('strips markdown syntax from word count', () => {
    expect(computeReadingTime('# Title\n\n[link](url) text')).toBe(1);
  });
});
