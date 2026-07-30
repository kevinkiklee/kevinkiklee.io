# kevinkiklee.io — Personal Blog Design

> **Note (2026-07-30):** the visual sections of this spec are superseded by
> [2026-07-29-quiet-meadow-redesign-design.md](./2026-07-29-quiet-meadow-redesign-design.md);
> architecture/SEO/CI decisions remain in force.

**Author:** Kevin Lee
**Date:** 2026-04-29
**Status:** Approved (brainstorming complete)
**Domain:** https://kevinkiklee.io
**Repo:** github.com/kevinkiklee/kevinkiklee.io
**Hosting:** Vercel (Hobby tier)

---

## Overview

A personal tech blog for Kevin Lee, Developer Relations Engineer at Google Chrome. Topics include AI and broader tech subjects. The site is monochromatic with a brutalist terminal aesthetic, monospace-driven, markdown-first, performance-obsessed, and SEO-strong. Content authored in MDX and pushed to git; Vercel auto-deploys.

The site exists both as a publishing surface and as a portfolio artifact — a Chrome DevRel's blog should itself demonstrate web-platform craft.

## Goals

- **Refined brutalist terminal aesthetic** — heavy borders, monospace, ASCII / box-drawing characters, all-caps headings, light + dark themes (user-toggleable, persists, no FOUC).
- **Markdown-first authoring** — write `.mdx` files, push, see live in ~30 seconds.
- **Top-tier Core Web Vitals** — LCP ≤ 1.5s, INP ≤ 100ms, CLS = 0.00 (75th percentile, 4G mobile).
- **Lighthouse 100s** on accessibility, best-practices, SEO; ≥ 95 on performance.
- **Best-in-class SEO + AEO** — full structured data, sitemap, RSS, JSON Feed, IndexNow, schema.org `BlogPosting`/`Person`/`BreadcrumbList`/`WebSite`+`SearchAction`.
- **Top-notch mobile experience** — mobile-first CSS, dvh units, ≥ 44px tap targets, no hover-only affordances, smooth transitions on mid-tier Android.
- **Refined motion** — per-route view transitions via Astro `<ClientRouter />`, Speculation Rules prerender for instant nav on Chrome, scroll-reveal fades, animated link underlines, theme crossfade. All compositor-only, ≤ 250ms, `prefers-reduced-motion` respected.
- **Heavy Mastodon integration** — primary social, `rel="me"` verification, "Discuss on Mastodon" on every post, webmentions ingest replies as comments alongside Giscus.
- **Efficient DX** — `pnpm dev` for hot-reload authoring, `pnpm new:post` scaffolds, single `pnpm check` runs typecheck + lint + format, Biome single-tool, pre-commit hooks.
- **Painless deploy** — push to `main`, Vercel ships in ~30s; preview deploys on PRs with Vercel-bot comments and Lighthouse-CI assertions.

## Non-Goals (v1)

- Newsletter signup
- /now, /uses, /talks pages
- Server-rendered routes (everything is static)
- Internationalization
- Outgoing webmention sender
- POSSE auto-syndication to Mastodon
- Cookie banner (unnecessary — both analytics layers are cookieless)
- CMS / admin UI
- Comments moderation UI (delegated to Giscus / GitHub Discussions + webmention.io)

---

