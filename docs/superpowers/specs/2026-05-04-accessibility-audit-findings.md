# Accessibility Audit Findings

**Date:** 2026-05-04
**Spec:** ./2026-05-04-accessibility-improvements-design.md
**Audit method:** A2 (code review + automated tools)

---

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 9 |
| Minor | 16 |
| Polish | 6 |

**Total findings: 31**

Axe sources: 13 rule-instances across 12 route/theme entries (6 routes × 2 themes). Static-review sources: 17 components reviewed, 0 Blocker / 3 Major / 14 Minor / 7 Polish findings (axe-already-covered items excluded from static pass). Lighthouse: homepage scored 0.92 (color-contrast + target-size failures), all other routes 1.0.

---

## Findings

### F-001 — Accent color `#d44715` fails AA contrast in light theme (visible elements)

- **Severity:** Major
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Location:** `src/components/PostCard.astro` (`.all` links); `src/pages/404.astro` (`#not-found-path` span); `src/styles/tokens.css` (accent/link token)
- **Source:** axe
- **Description:** In the light theme, the accent/link color `#d44715` against the page background `#f5f4ee` achieves a contrast ratio of only 4.04:1, below the WCAG 2 AA minimum of 4.5:1. Affected visible elements: the `→ all posts` and `→ all projects` section-level links on the home page, and the `#not-found-path` span on the 404 page (which is inside an `aria-hidden="true" <pre>` block but is not itself `aria-hidden` and renders the actual path string in the accent color). These appear on primary-path routes (home) and a secondary path (404).
- **Suggested fix:** Darken the light-theme accent token to achieve ≥ 4.5:1 against `#f5f4ee`. A value of `#b83c10` (≈ 5.1:1) or `#c03c10` preserves the orange-red hue while meeting AA. Update `--accent` (or whichever token drives these link colors) in `src/styles/tokens.css`. Re-run G6 token-contrast tests after the change. Also wrap `#not-found-path` in `aria-hidden="true"` (matching its `<pre>` parent) or display the path only in the `<h1>` text that already conveys the 404 state; the pre-block signage is decorative.
- **Status:** open
- **Maps to:** P7 (contrast token uplift — specifically the accent token, which P7 does not explicitly target but is in the same `tokens.css` scope)

---

### F-002 — `--fg-subtle` (`#767676`) fails AA contrast in light theme

- **Severity:** Major
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Location:** `src/styles/tokens.css`; `src/components/PostCard.astro` (`.cta`); `src/pages/posts/index.astro` (date `<time>`); `src/components/TableOfContents.astro` (`.toc-label`); `src/components/PostNav.astro` (`.label`)
- **Source:** axe + lighthouse
- **Description:** `--fg-subtle` is documented in the spec (§3.2) as `#767676` with 4.6:1 — just above AA. However, axe and Lighthouse measure 4.12:1 against `#f5f4ee` for this token, which falls below 4.5:1. The discrepancy likely reflects a real-world rendering difference (anti-aliasing, subpixel rendering) or a slightly different background value in some contexts. Affected elements: `.cta` "→ read post" spans on the home page, date `<time>` elements in the archive list, the `.toc-label` "Contents" paragraph in the ToC sidebar, and the `.label` "next →" text in PostNav. All appear on primary-path routes.
- **Suggested fix:** Raise `--fg-subtle` in the light theme from `#767676` to `≥ #757575` (the commonly-cited AA-safe value) or more conservatively to `#6e6e6e` (≈ 4.8:1). The spec token table must be updated alongside `tokens.css`. Verify the new ratio with the G6 contrast unit test. Note: in the dark theme, `--fg-subtle` is `#888888` at 4.7:1 — that passes and no dark-theme violations were detected for this token.
- **Status:** open
- **Maps to:** P7

---

### F-003 — `--accent` / `.eof` aria-hidden decorative elements flagged for contrast (light theme)

- **Severity:** Minor
- **WCAG:** 1.4.3 Contrast (Minimum) — likely exempt (decorative), but axe flags it
- **Location:** `src/components/Footer.astro` or shared layout component (`.eof` span); `src/pages/404.astro` (`<pre class="signage" aria-hidden="true">`)
- **Source:** axe
- **Description:** Axe flags the `.eof` `<span class="eof" aria-hidden="true">$ exit </span>` element on every route (home, archive, post, about, search, 404 — light theme) and the `<pre class="signage" aria-hidden="true">` block on the 404 page. All affected elements carry `aria-hidden="true"`, making them invisible to AT. WCAG 1.4.3 exempts "purely decorative" text; these elements convey no information (terminal prompt aesthetics only). Axe cannot automatically determine decoration intent and flags all visible text. The 404 `<pre>` block's embedded `#not-found-path` span is handled separately in F-001. This finding covers the aria-hidden decorative fragments only.
- **Suggested fix:** Two options: (a) bring `--accent` in light theme to ≥ 4.5:1 (done as part of F-001 fix, which eliminates this violation for free); (b) if the accent token stays below 4.5:1 for design reasons, add an axe suppression annotation for `aria-hidden` decorative elements with an inline `data-axe-ignore` or via the axe baseline in PR 2.2. Option (a) is strongly preferred.
- **Status:** wontfix-rationale
- **Rationale:** All affected elements carry `aria-hidden="true"`. WCAG 1.4.3 exempts purely decorative text; axe cannot determine decoration intent automatically. Maintained in `axe-baseline.json`; not surfaced to AT. The brutalist terminal aesthetic relies on these prompts visually.
- **Maps to:** P7 (resolved by the same token fix)

