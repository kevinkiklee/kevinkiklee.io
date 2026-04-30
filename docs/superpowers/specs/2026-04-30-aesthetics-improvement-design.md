# kevinkiklee.io — Aesthetics Improvement Design

**Author:** Kevin Lee
**Date:** 2026-04-30
**Status:** Approved (brainstorming complete)
**Builds on:** [`2026-04-29-personal-blog-design.md`](./2026-04-29-personal-blog-design.md)

---

## Overview

Refines the brutalist-terminal aesthetic so it reads as a *personal* artifact rather than the generic "dev brutalism" template. Two anchoring decisions:

1. **A custom ASCII / box-drawing motif system** at mid intensity — chrome reads as a terminal without crossing into full TUI.
2. **A single signature accent color** — *signal orange* (`#d44715` light · `#ff7849` dark) — applied sparingly to the chrome (CTAs, active state, post markers, system glyphs). Body remains monochromatic.

Tone is dialed back: caps are reserved for chrome, signage, and the wordmark. Headings, post titles, body, and meta are mixed case.

The design is a refactor of styles + small markup changes inside the existing component tree. No content changes, no new dependencies, no perf or schema regressions.

## Goals

- **Distinctive identity** — accent color + motif vocabulary make the site recognizable on a glance.
- **Calmer reading** — mixed-case content, caps reserved for signage.
- **Zero CWV regression** — LCP ≤ 1.5 s, INP ≤ 100 ms, CLS = 0 maintained or improved.
- **No new font fetches in the critical path** — all chrome motifs render in CSS, not as text glyphs.
- **AEO-cleaner content extraction** — drop bracket prefixes (`[01]`) and decorative box-drawing chars from HTML body so answer-engine extraction stays clean.
- **Forward-compatible accessibility** — accent is never the sole signal; `forced-colors`, `prefers-contrast: more`, and `prefers-reduced-motion` all explicitly handled.

## Non-Goals

- New pages, sections, or components.
- Re-architecting the type scale, spacing scale, or layout grid.
- Switching the type pair (mono stays).
- Animation/motion changes beyond accent color application.
- Theme behavior changes (light/dark toggle stays as-is).
- New JS islands or runtime cost.

---

## Decisions Log

| # | Decision | Rationale |
|---|---|---|
| A1 | **Mid-intensity ASCII motif system** (V2) | Distinctive without going full TUI; preserves long-form readability. |
| A2 | **Single accent color: signal orange** | Modern-dev energy; avoids retro-CRT cliché. AA contrast verified in both themes. |
| A3 | **Caps reserved for chrome** | Wordmark, micro-labels, 404 / system signage. Everything readable is mixed case. |
| A4 | **Wordmark stays `KEVINKIKLEE.IO`** | Explicit user override — character anchor for the brand. |
| A5 | **Decorative motifs render in CSS, not as text glyphs** | Avoids dragging the JetBrains Mono `-ext` subset into every page; keeps CLS = 0. |
| A6 | **Drop padded post numbering (`[01]`, `[02]`)** | Visual noise that fights mixed case; cleaner AEO extraction. |
| A7 | **Prose links keep `currentColor`, not accent** | Accent reserved for chrome; long-form posts stay calm and readable. |
| A8 | **Heading anchors use `§` (U+00A7), not `#`** | Section glyph is in primary font subset, semantically meaningful, accent-colored on hover/focus-within. |
| A9 | **Banner persists across nav via `view-transition-name`** | Removes header reflow during ClientRouter swaps. |
| A10 | **Accent never the sole indicator of state** | Active nav, links, and CTAs always pair color with structure (border, weight, position). |

---

## 1. Tokens

### 1.1 Add to `src/styles/tokens.css`

```css
:root[data-theme='light'] {
  /* existing tokens unchanged ... */
  --accent:      #d44715;        /* AA on bg #f5f4ee — verified 4.6:1 */
  --accent-rule: #d44715;        /* same hue; future split if needed */
}

:root[data-theme='dark'] {
  /* existing tokens unchanged ... */
  --accent:      #ff7849;        /* AA on bg #0a0a0a — verified 5.4:1 */
  --accent-rule: #ff7849;
}
```

No other token changes. Type scale, spacing, body palette untouched.

### 1.2 Forced-colors / contrast preferences

```css
@media (forced-colors: active) {
  :root { --accent: LinkText; }
}
@media (prefers-contrast: more) {
  :root { --accent: var(--fg); }
}
```

### 1.3 Print

```css
@media print {
  :root { --accent: var(--fg); }
}
```