## Decisions Log (TL;DR)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Astro 5 (static)** + TypeScript | Built for content sites; zero JS by default; native MDX, RSS, sitemap, View Transitions, image optimization. Cleanest path to Lighthouse 100. |
| D2 | **Vercel** hosting | First-class Astro support; free tier easily covers a personal blog; first-class image optimization, edge OG generation, Web Analytics, Speed Insights. |
| D3 | **Vanilla CSS** + custom properties (no Tailwind) | Brutalist mono with ~10 components is shorter and more controllable hand-written. |
| D4 | **Visual flavor: brutalist terminal** | Heavy borders, ASCII, all-caps, brackets. Dev-tool identity, refined-zine energy. |
| D5 | **Both themes with toggle** | Cookieless localStorage + `prefers-color-scheme`. No FOUC via inline blocking script. |
| D6 | **Per-route view transitions** | Forward-fade, back-slide, post-open scale-fade. View-transition-name morph for post titles. Chrome-only Speculation Rules prerender pairs with this. |
| D7 | **Pagefind** for search | Static index, ~50KB, zero infra; Cmd-K / `/` palette. |
| D8 | **Giscus + Mastodon webmentions** for comments | Giscus = GitHub Discussions; webmention.io ingests Mastodon/Bluesky replies. "Discuss on Mastodon" link on every post. |
| D9 | **Vercel Web Analytics + Speed Insights + GA4 via Partytown** | Vercel = privacy-friendly cookieless RUM + PV; GA4 for funnel analysis (loaded off-main-thread). |
| D10 | **No animation libraries** | Native CSS + Web Animations API + IntersectionObserver only. Zero runtime cost. |
| D11 | **Single source projects.yaml** | Projects are short metadata; YAML beats one MDX file each. |
| D12 | **Static curated projects list** | Manual control over what's featured; no GitHub API noise. |
| D13 | **`vercel.ts` typed config** | Replaces `vercel.json` per current Vercel best practice. |
| D14 | **Biome** for lint+format | Single tool; faster than ESLint+Prettier; native TS. |
| D15 | **pnpm** package manager | Matches Kevin's other projects (per `~/CLAUDE.md`). |
| D16 | **Node 24 LTS** | Vercel default; Astro 5 supported runtime. |
| D17 | **Branch-protected `main`** | All changes via PR (even solo); CI must be green. |
| D18 | **Renovate auto-merge** patch+minor | Lightweight dependency hygiene. |
| D19 | **Lighthouse CI on every PR** preview | Fails the PR if perf/CWV/a11y/seo budgets regress. |
| D20 | **IndexNow on every deploy** | Bing/Yandex push notification of new content (Google ignores it but doesn't hurt). |

---

## 1. Architecture & Tech Stack

### 1.1 Data flow

```
AUTHOR (Kevin)
  ├─ writes .mdx in /src/content/posts/
  ├─ curates entries in /src/content/projects/projects.yaml
  └─ git push → GitHub
            ↓
BUILD (Astro 5 on Vercel, Node 24 LTS, pnpm --frozen-lockfile)
  ├─ astro check       (TypeScript)
  ├─ Content Layer API validates collections w/ Zod
  ├─ MDX renders to static HTML
  ├─ Shiki dual-theme code highlighting
  ├─ astro-pagefind indexes posts
  ├─ @astrojs/sitemap + @astrojs/rss + custom feed.json
  ├─ Image pipeline: AVIF + WebP + responsive srcset
  ├─ Font subsetting at build time (variable WOFF2)
  ├─ Bundle visualizer outputs stats.html
  └─ ~30s build time (with .astro/ + pnpm cache)
            ↓
EDGE (Vercel CDN — global, HTTP/3, Brotli)
  ├─ Static HTML/CSS/JS served from edge cache
  ├─ /api/og — Vercel Function (Fluid Compute) renders OG images on demand
  ├─ stale-while-revalidate on HTML for instant + freshness
  ├─ immutable long-cache on /_astro/* and /fonts/*
  └─ Vercel Web Analytics + Speed Insights endpoints
            ↓
CLIENT (reader)
  ├─ HTML-first paint, ~6 KB initial JS (ClientRouter only)
  ├─ Speculation Rules prerender same-origin links (Chrome)
  ├─ View Transitions on nav (per-route choreography)
  ├─ Pagefind UI lazy on first ⌘K / "/"
  ├─ Giscus iframe lazy on viewport
  ├─ Theme toggle (no FOUC, cross-tab sync)
  └─ Partytown loads GA4 in a Web Worker (off main thread)
```

### 1.2 Stack table

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 5** (`output: 'static'`) | Content Layer API; `<ClientRouter />`; `astro:env`; `astro:assets` |
| Language | **TypeScript strict** | + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Content | **MDX** via `@astrojs/mdx`, validated via Content Collections + Zod | |
| Code highlighting | **Shiki** (built-in) with `min-light` + `min-dark` themes | dual-theme, mono-friendly |
| Markdown plugins | `remark-gfm`, `remark-smartypants`, `rehype-slug`, `rehype-autolink-headings`, custom `remark-reading-time` | |
| Search | **Pagefind** via `astro-pagefind` (`/shishkin/astro-pagefind`) | |
| Comments | **Giscus** (GitHub Discussions) + **webmention.io** ingest of Mastodon/Bluesky replies | |
| OG images | **`@vercel/og`** (Satori) at the edge | |
| Sitemap | **`@astrojs/sitemap`** with image sitemap extension | |
| RSS | **`@astrojs/rss`** + custom JSON Feed handler | |
| Analytics (RUM) | **`@vercel/speed-insights`** | RUM Core Web Vitals |
| Analytics (PV+events) | **`@vercel/analytics`** | Cookieless |
| Analytics (funnel) | **GA4** via **Partytown** (`@astrojs/partytown`) | Off-main-thread |
| Error tracking | **Sentry** on `/api/og` only | Free tier |
| Uptime | **Better Stack** (free tier) | 2 monitors |
| Styling | Vanilla CSS + custom properties + `@layer` | No Tailwind |
| Fonts | **JetBrains Mono** (body) + **IBM Plex Mono** (display, optional). Variable WOFF2, subset to ASCII + extended Latin, self-hosted. | Metric overrides → CLS=0 |
| Linter/formatter | **Biome** | Single tool |
| Pre-commit | **simple-git-hooks** + Biome + commitlint + cspell + markdownlint | |
| Package manager | **pnpm** | + `packageManager` field, `engines: node >=24` |
| Hosting | **Vercel** (Hobby) | |
| Repo | **GitHub** (public) | Branch-protected `main` |
| Node | **24 LTS** | Pinned via `.nvmrc` + `engines` |

### 1.3 vercel.ts (typed)

```ts
// vercel.ts
import { defineConfig, routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = defineConfig({
  framework: 'astro',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  outputDirectory: 'dist',
  redirects: [
    routes.redirect('/feed', '/rss.xml', { permanent: true }),
    // www → apex; trailing-slash strip handled below
  ],
  headers: [
    routes.header('/(.*)', [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: CSP /* defined in lib/csp.ts */ },
    ]),
    routes.cacheControl('/_astro/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/fonts/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/api/og(.*)', { public: true, sMaxAge: '1 year', immutable: true, staleWhileRevalidate: '1 day' }),
    routes.cacheControl('/(rss\\.xml|feed\\.json|sitemap.*)', { public: true, maxAge: '10 min', sMaxAge: '1 hour' }),
    routes.cacheControl('/(.*)\\.html', { public: true, sMaxAge: '60s', staleWhileRevalidate: '1 day' }),
  ],
  crons: [
    { path: '/api/refresh', schedule: '0 5 * * 1' }, // Mon 5am — pull fresh webmentions
  ],
});
```

---

## 2. Information Architecture & Content Model

### 2.1 Routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Home — masthead + latest 5 posts + featured projects strip | Speculation Rules + ClientRouter mounted in BaseLayout |
| `/posts` | Full archive grouped by year | Paginated 30/page (`/posts/2`, …) |
| `/posts/[slug]` | Individual post | View-transition-name morph from archive |
| `/tags` | All tags grid w/ counts | |
| `/tags/[tag]` | Posts filtered by tag | Paginated; `noindex` if < 3 posts |
| `/tags/[tag]/rss.xml` | Per-tag RSS feed | |
| `/projects` | Curated projects list | From `projects.yaml` |
| `/about` | Bio, social links, `rel="me"` plumbing | h-card microformat |
| `/search` | Pagefind UI | Plus global ⌘K / "/" overlay everywhere |
| `/privacy` | Plain-language disclosure of analytics + comments | Linked from footer |
| `/rss.xml` | Full-text RSS feed | |
| `/feed.json` | JSON Feed | |
| `/sitemap-index.xml` + `/sitemap-0.xml` | Generated by `@astrojs/sitemap` | With `lastmod`, `priority`, image sitemap |
| `/robots.txt` | Disallow `/api/`; pointer to sitemap | |
| `/404` | Custom brutalist 404 page with nav + search trigger | |
| `/api/og?slug=...` | Dynamic OG image (1200×630 PNG, brutalist) | Edge function, immutable cache |
| `/api/refresh` | Cron-triggered Vercel Deploy Hook ping | Weekly fresh build |

### 2.2 Content collections (Astro 5 Content Layer)

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(80),
      description: z.string().max(160),       // doubles as meta description + OG description
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),  // lowercase, kebab-case, validated against allowlist
      draft: z.boolean().default(false),
      cover: z.object({                       // optional, drives OG image + post hero
        src: image(),
        alt: z.string().min(1),
      }).optional(),
      mastodonUrl: z.string().url().optional(),
      series: z.object({
        name: z.string(),
        order: z.number().int().positive(),
      }).optional(),
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
```

**Schema invariants:**
- Tags validated at build time against `src/content/tags.json` allowlist. Adding a tag requires updating that file → prevents drift (`AI` vs `ai`).
- Slugs derived from filename: `2026-04-12-how-chrome-ships-features.mdx` → `/posts/how-chrome-ships-features`. Date in filename for organization, stripped from URL. `pubDate` frontmatter is the source of truth.
- `draft: true` excluded from prod, included on Vercel Preview (`VERCEL_ENV === 'preview'`) and `pnpm dev`.
- Reading time (`minutesRead`) computed at build via custom remark plugin; injected into entry's `remarkPluginFrontmatter`.
- Cover image required to declare non-empty `alt`.

### 2.3 Directory layout

```
kevinkiklee.io/
├── docs/superpowers/
│   ├── specs/
│   │   └── 2026-04-29-personal-blog-design.md       (this file)
│   └── plans/                                       (implementation plans live here)
├── src/
│   ├── components/
│   │   ├── BaseHead.astro            # all <head> meta, JSON-LD, links
│   │   ├── Header.astro              # nav row + brand + theme toggle
│   │   ├── Footer.astro              # social + privacy + RSS + JSON Feed
│   │   ├── ThemeToggle.astro
│   │   ├── PostCard.astro
│   │   ├── PostMeta.astro            # date · tags · reading time
│   │   ├── PostList.astro            # archive table
│   │   ├── ProjectCard.astro
│   │   ├── TagPill.astro
│   │   ├── TableOfContents.astro     # sticky on desktop, inline on mobile
│   │   ├── RelatedPosts.astro
│   │   ├── DiscussFooter.astro       # Mastodon + Giscus + webmentions
│   │   ├── Webmentions.astro         # rendered list
│   │   ├── SearchPalette.astro       # <dialog> w/ Pagefind UI, lazy
│   │   ├── Search.astro              # /search route component
│   │   ├── KeyboardShortcuts.astro   # global key handlers (g h, /, ?)
│   │   ├── ShortcutsOverlay.astro    # <dialog> shown on '?'
│   │   ├── PrerenderRules.astro      # <script type="speculationrules">
│   │   ├── PrefetchRules.astro       # <link rel="prefetch"> fallback
│   │   ├── CodeBlock.astro           # wraps Shiki output, copy button island
│   │   └── icons/                    # inline SVG (≤1KB each, currentColor)
│   ├── layouts/
│   │   ├── BaseLayout.astro          # <ClientRouter /> here; landmarks; skip link
│   │   └── PostLayout.astro          # post + ToC + related + discuss footer
│   ├── pages/
│   │   ├── index.astro
│   │   ├── posts/
│   │   │   ├── index.astro           # /posts (paginated)
│   │   │   ├── [page].astro          # /posts/2, /posts/3 ...
│   │   │   └── [...slug].astro       # /posts/<slug>
│   │   ├── tags/
│   │   │   ├── index.astro
│   │   │   ├── [tag].astro
│   │   │   └── [tag]/rss.xml.ts
│   │   ├── projects.astro
│   │   ├── about.astro
│   │   ├── search.astro
│   │   ├── privacy.astro
│   │   ├── 404.astro
│   │   ├── rss.xml.ts                # @astrojs/rss handler
│   │   ├── feed.json.ts              # JSON Feed handler
│   │   └── api/
│   │       ├── og.ts                 # @vercel/og endpoint
│   │       └── refresh.ts            # cron-triggered deploy hook ping
│   ├── content/
│   │   ├── posts/                    # *.mdx
│   │   ├── projects/projects.yaml
│   │   └── tags.json                 # allowlist
│   ├── styles/
│   │   ├── global.css                # @layer reset, tokens, base, components, prose, utilities
│   │   ├── tokens.css                # CSS custom properties (font, color, space)
│   │   ├── prose.css                 # MDX body styles
│   │   ├── code.css                  # Shiki + copy button styles
│   │   ├── transitions.css           # ::view-transition-* keyframes
│   │   └── print.css
│   ├── lib/
│   │   ├── csp.ts                    # CSP header builder (used by vercel.ts)
│   │   ├── schema.ts                 # JSON-LD builders (BlogPosting, Person, etc.)
│   │   ├── og.ts                     # Satori template builder
│   │   ├── webmentions.ts            # webmention.io fetcher
│   │   ├── related.ts                # related-posts ranker
│   │   ├── reading-time.ts           # remark plugin
│   │   ├── prerender-analytics.ts    # gates pageview on prerenderingchange
│   │   └── theme.ts                  # toggle + cross-tab sync
│   ├── content.config.ts
│   └── env.d.ts
├── public/
│   ├── fonts/                        # subset variable WOFF2 (web)
│   ├── fonts/og/                     # raw TTF for Satori (server-side)
│   ├── og-default.png                # static OG fallback
│   ├── favicon.svg                   # SVG w/ prefers-color-scheme media query
│   ├── favicon-32.png
│   ├── favicon-192.png
│   ├── favicon-512.png
│   └── robots.txt
├── scripts/
│   ├── new-post.ts                   # pnpm new:post "<title>"
│   ├── new-project.ts                # pnpm new:project "<name>"
│   └── subset-fonts.ts               # pnpm fonts:subset
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # typecheck, build, lint, link-check, a11y, lighthouse, size
│   │   └── size.yml                  # bundle-size diff comment
│   └── pull_request_template.md
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── astro.config.ts
├── tsconfig.json                     # strict + extras
├── biome.jsonc
├── cspell.config.cjs
├── .markdownlint.jsonc
├── commitlint.config.cjs
├── renovate.json
├── lighthouserc.cjs
├── vercel.ts
├── .editorconfig
├── .nvmrc                            # 24
├── .gitignore
├── .env.example
└── package.json
```

---

## 3. Visual System

### 3.1 Type system (mobile-first, fluid)

```css
:root {
  --font-mono:    'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --font-display: 'IBM Plex Mono', var(--font-mono);

  --text-xs:   clamp(0.72rem, 0.70rem + 0.10vw, 0.78rem);
  --text-sm:   clamp(0.82rem, 0.80rem + 0.13vw, 0.90rem);
  --text-base: clamp(0.95rem, 0.92rem + 0.18vw, 1.05rem);
  --text-lg:   clamp(1.10rem, 1.05rem + 0.25vw, 1.25rem);
  --text-xl:   clamp(1.40rem, 1.30rem + 0.50vw, 1.75rem);
  --text-2xl:  clamp(1.80rem, 1.60rem + 1.0vw,  2.50rem);

  --leading-body:  1.65;
  --leading-tight: 1.25;
  --measure: 68ch;
}
```

### 3.2 Color tokens (verified WCAG)

```css
:root[data-theme='light'] {
  --bg:        #f5f4ee;
  --fg:        #0a0a0a;     /* 21:1 vs bg ✓ AAA */
  --fg-muted:  #4a4a4a;     /* 7.5:1 ✓ AAA */
  --fg-subtle: #767676;     /* 4.6:1 ✓ AA  */
  --rule:      #0a0a0a;
  --rule-soft: #c8c5b8;
  --pill-bg:   #0a0a0a;
  --pill-fg:   #f5f4ee;
  --code-bg:   #ebe9df;
  --selection-bg: #0a0a0a;
  --selection-fg: #f5f4ee;
}

