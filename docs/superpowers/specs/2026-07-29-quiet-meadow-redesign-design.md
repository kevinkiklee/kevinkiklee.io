# kevinkiklee.io — Quiet Meadow Redesign

**Author:** Kevin Lee (brainstormed with Claude)
**Date:** 2026-07-29 (rev 2, post dual-subagent review)
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

The redesign is a reskin plus one new decorative subsystem (the garden),
one new structural element (a home-page hero, §2), and one feature
replacement (reading-progress bar → vine, Q13 — a knowing tradeoff, see
§3.2). No content changes, no route changes, no architectural changes.

### How we got here (decision trail)

Explored and rejected across five browsing rounds: louder terminal variants,
Editorial magazine (kept as influence), Swiss modern, expressive-gradient,
quiet-craft minimal, riso zine, engineer's notebook (all intensities —
"cartoony" props and refined technical alike), Bauhaus, broadsheet, and a
12-direction gallery. **Field & Moss** won the gallery; the **Quiet Meadow**
interpretation won over Modern Organic and Naturalist Portfolio; garden
density was then deliberately increased ("more" calibration), hardened by a
skeptical pass, and rev 2 folds in findings from two adversarial subagent
reviews (repo-reality + web-platform/a11y). Mockups persist under
`.superpowers/brainstorm/96992-1785352532/content/` (gitignored; approved
references: `quiet-meadow-garden.html`, `quiet-meadow-garden-v2.html`).

## Goals

- Replace the visual identity while keeping every functional, structural,
  SEO/AEO, and CI property of the current site, except where a change is an
  explicit decision below (Q13, Q14).
