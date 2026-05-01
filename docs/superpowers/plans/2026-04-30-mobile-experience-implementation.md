# Mobile Experience Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the eight-section mobile UX overhaul from [`2026-04-30-mobile-experience-design.md`](../specs/2026-04-30-mobile-experience-design.md) — long-form reading polish + light platform polish, brutalist aesthetic preserved, ≤ 650 b new JS, zero new dependencies.

**Architecture:** Pure-CSS where possible (Sections 1, 4, 5, 6, 7.3); small colocated TypeScript for the two interactive bits (Section 2 reading progress, Section 3 TOC scrollspy). Each phase is its own PR with a real-device verification step. Astro 5 + MDX content layer; Vercel static deploy; no SSR routes added.

**Tech Stack:** Astro 5, TypeScript (strict, `verbatimModuleSyntax`, `exactOptionalPropertyTypes`), pnpm 9, Vitest, Biome, Pagefind, Shiki dual-theme. Existing `<ClientRouter />` view transitions, `transition:persist`, `astro:page-load` / `astro:after-swap` lifecycle.

**Pre-existing state discovered during planning** (do not re-implement):
- Font preload (`BaseLayout.astro:33`) ✓
- `<html lang="en">` (`BaseLayout.astro:30`) ✓
- `theme-color` media variants (`BaseLayout.astro:35-36`) ✓
- Theme-color JS sync via `updateThemeColorMeta()` (`lib/theme.ts:13,16-19`) ✓
- Favicon set: SVG, 32px, 192px, 512px PNG, 192px apple-touch-icon (`BaseHead.astro:72-76`) ✓
- ThemeToggle 44×44 hit (`ThemeToggle.astro:20-21`) ✓
- CSP allows `webmention.io`, `*.gravatar.com`, `avatars.githubusercontent.com` (`lib/csp.ts:30-39,42-51`) ✓
- Webmentions are **build-time fetched** (`Webmentions.astro:9` + `lib/webmentions.ts`) — no client-side fetch, no preconnect needed ✓

---

## Phase / PR map

| Phase | Spec sections | Risk | Touches |
|---|---|---|---|
| 1 | 5 (platform polish completion) | Low (additions only) | `BaseHead.astro`, `BaseLayout.astro`, manifest, icons |
| 2 | 1, 8.6 (typography + PostCard rebalance) | Low (theme tokens) | `tokens.css`, `prose.css`, `PostCard.astro` |
| 3 | 4 (code-block polish) | Low (CSS + 1 attr) | `code.css`, `CopyButton.astro` |
| 4 | 6 (header/nav/tap-target) | Medium (live audit) | `Header.astro`, `search.astro`, audit components |
| 5 | 7.2, 7.3, 7.6 (image pipeline, anchor scroll, head order) | Low | `tokens.css`, `global.css`, `astro.config.ts`, `BaseHead.astro` |
| 6 | 2 (reading progress) | Medium (new JS) | `PostLayout.astro`, `progress.css`, fallback script |
| 7 | 3 (TOC + scrollspy + Speakable) | Medium (new JS) | `TableOfContents.astro`, `PostLayout.astro`, `schema.ts` |
| 8 | 8.1–8.5, 8.7 (below-the-fold composition) | Low (cosmetic) | `PostLayout.astro`, `Webmentions.astro`, `DiscussFooter.astro`, `Footer.astro` |

Each phase is one PR. Verification step (`pnpm check`, `pnpm test`, real-device walk) ends every phase.

---

## Phase 1 — Platform polish completion

**Files:**
- Modify: `src/components/BaseHead.astro` (viewport meta line 38, add `apple-mobile-web-app-title` and `manifest`)
- Modify: `src/layouts/BaseLayout.astro:30` (add `dir="ltr"`)
- Modify: `src/lib/csp.ts` (explicit `manifest-src 'self'`)
- Create: `public/manifest.webmanifest`
- Create: `public/icon-maskable.png` (512×512, content within central 80% safe zone)
- (Optional) Create: `public/apple-touch-icon.png` (180×180) — current 192×192 works, but Apple convention prefers 180×180

### Task 1.1: Update viewport meta to engage safe-area insets

- [ ] **Step 1: Modify `src/components/BaseHead.astro:38`**

```astro
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

(was: `<meta name="viewport" content="width=device-width, initial-scale=1" />`)

This unlocks the existing `env(safe-area-inset-*)` rules in `src/styles/global.css:166-170` on iPhone, which were dead code without `viewport-fit=cover`.

- [ ] **Step 2: Verify `<html dir="ltr">` add**

Modify `src/layouts/BaseLayout.astro:30`:

```astro
<html lang="en" dir="ltr">
```

(was: `<html lang="en">`)

### Task 1.2: Add iOS home-screen title and manifest link

- [ ] **Step 1: Append to `src/components/BaseHead.astro` (after line 76, before the existing preload-image block)**

```astro
<meta name="apple-mobile-web-app-title" content="kevinkiklee" />
<link rel="manifest" href="/manifest.webmanifest" />
```

### Task 1.3: Author the web manifest

- [ ] **Step 1: Create `public/manifest.webmanifest`**

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
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

(Reuses existing `favicon-192.png` and `favicon-512.png` from `public/`. Only `icon-maskable.png` is new.)

### Task 1.4: Generate maskable icon

- [ ] **Step 1: Generate `public/icon-maskable.png`**

A maskable icon needs the actual content/glyph within the central 80% (the "safe zone" — Android adaptive icon launchers crop the outer 20%). Generate from the existing `public/favicon.svg` source by:

1. Open the SVG.
2. Place it in a 512×512 canvas with the visual content centered and scaled to fit within a 410×410 inner box (80% of 512).
3. Fill the outer area with the background color `#f5f4ee` (light theme bg) for graceful cropping.
4. Export as PNG.

If a build script doesn't exist for this, either generate manually with an image tool (Figma, Sketch, ImageMagick) or add a one-time `scripts/generate-icons.ts` script. Defer the script approach unless this needs to repeat.

- [ ] **Step 2: Verify the file exists and is readable**

```bash
ls -la public/icon-maskable.png
file public/icon-maskable.png
```

Expected: `PNG image data, 512 x 512`.

### Task 1.5: Add explicit `manifest-src` to CSP

- [ ] **Step 1: Modify `src/lib/csp.ts`**

