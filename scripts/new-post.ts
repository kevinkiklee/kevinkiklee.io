#!/usr/bin/env tsx
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stringify as yamlStringify } from 'yaml';
import { TITLE_MAX } from '../src/lib/meta';
import { DATE_PREFIX } from '../src/lib/post-id';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('usage: pnpm new:post "<title>"');
  process.exit(1);
}

// `TITLE_MAX` is sourced from `src/lib/meta.ts` so the script and the
// Zod schema in `src/content.config.ts` cannot drift. Fail loud rather
// than generate a post the schema will reject at build time.
if (title.length > TITLE_MAX) {
  console.error(`error: title is ${title.length} chars; max is ${TITLE_MAX}.`);
  console.error(`got: ${title}`);
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
if (!slug) {
  console.error('error: title produced an empty slug. Use at least one alphanumeric char.');
  console.error(`got: ${title}`);
  process.exit(1);
}
const date = new Date().toISOString().slice(0, 10);
const postsDir = resolve('src/content/posts');
// Slugs are date-stripped at the content layer (see content.config.ts), so
// two posts with the same title on different dates would both publish at
// /posts/<slug>. Catch the collision here rather than ship a broken URL.
const existingSlugs = new Set(
  readdirSync(postsDir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, '')),
);
if (existingSlugs.has(slug)) {
  console.error(`error: slug "${slug}" already exists in src/content/posts/`);
  console.error('tip: pick a different title so the /posts/<slug> URL stays unique.');
  process.exit(1);
}
const file = resolve(`${postsDir}/${date}-${slug}.mdx`);
if (existsSync(file)) {
  console.error(`error: file already exists at ${file}`);
  console.error('tip: pick a different title, or delete the existing file first.');
  process.exit(1);
}

// Build frontmatter through yaml.stringify so a title containing a colon
// ("Field notes: foo") or quote can't produce a YAML-invalid scaffold that
// the schema would reject at build time with a confusing parser error.
const frontmatter = yamlStringify({
  title,
  description: 'TODO write a 1-2 sentence description (max 160 chars).',
  pubDate: date,
  tags: [],
  draft: true,
});
const fm = `---\n${frontmatter}---\n\n`;

writeFileSync(file, fm);
console.log(`created ${file}`);
