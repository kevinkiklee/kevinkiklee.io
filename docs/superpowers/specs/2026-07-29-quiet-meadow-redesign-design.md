# kevinkiklee.io — Quiet Meadow Redesign

**Author:** Kevin Lee (brainstormed with Claude)
**Date:** 2026-07-29
**Status:** Approved (brainstorming complete)
**Supersedes:** the *visual* sections of
[`2026-04-29-personal-blog-design.md`](./2026-04-29-personal-blog-design.md)
(§ D4 brutalist terminal flavor and everything downstream of it in CSS).
Architecture, content model, SEO/AEO, analytics, comments, CI, and hosting
decisions in that spec remain in force.

---

## Overview

Full visual identity replacement for kevinkiklee.io. The brutalist terminal
aesthetic (mono-everything, heavy borders, all-caps) is retired. The new
identity — **Quiet Meadow** — is an editorial-organic design: serif-led
typography on sage paper, hairline rules, generous air, and an illustrated
**garden system** of field-guide ink drawings (plants and birds) with subtle
CSS-only animation. Dark mode becomes **forest night**.

The redesign is a reskin plus one new decorative subsystem (the garden).
No content changes, no route changes, no architectural changes.

### How we got here (decision trail)

Explored and rejected across five browsing rounds: louder terminal variants,
Editorial magazine (kept as influence), Swiss modern, expressive-gradient,
quiet-craft minimal, riso zine, engineer's notebook (all intensities —
"cartoony" props and refined technical alike), Bauhaus, broadsheet, and a
12-direction gallery. **Field & Moss** won the gallery; the **Quiet Meadow**
interpretation won over Modern Organic and Naturalist Portfolio; the garden
density was then deliberately increased ("more" calibration) and hardened
against a skeptical review. Mockups from the session persist under
`.superpowers/brainstorm/96992-1785352532/content/` (gitignored; the
approved references are `quiet-meadow-garden.html` and
`quiet-meadow-garden-v2.html`).

## Goals

- Replace the visual identity while keeping every functional, structural,
  SEO/AEO, and CI property of the current site.
- A design with warmth and life: illustrated, gently animated, seasonal.
- Hold or improve every existing quality bar: WCAG 2.2 AA (AAA body
  contrast), CWV targets (LCP ≤ 1.5s, INP ≤ 100ms, CLS 0.00), Lighthouse
  budgets, 6 KB/chunk JS budget.

## Non-Goals

- New content types (a photography/portfolio section was explicitly
  deferred — see "Naturalist Portfolio" variant, rejected for scope).
- Editing any post MDX.
- Changing information architecture, routes, feeds, or schema.org output.
- Seasonal OG images, hemisphere detection, or per-visitor personalization.

---

## Decisions Log

| # | Decision | Rationale |
|---|---|---|
| Q1 | Identity: **Quiet Meadow** (editorial-organic) | Won 5-round exploration; serif warmth + organic palette; words stay the hero. |
| Q2 | Dark mode: **forest night** (loam/moss/amber) | Turns the theme toggle into part of the story; same bones after dark. |
| Q3 | Serif: **Source Serif 4 Variable** (roman + italic, latin subset, self-hosted) | Screen-tuned text serif; `opsz` axis gives display + text cuts from one file; OFL licensed. |
| Q4 | UI sans: **system stack**; mono: **JetBrains Mono retained for code only** (both subsets) | Zero new bytes for chrome; existing posts use box-drawing glyphs from the ext subset. |
| Q5 | Illustration register: **field-guide ink** | Single-weight strokes, moss ink, no fills, no faces. The guardrail against "cartoony," which was explicitly rejected. |
| Q6 | Garden density: **dense** ("more" calibration) | Progress vine, seasonal slots, full bird cast — with hard per-page budgets. |
| Q7 | Animation: **CSS-only, transform/opacity on whole `<svg>` elements** | Compositor-friendly; declared exceptions listed in §3.4. |
| Q8 | **"Pause the garden" control** (persisted) | WCAG 2.2.2 (Level A): auto-starting motion > 5s must be pausable; reduced-motion alone doesn't satisfy it. |
| Q9 | Reading progress = **scroll-driven vine**, desktop-only, progressive enhancement | Chrome-platform flex (`animation-timeline: scroll()`); masked-reveal via transform to stay off the main thread; static fallback elsewhere. |
| Q10 | Seasons swap **two slots only** (hero cluster, footer meadow) by the author's calendar | Bounded asset work; "it's Kevin's garden" — author-time, Northern Hemisphere. |
| Q11 | Font budget revised **30 KB → 100 KB**; JS budget unchanged (6 KB/chunk) + ≤ 0.5 KB inline gating JS | Typography is the design now; gating JS covers season/prerender/pause. |
| Q12 | Ship as **one PR** from `redesign/quiet-meadow` | Avoids mixed-identity states on `main`; CI gates + preview deploy carry review. |