---

## 2. Casing rule

Site-wide convention enforced both in markup and via a single `.is-caps` utility for the few opt-in places.

### 2.1 UPPERCASE — opt-in only

Applied via `.is-caps { text-transform: uppercase; letter-spacing: 0.06em; }`.

- Wordmark `KEVINKIKLEE.IO` (header brand + OG card + 404).
- Micro-labels (≤ 4 chars) where caps work as visual texture: `N°`, `RSS`, `JSON`, `KBD`-content key names like `⌘K`, `G H`, `?`, `/`.
- 404 signage: `SYSTEM HALTED` or `404 — PAGE NOT FOUND`.

### 2.2 Mixed case — everywhere else

Removes `text-transform: uppercase` and `.toUpperCase()` from:

- `src/styles/prose.css` — `.prose h2`, `.prose h3`.
- `src/components/PostCard.astro` — title.
- `src/components/ProjectCard.astro` — title + tag pills.
- `src/components/RelatedPosts.astro` — section title.
- `src/components/TableOfContents.astro` — heading.
- `src/components/TagPill.astro` — tag value.
- `src/layouts/PostLayout.astro` — `h1`, series banner.
- `src/pages/about.astro`, `posts/index.astro`, `posts/page/[page].astro`, `tags/index.astro`, `tags/[tag].astro`, `projects.astro`, `search.astro` — `.page-title`.
- `pages/index.astro` — `[ LATEST POSTS ]` and `[ FEATURED PROJECTS ]` brackets dropped.

Section heads use the new `── name` pattern (Section 4).

---

## 3. Motif vocabulary (CSS, not text glyphs)

All decorative motifs are pseudo-elements or CSS shapes. None require the JetBrains Mono `-ext` subset. Shape and size scale with the host element via `em` units.

### 3.1 Banner side rules `▌ ▐`

```css
.brand::before, .brand::after {
  content: "";
  display: inline-block;
  width: 0.18em;
  height: 0.95em;
  background: currentColor;
  vertical-align: -0.08em;
}
.brand::before { margin-right: 0.45em; }
.brand::after  { margin-left: 0.45em; }
```

### 3.2 Section divider `──`

```css
.section-title .rule {
  flex: 0 0 var(--space-5);
  height: 1px;
  background: var(--rule-soft);
}
```

### 3.3 Post marker `▸` (CSS triangle)

```css
.post-card .marker {
  display: inline-block;
  width: 0; height: 0;
  border-left: 0.45em solid var(--accent);
  border-top:  0.32em solid transparent;
  border-bottom: 0.32em solid transparent;
  vertical-align: 0.05em;
  margin-right: 0.5em;
}
```

### 3.4 Active-nav underline + heading `§` anchor

```css
.site-nav a[aria-current='page'] {
  border-bottom: 2px solid var(--accent);
  font-weight: 600;             /* color-blind redundancy */
}

.prose :is(h2, h3) > a.heading-anchor {
  color: var(--accent);
  opacity: 0;
  transition: opacity 180ms var(--ease);
}
.prose :is(h2, h3):is(:hover, :focus-within) > a.heading-anchor { opacity: 1; }
```

`rehype-autolink-headings` is configured to insert `§` (U+00A7, primary subset) instead of the default `#`.

### 3.5 Glyphs that **stay as text**

`→` (U+2192) and `↗` (U+2197) appear in CTAs (`→ read post`, `→ all posts`) and external-link affordances. Both currently live in the `-ext` subset's `unicode-range`. To avoid forcing `-ext` into the critical path on every page:

- Edit `scripts/subset-fonts.ts` so the **primary** subset includes `U+2192` and `U+2197` (and the section glyph `U+00A7`, already in Latin-1).
- The `-ext` subset still owns box-drawing (`U+2500–257F`), blocks (`U+2580–259F`), and the rest. It loads only if a *post body* uses one of those glyphs.

---

## 4. Component changes

### 4.1 Header (`src/components/Header.astro`)

```astro
<header class="site-header">
  <div class="row">
    <a href="/" class="brand is-caps" aria-label="kevinkiklee.io home">
      KEVINKIKLEE.IO
    </a>
    <small class="role">chrome devrel · seoul</small>
    <nav class="site-nav" aria-label="Primary"> ... </nav>
    <ThemeToggle />
  </div>
</header>
```

