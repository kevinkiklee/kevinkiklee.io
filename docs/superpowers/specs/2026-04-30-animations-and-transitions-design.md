# Animations & Page Transitions — Design

**Author:** Kevin Lee
**Date:** 2026-04-30
**Status:** Approved (brainstorming complete)
**Builds on:** `docs/superpowers/specs/2026-04-29-personal-blog-design.md`

---

## Overview

The blog ships with a basic motion layer (view transitions on `forward-into-post` and `back`, scroll-reveal, animated link underlines, hover states). This design replaces it with a full motion system organized around a single motion language ("Hybrid — refined terminal"): typing reveals, line-draws under headings, fade-ups, gentle springs on microinteractions. The result reads as terminal-flavored without CRT cosplay, holds up identically in light + dark, and never costs LCP / INP / CLS budget.

The design covers 16 accepted items from a 19-item shortlist (3 declined as either decorative or app-y for a long-form blog).

## Goals

- **Single motion language** applied site-wide. Centralized timing tokens (`--t-fast`, `--t-base`, `--t-slow`), single easing family, single stagger primitive — no drift between components.
- **CWV-safe.** Every animation is compositor-only (`transform`, `opacity`, `filter`). LCP candidate paints immediately on first load. INP < 100ms on every interaction. CLS = 0.
- **SEO-safe.** All content renders in static HTML. Crawlers index normally. Animation initial states gated behind a JS-set attribute so JS-disabled visitors and crawlers see static content.
- **A11y-safe.** `prefers-reduced-motion`, `prefers-reduced-data`, `prefers-reduced-transparency`, `forced-colors`, and `Save-Data` all honored via the same kill-switch (durations forced to 1ms).
- **Mobile-first.** -30% durations on mobile, no scale transforms (mid-tier Android GPU), bottom-anchored search palette, terminal-style tap-pulse feedback.
- **Per-route choreography.** Forward / lateral / back / forward-into-post / back-into-post each get distinct keyframes.
- **Header continuity.** Brand mark + nav row + theme toggle morph in place across navigations rather than re-painting.
- **Microinteractions everywhere.** Search palette open/close, copy-code success, ToC active-section glide, tag pill inverse-fill, focus-ring draw-in.

## Non-Goals

- Swipe-back gesture on mobile (item p — declined this round)
- Pull-to-refresh on archive (item q — declined this round)
- Custom Lottie / Rive animations
- Sound on interactions (brutalist is silent)
- Per-element view-transition-class for groups beyond header (Chrome 125+ exclusive; revisit in 6 months)

## Accepted scope (16 items)

| Item | Description | Section |
|---|---|---|
| a | Per-route choreography (forward / lateral / back / forward-into-post / back-into-post) | §3 |
| b | Brand-mark + nav-row continuity (view-transition-name + class on header singletons) | §3 |
| c | Post-title morph card → hero (refinement of existing) | §3 |
| d | Post body sequential reveal (the C demo applied) | §3 |
| e | Theme toggle full crossfade via View Transitions API | §3 |
| f | Stagger reveal on archive lists, project grids | §4 |
| g | Section heading line-draw on scroll | §4 |
| i | Search palette scale-fade open/close | §5 |
| j | Theme icon swap (folded into e via View Transitions API) | §3 |
| k | Copy-code success state with checkmark + scale | §5 |
| l | ToC active-section highlight glide | §5 |
| m | Tag pills inverse-fill on hover | §5 |
| n | Focus rings draw-in via box-shadow | §5 |
| o | Mobile tap feedback (outline pulse) | §6 |
| r | -30% mobile durations | §2 / §6 |
| s | No scale transforms on mobile | §6 |

