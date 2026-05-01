# SEO/AEO improvements — design spec

**Date:** 2026-04-30
**Scope:** site-wide SEO, AEO (AI answer engine optimization), and CWV-safe
platform plumbing for kevinkiklee.io.

## Summary

Ship one cohesive site-wide SEO upgrade in a single spec. The site already has
a strong technical SEO baseline (OG/Twitter meta, canonical, RSS+JSON Feed,
sitemap with lastmod, image sitemap, `BlogPosting`/`Person`/`WebSite`/
`BreadcrumbList` JSON-LD, Pagefind, prefetch on hover, View Transitions). This
spec extends coverage and depth so future posts benefit automatically:

- One `@graph` per page with stable `@id`s and proper entity linking.
- `Blog` parent entity, `SoftwareSourceCode` for projects, `DefinedTerm` for
  tags, `articleSection`, `primaryImageOfPage`, `speakable` selectors,
  optional `FAQPage`, optional `license`/`copyrightYear`.
- AEO scaffolding: `/llms.txt`, `/llms-full.txt`, per-post `/posts/<slug>.md`.
- Build-time enforcement of TL;DR + `<h2>` outline + image-attribute hygiene.
- Visible `Breadcrumbs` and `PostNav` components, zero JS.
- EEAT polish: expanded `Person` schema, `rel="author"` on post bylines, one
  visible "credentials" line on `/about`.
- Head-metadata hardening: `<meta name="author">`, robots
  `max-image-preview:large`, `og:type=profile` on `/about`, `og:image:type`,
  `twitter:image:alt`, `hreflang`, OpenSearch, `<link rel="alternate"
  type="text/markdown">` on posts, `<link rel="prev/next">` on posts,
  `noindex,follow` on `/404` and `/search`.
- Routing/cache hygiene: self-canonical for `/posts/page/[N]`, cache headers
  for `llms*.txt` and `/posts/*.md`, AI-crawler directives in `robots.txt`.

Mechanical verification only (Vitest). Existing Lighthouse CI assertions
(SEO=1.0, A11y=1.0, Best-Practices=1.0, Performance≥0.95, LCP≤1500ms, CLS=0,
TBT≤100ms) act as the regression net.

## Goals

- Make every existing and future post automatically eligible for richer Google
  results and clearer AI-engine citation, without changing the post-authoring
  experience beyond a TL;DR + h2 outline requirement.
- Preserve all current Lighthouse budgets and the 6 KB/chunk JS budget. New
  components must be 0 KB JS.
- Keep the brutalist mono-typeface design intact. Two small new visible
  surfaces (breadcrumbs above title; prev/next at end of post) only.

## Non-goals

Listed explicitly so the implementation plan and any future review do not
re-litigate.

**Content strategy & topical authority.** Keyword research, topic clusters,
"how to rank for X" content plans. This spec ships *platform plumbing*; it
does not prescribe what to write. No copy edits to the four existing posts
beyond what is needed for the build to pass (see "Grandfathering" below).

**Lighthouse / CWV budget changes.** `lighthouserc.cjs` thresholds are
unchanged. The success criterion is "must not regress these," not "must
improve these." No new Lighthouse assertions added.

**Search Console & external services.** No Google Search Console verification
meta-tag work (verified via DNS). No Schema.org validator integration —
Lighthouse CI's structured-data audit is the regression net. No
sitemap-submission automation.

**International SEO.** Site is en-only. A single `hreflang="en"` plus
`hreflang="x-default"` declaration is added for hygiene; nothing more.

**PWA & offline.** No `manifest.webmanifest`. No service worker. View
Transitions + Speculation Rules already give the perceived-instant feel.

**Image pipeline expansion.** No multi-aspect-ratio OG image generation. No
portrait photo. `Person.image` stays unset until `SITE.portraitUrl` is
provided.

**Robots scope creep.** AI-crawler directives use a permissive default. Kevin
reviews the new robots block during spec review and overrides before merge if
he wants `Google-Extended: disallow` etc.

**Schema choices we deliberately do not revisit.** `BlogPosting` is the
correct type (not `Article` or `NewsArticle`). No `Comment` schema for
webmentions. No `License` on the `WebSite` entity (per-post optional only).
No AI-content-disclosure metadata (emerging, not standardized). No `HowTo` /
`Recipe` / `Course` schema. `DefinedTerm` is used only as the item type in
the `/tags` `ItemList`; no separate glossary surface.

**Performance constraints unchanged.** 6 KB/chunk JS budget unchanged. New
components are server-rendered only; no client-side islands introduced.

