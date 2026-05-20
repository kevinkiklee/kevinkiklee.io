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

let indexXml: string;
try {
  indexXml = readFileSync(resolve(SITEMAP_DIR, 'sitemap-index.xml'), 'utf8');
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`indexnow: ${SITEMAP_DIR}/sitemap-index.xml not found. Did the build complete?`);
  console.error(`indexnow: underlying error: ${msg}`);
  process.exit(1);
}
const childLocs = extractLocs(indexXml);
// Deduplicate so an accidental cross-listing (a URL appearing in two child
// sitemap chunks) doesn't pad the payload toward IndexNow's 10k limit.
const rawUrls = Array.from(new Set(childLocs.flatMap((loc) => extractLocs(readChildSitemap(loc)))));
// IndexNow rejects payloads that contain URLs outside the host we're keyed
// for. A malformed sitemap (or a future cross-domain entry) would otherwise
// poison the entire batch with a single bad row; filter eagerly so the
// resulting POST always succeeds when at least one valid URL exists.
const urls: string[] = [];
for (const u of rawUrls) {
  try {
    const parsed = new URL(u);
    if (parsed.protocol === 'https:' && parsed.hostname === HOST) {
      urls.push(parsed.toString());
    } else {
      console.warn(`indexnow: skipping non-${HOST} url ${u}`);
    }
  } catch {
    console.warn(`indexnow: skipping malformed url ${u}`);
  }
}

if (urls.length === 0) {
  console.error('no URLs found in sitemap');
  process.exit(1);
}

// IndexNow caps each POST at 10,000 URLs. Chunk so a future content
// explosion (e.g. an archive import) doesn't silently get truncated by
// the API. We size to 5,000 to leave headroom for per-URL overhead and
// keep request bodies under ~1 MB.
const INDEXNOW_CHUNK_SIZE = 5_000;
// Bound the POST so a hung IndexNow API can't stall the deploy CI job
// indefinitely. 30s is generous: typical responses arrive in <2s.
const INDEXNOW_FETCH_TIMEOUT_MS = 30_000;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function postChunk(urlList: string[], index: number, total: number): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), INDEXNOW_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList,
      }),
      signal: ctrl.signal,
    });
    // IndexNow accepts 200 (processed) and 202 (received). Anything else is
    // either a bad key, a malformed payload, or a verification failure — all
    // of which we want to surface in CI logs as a red build, not a silent
    // "200/422 — looks fine!".
    const ok = res.status === 200 || res.status === 202;
    console.log(`indexnow: chunk ${index + 1}/${total} → ${res.status} (${urlList.length} urls)`);
    if (!ok) {
      const body = await res.text().catch(() => '');
      console.error(`indexnow: non-success status — ${body || '(empty body)'}`);
    }
    return ok;
  } catch (err) {
    const msg =
      err instanceof Error && err.name === 'AbortError'
        ? `aborted after ${INDEXNOW_FETCH_TIMEOUT_MS}ms`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(`indexnow: chunk ${index + 1}/${total} failed — ${msg}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const chunks = chunk(urls, INDEXNOW_CHUNK_SIZE);
let allOk = true;
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  if (!c) continue;
  const ok = await postChunk(c, i, chunks.length);
  if (!ok) allOk = false;
}
if (!allOk) process.exit(1);
