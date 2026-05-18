import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import tagsJson from './content/tags.json' with { type: 'json' };
import {
  DESCRIPTION_MAX,
  FAQ_A_MAX,
  FAQ_Q_MAX,
  PROJECT_BLURB_MAX,
  PROJECT_NAME_MAX,
  PROJECT_TECH_TAG_MAX,
  SERIES_NAME_MAX,
  TAG_MAX,
  TITLE_MAX,
} from './lib/meta';
import { DATE_PREFIX } from './lib/post-id';

const TAG_SET = new Set(tagsJson.tags);

// z.coerce.date() silently produces Invalid Date for unparseable input
// (e.g. "tomorrow", "2026-13-01"). The post would then ship with literal
// "Invalid Date" strings in feeds and JSON-LD. Refine to reject early so
// the build fails with a useful error pointing at the offending file.
const validDate = (d: Date) => Number.isFinite(d.getTime());
const validDateMsg = { message: 'must be a parseable date (YYYY-MM-DD or ISO 8601)' };

// `z.string().url()` accepts `javascript:`, `data:`, `file:` and other
// non-http(s) schemes (the URL constructor parses them without throwing).
// Frontmatter is author-trusted, but rendering a `javascript:` URL into
// `<a href>` would execute on click — a refinement here costs nothing
// and turns the trust model from "we trust the author not to typo" into
// "the build fails if a non-http(s) URL slips in."
const httpUrl = z
  .string()
  .url()
  .refine((v) => /^https?:/i.test(v), {
    message: 'URL must use http(s) — javascript:/data:/file: are rejected',
  });

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1).max(TITLE_MAX),
        description: z.string().min(1).max(DESCRIPTION_MAX),
        pubDate: z.coerce.date().refine(validDate, validDateMsg),
        updatedDate: z.coerce.date().refine(validDate, validDateMsg).optional(),
        tags: z
          .array(z.string().min(1).max(TAG_MAX))
          .default([])
          .refine((tags) => tags.every((t) => TAG_SET.has(t)), {
            message: 'Tag not in allowlist (src/content/tags.json). Add it there first.',
          }),
        draft: z.boolean().default(false),
        cover: z.object({ src: image(), alt: z.string().min(1) }).optional(),
        mastodonUrl: httpUrl.optional(),
        series: z
          .object({
            name: z.string().min(1).max(SERIES_NAME_MAX),
            order: z.number().int().positive(),
          })
          .optional(),
        faq: z
          .array(
            z.object({
              q: z.string().min(1).max(FAQ_Q_MAX),
              a: z.string().min(1).max(FAQ_A_MAX),
            }),
          )
          .optional(),
      })
      // A backwards-dated `updatedDate` produces nonsense feed `lastBuildDate`,
      // confuses sitemap lastmod-aware crawlers, and breaks the JSON-LD
      // `dateModified >= datePublished` guarantee. Catch the typo at build
      // time rather than letting it ship.
      .refine((d) => !d.updatedDate || d.updatedDate.getTime() >= d.pubDate.getTime(), {
        message: 'updatedDate must be on or after pubDate',
        path: ['updatedDate'],
      }),
});

const projects = defineCollection({
  loader: file('./src/content/projects/projects.yaml'),
  schema: z.object({
    // PROJECT_NAME_MAX is also enforced by scripts/new-project.ts so the
    // scaffolder and the schema can't drift; the schema is the source of
    // truth, the scaffolder is just an early-fail.
    name: z.string().min(1).max(PROJECT_NAME_MAX),
    // `blurb` lands in JSON-LD `SoftwareSourceCode.description` AND on the
    // visual card body. An empty value would silently degrade the
    // structured-data quality signal Google reads, so enforce min length
    // at schema time rather than discovering it post-deploy.
    blurb: z.string().min(1).max(PROJECT_BLURB_MAX),
    url: httpUrl,
    repoUrl: httpUrl.optional(),
    tech: z.array(z.string().min(1).max(PROJECT_TECH_TAG_MAX)).default([]),
    featured: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { posts, projects };