## Decisions log (TL;DR)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Single motion language: "Refined Terminal"** (typing reveals, line-draws, fade-ups, gentle springs) | Strongest motion identity without CRT cosplay; works in both themes; doesn't fight long-form reading |
| D2 | **Centralized motion tokens** (`--t-fast`/`--t-base`/`--t-slow`, easings, stagger) in `src/styles/motion.css` | Eliminates drift across 25+ animations; single point of truth |
| D3 | **`scaledDuration()` is the only runtime knob** | Mobile + reduced-motion + save-data all collapse into one helper |
| D4 | **Compositor-only animations** (transform / opacity / filter) | Hard rule. Anything else fails review. Locks CLS=0 + INP <100ms |
| D5 | **View Transitions API for theme toggle** | Free crossfade of every property at once; falls back to CSS color transitions |
| D6 | **`<dialog>` open/close via @starting-style + allow-discrete** | CSS-only choreography for the search palette; no JS animation race |
| D7 | **Box-shadow for focus rings** (not outline) | Animatable opacity, GPU-rendered, no layout cost |
| D8 | **JS-set `[data-anim]` attribute gates initial animation state** | Crawlers + JS-disabled users see static content; SEO safe |
| D9 | **First-paint detection via inline `[data-firstPaint]`** | Post `<h1>` LCP candidate paints immediately on first load; reveal sequence runs only on subsequent ClientRouter swaps |
| D10 | **Stagger via `--i` inline style** + `min(--i × --stagger, --stagger-cap)` calc | Allows arbitrary lists; cap at 8 × 30ms = 240ms total |
| D11 | **Mobile palette pinned to bottom edge** | Native iOS/Android sheet idiom; thumb-reachable |
| D12 | **`view-transition-class` for grouped header items** (Chrome 125+) with name fallback | Cleaner authoring than per-element naming for singletons |
| D13 | **No `view-transition-class` polyfill** | Graceful fallback to plain view-transition-name on older Chrome |
| D14 | **WAAPI for JS-driven, CSS for declarative** | Promise/cancel semantics for sequencing; declarative for hover/scroll |
| D15 | **All durations ≤ 280ms (`--t-slow`)** | WCAG 2.2 SC 2.3.3 (animations from interactions ≤5s); we ship far under |
| D16 | **Browser support floor: ~85% via View Transitions; 95%+ via @starting-style; 99%+ degraded** | Each feature has explicit graceful fallback |

---

## §1 — Motion primitives & file architecture

### 1.1 Centralized tokens (`src/styles/motion.css`)

Imported under `@layer tokens` in `global.css`.

```css
:root {
  --t-fast: 120ms;     /* tap feedback, icon snap */
  --t-base: 200ms;     /* default — most transitions */
  --t-slow: 280ms;     /* page-level emphasis only */

  --ease-out:    cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.40, 0.64, 1);
  --ease-in:     cubic-bezier(0.55, 0, 1, 0.45);

  --stagger: 30ms;
  --stagger-cap: 240ms;

  --header-height: 56px;
}

@media (min-width: 640px) {
  :root { --header-height: 80px; }
}

/* Item r — Mobile -30% durations */
@media (max-width: 640px) {
  :root {
    --t-fast: 90ms;
    --t-base: 140ms;
    --t-slow: 200ms;
  }
}

/* A11y kill switch — applied at the token level so EVERY consumer obeys */
@media (prefers-reduced-motion: reduce) {
  :root {
    --t-fast: 1ms;
    --t-base: 1ms;
    --t-slow: 1ms;
    --stagger: 0ms;
  }
}

@media (prefers-reduced-data: reduce) {
  :root {
    --t-fast: 1ms;
    --t-base: 1ms;
    --t-slow: 1ms;
    --stagger: 0ms;
  }
}

@media (prefers-reduced-transparency: reduce) {
  :root {
    --t-fast: 1ms;
    --t-base: 1ms;
    --t-slow: 1ms;
    --stagger: 0ms;
  }
}
```

### 1.2 Runtime helpers (`src/lib/motion.ts`)