**Configuration mechanism.** New site-level config (`SITE.bio`,
`SITE.portraitUrl?`, optional `SITE.license?`) lives in `src/lib/site-config.ts`
as TypeScript constants. No new `astro:env` envFields — these are
site-identity constants, not environment-dependent.

**HTML head hygiene.** No `<meta name="keywords">` emitted; deprecated for
ranking. `BlogPosting.keywords` covers the schema-side equivalent.

**Author-time enforcement.** No commit-hook running the full build before
commit. The remark plugin fails `pnpm build` and `pnpm check` in CI; that's
the contract. Local commits stay fast.

## Architecture

### File map

```text
public/
  robots.txt                  EDIT  +AI-crawler allow blocks (Kevin to confirm)
  opensearch.xml              NEW   OpenSearch description, points at /search?q={searchTerms}

src/
  components/
    BaseHead.astro            EDIT  see "Head metadata" section below
    Breadcrumbs.astro         NEW   server-rendered, 0 KB JS
    PostNav.astro             NEW   server-rendered, 0 KB JS

  layouts/
    BaseLayout.astro          EDIT  pass-through props for new BaseHead args
    PostLayout.astro          EDIT  Breadcrumbs (top), FAQ (conditional), PostNav (bottom)

  lib/
    schema.ts                 EDIT  @graph composition, stable @ids, new builders
    schema.test.ts            EDIT  +tests for new builders, @id stability, headline guard,
                                    speakable selector constant export
    aeo.ts                    NEW   pure: buildLlmsIndex, buildLlmsFull
    aeo.test.ts               NEW
    crumbs.ts                 NEW   pure: crumbsFor(route, ctx)
    crumbs.test.ts            NEW
    meta.ts                   NEW   pure: validateTitleLength, validateDescriptionLength
    meta.test.ts              NEW
    mdx-to-md.ts              NEW   pure: walk mdast, drop MDX nodes, serialize
    mdx-to-md.test.ts         NEW
    posts.ts                  EDIT  +export prevNextFor(post, allPosts) -> { prev?, next? }
    posts.test.ts             EDIT  +tests for prevNextFor edge cases
    remark-aeo.ts             NEW   build-time enforcement; auto-attaches className="lead"
    remark-aeo.test.ts        NEW
    site-config.ts            EDIT  +bio, +portraitUrl?, +license?

  pages/
    404.astro                 EDIT  noindex,follow via BaseHead prop
    about.astro               EDIT  ogType="profile", profile name props, credentials line,
                                    full Person JSON-LD via expanded buildPerson
    index.astro               EDIT  consolidated @graph (WebSite + Blog + Person ref)
    privacy.astro             EDIT  WebPage + BreadcrumbList
    projects.astro            EDIT  CollectionPage + ItemList<SoftwareSourceCode> + Breadcrumbs
    search.astro              EDIT  noindex,follow; no schema
    rss.xml.ts                no change
    feed.json.ts              no change
    llms.txt.ts               NEW   index of post .md URLs
    llms-full.txt.ts          NEW   capped concatenation (50 most recent)
    posts/
      [...slug].astro         no direct edit (PostLayout does the work)
      [slug].md.ts            NEW   per-post clean-markdown endpoint
      index.astro             EDIT  CollectionPage + Blog + ItemList + Breadcrumbs
      page/[page].astro       EDIT  same + explicit self-canonical
    tags/
      index.astro             EDIT  CollectionPage + ItemList<DefinedTerm> + Breadcrumbs
      [tag].astro             EDIT  CollectionPage + ItemList + Breadcrumbs

  content.config.ts           EDIT  +optional faq?: { q: string; a: string }[] on posts

test/
  llms.test.ts                NEW   explicit string assertions (no snapshots)
  page-graph.test.ts          NEW   @id uniqueness across each page's @graph;
                                    FAQ visible↔JSON-LD parity
  post-md.test.ts             NEW   .md endpoint contract
  posts-content.test.ts       NEW   lints title/description length per published post
  routing.test.ts             NEW   no [slug].md.ts ↔ [...slug].astro collision
  vercel-config.test.ts       NEW   asserts cache patterns match new files

vercel.ts                     EDIT  cache patterns extended for llms*.txt and /posts/*.md
astro.config.ts               EDIT  register remark-aeo plugin
AUTHORING.md                  EDIT  AEO patterns section + FAQ frontmatter example
```

### Stable schema entity IDs