After line 39 (closing the `img-src` directive's `].join(' '),`), insert:

```ts
  // Web app manifest fetched on every page load by Chrome.
  "manifest-src 'self'",
```

The `default-src 'self'` floor already covers manifest fetches, but explicit is better for grep + audit clarity.

- [ ] **Step 2: Run CSP tests**

```bash
pnpm test src/lib/csp.test.ts
```

Expected: all tests pass. If a test asserts the directive list is exhaustive, update the expected list to include `manifest-src`.

### Task 1.6: Verify and commit

- [ ] **Step 1: Run full check**

```bash
pnpm check
pnpm test
```

Both must pass.

- [ ] **Step 2: Build and preview**

```bash
pnpm build
pnpm preview
```

Open `http://localhost:4321/` in Chrome DevTools mobile emulation (iPhone 16 Pro, Pixel 8). Verify:
- DevTools Lighthouse mobile audit "Installable" check passes (manifest + icons valid).
- DevTools "Application" → "Manifest" panel shows the parsed manifest with no errors.
- Address-bar color tracks theme toggle.
- Safe-area inset CSS engages (test by enabling DevTools "Show device frame" with iPhone notch — left/right padding under the notch should reflect `env(safe-area-inset-*)`).

- [ ] **Step 3: Commit**

```bash
git add public/manifest.webmanifest public/icon-maskable.png \
        src/components/BaseHead.astro src/layouts/BaseLayout.astro \
        src/lib/csp.ts src/lib/csp.test.ts
git commit -m "feat(platform): web manifest, viewport-fit=cover, safe-area unlock"
```

---

## Phase 2 — Typography & PostCard rebalance

**Files:**
- Modify: `src/styles/tokens.css` (line 5–10: text size scale; add `--header-h-mobile` / `--header-h-desktop`)
- Modify: `src/styles/prose.css` (mobile spacing override; hyphens on `.prose p, .prose li`)
- Modify: `src/components/PostCard.astro` (mobile padding + description line-clamp)

### Task 2.1: Update modular type scale

- [ ] **Step 1: Modify `src/styles/tokens.css:5-10`**

Replace the current scale:

```css
--text-xs: clamp(0.72rem, 0.70rem + 0.10vw, 0.78rem);
--text-sm: clamp(0.82rem, 0.80rem + 0.13vw, 0.90rem);
--text-base: clamp(0.95rem, 0.92rem + 0.18vw, 1.05rem);
--text-lg: clamp(1.10rem, 1.05rem + 0.25vw, 1.25rem);
--text-xl: clamp(1.40rem, 1.30rem + 0.50vw, 1.75rem);
--text-2xl: clamp(1.80rem, 1.60rem + 1.0vw, 2.50rem);
```

with:

```css
--text-xs: clamp(0.78rem, 0.75rem + 0.12vw, 0.83rem);
--text-sm: clamp(0.92rem, 0.88rem + 0.18vw, 1.00rem);
--text-base: clamp(1.0625rem, 1rem + 0.4vw, 1.125rem);
--text-lg: clamp(1.20rem, 1.13rem + 0.35vw, 1.375rem);
--text-xl: clamp(1.50rem, 1.40rem + 0.60vw, 1.875rem);
--text-2xl: clamp(1.90rem, 1.70rem + 1.05vw, 2.625rem);
```

Body floor: 17px (1.0625rem). Body ceiling: 18px (1.125rem). Other sizes adjusted proportionally to keep the modular scale ratio (~1.13) coherent.

### Task 2.2: Add header height variables (used by Phase 5 + spec Section 7.3)

- [ ] **Step 1: Append to `src/styles/tokens.css` `:root` block (after line 25)**

```css
  --header-h-mobile: 96px;
  --header-h-desktop: 80px;
```

### Task 2.3: Tighten mobile prose vertical rhythm + scope hyphenation

- [ ] **Step 1: Append to `src/styles/prose.css` (inside the `@layer prose` block, before the closing brace at line 44)**

```css
  /* Mobile: tighter paragraph rhythm to compensate for the bumped body type. */
  @media (max-width: 640px) {
    .prose > * + * { margin-top: var(--space-4); }
  }

  /* Hyphenate body copy only — never headings (would fight `text-wrap: balance`). */
  .prose p,
  .prose li {
    hyphens: auto;
    -webkit-hyphens: auto;
  }
```

### Task 2.4: PostCard mobile rebalance

- [ ] **Step 1: Modify `src/components/PostCard.astro` style block (lines 53–85)**

Replace the existing styles with:

```css
.post-card {
  border-top: 1px solid var(--rule-soft);
  padding: var(--space-5) 0;
  container-type: inline-size;
  content-visibility: auto;
  contain-intrinsic-size: 1px 200px;
  contain: layout paint;
}
.post-card a { display: block; }
.post-card h3 {
  font-size: var(--text-lg);
  letter-spacing: 0.02em;
  margin-bottom: var(--space-2);
  transition: color 180ms var(--ease);
}
.post-card p {
  margin-top: var(--space-3);
  color: var(--fg-muted);
  max-width: var(--measure);
}
.post-card .cta {
  display: inline-block;
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--fg-subtle);
  transition: transform 180ms var(--ease), color 180ms var(--ease);
}
@media (hover: hover) and (pointer: fine) {
  .post-card:hover { border-top-color: var(--rule); }
  .post-card:hover .cta { color: var(--fg); transform: translateX(4px); }
}
@media (max-width: 640px) {
  .post-card { padding: var(--space-4) 0; }
  .post-card p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

The two added blocks at the end: mobile padding tightening and 2-line description clamp. Everything else preserved verbatim.

### Task 2.5: Verify and commit

- [ ] **Step 1: Build and preview**

```bash
pnpm check
pnpm build
pnpm preview
```

- [ ] **Step 2: Real-device verification**

Open the preview URL on iPhone 16 Pro Safari and Pixel 8 Chrome (or DevTools emulator). Routes: `/`, `/posts`, a post page. Check:
- Body text reads as ≥17px on phone (visually larger than current).
- PostCard descriptions clamp to 2 lines on mobile.
- ~5 PostCards still fit in the first viewport on iPhone 16 Pro.
- No CLS, no font-swap shift (font metrics already proportional).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css src/styles/prose.css src/components/PostCard.astro
git commit -m "feat(typography): bump body to 17/18px, tighten mobile rhythm, clamp PostCard descriptions"
```

---

## Phase 3 — Code-block polish

**Files:**
- Modify: `src/styles/code.css` (extensive)
- Modify: `src/components/CopyButton.astro` (add `aria-live` + role)

### Task 3.1: Code-block CSS overhaul

- [ ] **Step 1: Replace contents of `src/styles/code.css`**

```css
@layer prose {
  /*
   * Code-specific rules — extracted from prose.css so syntax highlighting
   * (Shiki) and the copy-button affordance live in one place.
   *
   * Loaded under the `prose` cascade layer so author-defined component
   * styles (`@layer components`) win, but utilities / themes can still
   * tweak per-token colours.
   */
  .prose code {
    background: var(--code-bg);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 0.92em;
  }
  .prose pre {
    position: relative;
    background: var(--code-bg);
    padding: var(--space-4);
    overflow-x: auto;
    border: 1px solid var(--rule-soft);
    line-height: 1.55;
    /* Inset shadow on right edge fades scroll boundary without clipping
       absolutely-positioned children (copy button stays opaque). */
    box-shadow: inset -8px 0 8px -8px var(--rule);
  }
  .prose pre code {
    background: transparent;
    padding: 0;
  }

  /* Language label — Shiki emits `data-language` on <pre> via Astro's
     built-in markdown integration. */
  .prose pre[data-language] {
    padding-top: var(--space-5);
  }
  .prose pre[data-language]::before {
    content: attr(data-language);
    position: absolute;
    top: var(--space-2);
    left: var(--space-3);
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
    color: var(--fg-subtle);
    text-transform: uppercase;
    pointer-events: none;
  }

  /* Inline-code wrap protection: long identifiers / URLs in <p>/<li>
     should never cause horizontal page scroll on phones. */
  .prose :not(pre) > code {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .copy-btn {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    background: var(--bg);
    border: 1px solid var(--rule-soft);
    color: var(--fg-muted);
    font: inherit;
    font-size: var(--text-xs);
    padding: 2px 6px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 180ms var(--ease);
  }
  @media (hover: hover) {
    .prose pre:hover .copy-btn { opacity: 1; }
  }
  @media (hover: none) {
    .copy-btn { opacity: 1; }
  }

  /* Mobile: shrink code to keep ~50ch per line under the bumped body type;
     preserve tap target via invisible ::before expander to 44×44. */
  @media (max-width: 640px) {
    .prose pre,
    .prose pre code { font-size: 0.875em; }
    .copy-btn {
      min-height: 36px;
      padding: var(--space-2) var(--space-3);
    }
    .copy-btn::before {
      content: "";
      position: absolute;
      inset: -4px;
    }
  }

  /* Forced-colors mode — drop the inset shadow so the system contrast wins. */
  @media (forced-colors: active) {
    .prose pre { box-shadow: none; }
  }

  /*
   * Shiki dual-theme: Astro emits both --shiki-light and --shiki-dark CSS
   * variables per token when configured with `themes: { light, dark }`.
   * Light is the default; toggle to dark by overriding to --shiki-dark.
   */
  html[data-theme="dark"] .astro-code,
  html[data-theme="dark"] .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
  }
}
```

### Task 3.2: CopyButton aria-live announcement

- [ ] **Step 1: Modify `src/components/CopyButton.astro:18-22`**

The button is created in JS. After `btn.setAttribute('aria-label', 'Copy code');` (line 22), add:

```ts
btn.setAttribute('aria-live', 'polite');
```

Edit-tool old/new strings:

old:
```ts
      btn.setAttribute('aria-label', 'Copy code');
      // Track the in-flight reset timer so spam-clicks don't pile up
```

new:
```ts
      btn.setAttribute('aria-label', 'Copy code');
      btn.setAttribute('aria-live', 'polite');
      // Track the in-flight reset timer so spam-clicks don't pile up
```

The button's `textContent` flips between `copy` / `copied` / `error`. With `aria-live="polite"`, screen readers announce each change.

### Task 3.3: Verify Shiki emits `data-language`

- [ ] **Step 1: Inspect a built post**

```bash
pnpm build
grep -m 1 'data-language' dist/posts/*/index.html | head -3
```

Expected: at least one match showing `<pre class="astro-code ..." data-language="typescript">` (or similar). If no match, the markdown integration's Shiki wrapper isn't emitting the attribute — check `astro.config.ts` `markdown.shikiConfig` and add `defaultColor: false` or a custom transformer that copies `lang` to `data-language`. Astro 5's default behavior emits the attribute; treat absence as a regression.

### Task 3.4: Verify and commit

- [ ] **Step 1: Run check + build + preview**

```bash
pnpm check
pnpm build
pnpm preview
```

- [ ] **Step 2: Real-device verification**

Open a post with code blocks on phone. Verify:
- Language label visible top-left of each code block.
- Inset shadow on right edge of long code blocks (visually fades to bg).
- Copy button visible on touch (always opaque).
- Tap copy button — feedback within 200ms (visual + announced via SR if enabled).
- Inline `<code>` in paragraphs wraps; never causes horizontal page scroll.

- [ ] **Step 3: Commit**

```bash
git add src/styles/code.css src/components/CopyButton.astro
git commit -m "feat(code): language label, inset-shadow overflow fade, mobile font + tap"
```

---

## Phase 4 — Header / nav comfort + tap-target audit

**Files:**
- Modify: `src/components/Header.astro` (style block: padding tightening + nav mask)
- Modify: `src/pages/search.astro` (preload Pagefind UI, ensure no autofocus)
- Audit (likely no changes, verify only): `src/components/PostMeta.astro`, `src/components/TagPill.astro`, `src/components/DiscussFooter.astro`, `src/components/RelatedPosts.astro`, `src/components/Footer.astro`, `src/components/Webmentions.astro`, `src/pages/404.astro`, `src/components/ThemeToggle.astro`

### Task 4.1: Tighten header padding on mobile

- [ ] **Step 1: Modify `src/components/Header.astro:85-101` (the `@media (max-width: 640px)` block)**

old:
```css
  @media (max-width: 640px) {
    .row { gap: var(--space-3); justify-content: flex-start; }
    nav {
      order: 3;
      width: 100%;
      overflow-x: auto;
      /* iOS momentum scroll for the horizontal nav strip. */
      -webkit-overflow-scrolling: touch;
    }
    nav ul {
      gap: var(--space-4);
      /* Snap to the start of each nav item so users land on whole labels
         when fling-scrolling, not mid-word. */
      scroll-snap-type: x proximity;
    }
    nav li { scroll-snap-align: start; }
  }
```

new:
```css
  @media (max-width: 640px) {
    .site-header { padding: var(--space-3) var(--space-5); }
    .row { gap: var(--space-3); justify-content: flex-start; }
    nav {
      order: 3;
      width: 100%;
      overflow-x: auto;
      /* iOS momentum scroll for the horizontal nav strip. */
      -webkit-overflow-scrolling: touch;
      /* Right-edge fade to telegraph "more nav off-screen". Nav has no
         absolutely-positioned children, so the mask doesn't clip anything
         visible. Always-on (last 24px) so it reads as intentional even
         when fully scrolled. */
      mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
      -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
    }
    nav ul {
      gap: var(--space-4);
      /* Snap to the start of each nav item so users land on whole labels
         when fling-scrolling, not mid-word. */
      scroll-snap-type: x proximity;
    }
    nav li { scroll-snap-align: start; }
  }

  @media (forced-colors: active) {
    nav { mask: none; -webkit-mask: none; }
  }
```

### Task 4.2: /search route polish — preload UI, drop any autofocus

- [ ] **Step 1: Modify `src/pages/search.astro` head injection**

Search.astro is wrapped in BaseLayout, which renders BaseHead. To inject a route-specific preload, use a named slot. After line 11 (`---`), the file has its `<BaseLayout ...>`. Add `slot="head"` content:

old:
```astro
<BaseLayout title="Search · kevinkiklee.io" description="Search the archive.">
  <h1 class="page-title">{'// SEARCH'}</h1>
```

new:
```astro
<BaseLayout title="Search · kevinkiklee.io" description="Search the archive.">
  <Fragment slot="head">
    <link rel="preload" as="script" href="/pagefind/pagefind-ui.js" />
    <link rel="preload" as="style" href="/pagefind/pagefind-ui.css" />
  </Fragment>
  <h1 class="page-title">{'// SEARCH'}</h1>
```

This warms the Pagefind UI assets while the user is reading the route, saving 300–500ms on phone. The existing lazy-mount logic still controls when the UI initializes; preload merely populates the cache.

- [ ] **Step 2: Verify there's no `autofocus` on the bootstrap input**

Read `src/pages/search.astro:20-29`. The current markup has no `autofocus`. **No change needed** — but if a future edit adds it, reject in PR review per spec rationale (Section 6.3).

### Task 4.3: Tap-target audit pass

This is verification, not blanket modification. Open each component, measure click area on mobile (DevTools → Inspect → click target box). Spec requires ≥44×44 hit; visual size can be smaller via invisible expander.

- [ ] **Step 1: Audit `ThemeToggle.astro`**

Already 44×44 per existing CSS (`min-width: 44px; min-height: 44px`). ✓ Skip.

- [ ] **Step 2: Audit `PostMeta.astro` interactive children**

The component (`PostMeta.astro:13-22`) renders `<time>` (non-interactive) and `<TagPill>` (delegated). The component itself has no interactive elements outside delegated children — pass.

- [ ] **Step 3: Audit `TagPill.astro`**

Visual: `padding: var(--space-2) var(--space-3)` = 8×12px → ~32×56px visual. Has `min-height: 32px`. **Hit area is ≤32px tall — fails 44px floor.** Fix:

Modify `src/components/TagPill.astro:23-37`:

old:
```css
  .pill {
    background: var(--pill-bg);
    color: var(--pill-fg);
    /* Visually compact, but expand the hit area for touch accuracy. The
       negative margin keeps the visual rhythm of the meta line intact. */
    padding: var(--space-2) var(--space-3);
    margin: -2px;
    display: inline-block;
    min-height: 32px;
    line-height: 1.4;
    text-decoration: none;
    transition:
      background-color 180ms var(--ease),
      color 180ms var(--ease);
  }
```

new:
```css
  .pill {
    background: var(--pill-bg);
    color: var(--pill-fg);
    /* Visually compact, but expand the hit area for touch accuracy via
       an invisible ::before expander. Keeps the visual rhythm intact. */
    padding: var(--space-2) var(--space-3);
    margin: -2px;
    display: inline-block;
    min-height: 32px;
    line-height: 1.4;
    text-decoration: none;
    position: relative;
    transition:
      background-color 180ms var(--ease),
      color 180ms var(--ease);
  }
  a.pill::before {
    content: "";
    position: absolute;
    inset: -6px -2px;
  }
```

The expander only applies to `a.pill` (interactive variant) — `span.pill` (non-interactive label) doesn't need it. `inset: -6px -2px` extends the hit area to ~44×60px while keeping visual rhythm.

- [ ] **Step 4: Audit `DiscussFooter.astro`**

`.links li { padding: var(--space-2) 0; }` (`DiscussFooter.astro:44`) — vertical padding 8px on each link. Combined with line-height ≈22px in the bumped scale, link container is ~38px tall. **Just below 44.** Fix:

Modify `src/components/DiscussFooter.astro:44`:

old:
```css
  .links li { padding: var(--space-2) 0; }
```

new:
```css
  .links li { padding: var(--space-3) 0; }
```

Bumps padding to 12px each side → ~46px tall total. ✓

- [ ] **Step 5: Audit `RelatedPosts.astro`**

`.related li { padding: var(--space-3); }` (`RelatedPosts.astro:46`) — 12px all around. Whole card is the link target via `<a>` wrapping the `<h3>` and `<p>` — total card height comfortably exceeds 44px. ✓ Skip.

- [ ] **Step 6: Audit `Webmentions.astro`**

Each reply `li` has `padding: var(--space-3) 0` (12px vertical). Combined with content (name + time + paragraph), ≥44px tall. The two `<a>` tags inside (author and permalink) inherit the line height of bumped `--text-base` ≈ 28px. **Both author and permalink links could be sub-44px tall in isolation.** Fix:

Modify `src/components/Webmentions.astro:51-57`:

old:
```css
  li {
    padding: var(--space-3) 0;
    border-top: 1px solid var(--rule-soft);
  }
  li p {
    margin-top: var(--space-2);
    color: var(--fg-muted);
  }
```

new:
```css
  li {
    padding: var(--space-3) 0;
    border-top: 1px solid var(--rule-soft);
  }
  li > a {
    display: inline-block;
    min-height: 44px;
    line-height: 44px;
    padding-right: var(--space-2);
  }
  li p {
    margin-top: var(--space-2);
    color: var(--fg-muted);
  }
```

Ensures the inline author and permalink anchors meet 44px minimum — the inline-block + min-height pattern keeps them inline within the meta line.

- [ ] **Step 7: Audit `Footer.astro`**

`.site-footer ul { gap: var(--space-4); }` (`Footer.astro:30`) and the links have no explicit padding. With `--text-xs` (~13px) and line-height 1.5, links are ~20px tall. **Sub-44.** Fix:

Modify `src/components/Footer.astro:31`:

old:
```css
  .site-footer a { color: var(--fg-muted); transition: color 180ms var(--ease); }
```

new:
```css
  .site-footer a {
    color: var(--fg-muted);
    transition: color 180ms var(--ease);
    display: inline-block;
    min-height: 44px;
    line-height: 44px;
  }
```

- [ ] **Step 8: Audit `404.astro`**

Read `src/pages/404.astro` (file not previously inspected; expected to have a "← back to home" link). If the link doesn't already pass 44px hit, add `display: inline-block; min-height: 44px; line-height: 44px;` to its rule.

If the file styles the home link inline, locate the rule and apply the same pattern. If the link is plain (no class), wrap it: `<a class="home-link">...</a>` and style `.home-link`.

### Task 4.4: Verify and commit

- [ ] **Step 1: Run check + build + preview**

```bash
pnpm check
pnpm build
pnpm preview
```

- [ ] **Step 2: Real-device verification**

Open every route on iPhone 16 Pro + Pixel 8 (DevTools mobile emulation acceptable for first pass; real device before merge).
- Header is ~95px tall on mobile.
- Right edge of nav fades when more items extend off-screen.
- Tap every interactive element with a finger; none feels small.
- `/search` route loads Pagefind UI noticeably faster than before.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro src/pages/search.astro \
        src/components/TagPill.astro src/components/DiscussFooter.astro \
        src/components/Webmentions.astro src/components/Footer.astro \
        src/pages/404.astro
git commit -m "feat(mobile): header chrome, nav edge-fade, /search preload, tap-target audit"
```

---

## Phase 5 — Anchor scroll alignment + image pipeline + head ordering

**Files:**
- Modify: `src/styles/global.css` (`scroll-padding-top` rule)
- Modify: `src/components/BaseHead.astro` (head reorder)
- Modify: `src/layouts/BaseLayout.astro` (move font preload up)
- Modify: `astro.config.ts` (verify image pipeline routes MDX images)
- Possibly modify: `src/lib/posts.ts` or a remark plugin to assert image dimensions

### Task 5.1: Anchor scroll alignment

- [ ] **Step 1: Modify `src/styles/global.css:66`**

old:
```css
    /* Anchor jumps shouldn't tuck content under the sticky header. */
    scroll-padding-top: calc(var(--space-7) + var(--space-3));
```

new:
```css
    /* Anchor jumps shouldn't tuck content under the sticky header.
       Header heights live in tokens.css for one-place adjustment. */
    scroll-padding-top: var(--header-h-mobile);
```

- [ ] **Step 2: Add desktop variant. After line 67, before `}` closing the html block, add a media query (or move it to a separate rule outside the html block):**

The existing `html` block at `global.css:56-67` only sets one `scroll-padding-top`. Append after the closing `}` of `html`:

```css
  @media (min-width: 1024px) {
    html { scroll-padding-top: var(--header-h-desktop); }
  }