```ts
export type MotionToken = 'fast' | 'base' | 'slow';
export const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const EASE_SPRING = 'cubic-bezier(0.34, 1.40, 0.64, 1)';
export const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';

let _isMobile = matchMedia('(max-width: 640px)');
let _reduce = matchMedia('(prefers-reduced-motion: reduce)');
let _reduceData = matchMedia('(prefers-reduced-data: reduce)');
let _reduceTransparency = matchMedia('(prefers-reduced-transparency: reduce)');

const NAVCONN = navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } };

export function scaledDuration(ms: number): number {
  if (_reduce.matches || _reduceData.matches || _reduceTransparency.matches) return 1;
  if (NAVCONN.connection?.saveData) return 1;
  if (['2g', 'slow-2g'].includes(NAVCONN.connection?.effectiveType ?? '')) return 1;
  if (_isMobile.matches) return Math.round(ms * 0.7);
  return ms;
}

export async function withWillChange(
  el: Element,
  props: ('transform' | 'opacity' | 'filter')[],
  fn: () => Promise<unknown>,
): Promise<void> {
  (el as HTMLElement).style.willChange = props.join(', ');
  try { await fn(); }
  finally { (el as HTMLElement).style.willChange = ''; }
}

export function cancelAnimations(el: Element): void {
  for (const a of (el as HTMLElement).getAnimations()) a.cancel();
}
```

### 1.3 File map

```
src/
├─ styles/
│  ├─ motion.css         NEW — tokens (≤ 800 B gzipped)
│  ├─ transitions.css    REFACTOR — VT keyframes use --t-* tokens
│  └─ tokens.css         imports motion.css
├─ lib/
│  ├─ motion.ts          NEW — runtime helpers (≤ 1 KB gzipped)
│  ├─ nav.ts             REFACTOR — direction matrix, visibility gate
│  └─ nav-direction.ts   REFACTOR — adds 'back-into-post' direction
└─ components/
   ├─ Header.astro       view-transition-name on brand + nav + theme toggle
   ├─ ThemeToggle.astro  setThemeAnimated via View Transitions API
   ├─ SearchPalette.astro CSS-only open/close via @starting-style
   ├─ CopyButton.astro   spring scale on success
   ├─ TableOfContents.astro indicator with scaleY + translateY
   ├─ TagPill.astro      ::before inverse-fill on hover
   └─ PostLayout.astro   url-prompt + reveal sequence
```

### 1.4 Hard constraints

1. **Compositor-only animations.** Only `transform`, `opacity`, `filter`. No animations on `width`, `height`, `margin`, `padding`, `top`, `left`, `right`, `bottom`. Exception: ToC indicator's `transform: scaleY(...)` substitutes for height.
2. **`scaledDuration()` is the one runtime knob.** Components never call `matchMedia` directly. Always go through the helper.
3. **`withWillChange()` for any JS-triggered animation.** Never set `will-change` permanently in CSS.
4. **`cancelAnimations(el)` on `astro:before-swap`** for elements that aren't `transition:persist`. Prevents memory creep across nav.

---

## §2 — Performance budget

```
ASSET                       BUDGET (gzip)    NOTES
─────────────────────────── ──────────────── ─────────────────────────────────
motion.css                  ≤ 800 B          Tokens + media queries only
transitions.css             ≤ 1.2 KB         All view transition keyframes
microinteractions (CSS)     ≤ 1.5 KB         ThemeToggle/SearchPalette/
                                             CopyButton/TagPill/TableOfContents
                                             /focus-ring scoped styles
lib/motion.ts               ≤ 1 KB           scaledDuration + withWillChange +
                                             cancelAnimations + token re-export
nav.ts                      ≤ 1.5 KB         was ~1.3 KB; +200 B for
                                             back-into-post + visibility gate
scroll-reveal.ts            ≤ 600 B          IO setup + stagger calc + heading
                                             draw fallback
copy-button + toc + theme   ≤ 1.5 KB total   <script> blocks across components
animation runtime budget    < 16.67 ms       Per-frame composite work for any
                                             single animation. Verified via
                                             Performance trace on Pixel 6a.
total nav budget            ≤ 300 ms         Snapshot + interpolation + new
                                             paint.
total reveal sequence       ≤ 800 ms         astro:after-swap → last animation.
                                             Body readable before first
                                             reading saccade.
microinteraction response   < 100 ms         INP target. WAAPI + compositor
                                             keeps every interaction here.
```

CI `size.yml` workflow asserts both `_astro/*.js` AND `_astro/*.css` gzip sizes.

---

## §3 — Page-level transitions (a + b + c + d + e + j)

### 3.1 Per-route choreography (item a)

Direction matrix:

| From → To | Animation | Duration |
|---|---|---|
| forward (anywhere → anywhere) | fade-out / fade-in | `--t-base` |
| lateral (same section nav) | double fast fade | `--t-fast` |
| forward-into-post (→ /posts/[slug]) | scale-fade | `--t-slow` |
| back (browser back) | slide-back (horiz) | `--t-base` |
| back-into-post (back → /posts/[slug]) | scale-fade (faster) | `--t-base` |

Driven by `data-nav-direction` attribute on `<html>` set by `nav.ts`. Direction logic in pure helper:

```ts
// src/lib/nav-direction.ts
export type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post' | 'back-into-post';

export function decideDirection(
  navType: NavType, fromUrl: URL | undefined, toUrl: URL | undefined, _fromDepth: number,
): Dir {
  const toIsPost = !!toUrl?.pathname?.startsWith('/posts/')
    && toUrl.pathname !== '/posts'
    && !toUrl.pathname.startsWith('/posts/page/');
  if (navType === 'traverse') return toIsPost ? 'back-into-post' : 'back';
  if (toIsPost) return 'forward-into-post';
  const seg = (p: string) => p.split('/')[1] ?? '';
  if (toUrl && fromUrl && seg(toUrl.pathname) === seg(fromUrl.pathname) && seg(toUrl.pathname) !== '') {
    return 'lateral';
  }
  return 'forward';
}
```

CSS keyframes in `transitions.css`, gated behind `@supports (view-transition-name: x)` so non-supporting browsers ship 0 bytes of unused rules.

### 3.2 Brand-mark + nav-row continuity (item b)

```astro
<!-- Header.astro -->
<header class="site-header">
  <a class="brand" style:view-transition-name="site-brand">[ KEVINKIKLEE.IO ]</a>
  <nav style:view-transition-name="site-nav">...</nav>
  <button class="theme-toggle" style:view-transition-name="theme-toggle">...</button>
</header>
```

Browser cross-frame interpolation morphs them in place. Side effect: `aria-current="page"` border on the active nav link slides smoothly between items on cross-section nav. **Documented as feature, not bug.**

`view-transition-class: persistent` (Chrome 125+) used as group-targeted hold-position primitive when supported:

```css
@supports (view-transition-class: x) {
  ::view-transition-group(.persistent) {
    animation-duration: 0ms;
  }
}
```

### 3.3 Post-title morph (item c)

```astro
<!-- PostCard.astro h3 -->
<h3 data-slug={post.id}
    style:view-transition-name={`post-title-${post.id}`}
    style:view-transition-class="post-title">

<!-- PostLayout.astro h1 -->
<h1 style:view-transition-name={`post-title-${post.id}`}
    style:view-transition-class="post-title">
```

Three-tier robustness:
1. IntersectionObserver sets `view-transition-name` only on viewport-visible cards (uniqueness)
2. `pointerdown` handler on cards sets `view-transition-name` synchronously before nav (race-free)
3. `view-transition-class="post-title"` (Chrome 125+) lets browser pick closest match by structural similarity when name uniqueness fails

### 3.4 Post body sequential reveal (item d)

Static HTML state (reads as final state with JS off):

```astro
<article class="post">
  <p class="url-prompt"><span class="prompt-dim">$</span> {post.id}</p>
  <h1 data-no-anim>...</h1>     <!-- LCP candidate, never animated -->
  <div class="post-meta">...</div>
  <div class="prose"><slot /></div>
</article>
```

Inline `<head>` script sets `dataset.firstPaint = '1'`; `astro:after-swap` reads + clears. First load skips the reveal (LCP unaffected); ClientRouter swaps run it.

