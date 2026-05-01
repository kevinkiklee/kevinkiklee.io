# kevinkiklee.io — Mobile Experience Refinement (Refined Document)

**Author:** Kevin Lee
**Date:** 2026-04-30
**Status:** Draft (awaiting review)
**Parent spec:** [`2026-04-29-personal-blog-design.md`](./2026-04-29-personal-blog-design.md)
**Devices targeted:** iPhone 16 Pro (Safari), Pixel 8 (Chrome)
**Optimization axes:** SEO, performance, Core Web Vitals (LCP ≤ 1.5s, INP ≤ 100ms, CLS = 0.00 at 75th percentile mobile, 4G)

---

## Overview

A comprehensive overhaul of the mobile experience under the **Refined Document** philosophy: treat every post as a refined long-form reading document, with platform polish where it strengthens identity but no app-chrome that fights the brutalist terminal aesthetic.

Eight focused sections, each with explicit CWV / SEO / bundle accounting. Total new JS ≤ 650 bytes (gated, lazy). Zero new dependencies. Zero `npm install`.

The work decomposes into 8 sections that can ship as 1–2 PRs each. Larger / cross-cutting sections (1, 7) ship as their own PRs; smaller polish sections (4, 5, 6) can bundle.

## Goals

- Reading body text large enough to read comfortably at arm's length on a 6.1" phone (≥17px floor).
- Per-post progress indicator integrated into existing brutalist chrome (no floating bars).
- Inline TOC that defers to the prose by default and tells the reader where they are.
- Code blocks that survive long lines, label their language, and don't cause horizontal page scroll via inline `<code>`.
- Address-bar / link-preview / home-screen polish: theme-color sync, web manifest, apple-touch-icon, viewport-fit unlock.
- Comfortable tap targets (≥44×44 hit, brutalist-tight visual) on every interactive element.
- Real LCP improvement on first paint via font preload + `<head>` ordering.
- Coherent below-the-fold rhythm on post pages.

## Non-goals (this spec)

- PWA standalone mode (`apple-mobile-web-app-capable: yes`) — defers until iOS supports media-conditioned status-bar styling.
- Mobile search-as-overlay (full-screen sheet replacing `/search` route) — that's an (A) Native pattern; out of scope for (B) Refined Document. Revisit if `/search` route still feels heavy after Section 6 polish.
- Header scroll-collapse (auto-hide on scroll-down) — risks twitchiness; brutalist identity prefers stable chrome.
- New dependencies, new analytics, redesigning the visual identity.

---

## Decisions log

| # | Decision | Rationale |
|---|---|---|
| M1 | Body type floor 17px on mobile, 18px ceiling on desktop | 15.2px in mono on dark feels thin at reading distance; native-app readers anchor at 17px. |
| M2 | Reading progress is the header's bottom border | Eliminates floating bar + z-index conflict; brutalist-coherent (the line was already there). |
| M3 | TOC variant prop: inline `<details>` on mobile, plain `<aside>` on desktop | Native disclosure semantics; closed-by-default reclaims first-viewport real estate; `transition:persist` keeps observer state. |
| M4 | Scrollspy with `aria-current="location"` + summary `[data-current]` text | Tells the reader where they are even when the TOC is collapsed; standard ARIA, free for SR + AEO. |
| M5 | Inset box-shadow for code-block overflow affordance, not `mask-image` | Mask clips children including the absolute-positioned copy button; shadow doesn't. |
| M6 | Skip standalone mode (PWA `display: minimal-ui`); keep URL bar | Content site identity > full-screen launch; `minimal-ui` keeps share-friendly URL bar. |
| M7 | `theme-color` driven by media-conditioned variants + JS sync on manual override | Hits both OS-followers and explicit-toggle users; JS-disabled users get OS-driven theme-color. |
| M8 | Single font preload (primary unicode range only) | The "extended" range is genuinely lazy by design; preloading it would defeat the split. |
| M9 | Webmentions `<link rel="preconnect">` to webmention.io | Client-side fetch on every post page; preconnect saves ~100–200ms TTFB on phones. |
| M10 | View transitions stay enabled under `Save-Data` | Snapshot-and-animate is ~30ms, well under cost-vs-identity threshold. |
| M11 | Defer mobile search-as-overlay | Identity boundary: (B) Refined Document, not (A) Native. |
| M12 | No header scroll-collapse | Brutalist values stability over fancy scroll behavior. |