- `.brand` keeps `KEVINKIKLEE.IO` uppercase via `.is-caps`. Side rules are CSS pseudo-elements (Section 3.1).
- `.role` is the new identity strip — single line, `--text-xs`, `--fg-muted`. Visible on all viewports if it fits without forcing the row to wrap > 2 lines; hidden via `display: none` below 360 px.
- Nav labels lowercase: `Home · Posts · Projects · About`. Active link: accent underline + weight 600.
- Search trigger label `/ search` — `/` glyph in accent, rest in `--fg-muted`.
- `.row { min-height: 56px; contain: layout; }` to prevent CLS from role strip mounting.
- Header element gets `view-transition-name: site-header` so it persists across page transitions.

### 4.2 Section title (new utility)

```astro
<h2 class="section-title">
  <span class="rule" aria-hidden="true"></span>
  <span class="name">latest</span>
  <a class="all" href="/posts">→ all posts</a>
</h2>
```

```css
.section-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--text-base);
  font-weight: 600;
  margin: var(--space-7) 0 var(--space-4);
}
.section-title .all { margin-left: auto; font-size: var(--text-xs); color: var(--accent); }
```

Replaces the bracketed `[ LATEST POSTS ]` headings on home, archive, related-posts, tag pages, projects, search.

### 4.3 PostCard (`src/components/PostCard.astro`)

```astro
<article class="post-card reveal" style={`--i:${index}`}>
  <a href={`/posts/${post.id}`}>
    <h3 data-slug={post.id}>
      <span class="marker" aria-hidden="true"></span>
      <span class="title">{title}</span>
    </h3>
    <PostMeta pubDate={pubDate} tags={tags} />
    <p>{description}</p>
    <span class="cta">→ read post</span>
  </a>
</article>
```

- `[{num}]` numbering removed.
- Title rendered as-authored (mixed case, no transform).
- Marker is a CSS triangle (Section 3.3) in `var(--accent)`.
- Description shown on every card (per decision).
- CTA `→ read post` — arrow stays text. On `:hover` / `:focus-visible`: arrow `translateX(4px)` + color → `var(--accent)`.
- `content-visibility: auto` + `contain-intrinsic-size: 1px 200px` unchanged. `contain-intrinsic-size` re-checked against new card height; adjust if necessary.
- `description` element uses `min-height: calc(2 * var(--leading-body) * var(--text-base))` so swap-in font shifts don't reflow card.

### 4.4 PostMeta (`src/components/PostMeta.astro`)

`2026-04-22 · ai · seo · 8 min read · updated 2026-04-25`

- ISO date kept (`<time datetime="...">`).
- Tags lowercase, `·`-joined.
- Reading-time label lowercase.
- `font-variant-numeric: tabular-nums slashed-zero` retained.

### 4.5 TagPill (`src/components/TagPill.astro`)

- Drop `.toUpperCase()` from JSX — render as authored.
- Inverted pill (`pill-bg = fg`, `pill-fg = bg`) retained.
- `:hover` / `:focus-visible`: `pill-bg → var(--accent)`, `pill-fg` stays `var(--bg)`.
- `forced-colors` mode: pill maps to `Highlight` / `HighlightText`.

### 4.6 PostLayout (`src/layouts/PostLayout.astro`) + prose (`src/styles/prose.css`)

- `h1`: drop `text-transform: uppercase`, set `letter-spacing: -0.01em`, weight 700.
- Cover figure: explicit `aspect-ratio` from cover dimensions (`width / height`) to lock layout against intrinsic-size CLS. AVIF/WebP preload + `fetchpriority="high"` unchanged.
- Series banner: `border-left: 3px solid var(--accent)`, `background: var(--code-bg)`, padding. Text mixed case: `Series · {name} · part {n}`.
- Heading anchor glyph swapped to `§` (Section 3.4).
- **Prose links** (`.prose a`) keep their existing `currentColor` + animated underline (per decision A7). No accent applied inside post body. Accent is reserved for chrome (CTAs, markers, active state, heading anchors, series banner border).
- Prose `h2`: drop `text-transform: uppercase` and `letter-spacing` reset; keep the 2 px `border-bottom` rule.
- Prose `h3`: drop `text-transform: uppercase`.

### 4.7 RelatedPosts (`src/components/RelatedPosts.astro`)

- Title via `.section-title` pattern: `── related`.
- Cards inherit Section 4.3 treatment.

### 4.8 DiscussFooter (`src/components/DiscussFooter.astro`)

- Title via `.section-title`: `── discuss`.
- Two actions in a row of `→ link` items, accent on the arrow only:
  - `→ reply on mastodon`
  - `→ webmentions ({n})`
