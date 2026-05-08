#!/usr/bin/env tsx
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('usage: pnpm new:post "<title>"');
  process.exit(1);
}

// Title length cap: matches the Zod schema in src/content.config.ts (titles
// > ~80 chars wrap awkwardly in the H1 + OG image). Fail loud rather than
// generate a post the schema will reject at build time.
const TITLE_MAX = 80;
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
const file = resolve(`src/content/posts/${date}-${slug}.mdx`);
if (existsSync(file)) {
  console.error(`error: file already exists at ${file}`);
  console.error('tip: pick a different title, or delete the existing file first.');
  process.exit(1);
}

const fm = `---
title: ${title}
description: TODO write a 1-2 sentence description (max 160 chars).
pubDate: ${date}
tags: []
draft: true
---

`;

writeFileSync(file, fm);
console.log(`created ${file}`);