```ts
document.addEventListener('astro:after-swap', () => {
  if (document.documentElement.dataset.firstPaint === '1') {
    delete document.documentElement.dataset.firstPaint;
    return;
  }
  if (document.visibilityState !== 'visible') return;
  runPostRevealSequence();
});

async function runPostRevealSequence() {
  const seq = [
    { sel: '.url-prompt',  delay: 0,    kind: 'fade' },
    { sel: '.post h1',     delay: 90,   kind: 'fade-up' },
    { sel: '.post-meta',   delay: 280,  kind: 'fade' },
    { sel: '.prose > *:first-child', delay: 380,  kind: 'fade-up' },
  ];
  const dur = scaledDuration(180);
  for (const { sel, delay, kind } of seq) {
    const el = document.querySelector(sel);
    if (!el || el.hasAttribute('data-no-anim')) continue;
    requestAnimationFrame(() => {
      withWillChange(el, ['opacity', 'transform'], () =>
        el.animate(getKeyframes(kind), { duration: dur, delay, easing: EASE_OUT, fill: 'both' }).finished
      );
    });
  }
}
```

Total elapsed: ≤ 800ms. Body readable before first reading saccade.

### 3.5 Theme toggle full crossfade (items e + j)

```ts
export async function setThemeAnimated(t: Theme): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTheme(t);
    return;
  }
  // Lock against re-entrance + collision with ClientRouter VT
  if (document.documentElement.dataset.transitioning === '' ||
      document.documentElement.dataset.vtTheme === '') {
    setTheme(t);
    return;
  }
  if (document.startViewTransition) {
    document.documentElement.dataset.vtTheme = '';
    try {
      await document.startViewTransition(() => setTheme(t)).updateCallbackDone;
    } finally {
      delete document.documentElement.dataset.vtTheme;
    }
    return;
  }
  setTheme(t);  // CSS transitions on :root handle the rest
}
```

The View Transitions API takes a snapshot, runs the callback (which mutates `data-theme` on root, cascading every CSS variable), then crossfades old → new. Every property that depends on `--bg`/`--fg`/etc. crossfades simultaneously, including the icon swap (item j). No per-property CSS transition needed.

---

## §4 — Scroll & in-page (f + g)

### 4.1 Stagger reveal on lists (item f)

Inline `--i` index per item:

```astro
{posts.map((post, i) => (
  <article class="post-card reveal" style={`--i: ${i};`}>...</article>
))}
```

CSS:

```css
@layer utilities {
  /* SEO-safe: animation only engages when JS sets [data-anim] on root */
  html[data-anim] .reveal {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity var(--t-base) var(--ease-out),
                transform var(--t-base) var(--ease-out);
    transition-delay: calc(min(var(--i, 0), 8) * var(--stagger));
  }
  html[data-anim] .reveal.in-view {
    opacity: 1;
    transform: none;
  }

  @supports (animation-timeline: view()) {
    html[data-anim] .reveal {
      opacity: 1; transform: none; transition: none;
      animation: reveal-fade linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 60%;
      animation-delay: calc(min(var(--i, 0), 8) * var(--stagger));
      animation-fill-mode: both;
    }
    @keyframes reveal-fade {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
  }
}
```

Applied to: `.post-card`, `.project-card` only. NOT to `.related-posts li` (3 items, not enough), NOT to `.discuss .links li` (4 items, not enough), NOT to `.url-prompt` / `.post h1` / `.post-meta` (Section 3.4 handles them).

Cap: 8 items × 30ms = 240ms total. Items 9+ snap with item 8's delay.

### 4.2 Section heading line-draw (item g)

```css
@layer utilities {
  @supports (animation-timeline: view()) {
    html[data-anim] .prose h2,
    html[data-anim] .prose h3 {
      position: relative;
    }
    html[data-anim] .prose h2::after,
    html[data-anim] .prose h3::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: -4px;
      height: 2px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left;
      animation: heading-draw linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 60%;
      animation-fill-mode: both;
    }
    @keyframes heading-draw {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
  }
}
```

JS fallback re-uses the singleton IO from `scroll-reveal.ts` (one observer, two action handlers) — toggles `.drawn` class on intersect.

### 4.3 Smooth scroll for anchors

```css
:root { --header-height: 56px; }
@media (min-width: 640px) { :root { --header-height: 80px; } }

html { scroll-padding-top: calc(var(--header-height) + var(--space-3)); }
```

Anchor jumps land below the sticky header on every viewport.

---

## §5 — Microinteractions (i + k + l + m + n)

### 5.1 Search palette open/close (item i)