---

## 1. Visual identity

### 1.1 Color tokens

All ratios below were computed during design and must be re-verified by the
token contrast tests (`tokens-baseline` suite) at implementation time.

**Light — "sage paper"**

| Token | Value | Contrast on `--bg` | Role |
|---|---|---|---|
| `--bg` | `#eff1e7` | — | page ground |
| `--fg` | `#2c352b` | 11.1:1 (AAA) | ink / body text |
| `--fg-muted` | `#49523f` | 7.2:1 (AAA) | decks, descriptions |
| `--fg-subtle` | `#5d6852` | 5.1:1 (AA) | incidental labels (letterspaced small caps); mockups used a lighter value that fails AA at label sizes — do not port it |
| `--rule` | `#ccd3bd` | — (non-text) | hairlines |
| `--panel` | `#f6f7ef` | — | lifted tiles |
| `--code-bg` | `#e6e9da` | — | code panels |
| `--accent` | `#8f4a26` | 5.8:1 page / 5.4:1 code-bg (AA+) | terracotta; links, dates, emphasis |
| `--garden-ink` | `#3f4c3a` | decorative (opacity .28–.55) | illustrations |

**Dark — "forest night"**

| Token | Value | Contrast on `--bg` | Role |
|---|---|---|---|
| `--bg` | `#161b14` | — | loam ground |
| `--fg` | `#dfe3cf` | 13.3:1 (AAA) | moss text |
| `--fg-muted` | `#aab599` | 8.1:1 (AAA) | decks |
| `--rule` | `#313c2b` | — | hairlines |
| `--accent` | `#d9a05b` | 7.6:1 | amber |
| `--garden-ink` | `#7d8a6e` | decorative | illustrations |

Forced-colors and `prefers-contrast: more` behavior carries over from the
current tokens.css (accent defers to system colors / `--fg`).

### 1.2 Typography

- **Prose + headings:** Source Serif 4 Variable, roman + italic, latin
  subset, self-hosted woff2 in `/public/fonts/`. `font-display: swap` with a
  **metric-matched Georgia fallback** (`size-adjust` / `ascent-override` /
  `descent-override` / `line-gap-override`, same technique as the current
  JetBrains Mono setup) — CLS from swap must measure 0.00, verified not
  assumed. Preload roman only; italic loads on use.
- **UI chrome / metadata:** system sans stack (nav, dates, labels, buttons,
  captions, footer).
- **Code:** JetBrains Mono, both existing subsets retained unchanged.
- **Scale:** prose body ~17–18px, line-height ~1.8; measure defined as
  **66–70 rendered characters per line** (counted, not ported as `ch` —
  `ch` is font-relative and the old 68ch was calibrated to mono).
- Headings: serif, sentence case. All-caps survives only in small
  letterspaced sans labels (`LATEST`, section labels, footer meta).

### 1.3 Link policy

- **Prose links** (inside running text): always underlined at rest.
- **Metadata links** (tags, dates, nav — standalone UI outside text blocks):
  accent color + position at rest; underline on hover/focus. Not color-only
  because they are not embedded in body text.

### 1.4 Focus

One uniform `:focus-visible` treatment: **2px solid accent outline, 2px
offset** (terracotta light / amber dark). Verified ≥ 3:1 against page and
panel surfaces in both themes. No component-specific focus styles.

### 1.5 Illustration register — "field-guide ink" (the anti-cartoon guardrail)

Every illustration site-wide MUST follow all of:

- Single-weight line strokes (1.2–1.4 units at native viewBox scale),
  `stroke-linecap: round`, **no fills** (tiny seed-head circles and eye dots
  excepted), no gradients, no drop shadows.
- Ink color `--garden-ink`, opacity 0.28–0.55.
- Botanically/ornithologically plausible forms. No faces, no googly eyes,
  no anthropomorphism, no rotated "sticker" placement.
- Hand-authored inline SVG, each ≤ ~1 KB, `aria-hidden="true"`,
  `pointer-events: none`.

### 1.6 OG images

The OG edge function (`src/pages/api/og.ts`) adopts the identity: sage
paper ground, Source Serif 4 (TTF embedded for Satori), terracotta accent,
one static grass-cluster illustration. Season-less. Watch edge bundle size
when embedding the serif TTF.

---

## 2. Layout & components

- **Global frame:** single column; header = name (sans, left) + nav + theme
  toggle (right) + one hairline. Footer mirrors it and hosts the footer
  meadow (§3.1) and the garden pause control (§3.5).
- **Post list rows** (replaces PostCard blocks): serif title, sans one-line
  deck, right-aligned date; hairline separators; newest entry's date in
  accent with `→`.