- A design with warmth and life: illustrated, gently animated, seasonal.
- Hold or improve every existing quality bar: WCAG 2.2 AA with AAA body
  *and* AAA muted/subtle text (matching today's discipline), CWV targets
  (LCP ≤ 1.5s, INP ≤ 100ms, CLS 0.00), existing Lighthouse CI gates, 6
  KB/chunk JS budget.

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
| Q3 | Serif: **Source Serif 4, static instances** — roman 400 + 600, italic 400, latin subsets, self-hosted | Variable `[opsz,wght]` woff2 is ~122 KB *per style* — budget-impossible. Three static latin instances ≈ 20 KB each. OFL licensed. |
| Q4 | UI sans: **system stack**; mono: **JetBrains Mono retained for code only** (both subsets). IBM Plex Mono display stack (`--font-display`) retired. | Zero new bytes for chrome; existing posts use box-drawing glyphs from the ext subset; Plex was a fallback-stack entry with no @font-face. |
| Q5 | Illustration register: **field-guide ink** | Single-weight strokes, moss ink, no fills, no faces. The guardrail against "cartoony," which was explicitly rejected. |
| Q6 | Garden density: **dense** ("more" calibration) | Progress vine, seasonal slots, full bird cast — with hard per-page budgets (§3.1). |
| Q7 | Animation: **CSS-only, transform/opacity on whole `<svg>` elements** | Compositor-friendly; declared paint exceptions listed in §3.3. |
| Q8 | **"Pause the garden" control** (persisted; ambient loops pause, one-shots jump to end state) | WCAG 2.2.2 (Level A): auto-starting motion > 5s must be pausable; reduced-motion alone doesn't satisfy it. |
| Q9 | Reading progress = **scroll-driven vine**, desktop-only, progressive enhancement | `animation-timeline: scroll()`; masked-reveal via transform (compositor-only in Chromium; Safari ≥ 26 animates too, main-thread before 26.4 — acceptable for a transform-only sliver). Firefox stable: behind flag → static fallback. |
| Q10 | Seasons swap **two slots only** (hero cluster, footer meadow) by the author's calendar | Bounded asset work; "it's Kevin's garden" — author-time, Northern Hemisphere. |
| Q11 | Font budget: **≤ 125 KB total** (3 serif instances ≈ 60 KB + JBM 52.7 KB, headroom ~12 KB); enforced by a **new** fonts step in size.yml | No font budget is CI-enforced today (the "30 KB" figure was prose; shipped JBM already totals 52.7 KB). JS budget unchanged (6 KB/chunk gzip) + ≤ 0.5 KB inline gating JS. |
| Q12 | Ship as **one PR** from `redesign/quiet-meadow` | Avoids mixed-identity states on `main`; CI gates + preview deploy carry review. |
| Q13 | **Replace** the existing reading-progress header bar (progress.css + reading-progress-fallback.ts + PostLayout wiring) with the vine | Explicit tradeoff: today's bar works at all viewports/browsers; the vine is desktop-only with a static fallback. Mobile and no-scroll-timeline browsers lose the progress affordance. Accepted for identity coherence — the bar is pure decoration, not an a11y feature. |
| Q14 | **New home hero** (serif intro as the page `<h1>` + garden cluster) | The current home has no hero and no h1 — documented as intentional in audit finding F-005 (wontfix). The redesign *resolves* F-005 rather than perpetuating it; the audit doc entry is closed accordingly. |
| Q15 | **Brand asset refresh rides along**: favicon.svg + PNG/maskable icons, manifest colors, `theme-color` metas, `og-default.png` | All currently broadcast the terminal identity (`#0a0a0a`/`#f5f4ee`, mono "K"); a reskin that skips them ships a split identity. |

---

## 1. Visual identity

### 1.1 Color tokens

All ratios verified during design review (worst-case deviation 0.06); the
token contrast suite re-verifies at implementation time. **Note:
`src/lib/tokens.ts` is a manual mirror of tokens.css and must be rewritten
with these values; its pair *tiers* also change (§4).**

**Light — "sage paper"**

| Token | Value | Contrast on `--bg` | Role |
|---|---|---|---|
| `--bg` | `#eff1e7` | — | page ground |
| `--fg` | `#2c352b` | 11.1:1 (AAA) | ink / body text |
| `--fg-muted` | `#49523f` | 7.2:1 (AAA) | decks, descriptions |
| `--fg-subtle` | `#464f3b` | 7.5:1 (AAA) | small letterspaced labels. (Mockups used `#79856e` ≈ 3.9:1 — mockup-only, do not port. AAA keeps parity with today's deliberately-bumped subtle token.) |
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
| `--fg-subtle` | `#a0ac8e` | 7.3:1 (AAA) | labels |
| `--rule` | `#313c2b` | — | hairlines |
| `--panel` | `#1c221a` | — | lifted tiles |
| `--code-bg` | `#10140e` | — | code panels |
| `--accent` | `#d9a05b` | 7.6:1 | amber |
| `--garden-ink` | `#7d8a6e` | decorative | illustrations |

Forced-colors and `prefers-contrast: more` behavior carries over from the
current tokens.css (accent defers to system colors / `--fg`).

### 1.2 Typography

- **Prose + headings:** Source Serif 4 **static instances** (roman 400,
  roman 600, italic 400), latin subset via `pyftsubset`, self-hosted woff2
  in `/public/fonts/`. `font-display: swap` with a **metric-matched Georgia
  fallback** (`size-adjust` / `ascent-override` / `descent-override` /
  `line-gap-override`, same technique as the current JetBrains Mono setup).
  Metric overrides normalize vertical metrics, not per-glyph advances —
  Georgia can wrap lines differently, so CLS 0.00 must be **measured**
  (Lighthouse CI + manual cold-cache check), and overrides tuned until it
  holds. Preload roman 400 only; 600/italic load on use.
- **UI chrome / metadata:** system sans stack (nav, dates, labels, buttons,
  captions, footer).
- **Code:** JetBrains Mono, both existing subsets retained unchanged. The
  `--font-display` IBM Plex Mono stack is deleted (Q4); the stale
  "Self-hosted JetBrains Mono + IBM Plex Mono" comment in `src/lib/csp.ts`
  is corrected while touching adjacent code.
- **Scale:** prose body ~17–18px, line-height ~1.8; measure defined as
  **66–70 rendered characters per line** (counted, not ported as `ch` —
  `ch` is font-relative and the old 68ch was calibrated to mono).
- Headings: serif, sentence case; bold prose maps to 600. All-caps survives
  only in small letterspaced sans labels (`LATEST`, section labels, footer
  meta).

### 1.3 Link policy

- **Prose links** (inside running text): always underlined at rest.
- **Metadata links** (tags, dates, nav — standalone UI outside text blocks):
  accent color + position at rest; underline on hover/focus. Not color-only
  because they are not embedded in body text.

### 1.4 Focus

One uniform `:focus-visible` treatment: **2px solid accent outline, 2px
offset** (terracotta light / amber dark). Verified ≥ 3:1 against page and
panel surfaces in both themes (5.8 / 6.1 light; 7.6 dark). No
component-specific focus styles.

### 1.5 Illustration register — "field-guide ink" (the anti-cartoon guardrail)

Every illustration site-wide MUST follow all of:

- Single-weight line strokes (1.2–1.4 units at native viewBox scale),
  `stroke-linecap: round`, **no fills** (tiny seed-head circles and eye dots
  excepted), no gradients, no drop shadows.
- Ink color `--garden-ink`, opacity 0.28–0.55.
- Botanically/ornithologically plausible forms. No faces, no googly eyes,
  no anthropomorphism, no rotated "sticker" placement.
- Hand-authored inline SVG, each slot ≤ ~1.5 KB, `aria-hidden="true"`,
  `pointer-events: none`.

### 1.6 OG images & brand assets

- The OG edge function (`src/pages/api/og.ts`) adopts the identity: sage
  paper ground, terracotta accent, one static grass-cluster illustration.
  Season-less. **Satori cannot parse variable-font fvar tables** (the repo
  already documents this at og.ts:30 for JBM) — embed a **static-instance
  Source Serif 4 TTF (600)**, subset to the OG glyph needs, placed in
  `public/fonts/og/` (read via `readFileSync` at cold start, as today).
  Bundle-size impact is checked manually against the Vercel build output —
  no CI mechanism exists for it.
- `public/og-default.png` (static fallback used by `fallbackResponse()` and
  as the sitewide default image) is regenerated in the new identity.
- `public/favicon.svg` (currently a terminal-styled mono "K" on `#0a0a0a`),
  `favicon-192/512.png`, `icon-maskable.png`: redrawn — a field-guide-ink
  grass mark on sage.
- `public/manifest.webmanifest` `background_color`/`theme_color` and the
  hardcoded `theme-color` metas in BaseLayout: updated to `#eff1e7` /
  `#161b14`.

---

## 2. Layout & components

- **Global frame:** single column; header = name (sans, left) + nav + theme
  toggle (right) + one hairline. Footer mirrors it and hosts the footer
  meadow (§3.1) and the garden pause control (§3.5).
- **Home hero (new — Q14):** serif intro sentence as the page `<h1>`
  ("Essays on the web platform, written at a walking pace." or similar
  final copy), sans subline, seasonal garden cluster right, swallow
  flight. This adds the h1 the home page never had; it becomes the home
  LCP candidate and resolves audit finding F-005.
- **Post list rows** (replaces PostCard blocks): serif title, sans one-line
  deck, right-aligned date; hairline separators; newest entry's date in
  accent with `→`.
- **Project tiles:** hairline border on `--panel`, all sans.
- **Section labels:** small letterspaced sans + sprig accent + quiet
  "All →" link (replaces SectionTitle brackets).
- **Tags:** inverted pill removed (and the `pillFg`/`pillBg` contrast pair
  removed from the token suite); metadata-link policy (§1.3) applies.
- **Prose:** per §1.2. Blockquotes: moss left rule + italic + small leaf
  marker at the rule's head. Figures/images: hairline border, muted sans
  caption.
- **Code blocks:** `--code-bg` panel; Shiki themes (`min-light`/`min-dark`
  in astro.config.ts today) replaced or CSS-overridden to match the
  palette in both modes; CopyButton restyled as a quiet sans ghost button.
- **Search palette / shortcuts overlay:** restyled to paper/loam panels;
  search empty-state gets one small illustration + "nothing sprouted for
  that query."
- **Behavior-preserving:** SearchPalette, TableOfContents, Breadcrumbs,
  PostMeta, PostNav, RelatedPosts, ShortcutsOverlay, Webmentions,
  DiscussFooter, Analytics, PrerenderRules, KeyboardShortcuts,
  PostBodyReveal keep markup and behavior; restyle only. (Baseline
  re-triage caveat: §4.)

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

**Seasonal variants live as four `<g>` groups inside ONE `<svg>` per
seasonal slot**, toggled by the season class — the sway transform still
applies to the whole `<svg>` (per §3.3), and element counts stay flat
across seasons.

**Hard budget: ≤ 16 inline `<svg>` elements and ≤ 14 KB raw SVG per page,
counting hidden seasonal `<g>` variants.** (Home is the ceiling case:
wren + hero-cluster svg + swallow + 2 sprigs + 5 tuft svgs + footer bird
= 11 elements; the four-season groups inflate bytes, not counts.) The
reading column is never planted — illustrations live in margins, rules,
and gaps.

### 3.2 Reading-progress vine (replaces the header progress bar — Q13)

- Full vine SVG renders complete; a paper-colored cover slides away via
  `transform: translateY()` driven by `animation-timeline: scroll()` —
  the reveal is transform-only (never scroll-drive `stroke-dashoffset`;
  that repaints every scroll frame on the main thread).
- Support reality (mid-2026): Chromium 115+ compositor-driven; Safari 26+
  supported (main-thread until 26.4 — acceptable: transform-only sliver);
  Firefox stable behind a flag → gets the fallback.
- Desktop-only (hidden below the width where the margin exists). Fallback
  and mobile: fully grown static vine / nothing — **the old bar's
  universal coverage is intentionally given up** (Q13).
- **Removals:** `src/styles/progress.css`, `src/lib/reading-progress-fallback.ts`,
  and the `body[data-progress]` wiring in PostLayout all deleted — not
  left dead.
- `aria-hidden`, `pointer-events: none`; not a WCAG-relied-upon indicator.
  Exempt from the pause control (scroll-driven = user-initiated, not
  auto-starting; 2.2.2 does not apply to it).

### 3.3 Animation rules

- CSS-only. Transforms/opacity animate on **whole `<svg>` elements**, never
  inner paths (inner-element transforms repaint). Never use the `animation`
  shorthand in garden rules (it resets `animation-play-state` and breaks
  the pause cascade — §3.5).
- Sway: 7–9.5s ease-in-out alternate, ≤ ±2°, staggered negative delays.
- Declared paint exceptions (small regions, one-shot): fin draw-in
  (`stroke-dashoffset`, ~600ms, ~72px region); autumn falling leaf
  (11s loop, ~15px region, autumn only).
- One-shot animations (swallow flight, fin) are **prerender aware**: their
  trigger class is added only when `document.prerendering` is false (else
  on `prerenderingchange`). Honest caveat: with Astro's ClientRouter
  intercepting same-origin navigations, Speculation-Rules prerenders
  mostly activate only on address-bar/external navigations — the gate
  protects that path; in-site navigations go through the router instead.
- **Client-side navigation:** the head inline script does not re-run on
  ClientRouter swaps; season/pause/one-shot classes are re-applied in the
  existing `astro:after-swap` hook in BaseLayout (the pattern already
  exists for the theme class).
- Page-level motion: view transitions, title morph, theme crossfade, and
  scroll reveals carry over; easing softens; reveals shrink to 8px rise +
  fade; ≤ 250ms cap on transitions stands.
- **Implementation deviation (Task 12):** the reveal fade floor is `0.92`,
  not `0` (`transitions.css`, `@keyframes reveal-fade`), so `--accent`
  text never rests below 4.5:1 mid-reveal on the taller hero layout, where
  a card can straddle the fold at first paint. This makes the fade subtle
  by design; re-verify contrast at the new floor before deepening it.

### 3.4 Seasons

- Two seasonal slots (hero cluster, footer meadow) + autumn falling leaf.
  Spring buds / summer full meadow / autumn seed heads / winter bare stems.
  Seasonal palette shift is bounded: only `--bg` (± a few degrees of hue /
  ≤ 2% lightness) and `--garden-ink` may vary; `--fg*`, `--accent`, and
  `--rule` are identical across seasons. The token contrast suite runs
  against all four seasonal backgrounds.
- Season class set on `<html>` by the inline head script **before first
  paint** (no flash of wrong season), by the author's calendar (Northern
  Hemisphere, month-based; no visitor locale detection); re-applied on
  `astro:after-swap` (§3.3).

### 3.5 "Pause the garden" (WCAG 2.2.2 — Level A)

- Ambient loops (sway, flick, autumn leaf) auto-start and run > 5s ⇒ must
  be pausable. `prefers-reduced-motion` support does **not** satisfy 2.2.2
  by itself.
- Control in the footer **and mirrored in the shortcuts overlay** (the
  footer-only placement made users scroll past all the motion to reach
  it). Persisted in localStorage, applied by the head inline script,
  documented on `/accessibility`.
- Mechanics: `html.garden-paused` pauses **loops** via
  `animation-play-state: paused` (longhand only — see §3.3); **one-shots
  jump to their end state** (fin fully drawn, swallow hidden/landed) —
  pausing them would freeze the fin invisible and the swallow mid-air. The
  pause rule must win the cascade over layered component styles (defined
  in the top layer / un-layered).
- `prefers-reduced-motion: reduce` renders the entire garden static
  (no loops, draw-ins pre-completed, vine fully grown).

### 3.6 Inline JS & CSP

Season class + prerender gating + pause restore: **≤ 0.5 KB** added to the
existing inline head script in BaseLayout. **No CSP change is needed** —
`src/lib/csp.ts` already allows inline scripts via `'unsafe-inline'` in
`script-src` (there are no hashes/nonces; vercel.ts only imports this
module). `csp.test.ts` continues to pass untouched unless the stale font
comment cleanup (§1.2) tweaks a string it pins. The 6 KB/chunk external JS
budget is untouched.

---

## 4. Accessibility

- Conformance target unchanged: WCAG 2.2 AA, AAA for body/muted/subtle
  text. CI gates are the *existing* Lighthouse CI thresholds
  (lighthouserc.cjs: a11y ≥ 0.92 home / 0.95 elsewhere; SEO deliberately
  unasserted because of /search) — the spec does not invent stricter gates.
- New conformance work: §3.5 pause control; focus spec §1.4; all
  illustrations `aria-hidden` + `pointer-events: none`; garden never
  conveys information.
- **Token suite restructuring (not just re-valuing):** `src/lib/tokens.ts`
  is a manual mirror — rewrite with §1.1 values; keep `fgSubtle` in
  `aaaPairs` (values chosen to pass); delete the `pillFg`/`pillBg` pair
  with the TagPill inversion; add `panel`/`code-bg` dark values; extend
  the suite to run per-season backgrounds. `src/lib/theme.test.ts`
  hardcodes `#0a0a0a`/`#f5f4ee` and must be updated alongside.
- **Baseline re-triage (required):** re-run every entry in
  `axe-baseline.json`, `html-checks-baseline.json`, `keyboard-baseline.json`
  against the redesign; entries are positional keys (route:theme:rule:idx),
  so any that shift must be regenerated, drained, or re-justified —
  never blind-copied. `tokens-baseline.json` is currently empty and stays
  empty. Both existing `wontfix-rationale` entries are terminal-design-
  specific: F-005 (no home h1) is **resolved** by Q14; the other is
  re-reviewed and likely removed (KnownLimits.astro renders from that doc).

## 5. Performance

- CWV targets unchanged: LCP ≤ 1.5s, INP ≤ 100ms, CLS 0.00.
- Font budget: **≤ 125 KB** total per Q11, enforced by a **new** step in
  `.github/workflows/size.yml` (none exists today; the old "30 KB" was
  never enforced and is already exceeded by shipped JBM). Serif swap CLS
  held at 0.00 via metric overrides (§1.2), verified not assumed.
- SVG budget per §3.1. Animation cost honesty: backgrounded tabs stop the
  rendering pipeline (loops cost ~nothing but keep advancing); elements
  merely scrolled out of view are **not** throttled by Chromium — the
  garden stays cheap because everything is whole-element transform/opacity
  on tiny regions. `content-visibility: auto` on the footer meadow section
  as belt-and-suspenders.
- LCP: home LCP becomes the new hero `<h1>` text (Q14); post pages stay
  title-text LCP. Inline path-based SVG is excluded from LCP candidacy;
  with `font-display: swap` LCP records the fallback paint, so the serif
  swap does not move LCP while metric overrides hold the box size.

## 6. Scope

**In:** every route (home, posts index + post pages, tags, projects, about,
search, 404, accessibility, privacy); OG function + `og-default.png`;
favicons + manifest + theme-color metas (Q15); Shiki theme; SearchPalette;
ShortcutsOverlay; `print.css` (serif print styles; garden + vine hidden in
print); deletion of progress.css/fallback (Q13); `src/lib/tokens.ts` +
`theme.test.ts` updates (§4); size.yml fonts step (Q11); CLAUDE.md pointer.

**Explicitly untouched:** all MDX content; content collections + tag
allowlist; JSON-LD/schema builders; sitemaps (incl. image-sitemap
integration); RSS/JSON feeds; llms.txt; IndexNow; Speculation Rules;
Giscus/webmentions; Pagefind; analytics; CSP contents (§3.6);
`vercel.ts` routes/headers; every CI workflow's *existence* (size.yml
gains a step; lighthouserc.cjs thresholds unchanged).