- Webmention count uses tabular-nums.
- Giscus is not in scope here — it was removed in a prior commit; this spec does not reintroduce it.

### 4.9 Webmentions (`src/components/Webmentions.astro`)

- Title via `.section-title`: `── replies`.
- Avatars: 24 px sq, no border-radius.

### 4.10 TableOfContents (`src/components/TableOfContents.astro`)

- Heading: `Contents` (mixed case).
- Active item: `border-left: 2px solid var(--accent)` + `font-weight: 600`. Border + weight = redundant signal.
- Sticky behavior on `(min-width: 1024px)` unchanged.

### 4.11 Footer (`src/components/Footer.astro`)

- Bracket framing dropped.
- Mixed-case labels: `© 2026 Kevin Lee`, `mastodon`, `github`, `rss`, `json feed`, `privacy`.
- 2 px top rule retained.
- No accent (calm baseline).
- `rel="me"` on mastodon + github unchanged.

### 4.12 ProjectCard (`src/components/ProjectCard.astro`)

- Drop `.toUpperCase()` and `text-transform: uppercase`.
- Marker triangle prefix matching PostCard.
- External-link `↗` arrow retained (per Section 3.5 font fix).
- `:hover` / `:focus-visible`: arrow `translateX(2px)` + color → `var(--accent)`.

### 4.13 SearchPalette (`src/components/SearchPalette.astro`)

- Trigger label `/ search` — `/` in accent, `search` in `--fg-muted`.
- Palette title: `Search` (no brackets).
- Result list: title mixed case, snippet `--fg-muted`, accent on Pagefind's matched-term highlight.
- Pagefind UI lazy-loaded on first interaction unchanged. ~50 KB chunk unchanged.
- `<dialog>` semantics + `⌘K` / `/` shortcuts unchanged.

### 4.14 ShortcutsOverlay (`src/components/ShortcutsOverlay.astro`)

- Title: `Keyboard shortcuts` (mixed case).
- Keys inside `<kbd>` retain caps (literal key names).
- Labels lowercase.
- `<kbd>` border stays monochrome. Accent reserved for the closing CTA `→ close (esc)`.

### 4.15 ThemeToggle (`src/components/ThemeToggle.astro`)

- Pill stays. Active-state glyph in accent.
- `aria-pressed`, no-FOUC, cross-tab, OS-change-sync unchanged.

### 4.16 404 (`src/pages/404.astro`)

- Retains signage caps — `SYSTEM HALTED` or `404 — PAGE NOT FOUND` in `var(--accent)`.
- Body lowercase prose + CTAs `→ home`, `→ search`, `→ all posts`.

### 4.17 Page titles (`pages/about.astro`, `posts/*`, `tags/*`, `projects.astro`, `search.astro`)

- `.page-title` — drop `text-transform: uppercase`, set `letter-spacing: -0.01em`.
- The `// TAG: ` prefix on tag pages becomes `Tag · {tag}` (sentence case, accent on the dot if desired).

---

## 5. OG image (`src/pages/api/og.tsx` + `src/lib/og.tsx`)

- Wordmark `KEVINKIKLEE.IO` retains caps (consistent with header).
- Title rendered in mixed case from frontmatter `title`.
- 6 px-wide accent vertical bar on the left edge of the card.
- Author + date footer line, lowercase.
- Static `og-default.png` (home, about, etc.) regenerated to match.
- Satori TTF in `public/fonts/og/` covers ASCII + Latin-1 + `→`, `↗`, `§`. No box-drawing chars in OG → no font expansion.
- Cache headers unchanged (`s-maxage=31536000, immutable, swr=86400`).

---

## 6. Performance, CWV, SEO, A11y

### 6.1 Critical-path budget

- Inlined critical CSS estimated +0.6 KB net (new tokens, marker triangles, accent rules, casing reset). Total stays under the 20 KB CSS budget.
- JS budget unchanged. All new effects are CSS or pseudo-elements.
- Font-fetch budget: the `unicode-range` patch in `scripts/subset-fonts.ts` keeps `→`, `↗`, `§` in the primary subset. The `-ext` subset stays lazy.

### 6.2 CWV invariants

- **LCP ≤ 1.5 s:** post-card titles render from primary font subset; cover images preloaded with AVIF/WebP + `fetchpriority="high"`. No regression.
- **CLS = 0:** marker triangles, dividers, and accent bars all use fixed pixel/em sizes. Cover figure gets explicit `aspect-ratio`. Banner row has explicit `min-height: 56px`. Description min-height set to 2 lines.
- **INP ≤ 100 ms:** no new event handlers; CSS-only hover/active states.
- **TTFB / FCP:** unchanged (no server-side change).

