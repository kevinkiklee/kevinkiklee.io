import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import tagsJson from '../src/content/tags.json' with { type: 'json' };
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateDescriptionLength,
  validateTitleLength,
} from '../src/lib/meta';

const POSTS_DIR = './src/content/posts';
const ALLOWED_TAGS = new Set(tagsJson.tags);

interface Frontmatter {
  title?: string;
  description?: string;
  draft?: boolean;
  tags?: string[];
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
    it(`${entry}: every tag is in src/content/tags.json allowlist`, () => {
      const tags = fm.tags ?? [];
      const unknown = tags.filter((t) => !ALLOWED_TAGS.has(t));
      // If this fails, either fix the typo in the post's frontmatter or add
      // the new tag to src/content/tags.json. The Astro content schema also
      // catches this at build time; this test surfaces the failure earlier
      // (during `pnpm test`) so authoring trips don't wait for a full build.
      expect(unknown).toEqual([]);
    });
  }
});