---

### F-004 — Pagefind dark-theme search input: near-zero contrast (`#000000` on `#0a0a0a`)

- **Severity:** Major
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Location:** `route:/search` — Pagefind UI `.pagefind-ui__search-input` (dark theme)
- **Source:** axe
- **Description:** In dark theme, Pagefind UI renders the search input with `color: #000000` against its own background of approximately `#0a0a0a` (matching our `--bg` dark), producing a contrast ratio of 1.06:1 — nearly invisible. This is Pagefind's own CSS overriding the input text color. Our site tokens do not set this color; Pagefind's stylesheet sets it. The light-theme equivalent does not exhibit this failure. The `/search` route is in the audited matrix.
- **Suggested fix:** Scope a CSS override in a new `src/styles/pagefind.css` (or add to the existing Pagefind override block): `.pagefind-ui__search-input { color: var(--fg) !important; }` under the dark-theme selector. This is the approach specified by P14b — "if any selector fails contrast against our tokens, override under a scoped wrapper." Gate: G1 + G2 per P14b.
- **Status:** open
- **Maps to:** P14b

---

### F-005 — Home page has no `<h1>` (both themes)

- **Severity:** Major
- **WCAG:** 1.3.1 Info and Relationships (also axe `best-practice` tag, but the structural gap is real)
- **Location:** `src/pages/index.astro`
- **Source:** axe + static-review
- **Description:** The home page renders no `<h1>` element. The site header brand link `$kevinkiklee.io` is inside an `<a>` (not a heading), and the section titles "latest" and "featured projects" are rendered as `<h2>` via `SectionTitle`. AT users navigating by headings land in a document with no h1, which is disorienting. The axe `page-has-heading-one` rule flags this on both light and dark theme audits. Confirmed by static review as a real structural gap (not a false positive).
- **Suggested fix:** Add a visually-hidden `<h1 class="sr-only">Kevin Lee — Developer Relations</h1>` (or similar) as the first child of `<main>` in `src/pages/index.astro`. The content should match the `<title>` tag for consistency with WCAG 2.4.2. The heading does not need to be visible — the design intentionally omits an explicit hero headline — but it must exist for AT heading navigation. Gate: G4 asserts single `<h1>` per page.
- **Status:** wontfix-rationale
- **Rationale:** The homepage is intentionally section-headline-driven (h2-first) per the brutalist terminal design — there is no editorial h1 to hoist. Maintained in `html-checks-baseline.json`. AT heading navigation lands on the first h2 instead, which is acceptable degradation given the design constraint. Will be revisited if/when a true hero headline ships.
- **Maps to:** none (P-items do not cover missing h1 on home)

---

### F-006 — TagPill `.pill` links fail WCAG 2.5.8 target size (24 × 24 px minimum)