### 6.3 SEO / AEO

- Mixed-case headings match `BlogPosting.headline` (sourced from frontmatter) — single source of truth.
- Decorative box-drawing chars removed from HTML body — `articleBody` extraction by answer engines stays clean.
- `[01]` bracket prefixes dropped from card titles — cleaner for answer-engine title extraction.
- Heading hierarchy semantic; `id` anchors retained.
- JSON-LD (`BlogPosting`, `Person`, `WebSite`/`SearchAction`, `BreadcrumbList`) unchanged.
- Sitemap, RSS, JSON Feed, canonical, OG, Twitter card — unchanged.
- Visible role strip in header (`chrome devrel · seoul`) corroborates `Person.jobTitle` JSON-LD — modest E-E-A-T signal.

### 6.4 A11y

- Accent never the sole signal: every accent state pairs with structural redundancy (border, weight, position).
- All decorative motifs are CSS pseudo-elements or `aria-hidden` spans → invisible to AT.
- `forced-colors: active` and `prefers-contrast: more` map accent to system / fg.
- `prefers-reduced-motion: reduce` unchanged (existing global handler).
- `:focus-visible` ring stays `currentColor` — never conflated with accent.
- `aria-current="page"` retained on active nav.

### 6.5 View transitions

- `view-transition-name: site-header` added to `<header>` so the banner persists across ClientRouter swaps.
- Post-title morph (`view-transition-name: post-title-{slug}` on the topmost in-viewport `<h3>`) unchanged. Both ends of the morph are now mixed case → no caps↔non-caps tween.

---

## 7. Tests

Pure-helper tests only (per repo convention). No Astro component rendering tests.

- `src/lib/casing.test.ts` (new) — if any helper is introduced; otherwise no test file.
- Visual regression is out of scope; no Playwright snapshots.
- Existing `src/lib/*.test.ts` and `src/integrations/image-sitemap.test.ts` continue to pass unchanged.
- `pnpm check` (astro check + biome + cspell + markdownlint) must pass.
- Lighthouse CI assertions in `lighthouserc.cjs` unchanged — perf/a11y/best-practices/seo budgets must hold.
- Bundle-size workflow (`.github/workflows/size.yml`) unchanged — must hold under 6 KB initial JS.

---

## 8. Out of Scope

- Type-pair change (mono stays).
- Accent applied to prose body links (decision A7 — calm reading wins).
- Newsletter, /now, /uses, /talks, i18n, CMS, comment moderation UI — all already explicit non-goals in v1.
- Migrating Pagefind UI styling beyond the result-list pass.
- Re-rendering existing post cover images.

---

## 9. Open content decisions

These don't block implementation but are flagged for Kevin to confirm before merge:

- **Role strip text** — defaulting to `chrome devrel · seoul`. Override if location is different.
- **404 signage line** — `SYSTEM HALTED` vs `404 — PAGE NOT FOUND`. Either works; pick one.

---

## Appendix: Cross-cutting summary

| Area | Change |
|---|---|
| **Color** | Add accent token (`--accent`, `--accent-rule`) in both themes. Forced-colors + prefers-contrast + print all map accent to safe values. |
| **Casing** | Caps reserved for wordmark, micro-labels, 404 signage. Everything readable is mixed case. `.is-caps` opt-in utility. |
| **Motifs** | All chrome motifs (`▌ ▐`, `──`, `▸`) render in CSS, not text glyphs. `→`, `↗`, `§` move to primary font subset. |
| **Components** | Header, PostCard, ProjectCard, PostMeta, TagPill, PostLayout, RelatedPosts, DiscussFooter, Webmentions, ToC, Footer, SearchPalette, ShortcutsOverlay, ThemeToggle, 404, page titles, OG image. |
| **CWV** | LCP / INP / CLS invariants preserved. Cover figure gets explicit `aspect-ratio`. Banner row gets `min-height`. |
| **SEO / AEO** | Mixed-case titles match `BlogPosting.headline`. Decorative chars removed from HTML body → cleaner extraction. |
| **A11y** | Accent never sole signal. Forced-colors / prefers-contrast handled. Focus ring stays `currentColor`. |
| **View transitions** | Header persists via `view-transition-name: site-header`. Post-title morph stays. |
| **Budgets** | +0.6 KB inlined CSS; JS unchanged; font-fetch path unchanged. |