```css
@layer utilities {
  #search-palette {
    opacity: 0;
    transform: translateY(-8px) scale(0.985);
    transition:
      opacity var(--t-base) var(--ease-out),
      transform var(--t-base) var(--ease-spring),
      overlay var(--t-base) allow-discrete,
      display var(--t-base) allow-discrete;
  }
  #search-palette[open] {
    opacity: 1;
    transform: none;
  }
  #search-palette::backdrop {
    background: rgba(0, 0, 0, 0);
    transition:
      background var(--t-base) var(--ease-out),
      overlay var(--t-base) allow-discrete,
      display var(--t-base) allow-discrete;
  }
  #search-palette[open]::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }
  @starting-style {
    #search-palette[open] {
      opacity: 0;
      transform: translateY(-8px) scale(0.985);
    }
    #search-palette[open]::backdrop {
      background: rgba(0, 0, 0, 0);
    }
  }
}
```

JS still calls `dialog.showModal()` and `dialog.close()`. CSS handles the choreography. Browser support: ~95% (Chrome 117+, Safari 17.4+, FF 129+); older browsers see snap (graceful).

`#search-trigger` link in header gets dynamic `aria-expanded` mirroring dialog open state.

### 5.2 Copy-code success (item k)

```ts
btn.addEventListener('click', async () => {
  let ok = false;
  try { await navigator.clipboard.writeText(code); ok = true; } catch {}
  if (!ok) {
    btn.textContent = 'ERR';
    setTimeout(() => (btn.textContent = 'COPY'), 1000);
    return;
  }
  await withWillChange(btn, ['transform'], () =>
    btn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: scaledDuration(200), easing: EASE_SPRING },
    ).finished
  );
  btn.textContent = '✓ COPIED';
  setTimeout(() => (btn.textContent = 'COPY'), 1000);
});
```

200ms spring punch + 1000ms text hold = 1.2s feedback window. Reduced-motion path: scale skipped, text-only feedback.

### 5.3 ToC active glide (item l)

```ts
const tocLinks = document.querySelectorAll('.toc-link');
const indicator = document.querySelector('.toc-indicator');
let activeId: string | null = null;
let baseHeight = 0;  // captured from indicator.offsetHeight on first paint

const obs = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const id = entry.target.id;
    if (id === activeId) continue;
    activeId = id;
    const link = document.querySelector(`.toc-link[href="#${id}"]`) as HTMLElement | null;
    if (link && indicator) {
      const ratio = link.offsetHeight / baseHeight;
      indicator.style.transform = `translateY(${link.offsetTop}px) scaleY(${ratio})`;
    }
  }
}, { rootMargin: '0px 0px -70% 0px' });

document.querySelectorAll('.prose h2[id], .prose h3[id]').forEach((h) => obs.observe(h));

// Snap to initial position without animation; enable transitions next frame
indicator.style.transition = 'none';
// ... initial position set ...
requestAnimationFrame(() => { indicator.style.transition = ''; });

// Re-position on resize / late font load
new ResizeObserver(reposition).observe(document.querySelector('.toc')!);
document.fonts.ready.then(reposition);

// Cleanup on swap
document.addEventListener('astro:before-swap', () => obs.disconnect(), { once: true });
```

```css
.toc { position: relative; contain: layout paint; }
.toc-indicator {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  background: var(--fg);
  transform-origin: top left;
  transition: transform var(--t-base) var(--ease-out);
}
```

Fully compositor (transform only). INP <1ms per scroll-into-view.

### 5.4 Tag pill inverse-fill on hover (item m)

```css
.pill {
  position: relative;
  overflow: hidden;
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--fg);
  padding: 1px 6px;
  isolation: isolate;
  transition: color var(--t-fast) var(--ease-out);
}
.pill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--fg);
  transform: scaleX(1);
  transform-origin: right;
  transition: transform var(--t-base) var(--ease-out);
  z-index: -1;
}
@media (hover: hover) {
  .pill:hover { color: var(--bg); }
  .pill:hover::before { transform: scaleX(0); }
}
@media (hover: none) {
  .pill:active { color: var(--bg); }
  .pill:active::before { transform: scaleX(0); }
}
```