---

## 1. Typography & reading rhythm

**Why:** `--text-base: clamp(0.95rem, ..., 1.05rem)` floors at 15.2px on phones — WCAG-fine but reads tight at arm's length, especially in mono on dark backgrounds.

**Spec:**

- `--text-base: clamp(1.0625rem, 1rem + 0.4vw, 1.125rem)` — 17px floor (mobile), 18px ceiling (desktop). Re-derive `--text-lg` and `--text-xl` proportionally to keep the modular scale balanced.
- Below 640px: `.prose > * + * { margin-top: var(--space-4); }` (was `--space-5`) — bigger type wants slightly less vertical air to compensate.
- `.prose p, .prose li { hyphens: auto; -webkit-hyphens: auto; }` — scoped to body copy, NOT headings (would fight `text-wrap: balance`).
- Verify `<html lang="en" dir="ltr">` is set in `BaseLayout.astro` — required for `hyphens: auto` to engage and for SR/SEO baseline.
- Verify viewport meta has `viewport-fit=cover` — without it, all `env(safe-area-inset-*)` in `global.css` evaluate to 0 on iPhone (currently dead code under the notch).
- JetBrains Mono metric overrides remain valid at the new size (proportional). No font-swap CLS.

**CWV:** zero (CSS-only, build-time-static media queries, font metrics already proportional).
**Bundle:** zero.
**Files:** `src/styles/tokens.css`, `src/styles/prose.css`, `src/layouts/BaseLayout.astro`, `src/components/BaseHead.astro`.
**Risk:** PostCard title and home-page rhythm get visually heavier. Section 8.6 rebalances PostCard.

---

## 2. Reading progress indicator (header underline)

**Why:** Per-post progress signal without floating chrome.

**Spec:** Replace the static `border-bottom: 2px solid var(--rule)` on `.site-header` with an animated underline that fills 0%→100% as the reader progresses through the article. On non-post pages, the underline stays static at 100%.

```css
body[data-progress] .site-header { border-bottom-color: transparent; }
body[data-progress] .site-header::after {
  content: ""; position: absolute; inset-inline: 0; bottom: -2px;
  height: 2px; background: var(--fg);
  transform-origin: left; transform: scaleX(0);
  view-transition-name: none; /* don't morph during view transitions */
}

@supports (animation-timeline: --x) {
  .post { view-timeline-name: --post; }
  body[data-progress] .site-header::after {
    animation: rp linear both;
    animation-timeline: --post;
    animation-range: cover 0% cover 100%;
  }
  @keyframes rp { to { transform: scaleX(1); } }
}

@media print, (forced-colors: active) {
  body[data-progress] .site-header::after { animation: none; transform: scaleX(1); background: CanvasText; }
}
```

- **JS fallback (~150 bytes minified):** dynamically imported only when `!CSS.supports('animation-timeline', '--x')` (Safari < 26, Firefox). Passive scroll listener + `requestAnimationFrame` throttle, single `transform: scaleX(p)` write per frame.
- `body[data-progress]` set by `PostLayout.astro` only.
- `aria-hidden` is the existing default for the bar — decorative; the article itself communicates progress to AT.

**CWV:** LCP unaffected (2px line never an LCP candidate). CLS = 0 (`position: absolute` on `::after`, header reflows do not compound). INP — passive scroll + rAF, well under 50ms.
**Bundle:** 0 bytes Chrome 115+; ~150 bytes Safari iOS / older Firefox via dynamic import.
**Files:** `src/styles/global.css` (or new `src/styles/progress.css` in `components` layer), `src/layouts/PostLayout.astro`, tiny fallback script colocated in PostLayout.

