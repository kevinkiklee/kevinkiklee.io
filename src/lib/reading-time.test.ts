import { describe, expect, it } from 'vitest';
import { computeReadingTime, computeWordCount } from './reading-time';

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

  it('returns at least 1 for empty input', () => {
    // Math.max(1, round(0/200)) === 1.
    expect(computeReadingTime('')).toBe(1);
  });

  it('ignores fenced code blocks when counting words', () => {
    const md = `${'word '.repeat(100)}\n\n\`\`\`\n${'noise '.repeat(1000)}\n\`\`\`\n`;
    // 100 prose words + 0 from the code block = 100 words → still 1 min.
    expect(computeReadingTime(md)).toBe(1);
    expect(computeWordCount(md)).toBe(100);
  });

  it('returns 1 minute for empty markdown', () => {
    expect(computeReadingTime('')).toBe(1);
  });

  it('returns 1 minute for markdown that is only a code block', () => {
    const md = '```ts\nconst x = 1;\nconst y = 2;\n```';
    // All words live inside the fence and are stripped.
    expect(computeWordCount(md)).toBe(0);
    expect(computeReadingTime(md)).toBe(1);
  });

  it('measures only prose when prose and code are mixed', () => {
    const prose = 'word '.repeat(400);
    const md = `${prose}\n\n\`\`\`ts\n${'console.log("noise");\n'.repeat(50)}\`\`\`\n`;
    // 400 prose words → 2 min, code block contributes 0.
    expect(computeWordCount(md)).toBe(400);
    expect(computeReadingTime(md)).toBe(2);
  });
});
