import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import tagsJson from './content/tags.json' with { type: 'json' };
import { DATE_PREFIX } from './lib/post-id';

const TAG_SET = new Set(tagsJson.tags);

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(DATE_PREFIX, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(60),
      description: z.string().min(1).max(160),
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
      faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
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
