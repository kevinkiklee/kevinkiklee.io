#!/usr/bin/env tsx
/**
 * Append a new project to src/content/projects/projects.yaml.
 *
 * Usage:
 *   pnpm new:project "<name>"
 *   pnpm new:project "<name>" --url=https://example.com
 *
 * If `--url` is omitted the project's `url` field is left as a TODO
 * placeholder so we don't ship dead links.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const argv = process.argv.slice(2);
const urlFlag = argv.find((a) => a.startsWith('--url='));
const positional = argv.filter((a) => !a.startsWith('--'));
const name = positional.join(' ').trim();

if (!name) {
  console.error('usage: pnpm new:project "<name>" [--url=https://example.com]');
  process.exit(1);
}

const explicitUrl = urlFlag ? urlFlag.slice('--url='.length) : undefined;

const path = 'src/content/projects/projects.yaml';
const raw = readFileSync(path, 'utf8');
const parsed: unknown = parse(raw) ?? [];

if (!Array.isArray(parsed)) {
  throw new Error(
    `expected ${path} to be a YAML sequence (array), got ${typeof parsed}. Refusing to overwrite.`,
  );
}

const id = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
parsed.push({
  id,
  name,
  blurb: 'TODO',
  url: explicitUrl ?? 'TODO',
  tech: [],
  featured: false,
});

writeFileSync(path, stringify(parsed));
console.log(`appended ${id} to ${path}${explicitUrl ? '' : ' (url=TODO — fill in before commit)'}`);