:root[data-theme='dark'] {
  --bg:        #0a0a0a;
  --fg:        #ededed;     /* 18.5:1 ✓ AAA */
  --fg-muted:  #b5b5b5;     /* 9.4:1 ✓ AAA */
  --fg-subtle: #888888;     /* 4.7:1 ✓ AA  */
  --rule:      #ededed;
  --rule-soft: #2a2a2a;
  --pill-bg:   #ededed;
  --pill-fg:   #0a0a0a;
  --code-bg:   #161616;
  --selection-bg: #ededed;
  --selection-fg: #0a0a0a;
}
```

No color carries semantic meaning — text/symbols carry semantics. Safe for color-blind readers and forced-colors mode.

### 3.3 Spacing & rhythm

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
}
```

Vertical rhythm = `--leading-body × --text-base` ≈ 28px → `--space-5`/`--space-6` are natural section gaps.

### 3.4 No-FOUC theme toggle

```html
<!-- inline in <head>, blocks paint, ~250 bytes -->
<script>
  (function () {
    var stored = localStorage.getItem('theme');
    var prefers = matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = stored || (prefers ? 'dark' : 'light');
  })();
</script>
<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
```

- `<html style="background:#0a0a0a">` set inline so no white flash even before CSS or during view-transition fallback.
- ClientRouter swap preserves `data-theme` (lives on `<html>`, not in swap region).
- Toggle button updates `dataset.theme` + `localStorage`; CSS handles 180ms `background-color` + `color` crossfade only (other transitions disabled during page swap).
- `storage` event listener syncs across tabs.
- `matchMedia('change')` listener follows OS theme iff user hasn't manually picked.