```

### Task 5.2: Reorder BaseHead for parser performance

- [ ] **Step 1: Move font preload from BaseLayout into BaseHead's head order**

BaseLayout currently has the font preload at line 33, but it sits after `<BaseHead>`. The optimal position is after viewport meta and before title/description.

In `src/layouts/BaseLayout.astro:33`, **remove** the line:

```astro
<link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin />
```

Then in `src/components/BaseHead.astro`, after the viewport meta (line 38, which we updated in Phase 1), insert:

old:
```astro
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>{finalTitle}</title>
```

new:
```astro
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

<!-- Critical preloads (early in <head> for browser preload scanner). -->
<link rel="preload" as="font" type="font/woff2" href="/fonts/jetbrains-mono.woff2" crossorigin />

<title>{finalTitle}</title>
```

- [ ] **Step 2: Verify head ordering after build**

```bash
pnpm build
sed -n '1,60p' dist/index.html
```

Confirm order: charset → viewport → font preload → theme-color → title → description → canonical → og/twitter → article meta → favicons → manifest → conditional LCP image preload.

If `meta name="theme-color"` is now after font preload (which is the correct sequence — theme-color is render-config, font preload is critical resource), good. If theme-color is in BaseLayout but the font preload moved to BaseHead, the relative order matters for paint scheduling. Visually inspect the head to confirm.

### Task 5.3: Image pipeline verification

Astro 5's MDX integration should auto-route relative `![alt](./img.png)` images through `astro:assets`. Verify against the live config.

- [ ] **Step 1: Check astro.config.ts MDX setup**

Open `astro.config.ts:118-119` (`integrations: [ mdx(), ... ]`). The default `mdx()` integration uses Astro's content layer, which auto-optimizes relative-path images via the `astro:assets` pipeline.

Verify with a sample post:

```bash
grep -rn 'src="/_astro/' dist/posts/*/index.html | head -3
```

Expected: relative-path MDX images are emitted as `<img src="/_astro/...">` (the optimized output). If they're not (e.g., they appear as `<img src="./image.png">` raw), the pipeline isn't active for inline images and needs explicit configuration. As of Astro 5.0+, default behavior covers this — only fix if the grep shows raw paths.

- [ ] **Step 2: Add a build-time assertion for img dimensions**

Add a remark/rehype plugin that walks the AST and fails the build if any `<img>` lacks `width` and `height` attributes. Astro's image pipeline sets these automatically; this assertion catches author mistakes (e.g., bare `<img>` in MDX).

Create `src/lib/assert-img-dims.ts`:

```ts
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: fail the build if any <img> lacks width and height attrs.
 * Catches MDX-author mistakes that would cause CLS in production.
 */