---

## 3. Collapsible TOC + scrollspy

**Why:** Inline TOC at top of post (current state) pushes the prose 150–300px down on mobile before the reader sees a single sentence. No active-section indication anywhere.

**Spec:**

- `TableOfContents.astro` accepts a `variant: 'inline' | 'aside'` prop. PostLayout already renders it twice; specialize:
  - **`inline`** → `<details class="toc">` with `<summary>// CONTENTS · <span data-current></span></summary>`. Closed by default. Native `<details>` semantics (free `aria-expanded`, free disclosure handling).
  - **`aside`** → unchanged `<aside class="toc">` (sticky right column ≥1024px).
- Both render the same H2/H3 anchor list as static HTML — fully crawlable, AEO-readable.
- **Scrollspy (~500 bytes minified):**
  - Single `IntersectionObserver` with `rootMargin: '-40% 0% -55% 0%'` (~5% focal band near viewport center).
  - Most-recently-entered heading sets `aria-current="location"` on its corresponding TOC links — **both** inline and aside copies, so they stay synced even though only one is visible.
  - The collapsed inline `<summary>` `[data-current]` span gets the active heading text. Even when collapsed, the summary reads `// CONTENTS · "Architecture"`.
  - Server-side preset `aria-current="location"` on the first H2 link so the summary shows context immediately on initial paint, before any scroll.
  - Single global instance, attached on `astro:page-load`, re-runs after `astro:after-swap`. `transition:persist` is preserved on the wrapper.
  - Active link styling: bold + leading `→ ` glyph (no color change — brutalist).
- **AEO:** add `Speakable` to the post's JSON-LD with `xpath: ['//article//h2', '//article//h3']`, gated to posts with `headings.length > 0`. ~80 bytes per post page; free signal for Google Assistant / Perplexity read-aloud.
- **View transitions:** `<details open>` state intentionally does **not** persist across navigations. Each post starts collapsed. Document this in the component.

**CWV:**
- **CLS:** zero. Initial collapsed state is server-rendered; user-tap expansion is within 500ms of input → excluded from CLS.
- **LCP:** modest improvement — smaller TOC means first-viewport content (cover hero or H1) renders sooner.
- **INP:** native `<details>` toggle is browser-native, zero JS cost.
- **Bundle:** ~500 bytes scrollspy script, hoisted globally once.
**SEO/AEO:** all H2/H3 anchors render server-side as static HTML; modern Googlebot processes `<details>` content as visible. Pagefind indexes regardless of `[open]`.
**Files:** `src/components/TableOfContents.astro`, `src/layouts/PostLayout.astro`, `src/lib/schema.ts` (Speakable helper).

---

## 4. Code-block polish

**Why:** No language label, no overflow affordance, sub-44px copy-button hit area, inline-code wrap can cause horizontal page scroll.

**Spec:**

```css
.prose pre {
  /* Inset shadow on right edge fades scroll boundary
     without clipping children (copy button stays opaque). */
  box-shadow: inset -8px 0 8px -8px var(--rule);
  line-height: 1.55;
}

.prose pre[data-language] { padding-top: var(--space-5); }
.prose pre[data-language]::before {
  content: attr(data-language);
  position: absolute; top: var(--space-2); left: var(--space-3);
  font-size: var(--text-xs); letter-spacing: 0.06em;
  color: var(--fg-subtle); text-transform: uppercase;
  pointer-events: none;
}

@media (max-width: 640px) {
  .prose pre, .prose pre code { font-size: 0.875em; }
  .copy-btn {
    min-height: 36px; padding: var(--space-2) var(--space-3);
    position: relative;
  }
  .copy-btn::before {
    /* Invisible tap-target expander to 44×44 */
    content: ""; position: absolute; inset: -4px;
  }
}

.prose :not(pre) > code {
  overflow-wrap: anywhere; word-break: break-word;
}

@media (forced-colors: active) {
  .prose pre { box-shadow: none; }
}
```