### 3.5 Mobile-first responsive system

- Container widths: `min(100% - 2rem, 760px)` (prose), `min(100% - 2rem, 1100px)` (lists).
- Two real breakpoints: `≥640px` (tablet+ refinements), `≥1024px` (sticky ToC, denser archive).
- `dvh` for full-height units (avoids iOS Safari address-bar thrash).
- Touch targets ≥ 44×44px on all interactive elements.
- Hover affordances always paired with `:focus-visible`; nothing is hover-only.
- Hover effects wrapped in `@media (hover: hover) and (pointer: fine)` — no sticky hover on iOS.
- Container queries (`container-type: inline-size`) on `PostCard` so it adapts to featured-strip vs grid vs related-posts contexts.
- Horizontal-scroll tag-chip row on mobile uses `scroll-snap-type: x mandatory`.
- `overscroll-behavior-y: contain` to prevent accidental pull-to-refresh.
- `-webkit-tap-highlight-color: transparent` + explicit `:active` style for tactile feedback.

### 3.6 Typography polish

- `text-wrap: balance` on `h1`/`h2` (no widows on responsive).
- `text-wrap: pretty` on body paragraphs (better last-line breaks).
- `hyphens: auto` on prose only.
- `overflow-wrap: anywhere` on inline code + long URLs (no mobile horizontal scroll).
- `font-variant-numeric: tabular-nums slashed-zero` on dates / archive columns.
- `text-rendering: optimizeLegibility` + smoothing on body.
- `caret-color: var(--fg)` on inputs.
- `accent-color: var(--fg)` on native form controls.
- Scrollbar styling via `scrollbar-color` (Firefox + new Chrome) + `::-webkit-scrollbar-*` (square, thin, brutalist).

### 3.7 Accessibility baseline

- Skip link as first interactive element.
- Landmarks: `<header>`, `<nav>`, `<main id="main">`, `<aside>`, `<footer>`.
- After `astro:after-swap`: focus moved to `<main h1>`, route change announced via `aria-live="polite"` region.
- `:focus-visible` rings: 2px outline + 2px offset, `currentColor`.
- Heading hierarchy validated by build-time check.
- Cover image alt schema-enforced; inline image alt enforced by custom remark lint.
- Forced-colors mode: explicit `@media (forced-colors: active)` rules using `CanvasText`, `Canvas`, `LinkText`.
- `prefers-reduced-motion: reduce` disables view transitions, scroll-reveal, theme crossfade (instant swap).
- `prefers-reduced-data: reduce` drops cover hero on post pages, skips scroll-reveal.
- `<dialog>` for search palette and shortcuts overlay (free a11y semantics).
- `aria-current="page"` on nav links matching current route.

### 3.8 Iconography

- ASCII / box-drawing characters where possible (`→`, `←`, `↗`, `[→]`, `─`, `·`, `┌─┐`).
- When real icons needed (GitHub, Mastodon), inline SVG, `currentColor`, ≤ 1KB each.
- No icon font dependency.

### 3.9 Critical CSS

- Astro `vite.build.cssCodeSplit: true` + `inlineStylesheets: 'auto'`.
- `@layer reset, tokens, base, components, prose, utilities;` for predictable cascade.
- Andy Bell-style minimal CSS reset (~1KB).

---

## 4. Animations & Page Transitions

### 4.1 Mental model

All motion exists to communicate state change, never decoration. Compositor-only properties (`transform`, `opacity`, `filter`). 250ms cap. Single easing family: `cubic-bezier(0.32, 0.72, 0, 1)`. No animation libraries — native CSS + Web Animations API + IntersectionObserver only.

### 4.2 Page transitions (Astro `<ClientRouter />`)

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter fallback="swap" />
</head>
```

**Per-route choreography (`data-nav-direction` set on `<html>` by lifecycle listeners):**

| Pair | Animation | Reason |
|---|---|---|
| home → post | scale-fade-in | post "opens" out of card |
| post → home | scale-fade-out | reverses gracefully |
| archive → post | slide-up 12px + fade | post emerges from list |
| post → archive (back) | slide-down + fade | reverses |
| nav same-level | fade only (180ms) | subtle, fast |
| browser back | horizontal slide right→ | native semantics |
| theme toggle | crossfade colors (no nav) | paint only |

**Direction detection:**
- `astro:before-preparation` reads `event.navigationType === 'traverse'` → back/forward.
- Push `{ depth: prevDepth + 1 }` to `history.state` on every nav; `before-preparation` reads delta to pick `back` / `forward` / `lateral`.
- Class on `<html>`: `data-nav-direction="back"` etc. CSS keyframes pick the right variant.

**View-transition-name continuity:**
```
header brand:    view-transition-name: brand-mark;
nav row:         view-transition-name: site-nav;
post title in archive ↔ <h1> on post page:
                 view-transition-name: post-title-{slug};