export const rehypeAssertImgDims: Plugin<[], Root> = () => {
  return (tree, file) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;
      const props = node.properties ?? {};
      if (!props.width || !props.height) {
        const src = props.src ?? '<no src>';
        throw new Error(
          `[mobile-experience] <img src="${src}"> is missing width/height — would cause CLS. ` +
          `In MDX, use \`![alt](./relative-path.png)\` so Astro's image pipeline sets dims, ` +
          `or pass explicit width/height props to a manual <img>.\nFile: ${file.path ?? '<unknown>'}`,
        );
      }
    });
  };
};
```

Wire it into `astro.config.ts:89-95`:

old:
```ts
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      wrap: true,
    },
  },
```

new:
```ts
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [rehypeAssertImgDims],
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      wrap: true,
    },
  },
```

Add the import at the top of `astro.config.ts`:

```ts
import { rehypeAssertImgDims } from './src/lib/assert-img-dims';
```

- [ ] **Step 3: Verify the assertion doesn't false-positive on existing posts**

```bash
pnpm build
```

Expected: build completes successfully (existing post `2026-04-12-hello-world.mdx` and the others either don't have `<img>` or all images have dims via the pipeline). If it fails, the offending image is either a bare `<img>` HTML element in an MDX file or an unprocessed pipeline path — fix the post.

### Task 5.4: Document hero image authoring guidance

- [ ] **Step 1: Append to `AUTHORING.md`**

Add a section (location: after the existing tags/cover guidance):

```markdown
## Image performance

