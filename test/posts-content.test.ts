import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateDescriptionLength,
  validateTitleLength,
} from '../src/lib/meta';

const POSTS_DIR = './src/content/posts';

interface Frontmatter {
  title?: string;
  description?: string;
  draft?: boolean;
}

function readFrontmatter(path: string): Frontmatter {
  const raw = readFileSync(path, 'utf-8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  return (parseYaml(m[1] ?? '') ?? {}) as Frontmatter;
}

describe('post frontmatter lengths', () => {
  const entries = readdirSync(POSTS_DIR).filter((f) => /\.mdx?$/.test(f));
  for (const entry of entries) {
    const fm = readFrontmatter(join(POSTS_DIR, entry));
    if (fm.draft === true) continue;
    it(`${entry}: title fits in ${TITLE_MAX} chars`, () => {
      expect(typeof fm.title).toBe('string');
      expect(validateTitleLength(fm.title ?? '')).toBe(true);
    });
    it(`${entry}: description fits in ${DESCRIPTION_MAX} chars`, () => {
      expect(typeof fm.description).toBe('string');
      expect(validateDescriptionLength(fm.description ?? '')).toBe(true);
    });
  }
});