```

To guarantee uniqueness during the transition, only the post-card currently in viewport carries `view-transition-name` (set via IntersectionObserver). Where browser supports `view-transition-class` (Chrome 125+), use that instead.

**Lock to suppress conflicting transitions:**
```css
:root[data-transitioning],
:root[data-transitioning] * {
  transition: none !important;
}
```
Set on `astro:before-preparation`, removed on `astro:after-swap`.

**Reduced-motion override:**
```ts
document.addEventListener('astro:before-preparation', (e) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    e.viewTransition?.skipTransition();
  }
});
```

**Save-data / 2g override:**
```ts
const c = (navigator as any).connection;
if (c?.saveData || ['slow-2g', '2g'].includes(c?.effectiveType)) {
  e.viewTransition?.skipTransition();
}
```

**Focus + scroll restoration:**
- `astro:after-swap`: focus moved to `<main h1>`; `aria-live` polite region announces route.
- `<aside>` ToC uses `transition:persist` to preserve open state.
- Window scroll resets to top on forward; preserved on back.

**Cleanup:**
- `astro:before-swap` disconnects all IntersectionObservers and cancels pending Web Animations.

### 4.3 Speculation Rules + prefetch

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "and": [
      { "href_matches": "/*" },
      { "not": { "href_matches": "/api/*" }},
      { "not": { "selector_matches": "[data-no-prerender]" }}
    ]},
    "eagerness": "conservative"
  }],
  "prefetch": [{
    "where": { "and": [
      { "href_matches": "/*" },
      { "not": { "href_matches": "/api/*" }}
    ]},
    "eagerness": "moderate"
  }]
}
</script>
```

- Prerender on pointerdown (`conservative`); prefetch on hover/viewport (`moderate`).
- Stays within Chrome's 10 prerenders / 50 prefetches per-page budget.
- bfcache-friendly: use `pagehide`/`pageshow`, never `unload`. No long-lived intervals.
- Astro `prefetch` strategy per-link: nav links `viewport`; in-prose links `hover`; external (Mastodon, GitHub) `false`.
- Falls back to plain `<link rel="prefetch">` in non-Chromium.

**Prerender-aware analytics:**
```ts
function ready(fn: () => void) {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', fn, { once: true });
  } else {
    fn();
  }
}
ready(() => { vercelAnalytics.pageview(); ga4Pageview(); });
```

### 4.4 Content motion

- **Scroll-reveal fades:** IntersectionObserver toggles `.in-view` → CSS `opacity 0→1, translateY 8px→0` over 240ms. Once-only. Where supported, CSS `animation-timeline: view()` replaces the JS observer entirely (lighter; observer stays as fallback). Stagger via `--i` index inline, capped at 8 items × 30ms.
- **Animated inline-link underline:** Pure CSS — `background-image: linear-gradient(to right, currentColor, currentColor); background-size: 0 1px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 200ms cubic-bezier(.32,.72,0,1);` → `:hover, :focus-visible` sets `background-size: 100% 1px`.
- **Hover state on post cards:** border color shift (`--rule-soft → --rule`), trailing `→` arrow `transform: translateX(2px)`. No box-shadow, no scale.
- **Cursor blink on terminal prompts:** `::after { content: '_'; animation: blink 1s steps(2) infinite; }` — sparse use only (header `$ ` prompt + 404). Disabled by `prefers-reduced-motion`.
- **Theme toggle crossfade:** `:root { transition: background-color 180ms, color 180ms; }` only. Suppressed during page swap by `data-transitioning`.

### 4.5 Performance budget for motion

- Compositor-only properties; non-compositor animations rejected in review.
- ≤ 250ms per animation, ≤ 320ms total page transition.
- 60fps target on Pixel 6a-class Android.
- No animations during initial paint (LCP). Scroll-reveal kicks in after `load` + 100ms idle.
- `will-change` applied only during active animation; removed on end.

---

## 5. Performance, Core Web Vitals, SEO, AEO

### 5.1 Performance budgets (assertion-tested in CI)

| Metric | Budget |
|---|---|
| HTML (gzip, per route) | ≤ 30 KB |
| CSS (inlined critical + linked) | ≤ 20 KB total |
| JS (no islands) | ≤ 6 KB initial (ClientRouter only) |
| JS (post page w/ Giscus lazy) | ≤ 6 KB initial; +30 KB on Giscus viewport |
| JS (search route) | ≤ 6 KB initial; +50 KB Pagefind UI on first interaction |
| Fonts (per route) | ≤ 30 KB (single subsetted variable WOFF2 preloaded) |
| Hero image (post) | ≤ 60 KB AVIF (1200w, q70) |
| Total (median post) | ≤ 120 KB |

| CWV (75th percentile, mobile, 4G) | Target |
|---|---|
| LCP | ≤ 1.5 s |
| INP | ≤ 100 ms |
| CLS | 0.00 |
| TTFB | ≤ 200 ms |
| FCP | ≤ 1.0 s |

### 5.2 Asset optimization

**Images:**
- All content images via Astro `<Image>` / `<Picture>` (`astro:assets`), AVIF + WebP, intrinsic sizing, `loading="lazy"` below fold, `fetchpriority="high"` + `loading="eager"` only on LCP-anchoring hero.
- `<link rel="preload" as="image" imagesrcset imagesizes>` for post hero — derived from Astro's generated srcset.
- Responsive widths: `[400, 800, 1200, 2400]`.
- Source images live in `src/assets/` (Astro processes); `public/` only for raw assets (favicon, OG fallback, fonts, robots).
- OG images cached at edge `s-maxage=31536000, immutable, swr=86400`.

**Fonts:**
- Single variable WOFF2 per family, subset to ASCII + extended Latin (~25–30KB).
- Preload primary mono only with `crossorigin`.
- `@font-face` with `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` matched to `ui-monospace` fallback → CLS = 0.
- `unicode-range` declarations so unused subsets don't fetch.

**CSS:**
- `vite.build.cssCodeSplit: true`, `inlineStylesheets: 'auto'`.
- `@layer` for predictable cascade.
- No `!important` battles.
- `content-visibility: auto` on below-fold archive rows, related posts, project cards.
- `contain: layout paint` on isolated cards.

**JS:**
- Zero islands by default.
- `<ClientRouter />` is the only baseline JS (~6KB).
- Per-island JS via `client:visible` (Giscus, Pagefind UI, copy-code button).
- Partytown loads GA4 in a Web Worker.
- `requestIdleCallback` (or 1500ms timeout) defers Vercel Analytics + Partytown init so they never compete with LCP.

**Resource hints (lean):**
- `<link rel="dns-prefetch">` + `<link rel="preconnect">` for Giscus only when post is scrolled near the comments section (IntersectionObserver-driven).

### 5.3 HTTP caching

| Path | Cache-Control |
|---|---|
| `/`, `/posts`, `/tags/*`, `/about`, `/posts/*` | `public, s-maxage=60, stale-while-revalidate=86400` |
| `/_astro/*` | `public, max-age=31536000, immutable` |
| `/fonts/*` | `public, max-age=31536000, immutable` |
| `/api/og` | `public, s-maxage=31536000, immutable, swr=86400` |
| `/sitemap-index.xml`, `/rss.xml`, `/feed.json` | `public, max-age=600, s-maxage=3600` |