- **Cover hero**: use the `cover:` frontmatter field. Astro generates an
  AVIF + WebP preload pair with `fetchpriority="high"` automatically.
- **First inline image** in a short post: if the image will appear in the
  first viewport on mobile (i.e. before the reader scrolls), it can become
  the LCP candidate. Override the default `loading="lazy"` by writing the
  image as a manual `<Image src={...} alt="..." loading="eager" />` instead
  of `![alt](./path.png)`.
- **Other inline images**: write as `![alt](./relative-path.png)`.
  The MDX pipeline sets `loading="lazy"`, `decoding="async"`, and width /
  height automatically.
- A build-time assertion fails the build if any `<img>` lacks dimensions
  — see `src/lib/assert-img-dims.ts`.
```

### Task 5.5: Verify and commit

- [ ] **Step 1: Run full check**

```bash
pnpm check
pnpm test
pnpm build
```

All must pass. Note any LCP improvements visible in build output (`stats.html`).

- [ ] **Step 2: Real-device verification**

- TOC anchor click on mobile lands the heading at the correct y-offset (not tucked under header).
- Lighthouse mobile: confirm LCP is unchanged or improved (font preload + head reorder).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css src/components/BaseHead.astro \
        src/layouts/BaseLayout.astro astro.config.ts \
        src/lib/assert-img-dims.ts AUTHORING.md
git commit -m "perf(head): reorder, anchor scroll alignment, MDX img dimension assertion"
```

---

## Phase 6 — Reading progress (header underline)

**Files:**
- Create: `src/styles/progress.css` (or fold into `global.css`)
- Modify: `src/styles/global.css` (import the new layer file if separate)
- Modify: `src/layouts/PostLayout.astro` (set `data-progress` on body, mount fallback script)
- Create: `src/lib/reading-progress-fallback.ts` (~150 b minified after gzip)

### Task 6.1: Reading-progress CSS

- [ ] **Step 1: Create `src/styles/progress.css`**

```css
@layer components {
  /*
   * Reading progress indicator: replaces the static header underline on
   * post pages. Animates 0% → 100% as the reader progresses through
   * the article. On non-post pages, the underline stays static at 100%.
   *
   * Implementation:
   *   - Chrome 115+: scroll-driven CSS animation (zero JS).
   *   - Older Safari/Firefox: tiny JS fallback (~150 b) updates the
   *     `--rp` custom property; the rule below picks it up.
   */
  body[data-progress] .site-header { border-bottom-color: transparent; }
  body[data-progress] .site-header::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    bottom: -2px;
    height: 2px;
    background: var(--fg);
    transform: scaleX(var(--rp, 0));
    transform-origin: left;
    /* Don't morph during view transitions — bar is page-state, not content. */
    view-transition-name: none;
  }

  /* Chrome 115+: scroll-driven animation. The view-timeline is scoped
     to the `.post` container so progress tracks the article range. */
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
    body[data-progress] .site-header::after {
      animation: none;
      transform: scaleX(1);
      background: CanvasText;
    }
  }
}
```

- [ ] **Step 2: Import the new file in `src/styles/global.css:1-7`**

old:
```css
@layer reset, tokens, base, components, prose, utilities;

@import "./tokens.css" layer(tokens);
@import "./prose.css" layer(prose);
@import "./code.css" layer(prose);
@import "./transitions.css" layer(utilities);
@import "./print.css" layer(utilities);
```

new:
```css
@layer reset, tokens, base, components, prose, utilities;

@import "./tokens.css" layer(tokens);
@import "./progress.css" layer(components);
@import "./prose.css" layer(prose);
@import "./code.css" layer(prose);
@import "./transitions.css" layer(utilities);
@import "./print.css" layer(utilities);
```

### Task 6.2: JS fallback for browsers without scroll-driven animations

- [ ] **Step 1: Create `src/lib/reading-progress-fallback.ts`**

```ts
/**
 * Reading progress fallback for browsers without CSS scroll-driven
 * animations (Safari < 26, older Firefox). Updates --rp on body
 * via passive scroll + rAF throttle. Idempotent across view transitions.
 *
 * Imported only when `!CSS.supports('animation-timeline', '--x')`.
 */
let raf = 0;
let attached = false;

function compute(): number {
  const article = document.querySelector<HTMLElement>('.post');
  if (!article) return 0;
  const rect = article.getBoundingClientRect();
  const vh = window.innerHeight;
  // Range: from when article top hits viewport bottom (start)
  // to when article bottom hits viewport top (end).
  const total = rect.height + vh;
  const passed = vh - rect.top;
  return Math.min(1, Math.max(0, passed / total));
}

function tick(): void {
  raf = 0;
  document.body.style.setProperty('--rp', String(compute()));
}

function onScroll(): void {
  if (raf !== 0) return;
  raf = requestAnimationFrame(tick);
}

export function attach(): void {
  if (attached) return;
  attached = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  tick();
}

export function detach(): void {
  if (!attached) return;
  attached = false;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (raf !== 0) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}
```

### Task 6.3: Wire fallback into PostLayout + set body data attribute

- [ ] **Step 1: Modify `src/layouts/PostLayout.astro`**

After the existing `<article class="post">` opening (line 79) — actually the body `data-progress` attribute is set OUTSIDE the article, on `<body>`. Astro doesn't expose body directly in PostLayout; we need a script.

