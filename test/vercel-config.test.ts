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