- **Project tiles:** hairline border on `--panel`, all sans.
- **Section labels:** small letterspaced sans + sprig accent + quiet
  "All →" link (replaces SectionTitle brackets).
- **Tags:** inverted pill removed; metadata-link policy (§1.3) applies.
- **Prose:** per §1.2. Blockquotes: moss left rule + italic + small leaf
  marker at the rule's head. Figures/images: hairline border, muted sans
  caption.
- **Code blocks:** `--code-bg` panel; Shiki theme retuned to the palette in
  both modes; CopyButton restyled as a quiet sans ghost button.
- **Search palette / shortcuts overlay:** restyled to paper/loam panels;
  search empty-state gets one small illustration + "nothing sprouted for
  that query."
- **Behavior-preserving:** SearchPalette, TableOfContents, Breadcrumbs,
  PostMeta, PostNav, RelatedPosts, ShortcutsOverlay, Webmentions,
  DiscussFooter, Analytics, PrerenderRules keep markup and behavior;
  restyle only. (Baseline re-triage caveat: §5.3.)

---

## 3. The garden system

### 3.1 Inventory & placement map

| Asset | Placement | Animation | Seasonal? |
|---|---|---|---|
| Wren (perched) | Header rule, every page | Tail flick (~7s loop) | No |
| Grass/seed hero cluster | Home hero, right | Sway loop | **Yes** |
| Swallow | Home hero | One flight per pageview (§3.3) | No |
| Swallow pair | Tags index | Static | No |
| Sprigs | Section labels | Static | No |
| Footer meadow (5 tufts + 1 small bird on home only) | Every page footer | Sway loops, staggered phases | **Yes** |
| Reading-progress vine | Post pages, left margin, desktop only | Scroll-driven reveal (§3.2) | No |
| Fin mark | End of each post | Stroke draw-in, once (~600ms) | No |
| Heron | About page, beside bio | Static | No |
| "Went to seed" scene | 404 | Sway | No |
| Blockquote leaf, search empty-state | As noted | Static | No |

**Hard budget: ≤ 16 inline `<svg>` elements and ≤ 12 KB raw SVG per page,
counting hidden seasonal variants.** (The home page is the ceiling case:
wren + hero cluster ×4 seasons + swallow + 2 sprigs + 5 meadow tufts ×
active-season set + footer bird. Each meadow tuft is its own `<svg>` so
sway transforms stay on whole elements per §3.3.) The reading column is
never planted — illustrations live in margins, rules, and gaps.

### 3.2 Reading-progress vine

- Full vine SVG renders complete; a paper-colored cover slides away via
  `transform: translateY()` driven by `animation-timeline: scroll()` —
  reveal stays compositor-only (never scroll-drive `stroke-dashoffset`;
  that repaints every scroll frame on the main thread).
- Desktop-only (hidden below the width where the margin exists). Mobile has
  no progress affordance.
- Progressive enhancement: browsers without scroll-timeline get the fully
  grown static vine (decoration without progress semantics).
- `aria-hidden`, `pointer-events: none`; not a WCAG-relied-upon indicator.

### 3.3 Animation rules

- CSS-only. Transforms/opacity animate on **whole `<svg>` elements**, never
  inner paths (inner-element transforms repaint).
- Sway: 7–9.5s ease-in-out alternate, ≤ ±2°, staggered negative delays.
- Declared paint exceptions (small regions, one-shot): fin draw-in
  (`stroke-dashoffset`, ~600ms, ~72px region); autumn falling leaf
  (11s loop, ~15px region, autumn only).
- One-shot animations (swallow flight, fin, vine state) are **prerender
  aware**: gated on `document.prerendering` /`prerenderingchange` so they
  don't fire invisibly inside Speculation-Rules prerenders.
- Page-level motion: view transitions, title morph, theme crossfade, and
  scroll reveals carry over; easing softens; reveals shrink to 8px rise +
  fade; ≤ 250ms cap on transitions stands.

### 3.4 Seasons

- Two seasonal slots (hero cluster, footer meadow) + autumn falling leaf.
  Spring buds / summer full meadow / autumn seed heads / winter bare stems.
  Seasonal palette shift is bounded: only `--bg` (± a few degrees of hue /
  ≤ 2% lightness) and `--garden-ink` may vary; `--fg*`, `--accent`, and
  `--rule` are identical across seasons. The token contrast suite runs
  against all four seasonal backgrounds.
- Season class set on `<html>` by the inline head script **before first
  paint** (no flash of wrong season), by the author's calendar (Northern
  Hemisphere, month-based; no visitor locale detection).
- Only the active season's variant SVGs are meaningful; inactive variants
  hidden via CSS (all variants inline; counted inside the §3.1 budget).

### 3.5 "Pause the garden" (WCAG 2.2.2 — Level A)