Add a script block at the END of PostLayout.astro (after the `<style>` block at line 177):

```astro
<script>
  // Set / clear data-progress on body around post navigations.
  function setProgress() { document.body.setAttribute('data-progress', ''); }
  function clearProgress() { document.body.removeAttribute('data-progress'); }

  // Fired on initial load and after each ClientRouter navigation.
  document.addEventListener('astro:page-load', () => {
    if (document.querySelector('.post')) setProgress();
    else clearProgress();
  });
  // Cleared before navigating away.
  document.addEventListener('astro:before-swap', clearProgress);

  // Fallback for browsers without CSS scroll-driven animations.
  if (!CSS.supports('animation-timeline', '--x')) {
    import('~/lib/reading-progress-fallback').then(({ attach }) => attach());
  }
</script>
```

- [ ] **Step 2: Verify import path resolves**

```bash
pnpm astro check
```

Expected: no errors. If `~/lib/reading-progress-fallback` is unresolved, confirm `tsconfig.json` has the `~/*` alias mapped to `src/*`.

### Task 6.4: Verify and commit

- [ ] **Step 1: Run check + build + preview**

```bash
pnpm check
pnpm build
pnpm preview
```

- [ ] **Step 2: Real-device verification**

Open a long post (the `2026-04-12-hello-world.mdx` sample). Verify:
- Header underline is invisible at the start of a post (transform: scaleX(0)).
- Scrolling through the article fills the underline left-to-right.
- At the end of the article, underline is full width.
- On non-post pages (`/`, `/posts`, `/about`), the underline is static and full-width as before.
- Theme toggle works without flicker.
- View transitions don't break the bar.

Test on Safari iOS — fallback path should behave identically.

- [ ] **Step 3: Verify bundle delta**

```bash
pnpm build
ls -la dist/_astro/*reading-progress-fallback*
```

Expected: a single chunk, ≤ 200 b gzipped (the dynamic import).

- [ ] **Step 4: Commit**

```bash
git add src/styles/progress.css src/styles/global.css \
        src/layouts/PostLayout.astro src/lib/reading-progress-fallback.ts
git commit -m "feat(post): reading progress as the header underline"
```

---

## Phase 7 — Collapsible TOC + scrollspy + Speakable

**Files:**
- Modify: `src/components/TableOfContents.astro` (variant prop, scrollspy script)
- Modify: `src/layouts/PostLayout.astro` (pass variants)
- Modify: `src/lib/schema.ts` (add `buildSpeakable`)
- Modify: `src/lib/schema.test.ts` (test the new helper)

### Task 7.1: Add `buildSpeakable` schema helper (TDD)

- [ ] **Step 1: Write failing test**

Append to `src/lib/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSpeakable } from './schema';

describe('buildSpeakable', () => {
  it('returns a SpeakableSpecification with H2/H3 xpaths', () => {
    const out = buildSpeakable();
    expect(out['@type']).toBe('SpeakableSpecification');
    expect(out.xpath).toEqual([
      '/html/body//article//h2',
      '/html/body//article//h3',
    ]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test src/lib/schema.test.ts -- --run
```

Expected: ImportError or `buildSpeakable is not a function`.

- [ ] **Step 3: Implement helper**

Append to `src/lib/schema.ts`:

```ts
/**
 * Speakable schema fragment for AEO read-aloud surfaces (Google Assistant,
 * Perplexity). Points to article H2/H3 headings as the speakable content.
 *
 * Designed to be merged into a BlogPosting via `speakable: buildSpeakable()`.
 */
export function buildSpeakable() {
  return {
    '@type': 'SpeakableSpecification',
    xpath: [
      '/html/body//article//h2',
      '/html/body//article//h3',
    ],
  } as const;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm test src/lib/schema.test.ts -- --run
```

- [ ] **Step 5: Wire into BlogPosting (conditional on headings present)**

Modify `buildBlogPosting` in `src/lib/schema.ts:4-32` — add an optional `hasHeadings: boolean` arg:

old:
```ts
export function buildBlogPosting(args: {
  url: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date | undefined;
  tags: string[];
  imageUrl: string;
  wordCount?: number | undefined;
  minutesRead?: number | undefined;
  authorUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': args.url },
    headline: args.title,
    description: args.description,
    image: args.imageUrl,
    datePublished: args.pubDate.toISOString(),
    dateModified: (args.updatedDate ?? args.pubDate).toISOString(),
    author: PERSON_REF,
    publisher: PERSON_REF,
    keywords: args.tags.join(','),
    inLanguage: 'en-US',
    ...(args.wordCount && { wordCount: args.wordCount }),
    ...(args.minutesRead && { timeRequired: `PT${args.minutesRead}M` }),
  } as const;
}
```

new:
```ts
export function buildBlogPosting(args: {
  url: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date | undefined;
  tags: string[];
  imageUrl: string;
  wordCount?: number | undefined;
  minutesRead?: number | undefined;
  authorUrl: string;
  hasHeadings?: boolean | undefined;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': args.url },
    headline: args.title,
    description: args.description,
    image: args.imageUrl,
    datePublished: args.pubDate.toISOString(),
    dateModified: (args.updatedDate ?? args.pubDate).toISOString(),
    author: PERSON_REF,
    publisher: PERSON_REF,
    keywords: args.tags.join(','),
    inLanguage: 'en-US',
    ...(args.wordCount && { wordCount: args.wordCount }),
    ...(args.minutesRead && { timeRequired: `PT${args.minutesRead}M` }),
    ...(args.hasHeadings && { speakable: buildSpeakable() }),
  } as const;
}
```

- [ ] **Step 6: Update PostLayout to pass `hasHeadings`**

Modify `src/layouts/PostLayout.astro:48-66`:

old:
```ts
const jsonLd = [
  buildBlogPosting({
    url: postUrl,
    title,
    description,
    pubDate,
    updatedDate,
    tags,
    imageUrl: ogImageUrl,
    wordCount,
    minutesRead,
    authorUrl,
  }),
  buildBreadcrumbs([
    { name: 'Home', url: homeUrl },
    { name: 'Posts', url: postsUrl },
    { name: title, url: postUrl },
  ]),
];
```

new:
```ts
const jsonLd = [
  buildBlogPosting({
    url: postUrl,
    title,
    description,
    pubDate,
    updatedDate,
    tags,
    imageUrl: ogImageUrl,
    wordCount,
    minutesRead,
    authorUrl,
    hasHeadings: headings.length > 0,
  }),
  buildBreadcrumbs([
    { name: 'Home', url: homeUrl },
    { name: 'Posts', url: postsUrl },
    { name: title, url: postUrl },
  ]),
];
```

### Task 7.2: TableOfContents variant + scrollspy

- [ ] **Step 1: Replace contents of `src/components/TableOfContents.astro`**

```astro
---
import type { MarkdownHeading } from 'astro';

interface Props {
  headings: MarkdownHeading[];
  variant?: 'inline' | 'aside' | undefined;
}
const { headings, variant = 'aside' } = Astro.props;
// Show only H2/H3. We render a flat list with H3s indented for simplicity
// — nested <ul> would generate noisy markup for short posts.
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
const firstSlug = items[0]?.slug;
---
{items.length > 0 && variant === 'inline' && (
  <details class="toc toc-inline" transition:persist>
    <summary aria-label="Table of contents">
      <span class="toc-prefix">// CONTENTS</span>
      <span class="toc-current" data-current>{items[0]?.text ?? ''}</span>
    </summary>
    <ol>
      {items.map((h) => (
        <li class:list={[`depth-${h.depth}`]}>
          <a
            href={`#${h.slug}`}
            data-toc-link={h.slug}
            aria-current={h.slug === firstSlug ? 'location' : undefined}
          >{h.text}</a>
        </li>
      ))}
    </ol>
  </details>
)}

