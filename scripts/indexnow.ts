#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';

const HOST = 'kevinkiklee.io';
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error('INDEXNOW_KEY env var not set');
  process.exit(1);
}

const sitemap = readFileSync('dist/client/sitemap-0.xml', 'utf8');
const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});
console.log('indexnow:', res.status);