Defined once, reused across all pages for entity merging.

| `@id` | Type | Purpose |
|---|---|---|
| `https://kevinkiklee.io#website` | `WebSite` | Site identity, `SearchAction` |
| `https://kevinkiklee.io/about#person` | `Person` | Kevin (author/publisher) |
| `https://kevinkiklee.io/posts#blog` | `Blog` | Parent of all posts |

Every page emits **one** `<script type="application/ld+json">` containing a
`@graph` array. References between entities use `@id`, not inlined duplicates.
`buildPageGraph(parts)` deduplicates by `@id` so callers can pass refs and
full objects freely.

### Per-route structured data

| Route | `@graph` contents |
|---|---|
| `/` | `WebSite`, `Blog`, `Person` (ref) |
| `/about` | `Person` (full), `BreadcrumbList`, `WebSite` |
| `/projects` | `CollectionPage` (`mainEntity` → `ItemList`), `ItemList` of `SoftwareSourceCode`, `BreadcrumbList`, `WebSite` |
| `/posts`, `/posts/page/[N]` | `CollectionPage` (`mainEntity` → `ItemList`), `Blog`, `ItemList` of `BlogPosting` (refs), `BreadcrumbList`, `WebSite` |
| `/posts/[slug]` | `BlogPosting` (full: `author@id`, `publisher@id`, `isPartOf@id` → Blog, `mainEntityOfPage`, `primaryImageOfPage`, `articleSection`, `speakable: { cssSelector: ['.lead', 'h1'] }`, optional `FAQPage`, optional `license`/`copyrightYear`), `BreadcrumbList`, `WebSite` |
| `/tags` | `CollectionPage` (`mainEntity` → `ItemList`), `ItemList` of `DefinedTerm`, `BreadcrumbList`, `WebSite` |
| `/tags/[tag]` | `CollectionPage` (`mainEntity` → `ItemList`), `ItemList` of `BlogPosting` (refs), `BreadcrumbList`, `WebSite` |
| `/privacy` | `WebPage`, `BreadcrumbList`, `WebSite` |
| `/search` | (none — `noindex,follow`) |
| `/404` | (none — `noindex,follow`) |

### Per-route breadcrumbs

| Route | Trail |
|---|---|
| `/about` | `~ / about` |
| `/projects` | `~ / projects` |
| `/posts` | `~ / posts` |
| `/posts/page/N` | `~ / posts / page N` |
| `/posts/[slug]` | `~ / posts / [title, truncated to 50 chars]` |
| `/tags` | `~ / tags` |
| `/tags/[tag]` | `~ / tags / [tag]` |
| `/privacy` | `~ / privacy` |

`/` and `/404` omit breadcrumbs.

## AEO scaffolding

### `/llms.txt`

`src/pages/llms.txt.ts`. Convention: links point to per-post `.md` URLs.

```
# kevinkiklee.io
> Field notes from a Chrome DevRel — AI, web platform, and tangents.

## About
- [About Kevin Lee](https://kevinkiklee.io/about): DevRel at Google Chrome.

## Posts
- [<title>](https://kevinkiklee.io/posts/<slug>.md): <description>
...

## Feeds
- RSS: https://kevinkiklee.io/rss.xml
- JSON Feed: https://kevinkiklee.io/feed.json
- Sitemap: https://kevinkiklee.io/sitemap-index.xml
```

Posts sorted newest-first. Drafts excluded (same filter as sitemap).

### `/llms-full.txt`

`src/pages/llms-full.txt.ts`. Convenience concatenation of post bodies, **capped
at 50 most recent posts**. Posts separated by `\n\n---\n\n`. Header explains
it's a snapshot and points at `/llms.txt` for the canonical index.

### `/posts/<slug>.md`

`src/pages/posts/[slug].md.ts`. Clean-markdown rendering of each published
post. Pipeline:

```
post.body (raw MDX)
  → remark.parse with remark-mdx
  → mdx-to-md.ts: drop mdxjsEsm, replace mdxJsxFlow/Text with children-as-text
  → mdast-util-to-markdown
  → prepend YAML frontmatter (title, date, updatedDate?, tags, description, url)
  → serve as text/markdown; charset=utf-8
```

The `remark-aeo` plugin's `class="lead"` attachment is HTML-only and does
**not** apply here — this endpoint runs `mdx-to-md.ts` directly against
`post.body`, bypassing the HTML-render pipeline.

Routing: `[slug].md.ts` is more specific than `[...slug].astro` so Astro
resolves correctly. A unit test asserts both routes coexist (see Tests).