{items.length > 0 && variant === 'aside' && (
  <aside class="toc toc-aside" aria-label="Table of contents" transition:persist>
    <p class="toc-label">// CONTENTS</p>
    <ol>
      {items.map((h) => (
        <li class:list={[`depth-${h.depth}`]}>
          <a
            href={`#${h.slug}`}
            data-toc-link={h.slug}
            aria-current={h.slug === firstSlug ? 'location' : undefined}
          >{h.text}</a>
        </li>
      ))}
    </ol>
  </aside>
)}

<style>
  .toc {
    border: 1px solid var(--rule);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  .toc-inline summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: baseline;
    min-height: 44px;
    padding: var(--space-1) 0;
  }
  .toc-inline summary::-webkit-details-marker { display: none; }
  .toc-inline summary::before {
    content: "▸";
    color: var(--fg-subtle);
    margin-right: var(--space-2);
    transition: transform 180ms var(--ease);
    display: inline-block;
  }
  .toc-inline[open] summary::before { transform: rotate(90deg); }
  .toc-inline .toc-prefix {
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
    color: var(--fg-subtle);
    text-transform: uppercase;
  }
  .toc-inline .toc-current { color: var(--fg-muted); }
  .toc-inline ol { margin-top: var(--space-3); }

  .toc-label {
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
    color: var(--fg-subtle);
    margin-bottom: var(--space-3);
    text-transform: uppercase;
  }
  .toc ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .toc li.depth-3 { padding-left: var(--space-4); }
  .toc a { color: var(--fg-muted); display: inline-block; min-height: 32px; }
  .toc a:hover, .toc a:focus-visible { color: var(--fg); }
  /* Active link: bold + leading arrow glyph (no colour change — brutalist). */
  .toc a[aria-current="location"] {
    color: var(--fg);
    font-weight: 700;
  }
  .toc a[aria-current="location"]::before {
    content: "→ ";
    color: var(--fg-subtle);
  }

  @media (min-width: 1024px) {
    .toc-aside {
      position: sticky;
      top: var(--space-6);
      max-height: calc(100dvh - var(--space-7));
      overflow-y: auto;
    }
  }
</style>

<script>
  // Single global scrollspy: observes article H2/H3 elements and updates
  // aria-current="location" on matching TOC anchors (inline + aside).
  // Idempotent across view transitions.
  if (!window.__tocScrollspyInit) {
    window.__tocScrollspyInit = true;

    const setup = () => {
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'),
      );
      if (links.length === 0) return;

      const headings = Array.from(
        document.querySelectorAll<HTMLHeadingElement>(
          'article h2[id], article h3[id]',
        ),
      );
      if (headings.length === 0) return;

      const setActive = (slug: string) => {
        for (const a of links) {
          const match = a.dataset.tocLink === slug;
          if (match) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        }
        const cur = document.querySelector<HTMLElement>('.toc-current');
        if (cur) {
          const matched = headings.find((h) => h.id === slug);
          if (matched) cur.textContent = matched.textContent ?? '';
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          // Pick the most recently entered heading near viewport top.
          const intersecting = entries.filter((e) => e.isIntersecting);
          if (intersecting.length === 0) return;
          // Sort by boundingClientRect.top ascending — closest to focal band wins.
          intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const top = intersecting[0]?.target as HTMLElement | undefined;
          if (top?.id) setActive(top.id);
        },
        { rootMargin: '-40% 0% -55% 0%', threshold: 0 },
      );
      for (const h of headings) io.observe(h);
    };

    setup();
    document.addEventListener('astro:after-swap', setup);
  }
</script>
```

### Task 7.3: PostLayout — pass variants

- [ ] **Step 1: Modify `src/layouts/PostLayout.astro:102-115`**

old:
```astro
    <div class="post-body">
      {headings.length > 0 && (
        <div class="toc-inline">
          <TableOfContents headings={headings} />
        </div>
      )}
      <div class="prose">
        <slot />
      </div>
      {headings.length > 0 && (
        <div class="toc-aside">
          <TableOfContents headings={headings} />
        </div>
      )}
    </div>
```

new:
```astro
    <div class="post-body">
      {headings.length > 0 && (
        <div class="toc-inline">
          <TableOfContents {headings} variant="inline" />
        </div>
      )}
      <div class="prose">
        <slot />
      </div>
      {headings.length > 0 && (
        <div class="toc-aside">
          <TableOfContents {headings} variant="aside" />
        </div>
      )}
    </div>
```

### Task 7.4: Verify and commit

- [ ] **Step 1: Run tests + build**

```bash
pnpm check
pnpm test
pnpm build
pnpm preview
```

All must pass.

- [ ] **Step 2: Real-device verification**

Open a post with multiple H2/H3 headings on phone:
- TOC at top of post starts collapsed: `▸ // CONTENTS · "First Section"`.
- Tap the summary — reveals the full list, glyph rotates.
- Scroll through the article — current section highlights in TOC; collapsed summary updates.
- Active link has bold weight + leading `→`.

On desktop ≥1024px:
- Sticky right-column TOC visible (always-open).
- Scrollspy highlights current section.
- Both TOC variants (inline hidden, aside visible) stay in sync via `aria-current`.

JSON-LD: view source on a post page, confirm BlogPosting includes `"speakable": { "@type": "SpeakableSpecification", "xpath": [...] }` when `headings.length > 0`.

- [ ] **Step 3: Commit**

```bash
git add src/components/TableOfContents.astro src/layouts/PostLayout.astro \
        src/lib/schema.ts src/lib/schema.test.ts
git commit -m "feat(post): collapsible TOC, scrollspy, Speakable JSON-LD"
```

---

## Phase 8 — Below-the-fold composition + list rhythm

**Files:**
- Modify: `src/layouts/PostLayout.astro` (tail rhythm)
- Modify: `src/components/Webmentions.astro` (avatars + Comment markup + empty-state branch)
- Modify: `src/components/DiscussFooter.astro` (full-width mobile CTA)
- Modify: `src/components/RelatedPosts.astro` (mobile single column tweaks if needed)
- Modify: `src/components/Footer.astro` (mobile single-column already touched in Phase 4 — finalize)

### Task 8.1: PostLayout tail rhythm

- [ ] **Step 1: Append a rule to `src/layouts/PostLayout.astro` `<style>` block (after line 175, before `</style>`)**

```css
  /* Below-the-fold rhythm: gap between major post-tail sections. */
  .post > .related,
  .post > .discuss {
    margin-top: var(--space-7);
  }
  @media (min-width: 1024px) {
    .post > .related,
    .post > .discuss {
      margin-top: var(--space-8);
    }
  }
```

(`.related` is `RelatedPosts`'s root class, `.discuss` is `DiscussFooter`'s root class.)

### Task 8.2: Webmentions avatars + Comment itemtype + empty-state

- [ ] **Step 1: Replace contents of `src/components/Webmentions.astro`**