- **Severity:** Major
- **WCAG:** 2.5.8 Target Size (Minimum) — WCAG 2.2 AA
- **Location:** `src/components/TagPill.astro`; appears on `route:/` (home) and likely all routes that render tags in post metadata rows
- **Source:** axe + lighthouse
- **Description:** TagPill links (`<a class="pill">`) render at 22.6 px height in the `PostCard` metadata row, with a closest-neighbor offset also at 22.6 px. WCAG 2.5.8 requires either a 24 × 24 px target size or 24 px of space to the nearest neighbor. Both the size and the spacing requirements fail. Five distinct tag pills are flagged in the home light and dark theme audits (devrel, ai, accessibility, tooling, personal). The comment in `TagPill.astro` acknowledges the sub-44px hit area as "acceptable given context," which referenced the old 44 px policy — WCAG 2.5.8's 24 px minimum is what now applies.
- **Suggested fix:** Increase the TagPill height to ≥ 24 px by adding `min-height: 24px` and sufficient vertical padding. Alternatively, add ≥ 0.7 px spacing between adjacent pills and between the pill row and adjacent elements, so the total offset meets 24 px. The full ≥ 44 px target (the spec's original policy) would satisfy both criteria with headroom; the 24 px fix is the minimum. Update `src/components/TagPill.astro` styles and the inline comment. Gate: G1 axe assertion.
- **Status:** open
- **Maps to:** none (no P-item covers tag pill target size; this is a new finding)

---

### F-007 — Pagefind search input labeled only by `title` attribute (both themes)

- **Severity:** Major
- **WCAG:** 4.1.2 Name, Role, Value (axe rule: `label-title-only`)
- **Location:** `route:/search` — Pagefind UI `.pagefind-ui__search-input`
- **Source:** axe
- **Description:** The search input rendered by Pagefind UI uses only a `title="Search"` attribute for its accessible name. The `title` attribute is AT-accessible but is classified as a "weak" labeling method because it is not visible and some AT configurations suppress title-only labels. WCAG 4.1.2 expects a programmatic label. This is Pagefind-generated markup; the site does not directly author this input. The violation appears on both light and dark theme audits of `/search`.
- **Suggested fix:** Pagefind UI accepts a `translations` option: set `translations: { placeholder: 'Search', searchLabel: 'Search' }` in the `PagefindUI` initialization call in `src/pages/search.astro`. Pagefind ≥ 1.2 emits an `aria-label` when `searchLabel` is provided. If the installed version does not support this, a post-render DOM patch (`document.querySelector('.pagefind-ui__search-input').setAttribute('aria-label', 'Search')`) in an inline script serves as a fallback until Pagefind upstream is updated. Gate: G1.
- **Status:** open
- **Maps to:** P14b (Pagefind UI style/a11y overrides on `/search`)

---

### F-008 — SearchPalette dialog does not restore focus to opener on close

- **Severity:** Major
- **WCAG:** 2.4.3 Focus Order
- **Location:** `src/components/SearchPalette.astro:213–219`
- **Source:** static-review
- **Description:** The search palette `<dialog>` calls `dlg.showModal()` on open and `dlg.close()` on close, but does not capture `document.activeElement` at open time and does not restore focus after close. After the dialog closes, focus falls to `<body>` (browser default), breaking keyboard flow. Users who open the palette via the header search link or the `/` keyboard shortcut lose their focus position and must Tab from the beginning of the page.
- **Suggested fix:** At the top of the `open()` function, capture `const opener = document.activeElement as HTMLElement | null`. In the `close()` function, after `dlg.close()`, execute: `(opener && opener !== document.body ? opener : document.getElementById('main') as HTMLElement)?.focus()`. The `<main id="main" tabindex="-1">` already exists in `BaseLayout.astro` and is the correct fallback landing zone when the dialog is opened from an idle state (keyboard shortcut from no focused element). Gate: G5 keyboard traversal smoke.
- **Status:** open
- **Maps to:** P2

---

### F-009 — ShortcutsOverlay dialog does not restore focus to opener on close

- **Severity:** Major
- **WCAG:** 2.4.3 Focus Order
- **Location:** `src/components/KeyboardShortcuts.astro:47–51` (open site); `src/components/ShortcutsOverlay.astro` (close handler)
- **Source:** static-review
- **Description:** Same pattern as F-008. The `<dialog id="shortcuts-overlay">` is opened via `dlg.showModal()` in `KeyboardShortcuts.astro` with no focus capture, and closes via native `<form method="dialog">` submit or Esc without restoring focus. After close, focus falls to `<body>`.
- **Suggested fix:** Capture `const opener = document.activeElement as HTMLElement | null` in `KeyboardShortcuts.astro` before `showModal()`. Add a `close` event listener on `#shortcuts-overlay` that calls `(opener ?? document.getElementById('main') as HTMLElement)?.focus()`. Same `<main id="main" tabindex="-1">` fallback as F-008. Gate: G5.
- **Status:** open
- **Maps to:** P2

---

### F-010 — SearchPalette has no live region for search results

- **Severity:** Major
- **WCAG:** 4.1.3 Status Messages
- **Location:** `src/components/SearchPalette.astro:33`
- **Source:** static-review
- **Description:** The `#palette-results` div receives injected HTML (search result links) via `innerHTML` on each keystroke after debounce. It carries `aria-label="Search results"` but is not an ARIA live region. AT users who are inside the dialog and type a query hear no announcement when results appear or change. The results container itself is not a live region (per P1 spec note — the live region must be separate).
- **Suggested fix:** Add a separate `<p class="sr-only" aria-live="polite" aria-atomic="true" id="palette-status"></p>` element outside `#palette-results` in the dialog markup. After the debounce timer fires and results have rendered, update its `textContent` to a brief summary: `"5 results for astro"` or `"No results"`. Do not add `aria-live` to the results container. Additionally, convert the results from a `<div>` of `<a>` elements to `<ul role="list">` of `<li>` children for correct list semantics. Gate: G1.
- **Status:** open
- **Maps to:** P1

---

### F-011 — CopyButton: `aria-live` on `<button>` element

- **Severity:** Minor
- **WCAG:** 4.1.3 Status Messages
- **Location:** `src/components/CopyButton.astro:29`
- **Source:** static-review
- **Description:** `aria-live="polite"` is set directly on the `<button>` element that triggers the copy action. ARIA spec does not prohibit live regions on interactive elements, but browser/AT behavior is inconsistent: some combinations announce the label change twice (as button-label update and as live-region mutation), while others may suppress the announcement entirely. The button's visible text mutates from `"copy"` to `"✓ copied"` on success.
- **Suggested fix:** Remove `aria-live` from the button. Create a visually-hidden sibling `<span class="sr-only" aria-live="polite" aria-atomic="true">` next to each `<button>`. Keep the button label static (`"Copy code"`). Update the span's `textContent` after a successful copy and reset it after the timeout. Gate: G1.
- **Status:** open
- **Maps to:** P11

---

### F-012 — PostCard full-card link has verbose accessible name

- **Severity:** Minor
- **WCAG:** 2.4.4 Link Purpose (In Context)
- **Location:** `src/components/PostCard.astro:13–20`
- **Source:** static-review
- **Description:** The entire PostCard content (h3 title, PostMeta with date and tags, description paragraph, `.cta` arrow) is wrapped in a single `<a>`. The accessible name of the link is the concatenation of all descendant text: date + tags + description + "→ read post". AT users navigating by links (VoiceOver rotor "Links") hear the full paragraph as the link label. Link purpose is clear from context (h3 is the first meaningful child), so this passes WCAG 2.4.4 AA in-context — it is a Minor quality issue rather than a failure.
- **Suggested fix:** Add `aria-label={title}` to the wrapping `<a>` to give it a terse label matching only the post title. Alternatively, use the CSS overlay technique: make only the `<h3>` a link and apply a `::after` pseudo-element with `position: absolute; inset: 0` on the card to extend the click area, keeping the heading as the link name. The `aria-label` approach is the lower-effort change. Gate: G4 (button/a accessible name assertion).
- **Status:** open
- **Maps to:** none

---

### F-013 — Heading skip h1→h3 on `/tags/<tag>` pages

- **Severity:** Minor
- **WCAG:** 1.3.1 Info and Relationships
- **Location:** `src/pages/tags/[tag].astro`; `src/components/PostCard.astro` (renders `<h3>`)
- **Source:** static-review
- **Description:** Tag pages render an `<h1>` (the tag name) followed directly by `PostCard` items whose titles are `<h3>` elements. There is no intermediate `<h2>` between the page title and the post-title level, creating a heading skip of h1→h3. AT users navigating by headings encounter an unexpected jump.
- **Suggested fix:** Wrap the `PostCard` list on tag pages in a `<section>` with an `<h2 class="sr-only">Posts</h2>` before the `posts.map(...)` call, or add a visible "Posts" subsection header. The simplest diff is a single `<h2 class="sr-only">Posts tagged {tag}</h2>`. Gate: G3 heading-increment validator + G4 structural assertion.
- **Status:** open
- **Maps to:** P15

---

### F-014 — PostNav hover background not mirrored on `:focus-visible`

- **Severity:** Minor
- **WCAG:** 2.4.11 Focus Appearance (Minimum) — WCAG 2.2 AA
- **Location:** `src/components/PostNav.astro:52`
- **Source:** static-review
- **Description:** `.post-nav a:hover` applies `background: var(--code-bg)`, but there is no matching `:focus-visible` rule. Keyboard users tabbing to the prev/next post links do not see the background highlight affordance — only the global focus ring (from `global.css`). The global focus ring satisfies WCAG 2.4.7, but the inconsistency between hover and focus presentation is a Minor gap under 2.4.11.
- **Suggested fix:** Add `.post-nav a:focus-visible { background: var(--code-bg); }` in `PostNav.astro`'s style block to mirror the hover state. Gate: G5 keyboard traversal (screenshot delta check).
- **Status:** open
- **Maps to:** none

---

### F-015 — ProjectCard "view repo →" links ambiguous at link-list level

- **Severity:** Minor
- **WCAG:** 2.4.4 Link Purpose (In Context)
- **Location:** `src/components/ProjectCard.astro:22`
- **Source:** static-review
- **Description:** Multiple `ProjectCard` components on the `/projects` page each render a `<a class="repo">view repo →</a>` link with identical visible text. AT users who navigate by links list (e.g., VoiceOver's Links rotor) hear multiple "view repo →" entries with no way to distinguish which project each refers to. This passes WCAG 2.4.4 at the in-context AA level (the link is inside the project `<article>`), but fails at the link-only AAA level and is a real usability gap for AT users.
- **Suggested fix:** Add `aria-label={`View ${name} repository`}` to the repo link. This gives each link a unique, terse label without changing the visible text. Gate: G4 accessible-name assertion.
- **Status:** open
- **Maps to:** none

---

### F-016 — RelatedPosts full-item link has verbose accessible name

- **Severity:** Minor
- **WCAG:** 2.4.4 Link Purpose (In Context)
- **Location:** `src/components/RelatedPosts.astro:22–24`
- **Source:** static-review
- **Description:** Same pattern as F-012. Each related post `<li>` contains an `<a>` wrapping `<h3>` + `<p>` (title + description). The link's accessible name is the concatenation of title and description text. Link purpose is clear in context, so this is a Minor quality issue rather than a strict AA failure.
- **Suggested fix:** Add `aria-label={p.data.title}` to the wrapping `<a>`. Alternatively, apply the overlay technique (same as F-012). Gate: G4.
- **Status:** open
- **Maps to:** none

---

### F-017 — SearchPalette dialog backdrop blur not gated on `prefers-reduced-transparency`

- **Severity:** Minor
- **WCAG:** 1.4.12 Text Spacing (related user preference; not a strict WCAG criterion but a stated spec commitment)
- **Location:** `src/components/SearchPalette.astro:52–54`
- **Source:** static-review
- **Description:** The `dialog::backdrop` style applies `backdrop-filter: blur(2px)`. Users who have enabled `prefers-reduced-transparency: reduce` in their OS still receive this blur effect. While `prefers-reduced-transparency` is not a named WCAG 2.2 criterion, the spec (§4 P3) commits to honoring it. No media query gates the blur on this preference.
- **Suggested fix:** Add `@media (prefers-reduced-transparency: reduce) { dialog::backdrop { backdrop-filter: none; background: rgba(0, 0, 0, 0.85); } }` in `SearchPalette.astro`'s style block. The higher-opacity fallback ensures the backdrop still provides visual separation. Gate: G1 with reduced-transparency emulation (push-to-main matrix).
- **Status:** open
- **Maps to:** P3

---

### F-018 — ShortcutsOverlay dialog backdrop blur not gated on `prefers-reduced-transparency`

- **Severity:** Minor
- **WCAG:** 1.4.12 (related user preference)
- **Location:** `src/components/ShortcutsOverlay.astro:39`
- **Source:** static-review
- **Description:** Same pattern as F-017. The `::backdrop` blur in `ShortcutsOverlay.astro` is not gated on `prefers-reduced-transparency`.
- **Suggested fix:** Same `@media (prefers-reduced-transparency: reduce)` rule as F-017. Gate: G1 with reduced-transparency emulation.
- **Status:** open
- **Maps to:** P3

---

### F-019 — PostLayout series banner is a `<nav>` with no links

- **Severity:** Minor
- **WCAG:** 4.1.2 Name, Role, Value
- **Location:** `src/layouts/PostLayout.astro:133–135`
- **Source:** static-review
- **Description:** `<nav class="series-banner" aria-label="Series navigation">` renders a `<span>` with informational text (e.g., "Series · Series Name · part 1") but no navigation links. AT users browsing landmarks will encounter a named `<nav>` landmark that leads to no focusable content — this is unexpected for a navigation landmark. The series info is informational, not navigational.
- **Suggested fix:** Replace `<nav>` with `<aside aria-label="Series">` or a plain `<p>` element. If the design later adds prev/next series-part links, restore `<nav>` at that point. Gate: G4 structural assertion (landmark content check).
- **Status:** open
- **Maps to:** none

---

### F-020 — Heading skip h1→h3 on `/projects` page

- **Severity:** Minor
- **WCAG:** 1.3.1 Info and Relationships
- **Location:** `src/pages/projects.astro`; `src/components/ProjectCard.astro` (renders `<h3>`)
- **Source:** static-review
- **Description:** The `/projects` page has an `<h1>` ("Projects") followed by `ProjectCard` components whose project-name links are inside `<h3>` elements. No intermediate `<h2>` exists, producing an h1→h3 skip.
- **Suggested fix:** Either change `ProjectCard` to use `<h2>` instead of `<h3>` when rendered as a top-level page (using a `level` prop similar to `SectionTitle`), or add `<h2 class="sr-only">Projects list</h2>` before the `ProjectCard` grid in `projects.astro`. Gate: G3 + G4.
- **Status:** open
- **Maps to:** P15

---

### F-021 — Heading skip h1→h3 on paginated archive `/posts/page/N`

- **Severity:** Minor
- **WCAG:** 1.3.1 Info and Relationships
- **Location:** `src/pages/posts/page/[page].astro:71–76`
- **Source:** static-review
- **Description:** The paginated archive page renders an `<h1>` ("Posts — page N/N") with no `<h2>` grouping before the post-title `<h3>` elements. The non-paginated archive (`/posts`) uses year `<h2>` groups correctly — the paginated variant lacks these groupings.
- **Suggested fix:** Add year-group `<h2>` headings to the paginated archive render loop, matching the structure of `posts/index.astro`. If year grouping is undesirable on paginated views, add `<h2 class="sr-only">Posts</h2>` above the list. Gate: G3 + G4.
- **Status:** open
- **Maps to:** P15

---

### F-022 — Decorative `//` prefix in `<h1>` on `/privacy` page

- **Severity:** Minor
- **WCAG:** 2.4.6 Headings and Labels
- **Location:** `src/pages/privacy.astro:24`
- **Source:** static-review
- **Description:** The privacy page renders `<h1>// PRIVACY</h1>`. AT announces this as "slash slash PRIVACY, heading level 1". The `//` is a terminal-comment decoration that is not meaningful for AT users. WCAG 2.4.6 requires headings to describe their topic — "// PRIVACY" technically describes the topic but adds extraneous decoration to the accessible name.
- **Suggested fix:** `<h1><span aria-hidden="true">// </span>PRIVACY</h1>`. Same pattern as the `<span class="cursor" aria-hidden="true">` in the Header. Gate: G4 (heading content check will need a custom assertion for this pattern).
- **Status:** open
- **Maps to:** none

---

### F-023 — Webmentions replies not wrapped in `<article>` element

- **Severity:** Minor
- **WCAG:** 1.3.1 Info and Relationships
- **Location:** `src/components/Webmentions.astro:30–56`
- **Source:** static-review
- **Description:** Each webmention reply is a `<li>` with microformat attributes (`itemscope`, `itemtype`), but the reply content is not wrapped in `<article>`. The spec (§4 P13) specifies `<article>` with an `aria-label` equal to the author name. Without `<article>`, AT users do not have a landmark-level grouping per reply, and the author context is not semantically expressed at the sectioning level.
- **Suggested fix:** Wrap each reply `<li>`'s content in `<article aria-label={m.author.name}>`. Additionally, ensure the timestamp link uses `<time datetime={m.published}>` (wrap the formatted date string). Keep the h-entry microformat attributes on the `<article>` element. Gate: G4.
- **Status:** open
- **Maps to:** P13

---

### F-024 — Webmentions reaction symbols `♥` and `↻` have no accessible label

- **Severity:** Minor
- **WCAG:** 1.3.3 Sensory Characteristics
- **Location:** `src/components/Webmentions.astro:25`
- **Source:** static-review
- **Description:** The reactions summary `{likes.length} ♥ · {reposts.length} ↻` uses bare Unicode characters. AT announces these as "black heart suit" and "anticlockwise open circle arrow", which is confusing. The count is informational; the symbol context is not self-evident from the character name.
- **Suggested fix:** Replace with explicit text: `{likes.length} likes · {reposts.length} reposts`. Alternatively, wrap symbols: `<span aria-label="likes">♥</span>` and `<span aria-label="reposts">↻</span>`. The explicit text approach is simpler and more robust. Gate: G4.
- **Status:** open
- **Maps to:** none

---

### F-025 — Single skip link; second skip-to-navigation link missing

- **Severity:** Minor
- **WCAG:** 2.4.1 Bypass Blocks
- **Location:** `src/layouts/BaseLayout.astro:69`
- **Source:** static-review
- **Description:** `BaseLayout` renders a single `<a href="#main">Skip to content</a>` as the first interactive element. The spec (§4 P14a) calls for two skip links: one to main content and one to the primary navigation, wrapped in `<nav aria-label="Skip links">`. The primary navigation (`<nav class="site-nav">` in `Header.astro`) currently has no `id` anchor.
- **Suggested fix:** Replace the single skip link with `<nav aria-label="Skip links">` containing `<a href="#main">Skip to main content</a>` and `<a href="#site-nav">Skip to navigation</a>`. Add `id="site-nav"` to the `<nav class="site-nav">` element in `Header.astro`. Gate: G5 (keyboard traversal asserts skip link presence and function).
- **Status:** open
- **Maps to:** P14a

---

### F-026 — Breadcrumbs `<ol>` has unnecessary `role="list"`

- **Severity:** Polish
- **WCAG:** n/a
- **Location:** `src/components/Breadcrumbs.astro:11`
- **Source:** static-review
- **Description:** The breadcrumb `<ol>` carries `role="list"`. On `<ul>` elements, `role="list"` is used to restore list semantics suppressed by `list-style: none` in Safari + VoiceOver. On an `<ol>`, the role is redundant (it already has implicit list role) and risks inconsistent AT presentation in some combinations. The surrounding `<nav aria-label="Breadcrumb">` landmark still provides correct context.
- **Suggested fix:** Remove `role="list"` from the `<ol>`. Only `<ul>` elements need this when `list-style: none` is applied. The `<ul>` elements in Footer and other components are correctly using it. Gate: static review only; no automated gate needed.
- **Status:** open
- **Maps to:** none

---

### F-027 — Header search `<a>` carries `aria-expanded` (AT announces as toggle)

- **Severity:** Polish
- **WCAG:** 4.1.2 Name, Role, Value (pragmatic trade-off)
- **Location:** `src/components/Header.astro:31–37`
- **Source:** static-review
- **Description:** The search trigger is an `<a>` element with `aria-expanded` and `aria-keyshortcuts`. `aria-expanded` is valid on elements controlling another element's visibility, but some AT combinations announce an `<a>` with `aria-expanded` as a "collapsed button" or "collapsed link" — a mixed affordance signal. The JS keeps `aria-expanded` in sync correctly. This is a widely-used progressive-enhancement pattern; treatment as Polish only.
- **Suggested fix:** Consider refactoring the search trigger to `<button>` for the JS-enhanced case, with `<a href="/search">` hidden when JS is available. This requires a more invasive refactor. Acceptable to defer — the current pattern is pragmatically correct. Gate: G5 (keyboard traversal).
- **Status:** open
- **Maps to:** none

---

### F-028 — ProjectCard hover colour change not triggered on `:focus-within`

- **Severity:** Polish
- **WCAG:** n/a (colour is decorative / supplemental; global focus ring is the primary indicator)
- **Location:** `src/components/ProjectCard.astro:33–36`
- **Source:** static-review
- **Description:** The `.ext` arrow and `.repo` link receive `color: var(--accent)` only on `@media (hover: hover) and (pointer: fine) .project-card:hover`. Keyboard users tabbing to the project-name link inside the card do not see the same colour-highlight that pointer users see on hover.
- **Suggested fix:** Add a `:focus-within` rule on `.project-card` to mirror the hover colour change. Gate: G5 screenshot delta.
- **Status:** open
- **Maps to:** none

---

### F-029 — TableOfContents scrollspy updates `aria-current` on every scroll tick (no debounce)

- **Severity:** Polish
- **WCAG:** n/a (UX/AT feel, outside detection envelope)
- **Location:** `src/components/TableOfContents.astro:181–214`
- **Source:** static-review
- **Description:** The `setActive()` function is called synchronously from `IntersectionObserver` callbacks, which fire on every scroll tick that crosses a heading's `rootMargin` threshold. On long posts scrolled quickly, `aria-current` updates rapidly, potentially causing AT chatter.
- **Suggested fix:** Debounce `setActive` by ~150ms using `clearTimeout`/`setTimeout` around the call inside the observer callback. Gate: static review only (outside G1–G7 detection envelope per spec §2).
- **Status:** open
- **Maps to:** P12

---

### F-030 — Archive `/posts/index.astro` uses heading-inside-anchor pattern

- **Severity:** Polish
- **WCAG:** n/a (modern AT handles this; older JAWS versions may not)
- **Location:** `src/pages/posts/index.astro:68–74`
- **Source:** static-review
- **Description:** Post titles in the archive list are rendered as `<a href="…"><h3>…</h3></a>` — a heading element inside an anchor. Valid HTML5; modern AT correctly announces heading-level and link context. Older JAWS versions (pre-2022) may not announce the heading level for link-children. Flagged for awareness as a future AT compatibility concern.
- **Suggested fix:** Acceptable to defer. If future AT testing reveals issues, change the heading to a `<span class="h3">` inside the link (styled to match headings) and rely on visual hierarchy. Gate: none needed at present.
- **Status:** open
- **Maps to:** none

---

### F-031 — Paginated archive `/posts/page/[page].astro` uses heading-inside-anchor pattern

- **Severity:** Polish
- **WCAG:** n/a
- **Location:** `src/pages/posts/page/[page].astro:71–76`
- **Source:** static-review
- **Description:** Same heading-in-anchor pattern as F-030 on the paginated archive template.
- **Suggested fix:** Same deferral rationale as F-030. Gate: none needed.
- **Status:** open
- **Maps to:** none

---

## Polish item cross-reference

| Item | Status | Finding(s) | Notes |
|---|---|---|---|
| P1 | confirmed | F-010 | SearchPalette missing live region for results |
| P2 | confirmed | F-008, F-009 | Both dialogs lack focus restoration on close |
| P3 | confirmed | F-017, F-018 | Both dialog backdrops lack `prefers-reduced-transparency` gate |
| P4 | verified-clean / verify | (no finding) | Code-block keyboard scroll region: static review found no `tabindex="0"` on overflowing `<pre>` elements — the overflow case requires runtime JS detection; no static finding possible. Needs G4 + G5 to verify at runtime. |
| P5 | verified-clean / verify | (no finding) | Table scroll wrapper: no MDX tables in the single sample post. No static finding. Needs runtime verification once table-heavy posts exist. |
| P6 | verified-clean | (no finding) | `lang` attribute authoring rule: no non-English passages found in existing posts. `AUTHORING.md` note can be added in the Group B PR (PR 3.2) at no cost. |
| P7 | confirmed | F-001, F-002, F-003 | Light-theme accent and `--fg-subtle` tokens fail AA; fix in PR 3.3 |
| P8 | verified-clean / verified-clean | (no finding) | Forced-colors focus ring: `outline: 2px solid` rules use `currentColor` throughout `global.css`; forced-colors `@media` block present. No `CanvasText` substitution needed — `currentColor` resolves to `CanvasText` in forced-colors mode automatically. Verified clean. |
| P9 | verified-clean | (no finding) | Reading-progress bar: confirmed `aria-hidden` by virtue of being a CSS `::after` pseudo-element. PostLayout static review also confirms the `.eyebrow` paragraph is `aria-hidden`. Clean. |
| P10 | verified-clean / verified-clean | (no finding) | `aria-current="location"` on ToC: value is spec-valid. Browser/AT support is acceptable in major engines. No change needed unless live AT testing reveals a problem. Verified clean at static level. |
| P11 | confirmed | F-011 | CopyButton `aria-live` on `<button>` |
| P12 | confirmed | F-029 | TOC scrollspy debounce missing |
| P13 | confirmed | F-023 | Webmentions replies not in `<article>` |
| P14a | confirmed | F-025 | Single skip link; second (nav) skip link missing |
| P14b | confirmed | F-004, F-007 | Pagefind dark-theme contrast + label-title-only; both need CSS/JS overrides |
| P15 | confirmed | F-013, F-020, F-021 | h1→h3 skips on /tags/[tag], /projects, /posts/page/N |
| P16 | not-yet-applicable | (no finding) | `/accessibility` page not yet built; ships in PR 3.6 |
| P17 | not-yet-applicable | (no finding) | Schema.org accessibility metadata not yet added; ships in PR 3.6 alongside P16 |

All 17 P-items accounted for.

---

## Promised-but-unshipped reconcile (vs blog spec §3.7, §5.8, §6.6)

| Promise | Current state | Resolution |
|---|---|---|
| Skip link as first interactive element | Single skip link exists (`BaseLayout.astro:69`). Spec §3.7 says "skip link" (singular); spec §4 P14a upgrades this to two skip links. Single link is shipped; second link is not. | F-025; gate G5 in PR 3.5 |
| Landmarks: `<header>`, `<nav>`, `<main id="main">`, `<aside>`, `<footer>` | All present across templates. `<main id="main" tabindex="-1">` exists in `BaseLayout.astro`. `<nav class="site-nav">` in Header lacks `id="site-nav"` (needed for F-025 skip link). | Minor gap covered by F-025; gate G4 |
| Focus moved to `<main h1>` after `astro:after-swap` | `~/lib/nav.ts` announces route change via `#route-announce`; focus move to `main h1` after view transition is stated in §3.7 but not confirmed implemented in static review. Needs runtime verification. | Add to G5 keyboard-traversal smoke test (PR 2.5). |
| `aria-live` route announce | `<div id="route-announce" aria-live="polite" aria-atomic="true">` present in `BaseLayout.astro:75`; `~/lib/nav.ts` updates only on `astro:after-swap`. Verified clean. | Delivered. |
| Heading hierarchy validated by build-time check | Not implemented. `pnpm check` runs `astro check + biome + cspell + markdownlint` — none of these validate heading order. `scripts/assert-img-dims.ts` exists for image dimensions only. | Gate G3 (custom remark plugins) in PR 2.1; gate G4 (post-build HTML assertion) in PR 2.4 |
| Cover image alt schema-enforced | Zod schema in `src/content/config.ts` has `alt: z.string().min(1)` — enforced at build time. Delivered. | Delivered. |
| Inline image alt enforced by custom remark lint | Not implemented. `scripts/assert-img-dims.ts` checks dimensions only, not `alt` text. `src/lib/remark-a11y/` directory does not yet exist. | Gate G3 in PR 2.1 |
| Forced-colors mode (`@media (forced-colors: active)`) | Present in `global.css` with `CanvasText`/`Canvas`/`LinkText`. P8 verified clean — `currentColor` rules work correctly in forced-colors. | Delivered. |
| `prefers-reduced-motion: reduce` | Present; collapses animation durations to `0.01ms !important`. Header cursor blink confirmed clean. PostBodyReveal uses `scaledDuration()`. | Delivered. |
| `prefers-reduced-data: reduce` | PostBodyReveal gates animation on `data-firstPaint`. Cover hero drop documented. Delivered for existing use cases. | Delivered. |
| `pnpm a11y:check` (axe-core via `@axe-core/cli` on built `dist/`) | Script key exists in `package.json` per §6.2 listing, but Phase 1 audit ran via a transient script — the permanent `pnpm a11y:audit` integration (`@axe-core/playwright` against preview server) is Phase 2. Current `a11y:check` stub may not assert anything yet. | Gate G1 in PR 2.2; gate G2 in PR 2.3 |
| `pnpm lighthouse` (lhci collect against pnpm preview) | Script listed in §6.2. LHCI ran in Phase 1 against 5 routes. Permanent LHCI integration with per-URL floor not yet wired into CI (the `lighthouserc.cjs` assertion at `minScore: 1.00` from §5.8 is not enforced yet — homepage scores 0.92). | Gate G2 in PR 2.3 |
| CI job `a11y: axe-core against pnpm preview` | Listed in §6.6 CI/CD table. Not implemented in `.github/workflows/ci.yml` — CI currently runs typecheck, lint, build, link-check, size-check but no axe or Playwright step. | Gate G1 in PR 2.2 |
| Lighthouse CI: `categories:accessibility: ['error', { minScore: 1.00 }]` | Listed in §5.8. Currently homepage scores 0.92. The assertion is not enforced in CI (gate not wired). | Gate G2 in PR 2.3; lift to strict `1.0` in Phase 4 after fixes land |
| `<dialog>` for search palette and shortcuts overlay | Both dialogs use `<dialog>` element with `showModal()`. Focus trapping via native `<dialog>` semantics. Delivered at structural level; focus-restoration bugs addressed in F-008, F-009. | Structurally delivered; focus-restoration gap in F-008, F-009 |
| `aria-current="page"` on nav links | Present on nav links matching current route. Verified clean in static review. | Delivered. |
| AAA contrast for body text | `--fg` and `--fg-muted` tokens meet AAA in both themes per spec §3.2. `--fg-subtle` does not meet AAA (4.12:1 light, 4.7:1 dark) — spec §3.2 tags it as AA only. P7 targets AAA for body-equivalent muted/subtle text. | Gate G6 token-contrast unit tests in PR 2.1; P7 fix in PR 3.3 |
| Playwright keyboard-traversal smoke test | Not implemented. No Playwright project exists yet. | Gate G5 in PR 2.5 |

---

## Lighthouse reconcile note

Homepage (`/`) Lighthouse a11y = 0.92, failing on `color-contrast` and `target-size` — both captured as F-001/F-002 and F-006. All other audited routes (`/posts`, `/posts/hello-world`, `/about`, `/search`) score 1.0. Expanding LHCI to the full route matrix (G2) will surface any per-route regressions not yet covered.
