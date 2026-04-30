#!/usr/bin/env tsx
/**
 * Pings IndexNow with every URL in our generated sitemap. Reads the
 * `sitemap-index.xml` first, then walks each child sitemap so this works
 * even when @astrojs/sitemap shards the index into multiple files.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HOST = 'kevinkiklee.io';
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error('INDEXNOW_KEY env var not set');
  process.exit(1);
}

const SITEMAP_DIR = 'dist/client';

function extractLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1] as string);
}

function readChildSitemap(loc: string): string {
  // Sitemap index entries are absolute URLs. Map them back to local files
  // by basename so we don't accidentally fetch over the network.
  const base = loc.split('/').pop() ?? 'sitemap-0.xml';
  return readFileSync(resolve(SITEMAP_DIR, base), 'utf8');
}

const indexXml = readFileSync(resolve(SITEMAP_DIR, 'sitemap-index.xml'), 'utf8');
const childLocs = extractLocs(indexXml);
const urls = childLocs.flatMap((loc) => extractLocs(readChildSitemap(loc)));

if (urls.length === 0) {
  console.error('no URLs found in sitemap');
  process.exit(1);
}

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
console.log(`indexnow: ${res.status} (${urls.length} urls)`);
