# Authoring guide

## Writing a post

```sh
pnpm new:post "How I think about Speculation Rules"
```

This scaffolds `src/content/posts/YYYY-MM-DD-how-i-think-about-speculation-rules.mdx`
with the required frontmatter pre-filled. The leading `YYYY-MM-DD-` is
stripped from the URL — the slug above renders at
`/posts/how-i-think-about-speculation-rules`.

### Frontmatter fields

```yaml
---
title: How I think about Speculation Rules     # required, max 60 chars
description: One-sentence pitch under 160 chars # required, max 160
pubDate: 2026-04-29                              # required
updatedDate: 2026-05-12                          # optional; updates lastmod
tags: [web-platform, performance]                # must exist in tags.json
draft: false                                     # true to hide in production
cover:                                           # optional; powers OG + LCP
  src: ./cover.jpg
  alt: Diagram of the speculation rules graph
mastodonUrl: https://mastodon.social/@kevin/123  # for webmention thread
series:                                          # optional series grouping
  name: Cache Components
  order: 1
---
```

### Drafts

Set `draft: true` while iterating. Drafts:

- render in `pnpm dev` and `vercel preview` builds (so you can share a
  preview URL)
- are hidden from the live site, RSS, JSON Feed, and the sitemap

## Adding a tag

Tags are an explicit allowlist. Edit `src/content/tags.json` and add the new
slug to the `tags` array. The post schema rejects unknown tags at build
time — this prevents accidental tag sprawl and typos.

```json
{
  "tags": ["ai", "devrel", "performance", "web-platform", "personal", "your-new-tag"]
}
```

## Sharing to Mastodon + collecting webmentions

1. Publish the post (`git push` to main). Vercel deploys.
2. Toot a link from your Mastodon account.
3. Copy the toot URL into the post's `mastodonUrl` frontmatter.
4. Push the update. The DiscussFooter now links to the toot, and any
   replies federate back via webmention.io.

`WEBMENTION_TOKEN` is used by `src/lib/webmentions.ts` at build time to
fetch replies from webmention.io and render them on each post. There is
no built-in sender — to seed a mention manually, use a third-party tool
such as Telegraph (`telegraph.p3k.io`).

## AEO conventions

Posts target both human readers and AI answer surfaces. Two house rules:

1. **Definitional first sentence.** Open with one or two sentences that
   directly answer the post's headline question in plain English. AI
   summarisers (ChatGPT, Perplexity, Google AI Overviews) lift this verbatim.
2. **Question-form headings.** Use `## What is X?` / `## When should I
   use X?` / `## How does X compare to Y?` / `## How does X work?` for at
   least one section heading per post.

Other helpful conventions:

- Lead each section with a 1-2 sentence answer; expand below.
- Cite primary sources inline; the print stylesheet exposes URLs.
- Code blocks use Shiki dual themes (light + dark); no colour overrides.
- Provide plain-prose summaries beneath any visual (diagram, screenshot,
  chart). Answer engines can't see the image; the summary is what they index.

### AEO checklist

Before publishing, verify the post:

- [ ] Opens with a 1–2 sentence definitional answer to the title's question.
- [ ] Contains at least one question-form heading
      (e.g. `## What is X?`, `## How does X work?`).
- [ ] Each section starts with a TL;DR sentence answering its heading.
- [ ] Every image / diagram has both `alt` text AND a plain-prose summary
      paragraph nearby (alt text alone is invisible to most LLM scrapers).
- [ ] Tags listed in frontmatter are concrete topics (not vibes).
- [ ] Primary sources are linked inline, not parked in a footer.

## Non-English passages

Use `<span lang="…">…</span>` (e.g., `<span lang="ja">こんにちは</span>`)
when quoting non-English text in posts. This lets screen readers select
the right voice. The build does not lint for this — it's an author
convention.

## Image performance

- **Cover hero**: use the `cover:` frontmatter field. The site emits an
  AVIF + WebP preload pair with `fetchpriority="high"` for you (see
  `src/layouts/PostLayout.astro` for the preload wiring).
- **First inline image** in a short post: if the image will appear in the
  first viewport on mobile (i.e. before the reader scrolls), it can become
  the LCP candidate. Override the default `loading="lazy"` by writing the
  image as a manual `<Image src={...} alt="..." loading="eager" />` instead
  of `![alt](./path.png)`. Add `import { Image } from 'astro:assets';` at
  the top of the MDX file (above any prose).
- **Other inline images**: write as `![alt](./relative-path.png)`.
  The MDX pipeline sets `loading="lazy"`, `decoding="async"`, and width /
  height automatically.
- A build-time assertion fails the build if any `<img>` lacks dimensions
  — see `src/lib/assert-img-dims.ts`.

## Reviewing locally

```sh
pnpm dev          # iterate
pnpm check        # typecheck + biome + cspell + markdownlint
pnpm build        # surface schema errors (e.g. unknown tag)
pnpm preview:static  # serve dist/client on :4321 (Pagefind + static assets)
```

## Writing for AI answer engines

Posts must follow three rules. The build (`pnpm build`, `pnpm check`) fails
loudly otherwise — the remark-aeo plugin enforces them.

1. **Open with a TL;DR paragraph.** The first paragraph in the body is treated
   as the lead. It receives `class="lead"` automatically and is what AI
   answer engines (and Google's Speakable spec) quote first. Keep it tight —
   one or two sentences.
2. **Use `##` headings to chunk content.** At least one is required. AI
   engines use the outline to pick which section to cite.
3. **All images must declare `alt`, `width`, `height`, `loading`, and
   `decoding`.** Both raw `<img>` and Astro's `<Image />` are checked.

### Frontmatter limits

- `title`: ≤ 60 chars. (Google truncates search result titles around this length.)
- `description`: ≤ 160 chars.

### Optional: FAQ schema

When a post genuinely has a Q&A section, add a `faq` block to frontmatter:

```yaml
faq:
  - q: How do I do X?
    a: You do X by doing Y.
  - q: When does X apply?
    a: It applies whenever Z.
```

The Q&A also renders visibly at the foot of the post (Google requires the
schema content to match visible markup). FAQ schema is opt-in — only add it
when the post structure genuinely is FAQ-shaped.