- Ambient loops (sway, flick) auto-start and run > 5s ⇒ must be pausable.
  `prefers-reduced-motion` support does **not** satisfy 2.2.2 by itself.
- Footer control adjacent to the theme toggle: pauses all garden animation
  site-wide (`html.garden-paused * { animation-play-state: paused }` scoped
  to garden classes). Persisted in localStorage, applied by the head inline
  script, documented on `/accessibility`.
- `prefers-reduced-motion: reduce` renders the entire garden static
  (no loops, draw-ins pre-completed, vine fully grown).

### 3.6 Inline JS budget

Season class + prerender gating + pause restore: **≤ 0.5 KB** added to the
existing inline head script. CSP hash in `vercel.ts` updated accordingly.
The 6 KB/chunk external JS budget is untouched.

---

## 4. Accessibility

- Targets unchanged: WCAG 2.2 AA, AAA body contrast, Lighthouse a11y 100.
- New conformance work: §3.5 pause control; focus spec §1.4; all
  illustrations `aria-hidden` + `pointer-events: none`; garden never
  conveys information.
- **Baseline re-triage (required):** every entry in `axe-baseline.json`,
  `html-checks-baseline.json`, `keyboard-baseline.json`,
  `tokens-baseline.json` is pinned to old selectors/colors — each entry is
  re-run against the redesign and either drained or re-justified. Mono-era
  `wontfix-rationale` entries in the audit findings doc are re-reviewed;
  stale ones removed (KnownLimits.astro renders from that doc).

## 5. Performance

- CWV targets unchanged: LCP ≤ 1.5s, INP ≤ 100ms, CLS 0.00.
- Font budget: **≤ 100 KB** total (serif roman + italic + both JBM
  subsets); update the size workflow accordingly. Serif swap CLS held at
  0.00 via metric overrides (§1.2), verified in Lighthouse CI.
- SVG budget per §3.1. Animations are throttled by the browser when
  off-screen/backgrounded; no timers, no rAF loops.
- LCP candidate stays the hero text block; illustrations are inline SVG
  (excluded from LCP candidacy) and load with the document.

## 6. Scope

**In:** every route (home, posts index + post pages, tags, projects, about,
search, 404, accessibility, privacy), OG function, Shiki theme, SearchPalette,
ShortcutsOverlay, `print.css` (serif print styles; garden hidden in print).

**Explicitly untouched:** all MDX content; content collections + tag
allowlist; JSON-LD/schema builders; sitemaps (incl. image-sitemap
integration); RSS/JSON feeds; llms.txt; IndexNow; Speculation Rules;
Giscus/webmentions; Pagefind; analytics; `vercel.ts` routes/headers (only
the CSP inline-script hash changes); every CI workflow's *existence* (only
budget numbers and baselines change as specified).

## 7. Migration

1. **Precondition:** commit or stash the 10 currently-dirty files; branch
   `redesign/quiet-meadow` from clean `main`.
2. **Order:** tokens rewrite → global/base CSS → components → prose/code →
   garden system → pages → OG → baseline re-triage → budget/CI updates →
   full verification (`pnpm check`, `pnpm test`, a11y suites, build,
   Lighthouse CI on preview).
3. Old tokens deleted, not aliased. Clean break.
4. **One PR.** Preview deploy is the review surface; Lighthouse CI + a11y
   gates + size gate must pass without new baseline entries (except
   re-justified ones per §4).
5. Docs ride along: CLAUDE.md's "visual design is intentional" pointer →
   this spec; size workflow font budget; audit-findings doc re-triage.
   AUTHORING.md unaffected (no authoring surface changes).

### Risks

| Risk | Mitigation |
|---|---|
| OG edge bundle grows past limits with serif TTF embed | Subset the TTF for OG (titles need few glyphs); measure in CI |
| Serif swap CLS | Metric-matched fallback; verify 0.00 in Lighthouse CI, adjust overrides |
| Shiki retheme regresses code legibility | Contrast-check token colors on `--code-bg` both themes |
| Garden drifts cartoony over future edits | §1.5 register rules are normative; review against them |
| Scroll-timeline support shifts | Feature is decorative-only; static fallback defined |
| Season-boundary stale builds | Head script corrects class at load, pre-paint |

## 8. Verification (definition of done)

- `pnpm check` and `pnpm test` green; token contrast tests updated to new
  values and passing (including per-season combinations).
- All four a11y baselines drained or re-justified; zero *new* entries.
- Lighthouse CI: perf ≥ 95, a11y/BP/SEO = 100 on preview.
- CLS 0.00 with fonts cold-cached; INP unaffected by garden (verified with
  animations running).
- Reduced-motion, garden-pause, forced-colors, and `prefers-contrast: more`
  each manually verified on home + one post.
- The swallow does not fly during Speculation-Rules prerender (verified in
  Chrome with prerender active).
