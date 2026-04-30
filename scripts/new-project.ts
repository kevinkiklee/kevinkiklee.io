#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('usage: pnpm new:project "<name>"');
  process.exit(1);
}

const path = 'src/content/projects/projects.yaml';
const data: unknown[] = parse(readFileSync(path, 'utf8')) ?? [];
const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
data.push({
  id,
  name,
  blurb: 'TODO',
  url: `https://github.com/kevinkiklee/${id}`,
  tech: [],
  featured: false,
});
writeFileSync(path, stringify(data));
console.log(`appended ${id} to ${path}`);