### FAQ schema (opt-in)

New optional field on the `posts` collection schema:

```ts
faq: z.array(z.object({ q: z.string(), a: z.string() })).optional()
```

When present and non-empty, `PostLayout`:

1. Renders a visible `## FAQ` section at the foot of the post (above
   `PostNav`). **Mandatory** for Google FAQ rich-result eligibility.
2. Adds a `FAQPage` entity to the page's `@graph` with each Q/A mapped to
   `Question`/`Answer`.

Visible markup ↔ JSON-LD parity is enforced by a fixture-driven test.

### EEAT

Expanded `Person` (used by `/about`'s full instance):

- `name`, `url`, `jobTitle`, `worksFor`
- `description` from `SITE.bio`
- `image` only when `SITE.portraitUrl` is set (no fake brand-mark fallback)
- `knowsAbout: ['Web platform', 'Chrome DevTools', 'Developer Relations',
  'JavaScript', 'AI tooling', 'Web performance', 'Browser engines']`
- `sameAs`: Mastodon, GitHub, LinkedIn, Bluesky

One new visible line on `/about` (Kevin to fill placeholder):

> Previously: <past role>. Speaks/writes about: web platform, AI tooling,
> browser internals.

Every post page references `Person` by `@id` only (no duplication). The
visible "by Kevin Lee" link in `PostMeta` carries `rel="author"`.

### Build-time enforcement (`src/lib/remark-aeo.ts`)

Walks the mdast post-parse. Behavior:

- Locates the `<h1>`; finds the first paragraph after it (skipping leading
  image/figure/blockquote nodes).
- Auto-attaches `className="lead"` to that paragraph so the `speakable`
  selector and CSS line up automatically.
- Fails the build if any of:
  - No `<h1>` found, or no paragraph found after the `<h1>` (no TL;DR).
  - Zero `<h2>` headings in the body.
  - Either a raw HTML `<img>` (mdast `html` / `mdxJsxFlowElement` named `img`)
    or Astro's `<Image />` MDX component (`mdxJsxFlowElement` named `Image`)
    lacks any of `alt`, `width`, `height`, `loading`, `decoding`.
  - Frontmatter `title` length > 60 (delegates to `meta.ts`).
  - Frontmatter `description` length > 160.

Wired into `astro.config.ts` `markdown.remarkPlugins`.

### Authoring guidance (`AUTHORING.md`)

New section "Writing for AI answer engines":

- Open with a TL;DR paragraph (the first paragraph; auto-classed as `.lead`).
- Use `<h2>` headings to chunk content (outline structure for AI engines).
- Prefer plain prose over jargon-dense intros.
- FAQ frontmatter example for opt-in `FAQPage` schema.
- Note that `pnpm build` / `pnpm check` will fail without TL;DR + h2 outline.

## Visible UI

Both components are server-rendered Astro, **0 KB JS**.

### `Breadcrumbs.astro`

**Props:** `items: { name: string; url: string }[]` (the active item's `url`
matches the current page; rendered as a non-link).

**Output:**

```html
<nav aria-label="Breadcrumb" class="crumbs">
  <ol role="list">
    <li><a href="/" aria-label="home">~</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="/posts">posts</a></li>
    <li aria-hidden="true">/</li>
    <li><span aria-current="page">Writing for AI answer engines</span></li>
  </ol>
</nav>
```

- Monospace, `font-size: var(--text-xs)`, `color: var(--fg-subtle)`; active
  crumb uses `var(--fg)`.
- Inline flex; wraps on overflow.
- `min-height: 1.5rem` (not `em`) for stable space reservation (CLS = 0).
- On post pages, the active crumb is the post title, truncated at 50 chars
  with `…`.
- Visible-UI source of truth = same `crumbsFor(route, ctx)` helper that feeds
  `BreadcrumbList` JSON-LD. Single source.

### `PostNav.astro`

**Props:** `prev?: PostEntry`, `next?: PostEntry`. **Convention:** `next` =
newer post, `prev` = older post (chronological forward).

**Output:**

```html
<nav aria-label="Post navigation" class="post-nav">
  <a class="prev" href="/posts/<prev.id>" rel="prev">
    <span class="label">← previous</span>
    <span class="title">{prev.data.title}</span>
  </a>
  <a class="next" href="/posts/<next.id>" rel="next">
    <span class="label">next →</span>
    <span class="title">{next.data.title}</span>
  </a>
</nav>
```

- Two-column grid; collapses to single column under 480px.
- Title clamped at 2 lines via `display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;`.
- `border-top: 1px solid var(--rule)`, padded for tap targets ≥ 44×44px.
- Edge cases: first post (no prev), newest post (no next), single post
  (renders nothing). Sibling lookup via `prevNextFor(post, allPosts)` from
  `lib/posts.ts`.

### PostLayout render order

```
Breadcrumbs → article body → FAQ (conditional) → PostNav → DiscussFooter → Webmentions
```

## Head metadata (`BaseHead.astro`)

Additions to existing meta block:

- `<meta name="author" content="Kevin Lee">`
- `<meta name="robots" content="index,follow,max-image-preview:large">`
  (replaced with `noindex,follow` when the new optional `noindex` prop is
  passed).
- Fix `<meta property="article:author">` to a URL
  (`https://kevinkiklee.io/about`); keep author name in `<meta name="author">`.
- `og:image:type` (e.g., `image/png`).
- `twitter:image:alt` (mirrors `og:image:alt`).
- `og:type=profile` branch for `/about` with `profile:first_name` /
  `profile:last_name`.
- `<link rel="alternate" hreflang="en" href="...">` and
  `<link rel="alternate" hreflang="x-default" href="...">`.
- `<link rel="search" type="application/opensearchdescription+xml"
  href="/opensearch.xml" title="kevinkiklee.io">`.
- On post pages: `<link rel="alternate" type="text/markdown"
  href="/posts/<slug>.md">`.
- On post pages: `<link rel="prev" href="...">` and/or
  `<link rel="next" href="...">` from `prevNextFor`.

`/posts/page/[N]` explicitly emits a self-canonical URL (does not default to
`/posts`).

## Tests

All Vitest, colocated `*.test.ts` next to source where applicable, otherwise
under `test/`. No Astro component rendering tests (per `CLAUDE.md`). No
external services. Existing `lighthouserc.cjs` is the structured-data /
performance regression net.

**`lib/schema.test.ts`** (extends existing)

- `buildPageGraph(parts)` deduplicates by `@id`.
- `buildBlogPosting` rejects headlines > 110 chars.
- `buildBlogPosting` includes `articleSection` from first tag and
  `speakable.cssSelector` from an exported constant.
- `buildBlog`, `buildSpeakable`, `buildAuthorRef` produce expected stable
  `@id`s.
- `buildItemList` of `SoftwareSourceCode` maps `repoUrl` → `codeRepository`,
  `tech` → `programmingLanguage[]`.
- `buildPerson` includes `knowsAbout`; omits `image` when no portrait set.

**`lib/aeo.test.ts`**

- `buildLlmsIndex(posts)` — header lines, sections, link format
  (`<title>](https://kevinkiklee.io/posts/<slug>.md)`), drafts excluded,
  newest-first.
- `buildLlmsFull(posts, cap=50)` — caps at 50 items.

**`lib/mdx-to-md.test.ts`**

- Drops `import` statements.
- Drops JSX flow/text elements, keeps inner text where present.
- Keeps code fences, lists, blockquotes, headings, paragraphs.
- Emits YAML frontmatter at the top.

**`lib/remark-aeo.test.ts`**

- Fixtures for both raw `<img>` and `<Image />`.
- Fails on: missing `<h1>`; `<h1>` but no following paragraph; missing
  `<h2>`; raw `<img>` missing any required attr.
- Passes on a well-formed fixture and asserts the first paragraph receives
  `className="lead"` matching the speakable selector constant from
  `schema.ts` (cross-cut).

**`lib/crumbs.test.ts`**

- `crumbsFor` for all spec'd routes, including `/posts/page/3` →
  `~ / posts / page 3`.
- 50-char title truncation.
- `/` and `/404` return `[]`.

**`lib/meta.test.ts`**

- `validateTitleLength('a'.repeat(60))` passes; 61 fails.
- `validateDescriptionLength('a'.repeat(160))` passes; 161 fails.

**`lib/posts.test.ts`** (extends existing)

- `prevNextFor` first-post / newest-post / single-post edge cases.
- "next = newer, prev = older" convention encoded in fixture.

**`test/posts-content.test.ts`**

- Iterates published posts; runs `validateTitleLength` and
  `validateDescriptionLength` against frontmatter; fails on any violation.

**`test/llms.test.ts`**

- Explicit string assertions (not snapshots): starts with
  `# kevinkiklee.io`; contains `## Posts`; each fixture post yields a
  `[<title>](https://kevinkiklee.io/posts/<slug>.md):` line; ends with three
  `## Feeds` lines (RSS, JSON Feed, Sitemap).
- `/llms-full.txt` includes ≤ 50 posts and the separator pattern.

**`test/post-md.test.ts`**

- Calls `posts/[slug].md.ts` GET handler with a fixture; asserts
  `Content-Type: text/markdown; charset=utf-8`, presence of YAML frontmatter,
  body markdown matches expected after MDX stripping.

**`test/routing.test.ts`**

- Imports `getStaticPaths` from both `posts/[...slug].astro` and
  `posts/[slug].md.ts`; asserts same slug set, no path collision.

**`test/page-graph.test.ts`**

- Asserts `@id` uniqueness across each page's `@graph`.
- Asserts `Person` appears once as a full object (only on `/about`) and
  elsewhere as `{ '@id': '...' }` references.
- FAQ fixture: visible markup Q/A pairs match the `FAQPage` JSON-LD pairs.

**`test/vercel-config.test.ts`**

- Imports `vercel.ts` config; asserts cache-pattern regexes match
  `llms.txt`, `llms-full.txt`, `/posts/<slug>.md`.

## Implementation order

Eight layers, each assuming prior layers merged. Suggested PR boundaries
listed at the end.

1. **Layer 1 — pure helpers.** `lib/meta.ts`, `lib/crumbs.ts`,
   `lib/posts.ts` (`prevNextFor`), `lib/mdx-to-md.ts`. All with tests.
2. **Layer 2 — schema rebuild.** `lib/schema.ts` refactor to `@graph`
   composition; new builders; headline guard; speakable selector constant.
3. **Layer 3 — build-time enforcement.** `lib/remark-aeo.ts` wired into
   `astro.config.ts`; `test/posts-content.test.ts`. **Includes step 0a
   below — grandfather existing posts.**
4. **Layer 4 — generated text endpoints.** `posts/[slug].md.ts`,
   `llms.txt.ts`, `llms-full.txt.ts`; `vercel.ts` cache rules extended;
   routing collision test.
5. **Layer 5 — visible UI.** `Breadcrumbs.astro`, `PostNav.astro`;
   `PostLayout.astro` wires render order.
6. **Layer 6 — head metadata.** `BaseHead.astro` updates listed above;
   `BaseLayout.astro` prop pass-through.
7. **Layer 7 — page integrations.** All page edits in the file map; new
   `site-config.ts` constants.
8. **Layer 8 — auxiliary files.** `robots.txt`, `opensearch.xml`,
   `AUTHORING.md`, `content.config.ts` `faq` field.

### Step 0a — grandfather existing posts (within Layer 3, before plugin merge)

Audit and minimally edit:

- `src/content/posts/2026-04-12-hello-world.mdx`
- `src/content/posts/2026-04-15-what-are-speculation-rules.mdx`
- `src/content/posts/2026-04-20-tools-i-use-in-2026.mdx`
- `src/content/posts/2026-04-26-writing-for-ai-answer-engines.mdx`

…to ensure each has `<h1>`, lead paragraph after it, ≥ 1 `<h2>`, and all
`<img>` / `<Image />` carry `alt` + `width` + `height` + `loading` +
`decoding`. Without this, the build will fail the moment Layer 3 lands.

### Suggested PR boundaries

- **PR 1** = Layers 1–3. Pure functions + schema + remark plugin +
  grandfathering. Easy to review.
- **PR 2** = Layer 4. `/llms.txt`, `/llms-full.txt`, per-post `.md`, cache
  rules. Single user-visible new surface.
- **PR 3** = Layers 5–6. Visible UI + head metadata. Reviewed for aesthetic
  fit.
- **PR 4** = Layers 7–8. Page integrations + aux files. Mostly mechanical
  wiring.

## Open decisions for review

- **AI-crawler robots.txt policy.** Default in spec is permissive (allow
  `GPTBot`, `Google-Extended`, `ClaudeBot`, `PerplexityBot`, `CCBot`,
  `Applebot-Extended`). Kevin overrides any of these before merge.
- **`SITE.portraitUrl`.** Defaults to unset. When provided, `Person.image`
  is emitted. No fallback brand-mark image.
- **`/about` credentials line copy.** Spec ships a placeholder; Kevin
  finalizes the wording during PR 4.
- **`SITE.license` (optional).** Defaults to unset. When set, every
  `BlogPosting` emits matching `license` / `copyrightYear`. Useful for AI
  engines that respect declared licenses.
