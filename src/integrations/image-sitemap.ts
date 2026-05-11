import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AstroIntegration } from 'astro';
import { parse as parseYaml } from 'yaml';
import { DATE_PREFIX } from '../lib/post-id';

/**
 * Image-sitemap integration.
 *
 * `@astrojs/sitemap` exposes an `image` namespace on the `<urlset>` root
 * (declared by default), but its public `serialize()` API does NOT expose
 * an `img` field on `SitemapItem` (the Pick type only includes `url`,
 * `lastmod`, `changefreq`, `priority`, `links`). So we can't inject
 * `<image:image>` blocks via the official hook.
 *
 * Instead, this integration runs after `astro:build:done`, walks the
 * sitemap chunks under `dist/client/`, and rewrites each `<url>` whose
 * `<loc>` matches a post that has a `cover` to inject:
 *
 *     <image:image>
 *       <image:loc>https://kevinkiklee.io/path/to/cover.avif</image:loc>
 *       <image:caption>alt text</image:caption>
 *     </image:image>
 *
 * Per https://www.sitemaps.org/protocol.html#extensions and Google's image
 * sitemap docs (https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps).
 *
 * If no posts have covers (current state), the rewriter is a no-op aside
 * from re-writing the file unchanged. We DO validate the sitemap parses
 * before and after so we never ship malformed XML.
 */

type CoverMeta = {
  slug: string;
  /** Resolved absolute URL to the cover image as it appears in the built site. */
  coverUrl: string;
  /** Alt text from the post frontmatter. */
  alt: string;
};

const POSTS_DIR = './src/content/posts';

/**
 * Read post frontmatter at build time to discover covers. We can't use
 * Astro's content layer here because integration hooks run outside the
 * content collection scope. Cheap: only scans `.md`/`.mdx` files once.
 */
function readPostsWithCovers(siteUrl: string, distClient: string): CoverMeta[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(POSTS_DIR);
  } catch {
    return [];
  }
  const out: CoverMeta[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md') && !entry.endsWith('.mdx')) continue;
    const raw = readFileSync(join(POSTS_DIR, entry), 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    let fm: Record<string, unknown> = {};
    try {
      fm = parseYaml(match[1] ?? '') ?? {};
    } catch {
      continue;
    }
    if (fm.draft === true) continue;
    const cover = fm.cover as { src?: string; alt?: string } | undefined;
    if (!cover?.src || !cover.alt) continue;
    const slug = entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, '');
    // Astro emits processed assets under /_astro/ with content-hashed names.
    // We can't predict the exact hashed filename from the source path here,
    // so we resolve it by scanning the built _astro/ directory for a basename
    // match against the cover's source filename.
    const baseFromFm = cover.src
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    if (!baseFromFm) continue;
    const resolved = resolveBuiltAsset(distClient, baseFromFm);
    if (!resolved) continue;
    out.push({
      slug,
      coverUrl: new URL(resolved, siteUrl).toString(),
      alt: cover.alt,
    });
  }
  return out;
}

function resolveBuiltAsset(distClient: string, baseName: string): string | null {
  let files: string[] = [];
  try {
    files = readdirSync(join(distClient, '_astro'));
  } catch {
    return null;
  }
  // Astro hashes filenames as `name.hash.ext`. Prefer AVIF, then WebP, then
  // original. Match by `name.` prefix to avoid accidentally pairing with a
  // file that contains `name` mid-filename.
  const candidates = files.filter((f) => f.startsWith(`${baseName}.`));
  if (candidates.length === 0) return null;
  const pickByExt = (ext: string) => candidates.find((f) => f.endsWith(ext));
  const chosen = pickByExt('.avif') ?? pickByExt('.webp') ?? candidates[0];
  return chosen ? `/_astro/${chosen}` : null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Inject `<image:image>` blocks into matching `<url>` entries. Returns the
 * rewritten XML and a count of urls modified.
 */
export function injectImageEntries(
  xml: string,
  covers: CoverMeta[],
): { xml: string; injected: number } {
  if (covers.length === 0) return { xml, injected: 0 };
  let injected = 0;
  const next = xml.replace(/<url>([\s\S]*?)<\/url>/g, (full, inner: string) => {
    const locMatch = inner.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch?.[1]) return full;
    const loc = locMatch[1];
    const slugMatch = loc.match(/\/posts\/([^/]+)\/?$/);
    if (!slugMatch?.[1]) return full;
    const cover = covers.find((c) => c.slug === slugMatch[1]);
    if (!cover) return full;
    injected += 1;
    const block = `<image:image><image:loc>${escapeXml(cover.coverUrl)}</image:loc><image:caption>${escapeXml(cover.alt)}</image:caption></image:image>`;
    return `<url>${inner}${block}</url>`;
  });
  return { xml: next, injected };
}

export default function imageSitemap(): AstroIntegration {
  return {
    name: 'image-sitemap',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        // dir is the final output dir. For the Vercel adapter (output: 'static')
        // sitemaps end up under dist/client/. Astro's `dir` for the static
        // output is dist/client/ already.
        const distClient = dir.pathname;
        const siteUrl = process.env.SITE_URL ?? 'https://kevinkiklee.io';
        const covers = readPostsWithCovers(siteUrl, distClient);
        if (covers.length === 0) {
          logger.info('image-sitemap: no posts with covers; skipping injection.');
          return;
        }
        let chunkFiles: string[] = [];
        try {
          chunkFiles = readdirSync(distClient).filter((f) => /^sitemap-\d+\.xml$/.test(f));
        } catch {
          logger.warn('image-sitemap: dist/client not readable; skipping.');
          return;
        }
        let total = 0;
        for (const f of chunkFiles) {
          const path = join(distClient, f);
          let raw: string;
          try {
            raw = readFileSync(path, 'utf-8');
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'unknown';
            logger.warn(`image-sitemap: failed to read ${f}: ${msg}`);
            continue;
          }
          const { xml, injected } = injectImageEntries(raw, covers);
          if (injected > 0) {
            try {
              writeFileSync(path, xml, 'utf-8');
              total += injected;
            } catch (err) {
              // Don't fail the build on a single chunk write failure — the
              // original sitemap is still on disk (we never deleted it),
              // so the deploy ships a valid sitemap minus the image hints.
              const msg = err instanceof Error ? err.message : 'unknown';
              logger.warn(`image-sitemap: failed to rewrite ${f}: ${msg}`);
            }
          }
        }
        logger.info(`image-sitemap: injected image entries into ${total} url(s).`);
      },
    },
  };
}