- Verify Astro 5 Shiki integration emits `data-language` on `<pre>` (it does; class `astro-code` + `data-language` per Astro 5 docs).
- Verify `CopyButton.astro` has `aria-live="polite"` on the "Copied" state announcement; add if missing (one-line fix).

**CWV:** zero impact. Mask-free, no scroll listener, build-time-static padding.
**Bundle:** zero.
**SEO/AEO:** visible language tags reinforce existing `class="language-ts"` for AI crawlers and Google "code snippet" enhancement. Inline-code wrap fix eliminates a real horizontal-page-scroll bug on phones.
**Files:** `src/styles/code.css`, `src/components/CopyButton.astro` (verify aria-live).

---

## 5. Platform polish (theme-color, manifest, touch icons, viewport-fit)

**Why:** Address-bar / link-preview / home-screen polish; engage existing safe-area padding under iPhone notch.

### 5.1 Meta in `BaseHead.astro`

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

<!-- Theme color: media-conditioned variants drive OS-followers and JS-disabled users. -->
<meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />

<!-- iOS home-screen polish (skipping `apple-mobile-web-app-capable: yes` per M6) -->
<meta name="apple-mobile-web-app-title" content="kevinkiklee" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

<!-- Favicon explicitness (Lighthouse + rich-result crawlers prefer this over /favicon.ico guessing) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />

<!-- Web manifest -->
<link rel="manifest" href="/manifest.webmanifest" />
```

### 5.2 ThemeToggle augmentation

Inside the existing pre-paint inline script that sets `data-theme` on `<html>`, add a sync to a non-`media` `<meta name="theme-color">` injected/updated on manual override. When user clears manual override (auto), remove the non-media meta — browser falls back to media-conditioned variants.

```js
function syncThemeColor(theme) {
  const existing = document.querySelector('meta[name="theme-color"]:not([media])');
  if (theme === 'auto') { existing?.remove(); return; }
  const color = theme === 'dark' ? '#0a0a0a' : '#f5f4ee';
  if (existing) existing.setAttribute('content', color);
  else {
    const m = document.createElement('meta');
    m.name = 'theme-color'; m.content = color;
    document.head.appendChild(m);
  }
}
```

### 5.3 `/public/manifest.webmanifest`

```json
{
  "name": "kevinkiklee.io",
  "short_name": "kevinkiklee",
  "description": "Kevin Lee's personal blog. Chrome DevRel.",
  "lang": "en",
  "dir": "ltr",
  "start_url": "/",
  "scope": "/",
  "display": "minimal-ui",
  "background_color": "#f5f4ee",
  "theme_color": "#f5f4ee",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 5.4 CSP

Verify `vercel.ts` CSP includes `manifest-src 'self'` (or covers via `default-src 'self'`). Without it, Chrome silently fails the manifest fetch and Lighthouse "Installable" never passes.

### 5.5 Required new assets

`/public/apple-touch-icon.png` (180×180), `/public/icon-192.png`, `/public/icon-512.png`, `/public/icon-maskable.png` (content within central 80% safe zone), `/public/favicon.svg`, `/public/favicon-32.png`. All PNGs from a single source design (defer art direction; brutalist `[K]` or `K.` glyph likely).

**CWV:** zero impact (meta/manifest don't preload; touch-icon fetched lazily on home-screen-add).
**Bundle:** zero JS delta — augments existing pre-paint theme script.
**SEO/AEO:** branded address-bar in shared link previews (iMessage, Slack, Discord, Mastodon); Lighthouse "Installable" passes; apple-touch-icon used in OS share sheets.
**Files:** `src/components/BaseHead.astro`, `src/components/ThemeToggle.astro`, `src/layouts/BaseLayout.astro` (verify `<html lang="en" dir="ltr">`), `vercel.ts` (verify CSP), `public/manifest.webmanifest` (new), 4–5 PNG icons (new).

---

## 6. Header / nav comfort + tap-target audit

**Why:** Mobile header takes ~110px of permanent chrome. Horizontal-scroll nav has no scroll affordance. Cross-component tap targets need a sweep against ≥44×44.

**Spec:**

### 6.1 Header

- `Header.astro` `padding: var(--space-4) var(--space-5)` → `var(--space-3) var(--space-5)` below 640px. Saves ~8px/row, header drops to ~95px.
- Reading progress underline (Section 2) stays as the bottom border.

### 6.2 Nav edge-fade

```css
@media (max-width: 640px) {
  nav {
    mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
    -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
  }
}
@media (forced-colors: active) {
  nav { mask: none; -webkit-mask: none; }
}
```

Always-on right-edge fade. Nav has no `position: absolute` children, so mask doesn't clip anything visible.

### 6.3 `/search` route polish

- Add `<link rel="preload" as="script" href="/pagefind/pagefind-ui.js">` and matching `as="style"` to `/search` HTML head. Saves 300–500ms perceived search-ready time.
- Verify Pagefind UI input gets `min-height: 44px` post-mount — add a `.pagefind-ui input { min-height: 44px; }` override if needed.
- **No `autofocus`** on the bootstrap input — pops the soft keyboard hiding 50% of viewport before the user has parsed the page; bad for screen readers (moves AT cursor on arrival).

### 6.4 Tap-target audit pass

In-PR audit, no separate doc. Verify ≥44×44 hit (visual size can be smaller via invisible expander):
- `nav a`, `[ / SEARCH ]`, `ThemeToggle`, `PostCard <a>`, `PostMeta` interactive children, `TagPill`, `DiscussFooter` Mastodon link + permalink/share, `RelatedPosts` cards, `Webmentions` reply links + avatars, `Footer` social/copy/RSS, `404.astro` home link, `.skip-link`, `CopyButton` (covered in §4).

**CWV:** marginal LCP+ from ~15px header height reduction (first-viewport content renders higher). Zero CLS, zero INP impact.
**Bundle:** zero.
**SEO/AEO:** edge-fade nav improves secondary-link discoverability → modest pages-per-session lift; all nav links remain crawlable static HTML.
**Files:** `src/components/Header.astro`, `src/components/ThemeToggle.astro`, `src/components/PostMeta.astro`, `src/components/TagPill.astro`, `src/components/DiscussFooter.astro`, `src/components/RelatedPosts.astro`, `src/components/Webmentions.astro`, `src/components/Footer.astro`, `src/pages/search.astro`, `src/pages/404.astro`.

---

## 7. Performance hardening: fonts, images, anchors, head

The biggest CWV-targeted wins live here.

### 7.1 Font preload

```html
<link rel="preload" as="font" type="font/woff2"
      href="/fonts/jetbrains-mono.woff2" crossorigin />
```

Single preload — primary unicode range only. The "extended" range stays genuinely lazy (the entire purpose of the split). `crossorigin` required even for same-origin font preloads to match the CSS-triggered fetch.

**Expected:** LCP drops 100–300ms on mobile 4G first paint. Verify post-deploy via Vercel Speed Insights.

### 7.2 Inline image pipeline

- Verify `astro.config.ts` routes MDX `![]()` through `astro:assets` (Astro 5 default behavior, but confirm).
- Document in `AUTHORING.md`: any image positioned in the first viewport of a post should pass `loading="eager"`. Ideally, route hero imagery through the post's `cover` field (already preload-optimized) rather than inline.
- Extend the existing alt-text remark lint with a width/height assertion — fails CI if any rendered `<img>` lacks dimensions.

### 7.3 `scroll-padding-top` alignment

After Section 6 mobile header is ~95px including the 2px progress underline. Current global `scroll-padding-top: calc(var(--space-7) + var(--space-3))` = 60px → 35px mismatch — TOC anchor jumps land too high.

```css
:root { --header-h-mobile: 96px; --header-h-desktop: 80px; }
html { scroll-padding-top: var(--header-h-mobile); }
@media (min-width: 1024px) { html { scroll-padding-top: var(--header-h-desktop); } }
```

Numbers in CSS variables for one-place adjustment after real DOM measurement.

### 7.4 External preconnects

Implementation step: read `Webmentions.astro` and `Analytics.astro`. If Webmentions does a client-side fetch to webmention.io, add:

```html
<link rel="preconnect" href="https://webmention.io" crossorigin />
```

Saves ~100–200ms TTFB on the AJAX request.

### 7.5 Save-Data interactions

- Cover hero already skipped under `prefers-reduced-data` — keep.
- View transitions stay enabled (M10).
- Font preload stays (~30KB; legibility outweighs metered-bandwidth concern).

### 7.6 `<head>` ordering

Final order in `BaseHead.astro`:

1. `<meta charset>`
2. `<meta viewport>`
3. `<meta theme-color>` (both media variants)
4. `<link rel="preload">` (font, conditional LCP image)
5. `<link rel="preconnect">` (cross-origin resources)
6. `<title>`, `<meta description>`
7. canonical / OG / Twitter
8. JSON-LD
9. icons + manifest
10. stylesheets

Earlier `<link rel="preload">` = earlier fetch dispatch on cold cache (~50–100ms LCP win).

**CWV:**
- **LCP:** 100–300ms improvement on mobile 4G from font preload + head ordering.
- **CLS:** image pipeline assertion is a CLS guard — protects future authoring.
- **INP:** zero impact.
**Bundle:** zero JS delta.
**Files:** `src/components/BaseHead.astro`, `src/pages/search.astro`, `src/styles/tokens.css`, `src/styles/global.css`, `astro.config.ts`, existing alt-text lint plugin.

---

## 8. Below-the-fold post composition + list rhythm

The dense lower portion of post pages and the home/archive list rhythm under bumped type.

### 8.1 Post-tail rhythm

- Define `--rhythm-tail: var(--space-7)` mobile / `var(--space-8)` desktop. Apply via `.post > * + * { margin-top: var(--rhythm-tail); }` between major tail sections (RelatedPosts, DiscussFooter, Webmentions).
- Unify section headers across `RelatedPosts`, `DiscussFooter`, `Webmentions`: `<h2>// SECTION</h2>` at `--text-xl`, top border `2px solid var(--rule)`.

### 8.2 RelatedPosts mobile (pending file read)

- One column on mobile (`<640px`) and tablet, two columns on desktop.
- Per related card: title + date only, no description. Top border `1px solid var(--rule-soft)`. Whole card tappable.
- Empty-state branch: render nothing (no section header) when no related posts.

### 8.3 DiscussFooter mobile

- Mastodon CTA: full-width `≥44px` button-like link with leading `→ ` glyph.
- Fallback: if no `mastodonUrl`, link to a Mastodon search for the post's canonical URL — preserves social-first identity.
- Permalink + share-via copy: tap-comfy, `aria-live="polite"` for copy feedback.

### 8.4 Webmentions mobile (pending file read)

- Reply card: avatar 32×32 (with `width`/`height` for CLS guard, `loading="lazy"`, `decoding="async"`), display name + permalink time.
- "Likes" / "reposts" group as a horizontal row of 24×24 avatars with caption — vertical-real-estate efficient.
- Empty state: hide entire section (not "0 mentions").
- **AEO:** wrap each webmention in `<article itemscope itemtype="https://schema.org/Comment">` for Google rich-result eligibility.
- **Perf:** preconnect to webmention.io via Section 7.4 if client-side fetch.

### 8.5 Series banner mobile

- Add inline `← previous · next →` link pair when the series has neighbors. Each link ≥44×44 hit.

### 8.6 PostCard rhythm under bumped type

With Section 1's body bump, each PostCard grows. Rebalance:

- `.post-card { padding: var(--space-4) 0; }` mobile (was `--space-5`).
- Description line-clamp to 2 lines on mobile: `display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden`.
- Verifies: ~5 cards above the fold on iPhone 16 Pro — roughly current state.

### 8.7 Footer mobile (pending file read)

- Single column on mobile, sections stack with 32px gap.
- Each link `≥44×44` hit. Social icons 44×44 with 24×24 visual SVG centered.
- Copyright at bottom, `--text-xs`, muted.

**CWV:**
- **CLS guard:** webmention avatar `width`/`height` attrs prevent async load shift. PostCard line-clamp keeps card height stable.
- **LCP:** no direct move.
- **INP:** zero.
**Bundle:** zero new JS.
**SEO/AEO:** `Comment` itemtype enables Google rich-result eligibility; series prev/next nav improves crawl depth + dwell time.
**Files:** `src/layouts/PostLayout.astro`, `src/components/RelatedPosts.astro`, `src/components/DiscussFooter.astro`, `src/components/Webmentions.astro`, `src/components/PostCard.astro`, `src/components/Footer.astro`.

---

## Verification & testing strategy

- **Real-device walk** before each PR merge: iPhone 16 Pro Safari + Pixel 8 Chrome. Routes: `/`, `/posts`, a post (with code + multi-heading TOC), `/search`, `/about`. Light + dark theme. Portrait + landscape.
- **Lighthouse mobile:** preserve ≥95 perf, 100 a11y / best-practices / SEO. Existing CI gate (`lighthouserc.cjs`).
- **Vercel Speed Insights post-deploy:** target LCP ≤ 1.5s, INP ≤ 100ms, CLS = 0.00 (75th percentile, mobile, 4G).
- **Vitest unit tests:** for any new pure helpers (e.g. scrollspy heading-finder logic, theme-color sync function).
- **`pnpm check`** must pass (`astro check` + `biome ci` + `cspell` + `markdownlint`).
- **`pnpm test`** must pass.
- **Bundle size budget** (`.github/workflows/size.yml`) enforced — every section's JS delta is sub-budget; zero new dependencies.
- **Per-section CWV expectations** documented in the implementation plan as deltas — verify or roll back.

## Bundle accounting

| # | Section | New JS (min, gzipped) | Loaded |
|---|---|---|---|
| 1 | Typography | 0 | — |
| 2 | Reading progress | ~150 b | only Safari/older Firefox, dynamic import on post pages |
| 3 | TOC + scrollspy | ~500 b | global, hoisted once |
| 4 | Code-block polish | 0 | — |
| 5 | Platform polish | 0 | augments existing pre-paint script |
| 6 | Header / nav / tap-target | 0 | — |
| 7 | Perf hardening | 0 | — |
| 8 | Below-fold + list rhythm | 0 | — |
| **Total** | | **≤ 650 b** | |

Zero new dependencies. Zero new third-party assets fetched on initial page load.

## Open questions

- Brand glyph for the icon set (apple-touch-icon, manifest icons): defer to implementation; brutalist `[K]` or `K.` likely.
- Webmentions client-side-fetch behavior: read `Webmentions.astro` during Section 7/8 implementation to confirm preconnect + Comment markup approach.
- `astro.config.ts` MDX image pipeline: verify Section 7.2 assertion (Astro 5 default, but confirm against the live config).

## Implementation sequence (suggested)

Likely PR shape, smallest risk first:

1. PR 1: Section 5 (platform polish) + Section 7.1 (font preload). Pure additions, zero rendering change.
2. PR 2: Section 1 (typography) + Section 8.6 (PostCard rebalance). Coupled change.
3. PR 3: Section 4 (code-block polish).
4. PR 4: Section 6 (header/nav/tap-target audit).
5. PR 5: Section 7.2–7.6 (image pipeline, scroll-padding, preconnects, head ordering).
6. PR 6: Section 2 (reading progress).
7. PR 7: Section 3 (TOC + scrollspy + Speakable).
8. PR 8: Section 8 (below-the-fold composition).

The implementation plan (next deliverable) will firm this up with task-level granularity.