HTTP/3, Brotli, atomic deploys all auto on Vercel.

### 5.4 Security headers

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline'
             https://*.vercel-insights.com
             https://giscus.app
             https://www.googletagmanager.com
             https://www.google-analytics.com
             https://cdn.jsdelivr.net;          /* partytown lib */
  style-src 'self' 'unsafe-inline' https://giscus.app;
  img-src 'self' data: https://*.giscus.app https://*.gravatar.com
          https://avatars.githubusercontent.com;
  frame-src https://giscus.app;
  connect-src 'self' https://*.vercel-insights.com
              https://*.google-analytics.com
              https://webmention.io;
  font-src 'self';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;

Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(),
                    accelerometer=(), gyroscope=(), magnetometer=(), payment=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
```

After 30+ days of confirmed HSTS in production: submit `kevinkiklee.io` to hstspreload.org.

### 5.5 SEO

**Per-page `<head>`:**
- `<title>{title} · kevinkiklee.io` template
- `<meta name="description">` from schema.description
- `<link rel="canonical" href="https://kevinkiklee.io/...">` (full URL)
- Open Graph: `og:type` (`website` | `article`), `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image` (`/api/og`), `og:image:alt`
- Twitter: `summary_large_image`, `twitter:title/description/image`
- `<link rel="me" href="https://...mastodon.social/@kevin">`
- `<link rel="webmention" href="https://webmention.io/kevinkiklee.io/webmention">`
- `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`
- `<link rel="alternate" type="application/feed+json" href="/feed.json">`

**Sitemap (`@astrojs/sitemap`):**
- `lastmod` from `updatedDate || pubDate`
- `priority`: home 1.0; posts/projects/about 0.8; tag pages 0.6
- Image sitemap entries for cover images
- Drafts excluded in prod via filter

**Robots:**
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://kevinkiklee.io/sitemap-index.xml
```

**JSON-LD (per page type):**
- Home → `WebSite` + `SearchAction` (`/search?q={query}`)
- About → `Person` with `sameAs[mastodon, github, linkedin, bluesky]`, `jobTitle`, `worksFor`
- Posts → `BlogPosting` with `headline`, `datePublished`, `dateModified`, `author` (Person ref), `image`, `keywords`, `articleBody`, `mainEntityOfPage`, `wordCount`, `timeRequired`, `inLanguage: en-US`
- Nested → `BreadcrumbList`

**URL hygiene:**
- Trailing-slash policy: never (`astro.config.ts: trailingSlash: 'never'`); `vercel.ts` 308-redirects `/foo/` → `/foo`.
- Apex enforcement: `vercel.ts` 308-redirects `www.kevinkiklee.io` → `kevinkiklee.io`.
- Self-canonical on paginated pages (per current Google guidance; `rel="prev/next"` deprecated).
- Tag pages with < 3 posts: `<meta name="robots" content="noindex">` to avoid thin-content penalty.

**IndexNow on deploy:** post-deploy hook pings `api.indexnow.org` with new/updated URLs (Bing, Yandex pick up immediately; Google ignores but harmless).

**Search Console + Bing Webmaster Tools** verified via DNS TXT (kept permanent); sitemap submitted to both.

### 5.6 AEO (Answer Engine Optimization)

