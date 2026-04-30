import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import { remarkReadingTime } from './src/lib/reading-time';

export default defineConfig({
  site: 'https://kevinkiklee.io',
  trailingSlash: 'never',
  output: 'static',
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
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/api/') && !page.endsWith('/404'),
    }),
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
