import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import pagefind from 'astro-pagefind';
import { defineConfig, envField } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';
import { remarkReadingTime } from './src/lib/reading-time';

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
      filter: (page) => !page.includes('/api/') && !page.endsWith('/404'),
    }),
    pagefind(),
    partytown({ config: { forward: ['dataLayer.push'], debug: false } }),
  ],
  env: {
    schema: {
      GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_REPO: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_REPO_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_CATEGORY: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_CATEGORY_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_HANDLE: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_INSTANCE_URL: envField.string({
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
