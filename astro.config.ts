import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import pagefind from 'astro-pagefind';
import { defineConfig, envField } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';
import { parse as parseYaml } from 'yaml';
import imageSitemap from './src/integrations/image-sitemap';
import { remarkReadingTime } from './src/lib/reading-time';

// Read post frontmatter at config-evaluation time so the sitemap can:
//  - exclude drafts in production builds
//  - inject lastmod (updatedDate || pubDate) per post via serialize()
//
// Astro's content layer is not available inside `astro.config.ts`, so we
// parse frontmatter directly from the filesystem. Cheap: we only do this
// once per build.
type PostMeta = {
  slug: string;
  pubDate?: string | undefined;
  updatedDate?: string | undefined;
  draft: boolean;
};
const POSTS_DIR = './src/content/posts';
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;
function readPostsMeta(): PostMeta[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(POSTS_DIR);
  } catch {
    return [];
  }
  const out: PostMeta[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md') && !entry.endsWith('.mdx')) continue;
    const raw = readFileSync(join(POSTS_DIR, entry), 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    let fm: Record<string, unknown> = {};
    try {
      fm = parseYaml(match[1] ?? '') ?? {};
    } catch {
      // ignore malformed frontmatter; the content layer will surface errors
    }
    const slug = entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, '');
    out.push({
      slug,
      pubDate: fm.pubDate ? new Date(fm.pubDate as string).toISOString() : undefined,
      updatedDate: fm.updatedDate ? new Date(fm.updatedDate as string).toISOString() : undefined,
      draft: fm.draft === true,
    });
  }
  return out;
}

const POSTS_META = readPostsMeta();
const POSTS_BY_SLUG = new Map(POSTS_META.map((p) => [p.slug, p]));
const PUBLISHED_SLUGS = new Set(POSTS_META.filter((p) => !p.draft).map((p) => p.slug));

function priorityFor(url: string): number {
  const path = new URL(url).pathname.replace(/\/$/, '') || '/';
  if (path === '/') return 1.0;
  if (path === '/about' || path === '/posts' || path === '/projects') return 0.8;
  if (path.startsWith('/posts/')) return 0.8;
  if (path.startsWith('/tags/') || path === '/tags') return 0.6;
  return 0.5;
}

export default defineConfig({
  site: 'https://kevinkiklee.io',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel({
    imageService: false,
    webAnalytics: { enabled: true },
  }),
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      wrap: true,
    },
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        // Pagefind ships its own runtime under /pagefind/ in the dist root.
        // We deliberately load it dynamically from the public path so the
        // bundler must NOT try to resolve it at build time.
        external: [/^\/pagefind\/.*/],
      },
    },
    plugins: [
      // rollup-plugin-visualizer returns a rollup `Plugin` whose typings
      // diverge from vite's `PluginOption` only under
      // `exactOptionalPropertyTypes` — the runtime shape is identical.
      // @ts-expect-error: rollup/vite Plugin variance mismatch under strict TS.
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        if (page.includes('/api/')) return false;
        if (page.endsWith('/404')) return false;
        // Exclude draft posts in production. Astro emits them in dev/preview
        // builds when explicitly enabled via VERCEL_ENV !== 'preview'.
        const m = page.match(/\/posts\/([^/]+)\/?$/);
        if (m) {
          const slug = m[1];
          if (slug && slug !== 'page' && !PUBLISHED_SLUGS.has(slug)) return false;
        }
        return true;
      },
      serialize(item) {
        item.priority = priorityFor(item.url);
        const m = new URL(item.url).pathname.match(/\/posts\/([^/]+)\/?$/);
        if (m?.[1] && m[1] !== 'page') {
          const meta = POSTS_BY_SLUG.get(m[1]);
          if (meta) {
            const lm = meta.updatedDate ?? meta.pubDate;
            if (lm) item.lastmod = lm;
          }
        }
        return item;
      },
    }),
    imageSitemap(),
    pagefind(),
    partytown({ config: { forward: ['dataLayer.push'], debug: false } }),
  ],
  env: {
    schema: {
      GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_HANDLE: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_INSTANCE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      TWITTER_HANDLE: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      WEBMENTION_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      VERCEL_DEPLOY_HOOK_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
});
