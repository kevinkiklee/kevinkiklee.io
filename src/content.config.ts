import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import tagsJson from './content/tags.json' with { type: 'json' };

const TAG_SET = new Set(tagsJson.tags);

// Strip the leading `YYYY-MM-DD-` date prefix from filenames so URLs are
// `/posts/hello-world` rather than `/posts/2026-04-12-hello-world`.
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(80),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
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
    }),
});

const projects = defineCollection({
  loader: file('./src/content/projects/projects.yaml'),
  schema: z.object({
    name: z.string(),
    blurb: z.string().max(200),
    url: z.string().url(),
    repoUrl: z.string().url().optional(),
    tech: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { posts, projects };
