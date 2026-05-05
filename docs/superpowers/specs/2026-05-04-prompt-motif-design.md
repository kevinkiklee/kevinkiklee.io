# kevinkiklee.io — Prompt Motif & Surface Polish

**Author:** Kevin Lee
**Date:** 2026-05-04
**Status:** Approved (brainstorming complete)
**Builds on:** [`2026-04-30-aesthetics-improvement-design.md`](./2026-04-30-aesthetics-improvement-design.md)

> **Post-implementation amendment (2026-05-04):** §1.3 ("Home — Status line") was **removed** before merging the implementation PR. The status-line markup, the `.status` styles in `index.astro`, and the `SITE.nowStatus` field were all dropped. Reason: Kevin chose not to ship the placeholder copy and didn't want a feature whose value depended on a sentence he hadn't written yet. The rest of the spec (header brand, footer finisher, post eyebrow, meta rail) shipped as designed.

---

## Overview

Adds a single new visual motif — the **prompt rail** (`$ ` + blinking caret) — to the existing brutalist-terminal aesthetic, and refines the three surfaces that currently feel weakest: the **chrome** (header + footer), the **home page**, and the **post page**. The motif lives in two places only — the brand mark and the post-page eyebrow — so it carries identity without creeping into body content.

The work is style and small markup, scoped to existing components. No new dependencies, no schema changes, no new pages, no perf-budget impact.

## Goals

- **One coherent new motif** — the prompt rail reads as the site's signature device wherever it appears.
- **Lift the three weak surfaces** without redesigning them — home gets a status line, the post page gets an eyebrow + light meta rail, the chrome gets a finishing line in the footer.
- **Zero CWV regression** — LCP ≤ 1.5 s, INP ≤ 100 ms, CLS = 0 stay green.
- **No new font fetches** — caret renders as a CSS shape (an `inline-block` block element with `width`/`height`), not the `_` glyph, so the JetBrains Mono extended subset stays lazy.
- **No SEO/AEO regression** — eyebrow is decorative; the real `<h1>` text is unchanged.
- **Reduced-motion safe** — caret blink disables under `prefers-reduced-motion: reduce`.

## Non-Goals

- New pages, sections, or components.
- Re-styling body prose, code blocks, or the type scale.
- Replacing the H1 with the eyebrow (option 3 from brainstorming was rejected).
- Spreading the prompt motif to section titles, archive rows, or footer link list.
- Adding a full home-page masthead (option C from brainstorming was rejected).
- Changing the meta line into a full manpage spec sheet (option D was rejected; this spec uses a *light* dt/dl version).
- Touching theme behavior, motion durations, or animation easing.

---

## Decisions Log

| # | Decision | Rationale |
|---|---|---|
| P1 | **Prompt motif at "medium" intensity** | Header + post eyebrow only. Strong enough to read as identity; doesn't fight content. |
| P2 | **Brand mark: `$ KEVINKIKLEE.IO_`** — replace bars with prompt + caret | Two motifs (frame bars + caret) doing similar duty competes; replacing shifts identity from "framed wordmark" to "active session." |
| P3 | **Eyebrow on post pages: `$ cat <slug>.md`** above the real H1 | Gives the post page identity without sabotaging H1 hierarchy or AEO extraction. |
| P4 | **Caret blink: 1.1s, 2-step, CSS-shape block** | Renders as a CSS shape (not the `_` glyph), so the extended font subset stays lazy and the caret stays pixel-crisp. Matches existing terminal-prompt pattern noted in the original spec (§4.4). |
| P5 | **Home status line** with `// now` prefix and accent left rule | Single-sentence personal note; addresses "home jumps straight to latest" weakness without becoming a masthead. |
| P6 | **Post-page meta rail** — light dt/dl block (PUBLISHED / UPDATED / READ / TAGS) | Replaces the inline `date · 7 min · tags` line. Lighter than option D's manpage rail but more spec-sheet than today. |
| P7 | **Footer finisher: `$ exit` in accent** before the copyright | Closes the "session" framing started by the brand mark. |
| P8 | **`accent` token unchanged** | Reuses `--accent` (`#d44715` light / `#ff7849` dark). No new tokens. |
| P9 | **Eyebrow uses post `id` (slug) directly** | No new schema field. |