Content conventions:
- Each post starts with a 1–2 sentence definition/answer (TL;DR for AI + humans).
- Headings match question form ("How does Chrome ship features?") for direct snippet quoting.
- Plain-prose summaries for visual content (LLMs can't see code/charts).
- Cross-platform identity reinforcement via `Person.sameAs[]` for Knowledge Graph eligibility.

### 5.7 Instrumentation

| Tool | JS cost | Purpose |
|---|---|---|
| `@vercel/speed-insights` | < 2 KB | RUM Core Web Vitals |
| `@vercel/analytics` | < 2 KB | Pageviews + custom events (`copy_code`, `theme_toggle`, `search_query`, `outbound_link`) |
| GA4 via Partytown | 0 KB main | Funnel/audience analysis (cookieless mode) |
| `web-vitals/attribution` | bundled | Pipes element-level CWV regressions to Vercel custom events |
| `PerformanceObserver` longtask | trivial | Logs INP suspects in field |
| Sentry on `/api/og` | server-side | Edge function error tracking |
| Better Stack uptime | external | 2 monitors (root + `/api/og`) |

All client analytics defer to `requestIdleCallback` and respect `document.prerendering` state. Cookieless by default → no cookie banner needed.

### 5.8 Lighthouse CI assertions (PR-blocking)

```js
// lighthouserc.cjs
module.exports = {
  ci: {
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance':       ['error', { minScore: 0.95 }],
        'categories:accessibility':     ['error', { minScore: 1.00 }],
        'categories:best-practices':    ['error', { minScore: 1.00 }],
        'categories:seo':               ['error', { minScore: 1.00 }],
        'largest-contentful-paint':     ['error', { maxNumericValue: 1500 }],
        'cumulative-layout-shift':      ['error', { maxNumericValue: 0.0 }],
        'total-blocking-time':          ['error', { maxNumericValue: 100 }],
        'unused-javascript':            ['warn',  { maxNumericValue: 10240 }],
        'render-blocking-resources':    ['error', { maxLength: 0 }],
      },
    },
  },
};
```

Runs against the Vercel Preview URL on every PR via `lhci autorun --collect.url=$VERCEL_PREVIEW_URL`.

**Caveat:** Lighthouse cannot measure Speculation Rules benefit (only RUM does). Don't optimize for LH at the expense of real-user gains.

---

## 6. Authoring, DX, Deployment, Day-2 Ops

### 6.1 Authoring workflow

```bash
pnpm new:post "How Chrome ships features"
# → src/content/posts/2026-04-12-how-chrome-ships-features.mdx
# → frontmatter prefilled (title, pubDate, draft: true, tags: [])

# Edit in your editor; hot reload at http://localhost:4321
# Drafts visible in dev; Vercel preview deploy includes drafts;
# production filters them out.

git add .
git commit -m "post: how chrome ships features"   # commitlint enforces
git push origin feature/...                         # Vercel preview + Lighthouse-CI
# Open PR, wait for green, merge → ~30s to live
```

### 6.2 Local DX commands

```
pnpm dev              # Astro dev server, hot reload, drafts visible
pnpm build            # typecheck + Pagefind index + sitemap + RSS + JSON Feed + bundle viz
pnpm preview          # serve dist/ locally with proper headers
pnpm check            # astro check + biome ci + cspell + markdownlint
pnpm format           # biome format --write .
pnpm fonts:subset     # regenerate subset WOFF2 from source fonts
pnpm new:post "<title>"
pnpm new:project "<name>"
pnpm analyze          # open stats.html bundle visualizer
pnpm links:check      # lychee --no-progress dist/
pnpm a11y:check       # axe-core via @axe-core/cli on built dist/
pnpm lighthouse       # lhci collect against pnpm preview
```

### 6.3 Tooling

- `.editorconfig` (LF, 2-space, trim trailing whitespace, final newline)
- `.vscode/settings.json` — Biome default formatter, format-on-save, MDX validation
- `.vscode/extensions.json` — Astro, Biome, MDX, Code Spell Checker, GitLens
- `.nvmrc` → `24`
- `package.json` → `engines: { node: ">=24" }`, `packageManager: "pnpm@9.x.x"`
- TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- `astro:env` typed env: `GA_MEASUREMENT_ID`, `GISCUS_REPO`, `GISCUS_REPO_ID`, `GISCUS_CATEGORY`, `GISCUS_CATEGORY_ID`, `MASTODON_HANDLE`, `MASTODON_INSTANCE_URL`, `WEBMENTION_TOKEN`

### 6.4 Pre-commit (simple-git-hooks)

- `biome format --write` + `biome lint` on staged files
- `astro check --noSync` if `*.astro|*.ts|*.mdx` changed
- `commitlint` enforces Conventional Commits
- `cspell` + `markdownlint` on staged `.md`/`.mdx`

### 6.5 Repo setup (one-time)

```
1. gh repo create kevinkiklee/kevinkiklee.io --public --source=. --remote=origin
2. vercel link
3. vercel domains add kevinkiklee.io
4. DNS at registrar:
     ALIAS  @     →  cname.vercel-dns.com   (or A 76.76.21.21)
     CNAME  www   →  cname.vercel-dns.com
5. vercel env add GA_MEASUREMENT_ID            production preview development
   vercel env add GISCUS_REPO                  production preview development
   vercel env add GISCUS_REPO_ID               production preview
   vercel env add GISCUS_CATEGORY              production preview development
   vercel env add GISCUS_CATEGORY_ID           production preview
   vercel env add MASTODON_HANDLE              production preview development
   vercel env add MASTODON_INSTANCE_URL        production preview development
   vercel env add WEBMENTION_TOKEN             production preview
   vercel env add VERCEL_DEPLOY_HOOK_URL       production
6. vercel pull → .env.development.local
7. Enable Speed Insights + Web Analytics in Vercel dashboard
8. Branch protection on main: require CI green, no force-push, linear history
9. Submit kevinkiklee.io to Google Search Console + Bing Webmaster (DNS TXT)
10. After 30 days HSTS in production: submit to hstspreload.org
```

### 6.6 CI/CD (`.github/workflows/ci.yml`)

```
Trigger: pull_request, push to main
Concurrency: cancel-in-progress on same ref
Permissions: contents:read, pull-requests:write
Auth: Vercel OIDC (no static VERCEL_TOKEN secret)

Jobs (parallel where independent):
  setup       checkout, pnpm install --frozen-lockfile, cache .astro/ + pnpm store
  typecheck   pnpm astro check
  lint        pnpm biome ci .
  spell       pnpm cspell "**/*.{md,mdx}"
  md-lint     pnpm markdownlint-cli2 "**/*.{md,mdx}"
  build       pnpm build (uploads stats.html artifact)
  link-check  lychee --no-progress dist/   (post-build)
  a11y        axe-core against pnpm preview
  lighthouse  lhci autorun against $VERCEL_PREVIEW_URL  (PR only)
  size-check  fails if /_astro/*.js gzip > 6KB

PR comments:
  - Vercel bot: preview URL
  - Lighthouse CI bot: scores + budget assertions
  - Bundle-size bot: delta vs main
```

### 6.7 Vercel project settings

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Install command | `pnpm install --frozen-lockfile` |
| Node version | 24.x |
| Function region | Auto (closest to user) |
| Speed Insights | On |
| Web Analytics | On |
| Vercel Toolbar | Preview only |
| Rolling Releases | Off (single-author) |
| Deployment Protection | Off in production; off in preview (so Lighthouse CI works) |

### 6.8 Day-2 runbook

| Operation | How |
|---|---|
| Add a tag | Tag the post; if new tag, build fails until you add it to `tags.json` |
| Change Giscus repo | Update env vars; old comments stay where they were |
| Drop GA | Remove env var + Partytown script; redeploy |
| Rotate fonts | Drop new TTF in `/fonts/source/`, run `pnpm fonts:subset`, commit |
| Add a redirect | Edit `vercel.ts` (`routes.redirect(...)`); push |
| Post on Mastodon for an existing post | Copy post URL → post on Mastodon → paste Mastodon URL into `mastodonUrl` frontmatter → push |
| Rollback prod | Vercel dashboard → previous deployment → "Promote to Production" (seconds, no rebuild) |
| Disaster recovery | Reclone repo → `vercel link` → `vercel env pull` → push. ≈ 5 min downtime worst case |
| Content backup | Git history is the backup |
| Weekly fresh build | `crons: [{ path: '/api/refresh', schedule: '0 5 * * 1' }]` pings Vercel Deploy Hook |

### 6.9 Cost expectations

- Vercel Hobby free tier: 100 GB bandwidth, 100k image optimizations, 100 GB-hr compute / mo. Personal blog ≈ free indefinitely.
- GA4: free below 10M events/mo (indefinite for personal blog).
- Sentry free tier: 5k events / mo.
- Better Stack free tier: 10 monitors, 3-min interval.
- Total expected monthly cost: **$0**.

---

## Out of Scope (v1) / Deferred to v2

- Newsletter signup
- /now, /uses, /talks pages
- Outgoing webmention sender (build-time ping when posts link to other domains)
- POSSE auto-syndication to Mastodon (auto-post on deploy via Mastodon API)
- Comment moderation UI (delegated to Giscus + webmention.io)
- Cookie banner (cookieless analytics → not needed)
- CMS / admin UI
- Internationalization
- Service worker / offline reading
- Search auto-suggest
- Reading list / bookmarks
- Per-post analytics overlay
- AI-generated summaries

---

## Verified Package Versions (via Context7, 2026-04-29)

| Package | Notes |
|---|---|
| Astro 5 | Content Layer API (`loader: glob({...})`, `src/content.config.ts`); `<ClientRouter />` (renamed from `<ViewTransitions />`); `astro:env`, `astro:assets`, `compressHTML: true` (default) |
| `astro-pagefind` (`/shishkin/astro-pagefind`) | Hooks into build, ships `<Search />` component |
| Partytown (`/qwikdev/partytown`) | `npx astro add partytown`; GA4 works without proxying |
| `@vercel/og` | Edge function via Satori; needs raw TTF in `/public/fonts/og/` |
| `@vercel/speed-insights`, `@vercel/analytics` | Both cookieless; trivial integration |
| `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/mdx` | First-party Astro integrations |
| `web-vitals` | Includes `attribution` build for element-level RUM |
| Pagefind | Static, ~50KB, fuzzy multilingual |
| Biome | Single-tool linter+formatter, native TS |

---

## Appendix: Cross-cutting summary

| Area | Key measures |
|---|---|
| **A11y** | Skip link, landmarks, AAA contrast, focus restoration on view transition, reduced-motion + reduced-data + forced-colors, ≥44px tap, alt text enforced in CI, keyboard shortcuts, `aria-current`, `aria-live` route announce, `<dialog>` for palettes |
| **Performance** | 6KB JS budget, 30KB HTML, 30KB font, 60KB hero. Inlined critical CSS, content-visibility, contain, font metric overrides, variable WOFF2 subset, image LCP preload, Speculation Rules, Partytown, requestIdleCallback |
| **CWV** | LCP ≤1.5s, INP ≤100ms, CLS=0, TTFB ≤200ms, FCP ≤1.0s. Lighthouse CI assertions on PR. RUM via Vercel Speed Insights + web-vitals/attribution + longtask observer |
| **SEO** | BlogPosting + Person + Breadcrumb + WebSite/SearchAction JSON-LD; sitemap + image sitemap + per-tag RSS + JSON Feed; canonical, OG, Twitter; trailing-slash policy; apex enforcement; HSTS preload; IndexNow on deploy; Search Console + Bing Webmaster |
| **AEO** | BlogPosting schema, definitional opening sentences, question-form headings, plain-prose summaries, sameAs[] cross-platform identity |
| **UX** | ⌘K / "/" search palette; keyboard shortcuts; "Discuss on Mastodon" + Giscus + webmentions on every post; theme toggle no-FOUC + cross-tab + OS-change sync; sticky ToC on long posts; related posts; custom 404 |
| **Mobile** | Mobile-first CSS, dvh, no hamburger, horizontal-scroll tag chips, 44px tap targets, hover-guarded, save-data respected, overscroll-behavior tuned, theme-color address bar |
| **Animation** | 250ms cap, single easing family, compositor-only, 60fps mid-tier Android, no animation libs, will-change discipline, observers cleaned on swap, reduced-motion + save-data fallbacks |
| **Page transitions** | Astro `<ClientRouter />`, per-route choreography, view-transition-name continuity, prerender-aware analytics, bfcache-friendly, data-transitioning lock |
| **DX** | pnpm scripts (dev/build/preview/check/format/new:post/new:project/fonts:subset/analyze/links/a11y/lighthouse), Biome, simple-git-hooks pre-commit, commitlint + cspell + markdownlint, .editorconfig + .vscode extensions, strict TS, astro:env |
| **Instrumentation** | Vercel Speed Insights + Web Analytics + GA4 via Partytown; web-vitals/attribution + longtask observer; Sentry on /api/og only |
| **Deploy** | GitHub → Vercel auto-deploy, preview deploys + Vercel-bot comment + Lighthouse CI + bundle-size check, vercel.ts typed config, Vercel OIDC for CI, Renovate auto-merge patch+minor, branch protection, weekly cron rebuild, IndexNow push, Better Stack uptime |

---

## Implementation status (snapshot)

This section is a living index added during the iterative implementation
batches; treat it as a map from spec features to source files, not as
authoritative spec content.

### Component map

| Component | File |
|---|---|
| `BaseHead` (canonical, OG, Twitter, alternates, article meta, LCP preload) | `src/components/BaseHead.astro` |
| `ThemeToggle` (no-FOUC, cross-tab, OS-change sync) | `src/components/ThemeToggle.astro` + `src/lib/theme.ts` |
| `SearchPalette` (Cmd-K / `/` dialog over Pagefind) | `src/components/SearchPalette.astro` |
| `ShortcutsOverlay` (`?` overlay, KB shortcuts) | `src/components/ShortcutsOverlay.astro` + `src/components/KeyboardShortcuts.astro` |
| `RelatedPosts` (tag-overlap then recency) | `src/components/RelatedPosts.astro` + `src/lib/related.ts` |
| `TableOfContents` (sticky aside on wide, inline on narrow) | `src/components/TableOfContents.astro` |
| OG image generator | `src/pages/api/og.tsx` + `src/lib/og.tsx` |
| Sitemap with image extension | `astro.config.ts` (`@astrojs/sitemap`) + `src/integrations/image-sitemap.ts` |
| RSS / JSON Feed | `src/pages/rss.xml.ts`, `src/pages/feed.json.ts` |
| Webmentions endpoint | `src/components/Webmentions.astro` + `src/lib/webmentions.ts` |
| CSP / cache headers / cron | `vercel.ts` + `src/lib/csp.ts` |

### Complete

- Content layer (`glob` loader, draft filter via `VERCEL_ENV`)
- BaseLayout + PostLayout (cover hero, series banner, ToC, related, discuss footer)
- BaseHead with canonical, OG (incl. `og:locale`), Twitter card, RSS/JSON Feed alternates, article meta (`article:published_time`, `article:modified_time`, `article:tag`, `article:author`, `article:section`), LCP preload (AVIF + WebP), Giscus preconnect on post pages
- Header sticky nav with mobile horizontal scroll-snap; 44px tap targets via `inline-flex` + `min-height`
- Footer with `rel="me"` on Mastodon AND GitHub
- Search: vanilla `<dialog>` + Pagefind, Cmd-K / `/`, lazy-loaded on first use; `/search` route as fallback for touch
- Theme toggle: no-FOUC, cross-tab, OS-change sync
- Reading time + word count via remark plugin
- Related posts (tag-overlap → recency tie-break)
- JSON-LD: BlogPosting, Person, BreadcrumbList, WebSite/SearchAction
- Sitemap with priority + lastmod + draft filter; image-sitemap injection via custom integration
- RSS + JSON Feed
- Brutalist mono-typeface design (JetBrains Mono subset, layered CSS)
- a11y: skip link, AAA-ish contrast, focus rings, forced-colors mode, reduced-motion + reduced-data, ≥44px tap targets, empty-state copy
- Performance: 6KB JS budget enforced in CI, content-visibility, contain, font metric overrides, IntersectionObserver-driven view-transition-name on top card
- View transitions via `<ClientRouter />` with per-route direction choreography
- CSP/cache headers/cron in typed `vercel.ts`
- Tests: `src/lib/*.test.ts` and `src/integrations/image-sitemap.test.ts`; `pnpm check` covers astro check + biome + cspell + markdownlint

### Deferred (intentional)

- IndexNow push on deploy — wired via CI workflow; not required for first launch
- Better Stack uptime monitoring — out of scope for source repo
- Search auto-suggest, reading list, AI-generated summaries — explicit non-goals (see "Non-Goals" above)
- i18n — single locale (`en-US`)
