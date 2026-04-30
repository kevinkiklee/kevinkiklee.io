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
title: How I think about Speculation Rules     # required, max 80 chars
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

If you want to seed a webmention manually, the
`@vercel/webhooks`-style webmention sender is wired through the
`WEBMENTION_TOKEN` env var.

## AEO conventions

Posts target both human readers and AI answer surfaces. Two house rules:

1. **Definitional first sentence.** Open with a single sentence that
   defines the topic in plain English. AI summarisers love this.
2. **Question-form headings.** Use `## What is X?` / `## When should I
   use X?` / `## How does X compare to Y?` for at least one heading.

Other helpful conventions:

- Lead each section with a 1-2 sentence answer; expand below.
- Cite primary sources inline; the print stylesheet exposes URLs.
- Code blocks use Shiki dual themes (light + dark); no colour overrides.

## Reviewing locally

```sh
pnpm dev          # iterate
pnpm check        # typecheck + biome + cspell + markdownlint
pnpm build        # surface schema errors (e.g. unknown tag)
pnpm preview      # serve dist/ with Pagefind index + OG endpoint live
```
