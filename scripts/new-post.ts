#!/usr/bin/env tsx
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('usage: pnpm new:post "<title>"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const date = new Date().toISOString().slice(0, 10);
const file = resolve(`src/content/posts/${date}-${slug}.mdx`);
if (existsSync(file)) {
  console.error(`exists: ${file}`);
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