### 5.5 Focus rings draw-in (item n)

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px currentColor;
  animation: focus-ring var(--t-fast) var(--ease-out);
}
@keyframes focus-ring {
  from { box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent; }
  to   { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px currentColor; }
}
```

Two-layer shadow: inner `--bg` provides contrast gap, outer `currentColor` is the ring. ~90-120ms. Only fires on `:focus-visible` (keyboard nav).

---

## §6 — Mobile + tap feedback (o + r + s)

### 6.1 Tap pulse (item o)

```css
@media (hover: none) and (pointer: coarse) {
  button, .post-card, .pill, [role="button"] {
    position: relative;
  }
  button:active::after,
  .post-card:active::after,
  .pill:active::after,
  [role="button"]:active::after {
    content: '';
    position: absolute;
    inset: -2px;
    border: 2px solid currentColor;
    pointer-events: none;
    animation: tap-pulse var(--t-fast) var(--ease-out);
  }
  @keyframes tap-pulse {
    from { transform: scale(1); opacity: 1; }
    to   { transform: scale(1.04); opacity: 0; }
  }
}
```

Scoped to block-level interactive surfaces only. Inline links keep their existing `:active` background flash.

### 6.2 No scale transforms on mobile (item s)

```css
@media (max-width: 640px) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    transform: none !important;
  }
  /* CopyButton scale becomes opacity flash via JS: scaledDuration handles */
  #search-palette {
    transform: translateY(-8px);  /* slide only, no scale */
  }
}
```

### 6.3 Bottom-anchored mobile palette

```css
@media (max-width: 640px) {
  #search-palette {
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    right: 0;
    margin: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 0;
    border-top: 2px solid var(--rule);
    border-bottom: none;
    transform: translateY(8px);
  }
  @starting-style {
    #search-palette[open] {
      transform: translateY(8px);
    }
  }
}
```

### 6.4 -30% durations (item r)

Already in `motion.css` (§1.1).

---

## §7 — Browser support matrix

| Feature | Chrome | Safari | Firefox | Fallback |
|---|---|---|---|---|
| View Transitions API | 111+ | 18.2+ | 132+ (flag) | Instant swap |
| `view-transition-class` | 125+ | — | — | Per-element view-transition-name |
| `animation-timeline: view()` | 115+ | TP | 144+ | IntersectionObserver (identical UX) |
| `<dialog>` `@starting-style` + allow-discrete | 117+ | 17.4+ | 129+ | Instant snap |
| Speculation Rules | 109+ | — | — | `<link rel="prefetch">` (Astro built-in) |
| `prefers-reduced-data` | 113+ (with Save-Data) | — | — | navigator.connection.saveData |
| `prefers-reduced-transparency` | 116+ | 17.4+ | — | (no fallback needed; treated as synonym for reduced-motion) |

**Floor:** ~85% of users get full View Transitions experience; ~95% get full `<dialog>` choreography; 99%+ get useful motion via fallbacks.

---

## §8 — A11y guarantees

| Guarantee | Mechanism |
|---|---|
| `prefers-reduced-motion` honored across ALL animations | `--t-*` tokens → 1ms; `scaledDuration()` → 1 |
| `prefers-reduced-data` + `Save-Data` honored | Same kill switch + JS-side `navigator.connection.saveData` check |
| `prefers-reduced-transparency` honored | Treated as synonym in motion tokens + `scaledDuration()` |
| `forced-colors: active` | Animations effectively become snaps (browser forces system colors) — documented as expected behavior |
| Keyboard navigation unaffected | Focus rings only on `:focus-visible`; tab order unchanged by VT; focus moves to `<main h1>` after each route swap |
| ARIA live region announces routes | `aria-live="polite" #route-announce` updated on `astro:after-swap` |
| Screen reader compat | No motion-driven content gating; all content in DOM immediately |
| Skip link unaffected | First focusable on every page; not affected by animations |
| WCAG 2.2 SC 2.3.3 (Animation from Interactions) | All animations ≤ 280ms; well under 5s |
| WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide) | Cursor-blink loop iteration < 5s and decorative (auto-updating non-essential exempt) |

---

## §9 — Testing strategy

