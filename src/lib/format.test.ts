import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthDay } from './format';

describe('formatDate', () => {
  it('returns YYYY-MM-DD for a UTC midnight date', () => {
    expect(formatDate(new Date('2026-04-29T00:00:00.000Z'))).toBe('2026-04-29');
  });

  it('uses UTC slicing — same string regardless of local timezone', () => {
    // 23:30 UTC on April 29 is still "2026-04-29" in our format. This
    // guards against accidentally switching to local-timezone slicing,
    // which would shift the date depending on where CI runs.
    expect(formatDate(new Date('2026-04-29T23:30:00.000Z'))).toBe('2026-04-29');
  });

  it('handles year boundaries', () => {
    expect(formatDate(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
    expect(formatDate(new Date('2025-12-31T23:59:59.999Z'))).toBe('2025-12-31');
  });
});

describe('formatMonthDay', () => {
  it('returns MM-DD slice', () => {
    expect(formatMonthDay(new Date('2026-04-29T00:00:00.000Z'))).toBe('04-29');
  });

  it('handles single-digit months/days with zero padding', () => {
    expect(formatMonthDay(new Date('2026-01-05T00:00:00.000Z'))).toBe('01-05');
  });

  it('is timezone-stable like formatDate', () => {
    expect(formatMonthDay(new Date('2026-04-29T23:59:59.999Z'))).toBe('04-29');
  });
});
