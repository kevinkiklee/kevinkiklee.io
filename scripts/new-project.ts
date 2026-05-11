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
import { PROJECT_NAME_MAX } from '../src/lib/meta';

const argv = process.argv.slice(2);
const urlFlag = argv.find((a) => a.startsWith('--url='));
const repoFlag = argv.find((a) => a.startsWith('--repo='));
const positional = argv.filter((a) => !a.startsWith('--'));
const name = positional.join(' ').trim();

if (!name) {
  console.error(
    'usage: pnpm new:project "<name>" [--url=https://example.com] [--repo=https://github.com/me/proj]',
  );
  process.exit(1);
}

// `PROJECT_NAME_MAX` is single-sourced in src/lib/meta.ts so this script and
// any future schema/UI consumer stay in sync if the cap ever changes.
if (name.length > PROJECT_NAME_MAX) {
  console.error(`error: name is ${name.length} chars; max is ${PROJECT_NAME_MAX}.`);
  process.exit(1);
}

function readUrlFlag(flag: string | undefined, label: string): string | undefined {
  if (!flag) return undefined;
  const value = flag.slice(`--${label}=`.length);
  if (!/^https?:\/\//.test(value)) {
    console.error(`error: --${label} must start with http:// or https://. Got: ${value}`);
    process.exit(1);
  }
  return value;
}

const explicitUrl = readUrlFlag(urlFlag, 'url');
const explicitRepo = readUrlFlag(repoFlag, 'repo');

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
  // `repoUrl` is optional in the schema; omitted entirely when no --repo flag.
  // Skipping the key (rather than writing 'TODO') keeps the YAML schema-valid
  // even before the author fills the placeholder in for `url`.
  ...(explicitRepo ? { repoUrl: explicitRepo } : {}),
  tech: [],
  featured: false,
});

writeFileSync(path, stringify(parsed));
const missing: string[] = [];
if (!explicitUrl) missing.push('url=TODO');
console.log(
  `appended ${id} to ${path}${missing.length > 0 ? ` (${missing.join(', ')} — fill in before commit)` : ''}`,
);