| Layer | Tool | Catches |
|---|---|---|
| Unit | Vitest | Pure logic: `nav-direction.decideDirection`, `scaledDuration`, `withWillChange`. +6 new tests. |
| Visual | chrome-devtools MCP (manual) | Pre-merge: open `/`, `/posts/<slug>`, `/tags/<x>`, `/search`; verify view transitions, palette slide, copy punch, ToC glide, theme crossfade. |
| Performance | DevTools Performance trace + Lighthouse CI | Pre-merge nav trace on mid-tier mobile profile. Total time ≤ 300ms; no long task > 50ms; no layout > 16ms. Lighthouse asserts CWV unchanged. |
| Accessibility | `@axe-core/cli` | Catches missing focus-visible, missing aria-expanded updates, missing aria-current updates. |
| A11y manual | Step-by-step checklist | (See below) |
| Real-user | Vercel Speed Insights (already wired) | Field CWV: LCP, INP, CLS. Watch INP after deploy — alert if p75 > 100ms. |

### 9.1 Manual a11y checklist

1. Tab through every interactive element on `/` and `/posts/<x>`. Verify focus-ring appears with box-shadow animation, ≥ 3:1 contrast against background.
2. Toggle theme via keyboard (`Tab` → button → `Space`). Verify aria-label updates ("Switch to light" ↔ "Switch to dark").
3. Open palette via `/` then close via `Escape` and backdrop click. Verify focus restores to trigger.
4. Enable `prefers-reduced-motion` in DevTools → repeat 1-3. Verify all animations skip / become instant.
5. Enable Save-Data emulation → reload `/`. Verify view transitions skip on next nav.
6. Forced-colors mode (Windows High Contrast or DevTools emulation). Verify crossfades become snaps; content remains legible.
7. Tab through site with screen reader (VoiceOver / NVDA). Verify route changes are announced via `#route-announce`.

### 9.2 Edge cases documented

```
- Rapid 2x click on different nav links → 2nd startViewTransition cancels 1st
- Reload mid-swap → no transition (full reload)
- Tab close mid-swap → animations cancelled by browser
- Back-during-forward → handled via traverse navigationType
- JS not yet loaded on first nav → falls back to standard nav
- Empty post (no h2/h3) → heading line-draw + ToC absent (expected)
- Very long h2 → line draws full width, looks fine
- Very tall .post-card → animation-range may not complete; cards in
  practice never exceed viewport
```

---

## §10 — Out of scope (deferred to vNext)

```
- Swipe-back gesture on mobile (item p — declined this round)
- Pull-to-refresh on archive (item q — declined this round)
- Per-element view-transition-class for groups beyond header
  (Chrome 125+ exclusive, low coverage; revisit in 6 months)
- Custom Lottie / Rive animations
- Sound effects (brutalist is silent)
- Page-prefetch animation feedback (subtle shimmer)
```

---

## §11 — Coverage check

All 16 accepted items covered:

| Item | State | Section |
|---|---|---|
| (foundation) Motion tokens + helpers | designed | §1 |
| a — per-route choreography | full matrix | §3.1 |
| b — brand-mark + nav continuity | view-transition-name + class | §3.2 |
| c — post-title morph refinement | 3-tier robustness | §3.3 |
| d — post body sequential reveal | LCP-protected via firstPaint flag | §3.4 |
| e — theme full crossfade | View Transitions API | §3.5 |
| f — stagger reveal on lists | --i + min-cap | §4.1 |
| g — section heading line-draw | scroll-driven scaleX | §4.2 |
| i — search palette open/close | @starting-style + allow-discrete | §5.1 |
| j — theme icon swap | folded into e | §3.5 |
| k — copy-code success | 200ms spring + ✓ glyph | §5.2 |
| l — ToC active glide | absolute indicator with translateY + scaleY | §5.3 |
| m — tag pills inverse-fill | ::before scaleX with origin: right | §5.4 |
| n — focus rings draw-in | box-shadow keyframes | §5.5 |
| o — mobile tap feedback | outline pulse on :active | §6.1 |
| r — -30% mobile durations | media query in tokens | §6.4 / §1.1 |
| s — no mobile scale transforms | media query overrides | §6.2 |