---

## 1. Surfaces & Changes

### 1.1 Chrome — Header brand mark

**File:** `src/components/Header.astro`

**Today:**
```html
<a class="brand is-caps">KEVINKIKLEE.IO</a>
```
with `::before` and `::after` pseudo-elements rendering the left and right bars.

**Proposed** — preserve all existing attributes (`href="/"`, `aria-label`, `view-transition-name` style); only the inner content and pseudo-elements change:
```html
<a href="/" class="brand is-caps" aria-label="kevinkiklee.io home" style="view-transition-name: site-brand; …">
  <span class="dol" aria-hidden="true">$</span>KEVINKIKLEE.IO<span class="cursor" aria-hidden="true"></span>
</a>
```

CSS changes:
- Remove `.brand::before` and `.brand::after` (the two bars).
- Add `.brand .dol`: `color: var(--accent)`, `margin-right: 0.45em`, `font-weight: 700`, `flex: 0 0 auto`.
- Add `.brand .cursor`: a CSS shape (not the `_` glyph) so the extended font subset stays lazy and the caret stays pixel-crisp — `display: inline-block`, `flex: 0 0 auto`, `width: 0.55em`, `height: 0.95em`, `background: currentColor`, `vertical-align: -0.1em`, `margin-left: 0.18em`.
- Animation: `@keyframes caret-blink { 50% { opacity: 0 } }` applied at `1.1s steps(2) infinite` on `.brand .cursor`. The existing global `prefers-reduced-motion: reduce` rule collapses animation duration to 0.01ms, so reduced-motion users see a steady caret with no extra wiring.
- Add `@media (forced-colors: active)` rule: caret `background: CanvasText`; animation disabled.

**Accessibility:**
- Both `dol` and `cursor` carry `aria-hidden="true"` so screen readers announce only "kevinkiklee dot io home."
- Existing `aria-label="kevinkiklee.io home"` on the anchor stays.
- View-transition name `site-brand` stays — the caret is visually inside the brand and rides the same transition.

### 1.2 Chrome — Footer finisher

**File:** `src/components/Footer.astro`

**Proposed:** Insert a small marker inside the existing copyright span (preserving the dynamic `{year}`):

```html
<span><span class="eof" aria-hidden="true">$ exit </span>© {year} Kevin Lee</span>
```

CSS:
- `.site-footer .eof`: `color: var(--accent)`, `margin-right: 0.5em`, `font-weight: 600`.
- `aria-hidden="true"` so it doesn't pollute the footer landmark for AT.
- No layout change — purely an additive prefix on the existing copyright span.

### 1.3 Home — Status line

**File:** `src/pages/index.astro` (inline; no new component).

**Markup**, placed above the existing `<SectionTitle id="latest" …>` on the home route only:
```astro
<p class="status">
  <span class="key" aria-hidden="true">// now</span>
  <span class="text">{SITE.nowStatus}</span>
</p>
```

CSS (scoped style block in `index.astro`):
- `.status`: `border-left: 2px solid var(--accent)`, `padding: var(--space-1) var(--space-3)`, `margin: 0 0 var(--space-6)`, `max-width: 60ch`, `font-family: var(--font-mono)`
- `.status .key`: `color: var(--fg-muted)`, `margin-right: var(--space-2)`, `font-size: var(--text-xs)`
- `.status .text`: `font-size: var(--text-sm)`, `line-height: 1.55`, `color: var(--fg)`

**Copy:** lives in `src/lib/site-config.ts` as a new `nowStatus: string` field so Kevin can update it without touching component code. **The initial value is a placeholder Kevin should rewrite before merge** — anything from the brainstorming mockup is illustrative, not factual.

**A11y:** plain `<p>` element — *not* an `<aside>` (the status line is an opening note, not tangential content; promoting it to a landmark would clutter the landmarks list for screen-reader users). The `// now` prefix is `aria-hidden` so AT users hear only the sentence.

### 1.4 Post page — Eyebrow