```astro
---
import { fetchWebmentions } from '~/lib/webmentions';
import SectionTitle from './SectionTitle.astro';

interface Props {
  url: string;
}
const { url } = Astro.props;
const mentions = await fetchWebmentions(url);
const replies = mentions.filter((m) => m.type === 'reply');
const likes = mentions.filter((m) => m.type === 'like');
const reposts = mentions.filter((m) => m.type === 'repost');

// Empty-state branch: render nothing if no mentions. The current spec
// hides "0 replies" entirely — feels lonely + hurts perceived quality.
const hasContent = replies.length > 0 || likes.length + reposts.length > 0;
---
{hasContent && (
  <section class="webmentions" aria-labelledby="wm-h">
    <SectionTitle id="wm-h" name="replies" level="h3" />
    {(likes.length + reposts.length) > 0 && (
      <p class="reactions">
        {likes.length} ♥ · {reposts.length} ↻
      </p>
    )}
    {replies.length > 0 && (
      <ul role="list">
        {replies.map((m) => (
          <li itemscope itemtype="https://schema.org/Comment">
            <div class="head">
              {m.author.photo && (
                <img
                  class="avatar"
                  src={m.author.photo}
                  alt=""
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  itemprop="image"
                />
              )}
              <div class="who">
                <a href={m.author.url} itemprop="author">
                  <strong>{m.author.name}</strong>
                </a>
                <a href={m.url} itemprop="url" class="when">
                  {new Date(m.published).toISOString().slice(0, 10)}
                </a>
              </div>
            </div>
            <p itemprop="text">{m.content.text}</p>
          </li>
        ))}
      </ul>
    )}
  </section>
)}

<style>
  .webmentions {
    margin-top: var(--space-7);
  }
  .reactions {
    color: var(--fg-muted);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    padding: var(--space-3) 0;
    border-top: 1px solid var(--rule-soft);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .avatar {
    border-radius: 0; /* brutalist — no rounding */
    flex: 0 0 auto;
  }
  .who {
    display: flex;
    flex-direction: column;
    min-height: 44px;
    justify-content: center;
  }
  .who a {
    display: inline-block;
    color: var(--fg);
  }
  .who .when {
    color: var(--fg-muted);
    font-size: var(--text-xs);
  }
  li p {
    margin-top: var(--space-2);
    color: var(--fg-muted);
  }
</style>
```

### Task 8.3: DiscussFooter mobile full-width CTA

- [ ] **Step 1: Modify `src/components/DiscussFooter.astro:30-61` `<style>` block**

old:
```css
  .links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .links li { padding: var(--space-3) 0; }
  .links a {
    color: var(--fg-muted);
    transition: color 180ms var(--ease);
  }
  .links a:hover,
  .links a:focus-visible { color: var(--fg); }
  .links .ar {
    color: var(--accent);
    font-weight: 700;
    margin-right: 0.3em;
    display: inline-block;
    transition: transform 180ms var(--ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .links a:hover .ar { transform: translateX(3px); }
  }
```

new:
```css
  .links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .links li { padding: var(--space-3) 0; }
  .links a {
    color: var(--fg-muted);
    transition: color 180ms var(--ease);
    display: inline-block;
    min-height: 44px;
    line-height: 44px;
  }
  .links a:hover,
  .links a:focus-visible { color: var(--fg); }
  .links .ar {
    color: var(--accent);
    font-weight: 700;
    margin-right: 0.3em;
    display: inline-block;
    transition: transform 180ms var(--ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .links a:hover .ar { transform: translateX(3px); }
  }

  @media (max-width: 640px) {
    /* Full-width tap target on phones. */
    .links a {
      display: block;
      border: 1px solid var(--rule-soft);
      padding: var(--space-3);
    }
  }
```

### Task 8.4: Verify RelatedPosts mobile

- [ ] **Step 1: Read current behavior**

`RelatedPosts.astro:42` uses `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`. At 390px viewport with 24px gutters, the grid resolves to 1 column. Spec requirement met. **No change needed.**

- [ ] **Step 2: Confirm via DevTools mobile emulation**

Open a post with related posts (more than one published post in the archive). On 390px viewport, related cards stack vertically. ✓

### Task 8.5: Verify and commit

- [ ] **Step 1: Run check + build + preview**

```bash
pnpm check
pnpm test
pnpm build
pnpm preview
```

- [ ] **Step 2: Real-device verification**

- Post tail: prose → related → discuss → webmentions has even rhythm.
- Mastodon CTA on phone is a full-width bordered button, easy to tap.
- Webmentions show avatars when present (gravatar/github already CSP-allowed).
- Empty webmentions state hides the section entirely.
- Page source shows `itemtype="https://schema.org/Comment"` on each reply.

- [ ] **Step 3: Lighthouse mobile audit**

```bash
# Manually run Lighthouse mobile in Chrome DevTools on a post page.
# Target: Performance ≥95, A11y 100, Best Practices 100, SEO 100.
```

If "Installable" passes (Phase 1 manifest), the platform polish goal is met.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/PostLayout.astro src/components/Webmentions.astro \
        src/components/DiscussFooter.astro
git commit -m "feat(post-tail): below-the-fold rhythm, avatars, Comment itemtype"
```

---

## Final verification

After all eight phases merged:

- [ ] **Lighthouse mobile** on `/`, `/posts`, a post page: Performance ≥95, A11y 100, Best Practices 100, SEO 100.
- [ ] **Vercel Speed Insights** dashboard shows LCP ≤ 1.5s, INP ≤ 100ms, CLS = 0.00 at 75th percentile mobile, 4G.
- [ ] **`.github/workflows/size.yml` budget** is not exceeded — total new JS ≤ 650 b gzipped (per spec accounting).
- [ ] **Real-device walk** on iPhone 16 Pro Safari + Pixel 8 Chrome of every route in light + dark themes:
  - `/` (home)
  - `/posts` (archive)
  - `/posts/2026-04-12-hello-world` (post with TOC + code + cover)
  - `/projects`
  - `/about`
  - `/search`
  - A tag page (`/tags/<some-tag>`)
  - `/404` (any URL that 404s)
- [ ] All tests pass (`pnpm test`).
- [ ] `pnpm check` passes (`astro check` + `biome ci` + `cspell` + `markdownlint`).

---

## Self-Review notes

**Spec coverage check:**
- Section 1 → Phase 2 (typography) ✓
- Section 2 → Phase 6 (reading progress) ✓
- Section 3 → Phase 7 (TOC + Speakable) ✓
- Section 4 → Phase 3 (code-block) ✓
- Section 5 → Phase 1 (platform) ✓ (50% pre-existing — viewport-fit, manifest, dir, app-title, manifest-src remaining)
- Section 6 → Phase 4 (header/nav/audit) ✓
- Section 7.1 (font preload) → already done; Phase 5 reorders into BaseHead ✓
- Section 7.2 (image pipeline) → Phase 5 ✓
- Section 7.3 (anchor padding) → Phase 5 ✓
- Section 7.4 (preconnect) → **dropped** (webmentions are build-time, not client-side) — note in spec follow-up commit
- Section 7.5 (Save-Data) → no work needed; existing behavior matches spec
- Section 7.6 (head order) → Phase 5 ✓
- Section 8.1–8.7 → Phase 8 ✓ (8.5 series prev/next is **deferred** — see below)

**Deferred items (called out, not orphaned):**
- Section 8.5 series prev/next nav: deferred until series posts exist. The current archive has zero posts with `series` frontmatter; building the navigation now is YAGNI. Add when the first series post lands.
- Section 7.4 webmention preconnect: dropped (not needed; build-time fetch).

**Type consistency:** `--header-h-mobile` and `--header-h-desktop` defined in Phase 2.2, used in Phase 5.1. `data-progress` attribute set in Phase 6, referenced in Phase 6.1's CSS. `view-timeline-name: --post` set in Phase 6.1, target class `.post` already exists in `PostLayout.astro:79`. `aria-current="location"` set in Phase 7.2 markup, styled in same file. `buildSpeakable()` defined in Phase 7.1, called by `buildBlogPosting` arg in same task.

**No placeholders.** All file paths, line numbers, and code blocks are concrete.