## 7. Migration

1. **Precondition:** commit or stash the 10 currently-dirty files; branch
   `redesign/quiet-meadow` from clean `main`.
2. **Order:** tokens rewrite (css + ts mirror) → global/base CSS →
   components → prose/code → garden system → pages (incl. new home hero) →
   OG + brand assets → baseline re-triage → budget/CI updates → full
   verification.
3. Old tokens deleted, not aliased. Clean break. Deleted subsystems
   (progress bar, TagPill inversion, `--font-display` stack) removed
   fully, not orphaned.
4. **One PR.** Preview deploy is the review surface; Lighthouse CI + a11y
   gates + size gate must pass with zero *new* baseline entries (re-
   justified entries per §4 allowed).
5. Docs ride along: CLAUDE.md's "visual design is intentional" pointer →
   this spec; audit-findings doc re-triage (incl. closing F-005);
   AUTHORING.md unaffected (no authoring surface changes).

### Risks

| Risk | Mitigation |
|---|---|
| Serif subsets land heavier than estimated (~20 KB/instance) | Measure post-`pyftsubset` before committing to Q11's 125 KB; tighten glyph set or drop the 600 instance (synthesize bold is NOT acceptable — re-scope instead) |
| OG edge bundle / cold-start with serif TTF | Static-instance TTF subset to OG glyphs; manual size check on Vercel build output (no CI mechanism exists) |
| Serif swap CLS | Metric-matched fallback; verify 0.00 in Lighthouse CI + cold-cache manual check; tune overrides |
| Shiki retheme regresses code legibility | Contrast-check token colors on `--code-bg` both themes |
| Garden drifts cartoony over future edits | §1.5 register rules are normative; review against them |
| Pause control cascade broken by later CSS | §3.3 longhand-only rule + top-layer pause rule; add a test to the keyboard/a11y suite that toggles pause and asserts `animation-play-state` |
| Season-boundary stale builds | Head script corrects class at load, pre-paint |
| ClientRouter/SR overlap confuses testing | §3.3 caveat; test one-shot gating via address-bar navigation, not in-site links |

## 8. Verification (definition of done)

- `pnpm check` and `pnpm test` green; token contrast suite restructured
  per §4, passing (including per-season backgrounds); `theme.test.ts`
  updated and passing.
- a11y baselines re-triaged per §4; zero *new* entries; F-005 closed.
- Lighthouse CI passes at its **existing** thresholds on preview.
- CLS 0.00 with fonts cold-cached; INP unaffected by garden (verified with
  animations running).
- Fonts step in size.yml enforcing ≤ 125 KB total; actual measured sizes
  recorded in the PR description.
- Reduced-motion, garden-pause (incl. one-shot jump-to-end), forced-colors,
  and `prefers-contrast: more` each manually verified on home + one post.
- One-shot prerender gating verified via **address-bar** navigation with
  Speculation Rules active (in-site links go through ClientRouter and
  don't exercise it).