**File:** `src/layouts/PostLayout.astro`

**`PostLayout.astro` today already renders a similar element** above the H1:
```astro
<p class="url-prompt"><span aria-hidden="true">$</span> posts/{post.id}</p>
```

This eyebrow **replaces** that block — same purpose, different format. The new format reads as a shell session ("cat the file") rather than a URL hint, which is what the prompt motif is going for.

**Replacement markup:**
```astro
<p class="eyebrow" aria-hidden="true">
  <span class="dol">$</span> cat {post.id}.md
</p>
<h1>{title}</h1>
```

The associated `.url-prompt` styles in `PostLayout.astro` are removed in the same change.

CSS (note: `.eyebrow .dol` is a separate selector from `.brand .dol`; same name, same color rule, different parent context):
- `.eyebrow`: `font-size: var(--text-xs)`, `color: var(--fg-muted)`, `letter-spacing: 0.02em`, `margin-bottom: var(--space-2)`, `font-family: var(--font-mono)` (matches the chrome).
- `.eyebrow .dol`: `color: var(--accent)`, `margin-right: 0.35em`, `font-weight: 700`.

**A11y:** `aria-hidden="true"` on the whole eyebrow; the real `<h1>` is unchanged so AT users hear the actual title.

**Slug source:** `entry.id` from the existing post collection — already the canonical slug used in the URL. No new schema field.

**Long slugs:** `overflow-wrap: anywhere` (already a global rule on paragraphs) prevents horizontal scroll. No truncation; full slug stays visible.

### 1.5 Post page — Meta rail

**File:** `src/components/PostMeta.astro`

This is a refactor of the existing inline meta line into a 2-column dt/dl block, used only on the post page itself (PostCards on home/archive keep the inline meta line).

**Approach:** Add a `variant` prop to `PostMeta`:
- `variant="inline"` (default) — current behavior, used by `PostCard`.
- `variant="rail"` — new dt/dl block, used by `PostLayout`.

**Rail markup:**
```html
<dl class="meta meta-rail">
  <dt>Published</dt><dd><time datetime="…">2026-04-12</time></dd>
  <dt>Updated</dt><dd><time datetime="…">2026-04-29</time></dd>
  <dt>Read</dt><dd>7 min · 1,420 words</dd>
  <dt>Tags</dt><dd><TagPill /> <TagPill /></dd>
</dl>
```

CSS:
- `display: grid`, `grid-template-columns: max-content 1fr`, `gap: var(--space-1) var(--space-4)`
- `border-top: 1px solid var(--rule-soft)`, `border-bottom: 1px solid var(--rule-soft)`, `padding: var(--space-3) 0`, `margin: var(--space-3) 0 var(--space-6)`
- `dt`: `color: var(--fg-muted)`, `letter-spacing: 0.04em`, `font-size: var(--text-xs)`. **Mixed case**, not uppercase — the brainstorming mockup showed uppercase, but that contradicts decision A3 from the prior aesthetics spec ("caps reserved for chrome / signage / wordmark; meta is mixed case"). Source markup is already mixed case (`Published`, `Updated`, …); no `text-transform`.
- `dd`: `color: var(--fg)`, `font-size: var(--text-xs)`, `margin: 0`, `font-variant-numeric: tabular-nums slashed-zero`
- Tags `<dd>` uses `display: flex; flex-wrap: wrap; gap: var(--space-1)`
- Mobile (≤640px): media query collapses to single column — each `dt` renders above its `dd` (uses `display: block` on dt/dd inside the media query and adds a small `margin-top` on dt to keep rhythm).

**Word count:** already exposed end-to-end. `src/lib/reading-time.ts` writes `wordCount` into `remarkPluginFrontmatter`; `src/pages/posts/[...slug].astro` reads it and forwards to `PostLayout`; `PostLayout` already accepts the prop. The only missing link is forwarding it from `PostLayout` into the `<PostMeta variant="rail">` call.

---

## 2. Implementation Notes

### 2.1 Tokens

