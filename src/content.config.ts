import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import tagsJson from './content/tags.json' with { type: 'json' };
import { DESCRIPTION_MAX, PROJECT_NAME_MAX, TITLE_MAX } from './lib/meta';
import { DATE_PREFIX } from './lib/post-id';

const TAG_SET = new Set(tagsJson.tags);

// z.coerce.date() silently produces Invalid Date for unparseable input
// (e.g. "tomorrow", "2026-13-01"). The post would then ship with literal
// "Invalid Date" strings in feeds and JSON-LD. Refine to reject early so
// the build fails with a useful error pointing at the offending file.
const validDate = (d: Date) => Number.isFinite(d.getTime());
const validDateMsg = { message: 'must be a parseable date (YYYY-MM-DD or ISO 8601)' };

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(TITLE_MAX),
      description: z.string().min(1).max(DESCRIPTION_MAX),
      pubDate: z.coerce.date().refine(validDate, validDateMsg),
      updatedDate: z.coerce.date().refine(validDate, validDateMsg).optional(),
      tags: z
        .array(z.string())
        .default([])
        .refine((tags) => tags.every((t) => TAG_SET.has(t)), {
          message: 'Tag not in allowlist (src/content/tags.json). Add it there first.',
        }),
      draft: z.boolean().default(false),
      cover: z.object({ src: image(), alt: z.string().min(1) }).optional(),
      mastodonUrl: z.string().url().optional(),
      series: z.object({ name: z.string(), order: z.number().int().positive() }).optional(),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    }),
});

const projects = defineCollection({
  loader: file('./src/content/projects/projects.yaml'),
  schema: z.object({
    // PROJECT_NAME_MAX is also enforced by scripts/new-project.ts so the
    // scaffolder and the schema can't drift; the schema is the source of
    // truth, the scaffolder is just an early-fail.
    name: z.string().min(1).max(PROJECT_NAME_MAX),
    blurb: z.string().max(200),
    url: z.string().url(),
    repoUrl: z.string().url().optional(),
    tech: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { posts, projects };