No new tokens. Reuses:
- `--accent`, `--accent-rule` (caret color, eyebrow `$`, status border, footer `$ exit`)
- `--fg-muted` (eyebrow body, status `// now`, dt labels)
- `--rule-soft` (meta-rail borders)
- `--space-*` (spacing scale)
- `--text-xs`, `--text-sm` (eyebrow, status, meta-rail)

### 2.2 Component touchpoints

| File | Change |
|---|---|
| `src/components/Header.astro` | Replace `::before/::after` bars with `.dol` + `.cursor`; add blink keyframe. |
| `src/components/Footer.astro` | Add `.eof` span before the copyright. |
| `src/pages/index.astro` | Inline status-line markup + scoped styles above the latest section. |
| `src/layouts/PostLayout.astro` | Replace existing `.url-prompt` block with eyebrow; switch `<PostMeta>` call to `variant="rail"` and pass `wordCount`; remove `.url-prompt` styles. |
| `src/components/PostMeta.astro` | Add `variant` prop and optional `wordCount`; new rail markup + styles. |
| `src/lib/site-config.ts` | Add `nowStatus: string` field with the initial placeholder copy. |

### 2.3 Reduced motion, forced colors, contrast

- Caret blink and eyebrow `$` color follow the same rules already wired into `tokens.css`:
  - `prefers-reduced-motion: reduce` → blink animation collapses (existing global rule already sets `animation-duration: 0.01ms`).
  - `forced-colors: active` → `--accent` becomes `LinkText` (existing rule); caret falls back to `CanvasText`; status left border uses `LinkText`.
  - `prefers-contrast: more` → `--accent` becomes `--fg` (existing rule); the prompt symbols still read because they're shape, not color.

### 2.4 SEO / AEO impact

- `<h1>` text is unchanged → no canonical/title regression.
- JSON-LD `BlogPosting.headline` continues to use `entry.data.title` — already the source.
- Eyebrow is `aria-hidden`, so AT users don't hear it. AEO crawlers that read rendered DOM text *will* extract the eyebrow string (e.g. `$ cat slug.md`) into the article body. This is acceptable: the `<h1>` and `<article>`/`mainEntityOfPage` are unchanged, and the eyebrow appears as an opening micro-label rather than competing with the headline. If extraction noise becomes a real issue we can move the eyebrow inside an `<aside>` to lift it out of the article element — out of scope for v1.
- Status line on home is decorative; doesn't change `WebSite` or `Blog` schema.
- Footer `$ exit` is `aria-hidden`; AT users hear `© {year} Kevin Lee` exactly as today.

### 2.5 Performance

- No new fonts: `_` glyph stays a CSS shape; `$` is ASCII (already in primary subset).
- Caret blink: single `opacity` keyframe, compositor-only, well under the 250ms-per-animation rule by being a sustained 1.1s loop on a tiny element.
- Status line + eyebrow + meta rail add ~0.6 KB of additional CSS (gzipped). Header bar removal recoups ~0.1 KB. Net well under the 20 KB CSS budget.
- No new JS.

---

## 3. What Does NOT Change

- Type scale, font stack, spacing scale.
- Theme tokens, theme toggle, light/dark behavior.
- View Transitions choreography or Speculation Rules.
- Body prose styles (`prose.css`), code blocks, link underlines.
- PostCard markup or hover behavior (the home post-list cards stay exactly as today; only the page-level surroundings change).
- Header nav, search trigger, theme toggle, mobile nav scroll-snap.
- Footer link list.
- All JSON-LD, sitemap, RSS, OG generation.
- Any test in `src/lib/*.test.ts` or `src/integrations/`.

---

## Appendix: Brainstorming references

- Motif options reviewed: prompt rail (chosen), box-drawing chrome, home masthead block, full manpage meta rail. See `.superpowers/brainstorm/17689-1777933977/content/motif-options.html`.
- Intensity levels reviewed: subtle / **medium (chosen)** / aggressive. See `prompt-intensity.html`.
- Brand reconciliation reviewed: **replace bars (chosen)** / keep both / asymmetric. See `brand-mark.html`.
- Final mockup reviewed: home + post page + dark-theme header. See `full-mockup.html`. User approved with "ship it."
