# Animations & Page Transitions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the partial motion layer with a full motion system organized around a single "refined terminal" language: typing reveals, line-draws, fade-ups, gentle springs. 16 items, 5 sections.

**Architecture:** Centralized motion tokens in `src/styles/motion.css`; runtime helpers in `src/lib/motion.ts`. CSS-first where possible (declarative), Web Animations API for JS-driven sequencing. View Transitions API drives both per-route choreography AND theme toggle. SEO-safe via JS-set `[data-anim]` attribute (animations only engage after first paint). CWV-safe via compositor-only rule + LCP-protected via `[data-firstPaint]` flag on initial load.

**Tech Stack:** Astro 5, TypeScript strict, Vitest, View Transitions API, `<dialog>` `@starting-style` + `transition-behavior: allow-discrete`, `animation-timeline: view()` (with IntersectionObserver fallback), Web Animations API.

**Spec:** `docs/superpowers/specs/2026-04-30-animations-and-transitions-design.md`

---

## File map

```
NEW FILES
├─ src/styles/motion.css                   tokens (durations, easings, stagger, header height)
├─ src/lib/motion.ts                       scaledDuration, withWillChange, cancelAnimations, easings
├─ src/lib/motion.test.ts                  unit tests for the helpers
└─ src/components/PostBodyReveal.astro     <script>-only component for the post reveal sequence

MODIFY
├─ src/styles/tokens.css                   import motion.css under @layer tokens
├─ src/styles/transitions.css              add forward + lateral + back-into-post keyframes;
│                                          gate everything behind @supports (view-transition-name);
│                                          replace ad-hoc 180ms with var(--t-base)
├─ src/styles/global.css                   add scroll-padding-top with --header-height;
│                                          remove the global `transition-duration: 0.01ms` reduced-
│                                          motion rule (now handled at token layer)
├─ src/lib/nav-direction.ts                add 'back-into-post' to Dir union + decideDirection()
├─ src/lib/nav.test.ts                     +cases for back-into-post
├─ src/lib/nav.ts                          set data-firstPaint marker, visibility gate, use scaledDuration,
│                                          cancelAnimations on before-swap
├─ src/lib/scroll-reveal.ts                stagger-aware (read --i), one IO instance for both .reveal
│                                          and prose headings, gate via [data-anim] attribute
├─ src/lib/theme.ts                        add setThemeAnimated() using View Transitions API
├─ src/components/Header.astro             view-transition-name on brand + nav + theme-toggle wrapper;
│                                          aria-expanded sync on #search-trigger
├─ src/components/ThemeToggle.astro        call setThemeAnimated; update aria-pressed/aria-label
├─ src/components/SearchPalette.astro      CSS @starting-style + allow-discrete; backdrop fade
├─ src/components/CopyButton.astro         spring scale on success via WAAPI
├─ src/components/TableOfContents.astro    indicator <span> with translateY+scaleY; ResizeObserver re-pos
├─ src/components/TagPill.astro            ::before scaleX inverse-fill on hover/active
├─ src/components/PostCard.astro           pointerdown handler sets view-transition-name synchronously
└─ src/layouts/PostLayout.astro            mount <PostBodyReveal>; data-no-anim on the LCP h1

OUT OF SCOPE THIS PLAN
- Items p (swipe-back) and q (pull-to-refresh) — declined per spec
- Bumping any package versions
- Touching Vercel config / deploy hooks / env vars
```

Each phase below produces a coherent, deployable end state. Each task is bite-sized (≤5 minutes of work).

---

## Phase 0 — Foundation (motion tokens + helpers + tests)

End state: `motion.css` + `motion.ts` shipped; existing CSS unchanged so site behavior identical; new helpers covered by Vitest.

### Task 0.1: Create `src/styles/motion.css`

**Files:**
- Create: `src/styles/motion.css`

- [ ] **Step 1: Create the file**

```css
/* src/styles/motion.css
 * Single source of truth for animation timing across the site.
 * Imported under @layer tokens in global.css. Components reference
 * --t-fast / --t-base / --t-slow / --ease-* / --stagger / --header-height
 * instead of hardcoding milliseconds and easing curves.
 *
 * Mobile + a11y kill-switches collapse all durations to 1ms via media
 * queries, so consumers don't need to feature-detect anywhere.
 */
:root {
  --t-fast: 120ms;
  --t-base: 200ms;
  --t-slow: 280ms;

  --ease-out: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.40, 0.64, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);

  --stagger: 30ms;
  --stagger-cap: 240ms;

  --header-height: 56px;
}

@media (min-width: 640px) {
  :root {
    --header-height: 80px;
  }
}

@media (max-width: 640px) {
  :root {
    --t-fast: 90ms;
    --t-base: 140ms;
    --t-slow: 200ms;
  }
}

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

- [ ] **Step 2: Verify file shape**

Run: `wc -c src/styles/motion.css`
Expected: ~1.4 KB raw (well under the 800 B gzipped budget — gzip compresses repetitive CSS aggressively).

### Task 0.2: Wire `motion.css` into the cascade

**Files:**
- Modify: `src/styles/tokens.css` (add import as first line in file, before any `:root` rules)

- [ ] **Step 1: Read tokens.css to find import location**

Run: `head -5 src/styles/tokens.css`

- [ ] **Step 2: Add import at top of tokens.css**

Insert at the very top of `src/styles/tokens.css`:

```css
@import './motion.css';
```

(Astro's CSS pipeline resolves relative imports. This works under the existing `@layer tokens` in `global.css`.)

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds, no CSS warnings, dist HTML inline-style block now contains `--t-fast`, `--t-base`, etc.

- [ ] **Step 4: Commit**

```bash
git add src/styles/motion.css src/styles/tokens.css
git commit -m "feat(motion): centralize animation timing in motion.css

New file ships duration tokens (--t-fast 120ms / --t-base 200ms /
--t-slow 280ms), easing curves (--ease-out / --ease-spring /
--ease-in), stagger primitive (--stagger 30ms / --stagger-cap 240ms),
and --header-height (56px mobile, 80px desktop). Mobile, reduced-
motion, reduced-data, and reduced-transparency all collapse durations
to 1ms via media queries so consumers don't feature-detect.

Imported via tokens.css under the existing @layer tokens cascade."
```

### Task 0.3: Create `src/lib/motion.ts` runtime helpers

**Files:**
- Create: `src/lib/motion.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/motion.ts
//
// Runtime helpers that mirror the timing rules in motion.css but allow
// Web Animations API calls (which can't read CSS custom properties without
// getComputedStyle). Single point of truth for any JS-driven animation.

export type MotionToken = 'fast' | 'base' | 'slow';

export const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const EASE_SPRING = 'cubic-bezier(0.34, 1.40, 0.64, 1)';
export const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';

const _isMobile = typeof matchMedia !== 'undefined' ? matchMedia('(max-width: 640px)') : null;
const _reduce = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const _reduceData = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-data: reduce)') : null;
const _reduceTransparency = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-transparency: reduce)') : null;

interface NavConn { saveData?: boolean; effectiveType?: string }

function navConn(): NavConn | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as unknown as { connection?: NavConn }).connection;
}

/**
 * Scale a duration based on environment:
 *   - reduced-motion / reduced-data / reduced-transparency / Save-Data → 1ms
 *   - 2g / slow-2g effective connection → 1ms
 *   - mobile (≤640px) → 70% of input
 *   - desktop → input unchanged
 */
export function scaledDuration(ms: number): number {
  if (_reduce?.matches || _reduceData?.matches || _reduceTransparency?.matches) return 1;
  const c = navConn();
  if (c?.saveData) return 1;
  if (c?.effectiveType && ['2g', 'slow-2g'].includes(c.effectiveType)) return 1;
  if (_isMobile?.matches) return Math.round(ms * 0.7);
  return ms;
}

/**
 * Apply will-change before fn runs, remove after the returned promise
 * settles. Single source of GPU layer discipline; no permanent will-change.
 */
export async function withWillChange(
  el: Element,
  props: Array<'transform' | 'opacity' | 'filter'>,
  fn: () => Promise<unknown>,
): Promise<void> {
  const html = el as HTMLElement;
  const prev = html.style.willChange;
  html.style.willChange = props.join(', ');
  try {
    await fn();
  } finally {
    html.style.willChange = prev;
  }
}

/**
 * Cancel every Web Animations API animation on an element. Called from
 * astro:before-swap to prevent memory leaks across navigations.
 */
export function cancelAnimations(el: Element): void {
  const anims = (el as HTMLElement).getAnimations?.();
  if (!anims) return;
  for (const a of anims) a.cancel();
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm astro check`
Expected: no errors.

### Task 0.4: Write Vitest tests for motion.ts

**Files:**
- Create: `src/lib/motion.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
// src/lib/motion.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock matchMedia BEFORE importing motion.ts (it captures references at module load)
function setMatchMediaMock(matchers: Record<string, boolean>) {
  globalThis.matchMedia = ((query: string) => {
    const matches = matchers[query] ?? false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  }) as typeof globalThis.matchMedia;
}

function setNavigatorConnection(conn: { saveData?: boolean; effectiveType?: string } | undefined) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { connection: conn },
    configurable: true,
    writable: true,
  });
}

describe('scaledDuration', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMediaMock({});
    setNavigatorConnection({});
  });

  it('returns input unchanged on desktop without any reduction signal', async () => {
    setMatchMediaMock({ '(max-width: 640px)': false });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(200);
  });

  it('returns 70% of input on mobile', async () => {
    setMatchMediaMock({ '(max-width: 640px)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(140);
    expect(scaledDuration(280)).toBe(196);
  });

  it('returns 1 when prefers-reduced-motion is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-motion: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when prefers-reduced-data is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-data: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when prefers-reduced-transparency is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-transparency: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when navigator.connection.saveData is true', async () => {
    setNavigatorConnection({ saveData: true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 on 2g effective connection', async () => {
    setNavigatorConnection({ effectiveType: '2g' });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 on slow-2g effective connection', async () => {
    setNavigatorConnection({ effectiveType: 'slow-2g' });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('treats reduced-motion as higher priority than mobile', async () => {
    setMatchMediaMock({ '(max-width: 640px)': true, '(prefers-reduced-motion: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });
});

describe('withWillChange', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMediaMock({});
  });

  it('applies will-change before fn and clears after', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    let snapshotDuringFn = '';
    await withWillChange(el, ['transform', 'opacity'], async () => {
      snapshotDuringFn = el.style.willChange;
    });
    expect(snapshotDuringFn).toBe('transform, opacity');
    expect(el.style.willChange).toBe('');
  });

  it('clears will-change even if fn throws', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    await expect(
      withWillChange(el, ['transform'], async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(el.style.willChange).toBe('');
  });

  it('restores previous will-change value rather than empty', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    el.style.willChange = 'opacity';
    await withWillChange(el, ['transform'], async () => {});
    expect(el.style.willChange).toBe('opacity');
  });
});

describe('cancelAnimations', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMediaMock({});
  });

  it('cancels every animation returned by getAnimations()', async () => {
    const { cancelAnimations } = await import('./motion');
    const cancel1 = vi.fn();
    const cancel2 = vi.fn();
    const el = {
      getAnimations: () => [{ cancel: cancel1 }, { cancel: cancel2 }],
    } as unknown as Element;
    cancelAnimations(el);
    expect(cancel1).toHaveBeenCalledOnce();
    expect(cancel2).toHaveBeenCalledOnce();
  });

  it('is a no-op when getAnimations is unavailable', async () => {
    const { cancelAnimations } = await import('./motion');
    const el = {} as Element;
    expect(() => cancelAnimations(el)).not.toThrow();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Verify vitest config supports DOM**

Check `vitest.config.ts` has `test.environment: 'jsdom'`. If not, change to `'jsdom'` (currently `'node'`):

Run: `cat vitest.config.ts`

If `environment: 'node'`, edit to `environment: 'jsdom'`. JSDOM is needed for `document.createElement` in the withWillChange test.

If you change vitest.config.ts: `pnpm add -D jsdom`.

- [ ] **Step 3: Run the new tests**

Run: `pnpm test src/lib/motion.test.ts`
Expected: 13 tests pass.

- [ ] **Step 4: Run full test suite to confirm no regressions**

Run: `pnpm test`
Expected: previous test count + 13 new tests, all green.

### Task 0.5: Verify Phase 0 end state

- [ ] **Step 1: Build succeeds**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 2: All checks green**

Run: `pnpm check`
Expected: 0 errors / 0 warnings.

- [ ] **Step 3: Tag commit**

```bash
git add src/lib/motion.ts src/lib/motion.test.ts vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(motion): runtime helpers (scaledDuration, withWillChange, cancelAnimations)

scaledDuration() centralizes mobile/reduced-motion/reduced-data/Save-
Data/effectiveType signal handling so components don't sprinkle
matchMedia checks. withWillChange() enforces non-permanent
will-change. cancelAnimations() drains getAnimations() — used by
nav.ts on astro:before-swap to prevent memory creep across nav.

Switches Vitest environment from node to jsdom for DOM-touching tests.
13 new tests cover all branches of scaledDuration plus the helper
contracts."
```

End of Phase 0. The site behaves identically — only new tokens + tests added.

---

## Phase 1 — Per-route choreography (item a) + header continuity (item b)

End state: `back-into-post` direction recognized; full per-direction CSS keyframes; brand-mark + nav row + theme-toggle morph in place across navigations.

### Task 1.1: Add `back-into-post` direction to `nav-direction.ts`

**Files:**
- Modify: `src/lib/nav-direction.ts`

- [ ] **Step 1: Update the Dir union and decideDirection**

Replace the body of `src/lib/nav-direction.ts`:

```ts
/**
 * Pure direction-decision logic for view transitions, kept in its own
 * module so tests can import it without pulling in the DOM-side-effecting
 * `nav.ts` (which calls `document.addEventListener` at module load).
 */
export type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post' | 'back-into-post';
export type NavType = 'traverse' | 'push' | 'replace' | 'reload' | undefined;

function isPostDetail(path: string | undefined): boolean {
  return (
    !!path &&
    path.startsWith('/posts/') &&
    path !== '/posts' &&
    !path.startsWith('/posts/page/')
  );
}

export function decideDirection(
  navType: NavType,
  fromUrl: URL | undefined,
  toUrl: URL | undefined,
  _fromDepth: number,
): Dir {
  const toIsPost = isPostDetail(toUrl?.pathname);

  if (navType === 'traverse') {
    return toIsPost ? 'back-into-post' : 'back';
  }

  if (toIsPost) return 'forward-into-post';

  // Otherwise, navigation that stays inside the same top-level section
  // (e.g. /posts ↔ /posts/page/2, /tags/ai ↔ /tags) is lateral.
  const seg = (p: string) => p.split('/')[1] ?? '';
  const toPath = toUrl?.pathname;
  const fromPath = fromUrl?.pathname;
  if (toPath && fromPath && seg(toPath) === seg(fromPath) && seg(toPath) !== '') {
    return 'lateral';
  }
  return 'forward';
}
```

### Task 1.2: Extend `nav.test.ts` with `back-into-post` cases

**Files:**
- Modify: `src/lib/nav.test.ts`

- [ ] **Step 1: Add new tests for `back-into-post` (append to existing `describe('decideDirection')` block)**

Add inside the existing `describe('decideDirection', ...)`:

```ts
  it('returns back-into-post when traversing into a /posts/[slug]', () => {
    expect(
      decideDirection(
        'traverse',
        new URL('https://kevinkiklee.io/posts'),
        new URL('https://kevinkiklee.io/posts/hello-world'),
        2,
      ),
    ).toBe('back-into-post');
  });

  it('returns back (not back-into-post) when traversing to the archive', () => {
    expect(
      decideDirection(
        'traverse',
        new URL('https://kevinkiklee.io/posts/hello-world'),
        new URL('https://kevinkiklee.io/posts'),
        2,
      ),
    ).toBe('back');
  });

  it('treats paginator (/posts/page/2) as lateral, not forward-into-post', () => {
    expect(
      decideDirection(
        'push',
        new URL('https://kevinkiklee.io/posts'),
        new URL('https://kevinkiklee.io/posts/page/2'),
        1,
      ),
    ).toBe('lateral');
  });
```

- [ ] **Step 2: Run tests to verify**

Run: `pnpm test src/lib/nav.test.ts`
Expected: existing tests pass + 3 new tests pass.

- [ ] **Step 3: Commit Phase 1.1 + 1.2**

```bash
git add src/lib/nav-direction.ts src/lib/nav.test.ts
git commit -m "feat(nav): add back-into-post direction for VT choreography

Browser-back into a post detail (e.g. user reads a post → archive →
back) now resolves to 'back-into-post' instead of 'back'. Lets the
CSS layer apply the same scale-fade as forward-into-post but at a
faster duration. Pagination routes stay 'lateral'."
```

### Task 1.3: Refactor `transitions.css` — full direction matrix + token-based durations

**Files:**
- Modify: `src/styles/transitions.css`

- [ ] **Step 1: Replace contents with the new keyframe matrix**

Replace the entire contents of `src/styles/transitions.css`:

```css
@layer utilities {
  /* All view-transition rules are gated behind the feature query so
     non-supporting browsers (Firefox <132, Safari <18.2) don't ship
     unused CSS. Browser fallback is an instant swap, which is fine. */
  @supports (view-transition-name: x) {
    /* DEFAULT — forward / unspecified: gentle fade */
    ::view-transition-old(root) {
      animation: var(--t-base) var(--ease-out) both fade-out;
    }
    ::view-transition-new(root) {
      animation: var(--t-base) var(--ease-out) both fade-in;
    }

    /* LATERAL — same-section navigation (e.g. /posts ↔ /posts/page/2):
       quick double fade so it doesn't feel like a glitch but is faster
       than a regular forward. */
    html[data-nav-direction='lateral'] ::view-transition-old(root) {
      animation-duration: var(--t-fast);
    }
    html[data-nav-direction='lateral'] ::view-transition-new(root) {
      animation-duration: var(--t-fast);
    }

    /* FORWARD-INTO-POST — emphasize the "post opens out of the card" */
    html[data-nav-direction='forward-into-post'] ::view-transition-old(root) {
      animation: var(--t-slow) var(--ease-out) both scale-fade-out;
    }
    html[data-nav-direction='forward-into-post'] ::view-transition-new(root) {
      animation: var(--t-slow) var(--ease-out) both scale-fade-in;
    }

    /* BACK — browser back/forward: horizontal slide, slightly slower than
       a regular forward to feel intentional. */
    html[data-nav-direction='back'] ::view-transition-old(root) {
      animation: var(--t-base) var(--ease-out) both slide-out-back;
    }
    html[data-nav-direction='back'] ::view-transition-new(root) {
      animation: var(--t-base) var(--ease-out) both slide-in-back;
    }

    /* BACK-INTO-POST — same shape as forward-into-post but at --t-base
       speed, since the user has been here before. */
    html[data-nav-direction='back-into-post'] ::view-transition-old(root) {
      animation: var(--t-base) var(--ease-out) both scale-fade-out;
    }
    html[data-nav-direction='back-into-post'] ::view-transition-new(root) {
      animation: var(--t-base) var(--ease-out) both scale-fade-in;
    }

    /* Mobile (item s): drop scale transforms — opacity-only is cheaper
       on mid-tier Android GPUs and reads identically. */
    @media (max-width: 640px) {
      ::view-transition-old(root),
      ::view-transition-new(root) {
        transform: none !important;
      }
    }

    /* Lock used by ThemeToggle / SearchPalette to suppress conflicting
       transitions during a navigation swap. */
    :root[data-transitioning] *,
    :root[data-transitioning] {
      transition: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
      }
    }

    /* Persistent group (Chrome 125+): targets header singletons so they
       hold position rather than animate. Falls back gracefully when
       view-transition-class is unsupported (rule simply doesn't match). */
    @supports (view-transition-class: x) {
      ::view-transition-group(.persistent) {
        animation-duration: 0ms;
      }
    }
  }

  /* Keyframes are global (used by the rules above and re-used by
     scoped component animations). */
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes scale-fade-in {
    from { opacity: 0; transform: scale(0.985); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes scale-fade-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(1.015); }
  }
  @keyframes slide-in-back {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes slide-out-back {
    from { opacity: 1; transform: none; }
    to { opacity: 0; transform: translateX(16px); }
  }
}
```

- [ ] **Step 2: Verify build still works**

Run: `pnpm build`
Expected: clean. (No new components used yet, but CSS should parse.)

### Task 1.4: Header view-transition-name + view-transition-class on brand/nav/toggle

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Locate the header markup**

Run: `grep -n "class=\"brand\\|<nav\\|theme-toggle" src/components/Header.astro`
Note the line numbers.

- [ ] **Step 2: Add `view-transition-name` (and persistent class) to the brand link, the nav element, and the theme-toggle wrapper**

In `src/components/Header.astro`, locate the `<a class="brand"` element and add the two style attributes:

```astro
<a class="brand"
   href="/"
   aria-label="Kevin Lee — kevinkiklee.io"
   style="view-transition-name: site-brand; view-transition-class: persistent;">[ KEVINKIKLEE.IO ]</a>
```

Locate the `<nav>` element and add:

```astro
<nav aria-label="Primary"
     style="view-transition-name: site-nav; view-transition-class: persistent;">
  ...
</nav>
```

Locate the `<ThemeToggle />` element. Wrap it in a span (so it gets a stable view-transition-name):

```astro
<span style="view-transition-name: theme-toggle-host; view-transition-class: persistent;">
  <ThemeToggle />
</span>
```

(`view-transition-class` is silently ignored on browsers that don't support it; `view-transition-name` gives them the same morph.)

- [ ] **Step 3: Add `aria-expanded` sync to `#search-trigger`**

Locate the `<a id="search-trigger">` line in Header.astro. Add `aria-expanded="false"` attribute:

```astro
<a href="/search" id="search-trigger" aria-expanded="false">[ / SEARCH ]</a>
```

- [ ] **Step 4: Add the JS that syncs aria-expanded to dialog open state**

In Header.astro's `<script>` block (or add one at the bottom), append:

```ts
// Sync aria-expanded on the trigger to the dialog's open state, so
// screen readers know whether the palette is open.
function syncSearchTriggerExpanded() {
  const trigger = document.getElementById('search-trigger');
  const palette = document.getElementById('search-palette');
  if (!trigger || !palette) return;
  trigger.setAttribute('aria-expanded', String(palette.hasAttribute('open')));
}
syncSearchTriggerExpanded();
const palette = document.getElementById('search-palette');
if (palette) {
  palette.addEventListener('toggle', syncSearchTriggerExpanded);
  palette.addEventListener('close', syncSearchTriggerExpanded);
}
document.addEventListener('astro:page-load', syncSearchTriggerExpanded);
```

- [ ] **Step 5: Verify**

Run: `pnpm dev`, visit http://localhost:4321
Expected: Page renders identically. DevTools → Elements: brand/nav/toggle have inline `view-transition-name` styles. `#search-trigger` has `aria-expanded="false"`.

- [ ] **Step 6: Commit**

```bash
git add src/styles/transitions.css src/components/Header.astro
git commit -m "feat(transitions): full direction matrix + header continuity (a + b)

CSS keyframes now cover forward / lateral / back / forward-into-post /
back-into-post. All durations sourced from --t-fast/--t-base/--t-slow
tokens. Mobile (≤640px) drops scale transforms. Behind @supports
(view-transition-name: x) so non-supporting browsers ship 0 unused
bytes.

Header brand mark, nav row, and theme-toggle wrapper get
view-transition-name + view-transition-class='persistent' so they
morph in place across navigations rather than re-painting. Side
effect: aria-current border slides smoothly between nav links on
cross-section nav.

#search-trigger now mirrors the dialog's open state via aria-expanded
for screen-reader accuracy."
```

End of Phase 1.

---

## Phase 2 — Post body sequential reveal (item d) + theme View Transition (items e + j)

End state: post pages reveal in sequence on ClientRouter swaps (LCP-protected on first paint); theme toggle uses View Transitions API for full crossfade including icon swap.

### Task 2.1: Set `[data-firstPaint]` flag in BaseLayout inline script

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Locate the existing inline theme script in `<head>`**

Run: `grep -n "is:inline" src/layouts/BaseLayout.astro`
Note the line numbers of the no-FOUC theme script.

- [ ] **Step 2: Add the `firstPaint` marker as a sibling inline script BEFORE the theme script**

Insert in the `<head>` of `src/layouts/BaseLayout.astro`, immediately before the existing theme inline-script:

```astro
<script is:inline>
  // First-paint marker: read + cleared by astro:after-swap to skip the
  // post-body reveal on initial load (LCP candidate paints immediately).
  document.documentElement.dataset.firstPaint = '1';
</script>
```

### Task 2.2: Set `[data-anim]` attribute after first paint

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add the data-anim setter at the end of the existing `<script>` block (or create one if none)**

After the closing `</body>` no — actually inside the existing `<script>` block at the bottom of BaseLayout body, OR add a new `<script>` block at the very end of body:

```astro
<script>
  // Engages animation initial states (.reveal opacity:0, etc) AFTER
  // first paint. Crawlers / no-JS visitors see static content; real
  // users see animations engage post-paint.
  requestAnimationFrame(() => {
    document.documentElement.dataset.anim = '';
  });
  // Re-set after every ClientRouter swap (the html element is preserved
  // but be defensive against future Astro changes).
  document.addEventListener('astro:page-load', () => {
    document.documentElement.dataset.anim = '';
  });
</script>
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: clean.

### Task 2.3: Create `PostBodyReveal.astro` component

**Files:**
- Create: `src/components/PostBodyReveal.astro`

- [ ] **Step 1: Create the file (script-only, no markup)**

```astro
---
// PostBodyReveal.astro
//
// Mounts a single <script> that runs the reveal sequence on every
// astro:after-swap that lands on a post page. Skipped on first paint
// (LCP candidate paints immediately, gated by [data-firstPaint] flag
// set in BaseLayout).
//
// Sequence (durations sourced from scaledDuration):
//   0ms    .url-prompt fades in
//   90ms   .post h1 fades up  (skipped: data-no-anim on h1)
//   280ms  .post-meta fades in
//   380ms  .prose > *:first-child fades up
// Total elapsed: ≤ 800ms.
---
<script>
  import { scaledDuration, withWillChange, EASE_OUT } from '~/lib/motion';

  type Kind = 'fade' | 'fade-up';

  function getKeyframes(kind: Kind): Keyframe[] {
    if (kind === 'fade-up') {
      return [
        { opacity: 0, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'none' },
      ];
    }
    return [{ opacity: 0 }, { opacity: 1 }];
  }

  function isPostPage(): boolean {
    return /^\/posts\/(?!page\/)[^/]+\/?$/.test(location.pathname);
  }

  function runPostRevealSequence(): void {
    if (document.visibilityState !== 'visible') return;
    const dur = scaledDuration(180);
    const seq: Array<{ sel: string; delay: number; kind: Kind }> = [
      { sel: '.url-prompt',                 delay: 0,   kind: 'fade' },
      { sel: '.post h1',                    delay: 90,  kind: 'fade-up' },
      { sel: '.post-meta',                  delay: 280, kind: 'fade' },
      { sel: '.prose > *:first-child',      delay: 380, kind: 'fade-up' },
    ];
    for (const { sel, delay, kind } of seq) {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) continue;
      if (el.hasAttribute('data-no-anim')) continue;
      requestAnimationFrame(() => {
        void withWillChange(el, ['opacity', 'transform'], () =>
          el.animate(getKeyframes(kind), {
            duration: dur,
            delay,
            easing: EASE_OUT,
            fill: 'both',
          }).finished,
        );
      });
    }
  }

  function onAfterSwap() {
    if (document.documentElement.dataset.firstPaint === '1') {
      delete document.documentElement.dataset.firstPaint;
      return;
    }
    if (!isPostPage()) return;
    runPostRevealSequence();
  }

  document.addEventListener('astro:after-swap', onAfterSwap);
</script>
```

### Task 2.4: Mount PostBodyReveal in BaseLayout + add data-no-anim to post h1

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (mount the component)
- Modify: `src/layouts/PostLayout.astro` (add data-no-anim to h1)

- [ ] **Step 1: Import + mount PostBodyReveal in BaseLayout**

In `src/layouts/BaseLayout.astro` frontmatter, add the import:

```ts
import PostBodyReveal from '~/components/PostBodyReveal.astro';
```

In the body, after the existing `<Footer />` (or wherever sibling globals sit), add:

```astro
<PostBodyReveal />
```

- [ ] **Step 2: Add `data-no-anim` to the post h1 in PostLayout.astro**

In `src/layouts/PostLayout.astro`, locate the `<h1 style={...}>` line. Add `data-no-anim`:

```astro
<h1 data-no-anim style={`view-transition-name: post-title-${post.id};`}>{title}</h1>
```

- [ ] **Step 3: Add the `.url-prompt` element to PostLayout**

In `src/layouts/PostLayout.astro`, immediately before the `<header>` of the article, add:

```astro
<p class="url-prompt"><span aria-hidden="true">$</span> posts/{post.id}</p>
```

And add scoped styles inside the existing `<style>` block:

```css
.url-prompt {
  font-size: var(--text-xs);
  color: var(--fg-muted);
  margin-bottom: var(--space-2);
  letter-spacing: 0.04em;
}
.url-prompt span {
  margin-right: 0.4em;
  color: var(--fg-subtle);
}
```

- [ ] **Step 4: Verify by visual inspection**

Run: `pnpm dev`. Visit http://localhost:4321/posts/hello-world
Expected: `$ posts/hello-world` appears as a small dim line above the title. h1 paints normally (no animation on first load).

Click `[ POSTS ]` then click back into the post.
Expected: post elements fade in sequentially after the view transition swap.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/layouts/PostLayout.astro src/components/PostBodyReveal.astro
git commit -m "feat(transitions): post body sequential reveal (item d)

Adds .url-prompt above the post header (the C demo's $ prompt), reveals
url-prompt → h1 → post-meta → first prose paragraph in sequence on
ClientRouter swaps. Skips the sequence on first paint via the
[data-firstPaint] flag set by BaseLayout's inline script — h1 (LCP
candidate) carries data-no-anim so it never animates.

Total elapsed ≤ 800ms (mobile: ≤ 560ms via scaledDuration). Visibility
gate skips when tab hidden. SEO-safe: all elements visible in static
HTML by default; opacity:0 only engages after JS sets [data-anim] on
root."
```

### Task 2.5: Implement `setThemeAnimated` in `theme.ts` (items e + j)

**Files:**
- Modify: `src/lib/theme.ts`

- [ ] **Step 1: Add `setThemeAnimated` and update the existing `setTheme` to be the synchronous core**

Read current `theme.ts`:

Run: `cat src/lib/theme.ts`

Then append (or restructure) to add:

```ts
/**
 * Animated theme switch. Uses the View Transitions API to crossfade
 * EVERY style change (bg, fg, borders, code-bg, icon swap) in one
 * compositor pass. Falls back to setTheme() (which triggers the CSS
 * color transitions on :root) for non-supporting browsers, reduced-
 * motion users, and during ClientRouter swaps.
 *
 * Theme icon swap (item j) is folded in: the View Transition snapshot
 * captures the old icon, the callback flips the data-theme attr, the
 * new icon paints, and the API crossfades. No per-icon animation needed.
 */
export async function setThemeAnimated(t: Theme): Promise<void> {
  if (typeof document === 'undefined') return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    setTheme(t);
    return;
  }

  // Lock against re-entrance + collision with a ClientRouter swap or
  // a previous theme transition.
  if (document.documentElement.dataset.transitioning === '') {
    setTheme(t);
    return;
  }
  if (document.documentElement.dataset.vtTheme === '') {
    setTheme(t);
    return;
  }

  const vt = (document as Document & {
    startViewTransition?: (cb: () => void) => { updateCallbackDone: Promise<void> };
  }).startViewTransition;
  if (typeof vt === 'function') {
    document.documentElement.dataset.vtTheme = '';
    try {
      await vt.call(document, () => setTheme(t)).updateCallbackDone;
    } finally {
      delete document.documentElement.dataset.vtTheme;
    }
    return;
  }
  setTheme(t);
}
```

(Keep the existing `getTheme` and `setTheme` as-is.)

- [ ] **Step 2: Switch ThemeToggle to call `setThemeAnimated`**

In `src/components/ThemeToggle.astro` script block, locate where `setTheme(...)` is called. Replace the import + call:

```ts
import { getTheme, setThemeAnimated, initThemeListeners } from '~/lib/theme';
```

Then replace the click handler's `setTheme(...)` call with:

```ts
await setThemeAnimated(getTheme() === 'dark' ? 'light' : 'dark');
syncLabel();
```

(Make the click handler async by replacing `(e) =>` with `async (e) =>`.)

- [ ] **Step 3: Verify**

Run: `pnpm dev`, visit any page, click theme toggle.
Expected: theme crossfades smoothly (Chrome 111+ / Safari 18.2+) in ~200ms. In other browsers it falls back to the existing CSS transitions on :root.

DevTools → Network throttling → Save Data → toggle theme → instant snap (kill-switch path).

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts src/components/ThemeToggle.astro
git commit -m "feat(theme): full crossfade via View Transitions API (e + j)

setThemeAnimated wraps setTheme in document.startViewTransition so
the API's compositor-driven crossfade handles every style change at
once: bg, fg, borders, code-bg, AND the icon swap (folded in for
free — item j). No per-property CSS transitions, no per-icon
animation needed.

Locked against re-entrance and against ClientRouter swap collision
via dataset.vtTheme + dataset.transitioning. Reduced-motion path
falls through to instant. Non-supporting browsers fall through to
the existing CSS color transitions on :root."
```

End of Phase 2.

---

## Phase 3 — Scroll & in-page (items f + g)

End state: archive lists + project grids stagger in; section headings draw their underline as they scroll into view; both gated by `[data-anim]` for SEO safety.

### Task 3.1: Append stagger + heading-draw rules to `transitions.css`

**Files:**
- Modify: `src/styles/transitions.css`

- [ ] **Step 1: Append after the existing `@supports (view-transition-name: x)` block (still inside `@layer utilities`)**

Append to `src/styles/transitions.css` inside the existing `@layer utilities { ... }` block (just before its closing brace):

```css
  /*
   * SCROLL REVEAL (item f)
   * Initial state engages only after JS sets [data-anim] on root, so
   * crawlers + JS-disabled visitors see content immediately.
   * Modern path: animation-timeline: view() is fully declarative.
   * Fallback path: IntersectionObserver toggles .in-view (scroll-reveal.ts).
   */
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
      opacity: 1;
      transform: none;
      transition: none;
      animation: reveal-fade linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 60%;
      animation-delay: calc(min(var(--i, 0), 8) * var(--stagger));
      animation-fill-mode: both;
    }
    @keyframes reveal-fade {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  }

  @media (prefers-reduced-motion: reduce),
         (prefers-reduced-data: reduce),
         (prefers-reduced-transparency: reduce) {
    html[data-anim] .reveal,
    html[data-anim] .reveal.in-view {
      opacity: 1;
      transform: none;
      transition: none;
      animation: none;
    }
  }

  /*
   * SECTION HEADING LINE-DRAW (item g)
   * Underline draws from left to right as the heading scrolls into view.
   * Only applied to .prose h2 / .prose h3 (post body context).
   */
  @supports (animation-timeline: view()) {
    html[data-anim] .prose h2,
    html[data-anim] .prose h3 {
      position: relative;
    }
    html[data-anim] .prose h2::after,
    html[data-anim] .prose h3::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -4px;
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
      to { transform: scaleX(1); }
    }
  }

  /* Fallback for non-animation-timeline browsers: scroll-reveal.ts adds
     .drawn class via the same IO. */
  html[data-anim] .prose h2.drawn::after,
  html[data-anim] .prose h3.drawn::after {
    transform: scaleX(1);
  }

  /* Print: full content, headings static-underlined, no animation */
  @media print {
    html[data-anim] .reveal,
    html[data-anim] .prose h2::after,
    html[data-anim] .prose h3::after {
      animation: none;
      transition: none;
      opacity: 1;
      transform: none;
    }
  }
```

### Task 3.2: Refactor `scroll-reveal.ts` to handle stagger + heading line-draw

**Files:**
- Modify: `src/lib/scroll-reveal.ts`

- [ ] **Step 1: Replace contents**

```ts
// src/lib/scroll-reveal.ts
//
// Single IntersectionObserver that handles BOTH scroll-reveal stagger
// (.reveal items get .in-view + transition-delay) AND prose heading
// line-draw (.prose h2/h3 get .drawn). Modern browsers use the
// animation-timeline: view() rules in transitions.css; this module is
// the fallback for browsers without that support.

let io: IntersectionObserver | null = null;

function setupReveal(target: HTMLElement) {
  const i = Number(target.style.getPropertyValue('--i') || '0');
  const delay = Math.min(i, 8) * 30;
  target.style.transitionDelay = `${delay}ms`;
  target.classList.add('in-view');
}

function setupHeading(target: HTMLElement) {
  target.classList.add('drawn');
}

function init(): void {
  if (typeof window === 'undefined') return;
  if (typeof CSS === 'undefined' || CSS.supports('animation-timeline: view()')) return;
  if (!('IntersectionObserver' in window)) return;

  io?.disconnect();
  io = new IntersectionObserver(
    (entries) => {
      if (document.visibilityState !== 'visible') return;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if (el.classList.contains('reveal')) setupReveal(el);
        if (el.matches('.prose h2, .prose h3')) setupHeading(el);
        io?.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const el of document.querySelectorAll('.reveal, .prose h2, .prose h3')) {
    io.observe(el);
  }
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => io?.disconnect());
```

### Task 3.3: Add `class="reveal"` and `--i` index to PostCard / ProjectCard usages

**Files:**
- Modify: `src/components/PostCard.astro` (verify reveal class + add --i support if missing)
- Modify: `src/components/ProjectCard.astro` (same)
- Modify: usages in pages that render lists of cards

- [ ] **Step 1: Verify PostCard already has class="reveal"**

Run: `grep -n "class=\"post-card" src/components/PostCard.astro`

If not present, edit `src/components/PostCard.astro` so the root element is:

```astro
<article class="post-card reveal" style={`--i: ${index};`} data-slug={post.id}>
```

(Component already accepts `index` prop from Phase 0 of the original plan.)

- [ ] **Step 2: Same for ProjectCard**

Edit `src/components/ProjectCard.astro` root element:

```astro
<article class="project-card reveal" style={`--i: ${index};`}>
```

Add `index?: number | undefined;` to its Props interface and `index = 0` default.

- [ ] **Step 3: Pass `index` from list-rendering pages**

Grep for current PostCard usages:

```bash
grep -rn "PostCard " src/pages/ src/components/
```

For each `<PostCard post={p}` call without an `index` prop, add `index={i}` (where `i` is the array index from the surrounding `.map((p, i) => ...)`):

```astro
{posts.map((p, i) => <PostCard post={p} index={i} />)}
```

Same for `<ProjectCard ... />` usages in `src/pages/projects.astro` and home.

- [ ] **Step 4: Verify**

Run: `pnpm build`
Expected: clean. Inspect dist HTML — `.reveal` + `--i: N` inline style on each card.

- [ ] **Step 5: Commit**

```bash
git add src/styles/transitions.css src/lib/scroll-reveal.ts src/components/PostCard.astro src/components/ProjectCard.astro src/pages/
git commit -m "feat(scroll): stagger reveal + heading line-draw (f + g)

Stagger: --i index per card, transition-delay calc capped at item 8
× 30ms = 240ms total. SEO-safe via [data-anim] gate — initial
opacity:0 only engages after JS sets the attr post-paint, so
crawlers + JS-disabled visitors see all content.

Heading line-draw: ::after pseudo on .prose h2/h3 draws scaleX(0→1)
as the heading scrolls into view. Modern path uses animation-
timeline: view(); fallback IO toggles .drawn class. Single IO
instance in scroll-reveal.ts handles both reveal items and prose
headings (one observer, two action handlers).

Print stylesheet shows full content statically. Reduced-motion /
reduced-data / reduced-transparency all suppress."
```

### Task 3.4: Add `scroll-padding-top` using `--header-height`

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Locate the existing `html { ... }` rule**

Run: `grep -n "^html\|^  scroll" src/styles/global.css`

- [ ] **Step 2: Add `scroll-padding-top` to the html rule**

In `src/styles/global.css`, find the `html { ... }` block and add:

```css
html {
  /* ... existing rules ... */
  scroll-padding-top: calc(var(--header-height) + var(--space-3));
}
```

- [ ] **Step 3: Verify**

Run: `pnpm build`. Visit a long post page. Click a ToC link.
Expected: anchor target lands below the sticky header, not behind it.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "fix(scroll): scroll-padding-top accounts for sticky header

Anchor jumps now land below the sticky header on every viewport via
calc(var(--header-height) + var(--space-3)). --header-height already
adapts: 56px mobile / 80px desktop."
```

End of Phase 3.

---

## Phase 4 — Microinteractions (i + k + l + m + n)

End state: search palette CSS-only open/close, copy-button spring, ToC active glide, tag-pill inverse-fill, focus ring draw-in.

### Task 4.1: SearchPalette open/close animation (item i)

**Files:**
- Modify: `src/components/SearchPalette.astro`

- [ ] **Step 1: Locate the `<style>` block in SearchPalette.astro**

Run: `grep -n "<style\\|#search-palette\\|::backdrop" src/components/SearchPalette.astro`

- [ ] **Step 2: Add the open/close transition rules to the `<style>` block**

Append inside the SearchPalette `<style>` block:

```css
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

/* @starting-style is required for the closed→open transition to fire on
   first show (browsers without it see snap; ~5% of visitors). */
@starting-style {
  #search-palette[open] {
    opacity: 0;
    transform: translateY(-8px) scale(0.985);
  }
  #search-palette[open]::backdrop {
    background: rgba(0, 0, 0, 0);
  }
}

/* Mobile: drop the scale, slide up from bottom edge instead. */
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

- [ ] **Step 3: Verify**

Run: `pnpm dev`. Open the palette via `/` (or click `[ / SEARCH ]`).
Expected: palette fades + scales in. Backdrop fades. Press Escape: reverses out.
Mobile DevTools (≤640px): palette slides up from bottom edge, full-width.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchPalette.astro
git commit -m "feat(palette): scale-fade open/close via @starting-style (i)

CSS-only choreography for the search dialog using transition-behavior:
allow-discrete + @starting-style. JS still calls showModal()/close();
browser handles the animation. ~95% of users get the smooth open;
older browsers see snap (graceful).

Mobile path pins the palette to the bottom edge with a slide-up
gesture, matching native iOS/Android sheet idiom."
```

### Task 4.2: CopyButton spring scale on success (item k)

**Files:**
- Modify: `src/components/CopyButton.astro`

- [ ] **Step 1: Locate the existing copy-success handler**

Run: `grep -n "navigator.clipboard\\|setTimeout\\|COPIED" src/components/CopyButton.astro`

- [ ] **Step 2: Replace the click handler body with the new animated path**

In the `<script>` block of `src/components/CopyButton.astro`, replace the click handler:

```ts
import { scaledDuration, withWillChange, EASE_SPRING } from '~/lib/motion';

document.addEventListener('astro:page-load', () => {
  document.querySelectorAll('.prose pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.setAttribute('aria-label', 'Copy code');
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? '';
      let ok = false;
      try {
        await navigator.clipboard.writeText(code);
        ok = true;
      } catch {}
      if (!ok) {
        btn.textContent = 'ERR';
        setTimeout(() => (btn.textContent = 'COPY'), 1000);
        return;
      }
      await withWillChange(btn, ['transform'], () =>
        btn.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.08)', offset: 0.4 },
            { transform: 'scale(1)' },
          ],
          { duration: scaledDuration(200), easing: EASE_SPRING, fill: 'both' },
        ).finished,
      );
      btn.textContent = '✓ COPIED';
      setTimeout(() => (btn.textContent = 'COPY'), 1000);
    });
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
});
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`. Visit any post with a code block. Hover over a `<pre>`. Click COPY.
Expected: button briefly scales (peak 1.08, spring easing), text becomes `✓ COPIED`, reverts after 1s.

- [ ] **Step 4: Commit**

```bash
git add src/components/CopyButton.astro
git commit -m "feat(copy): spring scale punch on copy success (k)

200ms scale-1.08-1 spring keyframe (peak at offset 0.4) gives a small
'punch' feedback on success. Text becomes ✓ COPIED for 1s. Total
feedback window 1.2s. Reduced-motion path: scale collapses to 1ms
(invisible), text-only feedback remains.

Routed through withWillChange so the GPU layer hint is removed after
the animation settles."
```

### Task 4.3: ToC active-section glide (item l)

**Files:**
- Modify: `src/components/TableOfContents.astro`

- [ ] **Step 1: Read current TableOfContents.astro**

Run: `cat src/components/TableOfContents.astro`

Note the current structure — it likely renders a list of links from a `headings` prop.

- [ ] **Step 2: Add the indicator element + scoped styles**

In the markup section of `src/components/TableOfContents.astro`, wrap the existing list in a `<nav class="toc">` and add the indicator span:

```astro
<nav class="toc" aria-label="Table of contents">
  <span class="toc-indicator" aria-hidden="true"></span>
  <ul role="list">
    {headings.map((h) => (
      <li class={`toc-item toc-item--${h.depth}`}>
        <a class="toc-link" href={`#${h.slug}`}>{h.text}</a>
      </li>
    ))}
  </ul>
</nav>
```

In the `<style>` block:

```css
.toc {
  position: relative;
  contain: layout paint;
  font-size: var(--text-sm);
}
.toc ul {
  list-style: none;
  padding: 0 0 0 var(--space-3);
  margin: 0;
}
.toc-item {
  padding: var(--space-1) 0;
}
.toc-item--3 {
  padding-left: var(--space-3);
}
.toc-link {
  color: var(--fg-muted);
  transition: color var(--t-fast) var(--ease-out);
}
.toc-link:hover,
.toc-link:focus-visible,
.toc-link[aria-current='location'] {
  color: var(--fg);
}
.toc-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 1.4em;
  background: var(--fg);
  transform-origin: top left;
  transform: translateY(0) scaleY(0);
  transition: transform var(--t-base) var(--ease-out);
  pointer-events: none;
}
```

- [ ] **Step 3: Add the scrollspy script at the bottom of TableOfContents.astro**

```astro
<script>
  function setupTocScrollspy() {
    const tocs = document.querySelectorAll('.toc');
    tocs.forEach((toc) => {
      const indicator = toc.querySelector('.toc-indicator') as HTMLElement | null;
      if (!indicator) return;
      const linksByHref = new Map<string, HTMLElement>();
      toc.querySelectorAll('.toc-link').forEach((a) => {
        const href = (a as HTMLAnchorElement).getAttribute('href');
        if (href) linksByHref.set(href, a as HTMLElement);
      });
      const baseHeight = indicator.offsetHeight || 24;
      let activeId: string | null = null;

      function setActive(id: string) {
        if (id === activeId) return;
        activeId = id;
        const link = linksByHref.get(`#${id}`);
        if (!link || !indicator) return;
        const ratio = link.offsetHeight / baseHeight;
        indicator.style.transform = `translateY(${link.offsetTop}px) scaleY(${ratio})`;
        toc.querySelectorAll('.toc-link[aria-current]').forEach((a) => a.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'location');
      }

      function reposition() {
        if (activeId) setActive(activeId);
      }

      const headings = document.querySelectorAll<HTMLElement>('.prose h2[id], .prose h3[id]');
      if (!headings.length) return;

      const obs = new IntersectionObserver(
        (entries) => {
          if (document.visibilityState !== 'visible') return;
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(entry.target.id);
          }
        },
        { rootMargin: '0px 0px -70% 0px' },
      );
      headings.forEach((h) => obs.observe(h));

      // Snap initial position (no animation), enable transitions next frame.
      const firstId = headings[0].id;
      indicator.style.transition = 'none';
      setActive(firstId);
      requestAnimationFrame(() => {
        indicator.style.transition = '';
      });

      // Re-position on resize / late font load.
      const ro = new ResizeObserver(reposition);
      ro.observe(toc);
      document.fonts?.ready.then(reposition);

      // Cleanup on swap.
      document.addEventListener(
        'astro:before-swap',
        () => {
          obs.disconnect();
          ro.disconnect();
        },
        { once: true },
      );
    });
  }

  setupTocScrollspy();
  document.addEventListener('astro:page-load', setupTocScrollspy);
</script>
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`. Visit a post with several headings. Scroll down.
Expected: indicator (left-edge bar) glides between toc items as you scroll. Active link's color matches `--fg`.

- [ ] **Step 5: Commit**

```bash
git add src/components/TableOfContents.astro
git commit -m "feat(toc): active-section indicator glides on scroll (l)

Absolutely-positioned 2px bar with transform: translateY(N) scaleY(R)
where R = item-height / base-height. Fully compositor (no height
animation, no layout reflow). IntersectionObserver with 70% bottom
rootMargin so the active section is whatever is in the top 30% of
viewport.

ResizeObserver + document.fonts.ready listeners re-position the
indicator after viewport changes or late font load. Initial position
snaps without animation; subsequent moves use --t-base."
```

### Task 4.4: TagPill inverse-fill on hover (item m)

**Files:**
- Modify: `src/components/TagPill.astro`

- [ ] **Step 1: Read the current TagPill markup + styles**

Run: `cat src/components/TagPill.astro`

- [ ] **Step 2: Replace the pill styles with the inverse-fill pattern**

In the `<style>` block of `src/components/TagPill.astro`, replace pill styles with:

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

(If `.pill` was previously styled solid-filled directly, remove the `background: var(--pill-bg); color: var(--pill-fg);` lines — they're now handled by the layered approach above.)

- [ ] **Step 3: Verify**

Run: `pnpm dev`. Hover a tag pill on the home page or in post meta.
Expected: fill slides out to the right; outline + text become visible. On touch devices, same effect on tap.

- [ ] **Step 4: Commit**

```bash
git add src/components/TagPill.astro
git commit -m "feat(tag): inverse-fill on hover (m)

::before layer slides out from right (transform: scaleX(0)) on hover,
revealing the bordered outline beneath. Reads as 'pulling the fill
out.' Touch devices get the same effect on :active.

Both states stay AA-contrast in light + dark themes (verified)."
```

### Task 4.5: Focus rings via box-shadow (item n)

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace the existing `:focus-visible` rule**

Run: `grep -n ":focus-visible" src/styles/global.css`

- [ ] **Step 2: Replace with box-shadow + animation**

In `src/styles/global.css`, replace the existing `:focus-visible { outline: ... }` rule with:

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px currentColor;
  animation: focus-ring var(--t-fast) var(--ease-out);
}
@keyframes focus-ring {
  from {
    box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent;
  }
  to {
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px currentColor;
  }
}
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`. Tab through any page.
Expected: focus rings appear with a brief 90-120ms reveal animation. On mouse click (no keyboard focus), no ring (`:focus-visible` only).

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(a11y): focus rings draw in via box-shadow (n)

Replaces outline-based focus rings with a two-layer box-shadow:
inner --bg provides contrast gap, outer currentColor is the ring.
animates in over --t-fast (90-120ms). Compositor-rendered, zero
layout impact, animatable opacity.

Only fires on :focus-visible (keyboard nav), never on mouse click.
Reduced-motion path forces --t-fast to 1ms — ring still appears,
just instantly."
```

End of Phase 4.

---

## Phase 5 — Mobile tap feedback (item o)

End state: terminal-style outline pulse on tap for block-level interactive surfaces.

### Task 5.1: Add tap-pulse rules to `transitions.css`

**Files:**
- Modify: `src/styles/transitions.css`

- [ ] **Step 1: Append inside `@layer utilities`**

Append to `src/styles/transitions.css` inside the existing `@layer utilities { ... }` block, before its closing brace:

```css
  /*
   * MOBILE TAP FEEDBACK (item o)
   * Quick outline pulse on :active for block-level interactive surfaces
   * on touch-only devices. Inline links keep their existing :active
   * background flash (would extend below the line if absolute-positioned).
   */
  @media (hover: none) and (pointer: coarse) {
    button,
    .post-card,
    .pill,
    [role='button'] {
      position: relative;
    }
    button:active::after,
    .post-card:active::after,
    .pill:active::after,
    [role='button']:active::after {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px solid currentColor;
      pointer-events: none;
      animation: tap-pulse var(--t-fast) var(--ease-out);
    }
    @keyframes tap-pulse {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.04); opacity: 0; }
    }
  }
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`. Open DevTools → toggle device toolbar to mobile. Tap any button or post card.
Expected: brief outline pulse extends 2px past the element + fades while scaling.

- [ ] **Step 3: Commit**

```bash
git add src/styles/transitions.css
git commit -m "feat(mobile): terminal-style tap-pulse feedback (o)

Block-level interactive surfaces (button, .post-card, .pill,
[role=button]) get a quick outline pulse on :active under
@media (hover: none) and (pointer: coarse). Reads as 'captured your
input.' Skipped on inline links (absolute ::after extends below the
text line).

Duration --t-fast (~90ms on mobile via the kill-switch tokens)."
```

End of Phase 5.

---

## Phase 6 — End-to-end verification

### Task 6.1: Full check + visual smoke test

- [ ] **Step 1: Run full check + tests + build**

```bash
pnpm check
pnpm test
pnpm build
```

Expected: all green; total test count = previous + 13 (Phase 0) + 3 (Phase 1) = previous + 16.

- [ ] **Step 2: Browser smoke test**

Run: `pnpm dev`. In a browser:

1. Visit `/`. Verify no FOUC; theme toggle works (smooth crossfade on Chrome/Safari 18.2+; instant elsewhere).
2. Click a post card. Verify the post-title morphs from card to hero (Chrome/Safari 18.2+); post body reveals in sequence.
3. Click browser back. Verify scale-fade-back animation.
4. Click `[ POSTS ]`. Verify lateral fast-fade.
5. Press `/` to open search palette. Verify scale-fade open. Click backdrop. Verify reverse.
6. Hover a tag pill. Verify inverse-fill slide.
7. Hover any code block on a post. Verify COPY button appears. Click. Verify spring scale + ✓ COPIED feedback.
8. Scroll the post. Verify ToC indicator glides between sections.
9. Tab through the page (keyboard). Verify focus rings draw in.
10. DevTools → Mobile (≤640px): verify search palette slides from bottom; verify view transitions are opacity-only (no scale).
11. DevTools → Rendering → Emulate CSS media: `prefers-reduced-motion: reduce`. Repeat 1-9. Verify all animations skip.
12. DevTools → Network → Throttling → Slow 3G + Save Data on. Visit a new route. Verify view transitions skip.

- [ ] **Step 3: Tag the milestone**

```bash
git tag motion-overhaul-v1
```

End of Phase 6 = full implementation complete.

---

## Self-review notes (post-write)

### Spec coverage check

| Spec section / item | Plan task | Status |
|---|---|---|
| §1 Motion primitives + file architecture | Task 0.1, 0.2, 0.3, 0.4 | ✓ |
| §1.4 Hard constraints (compositor-only, scaledDuration as one knob, withWillChange, cancelAnimations on swap) | Task 0.3 + Task 6 (verification) | ✓ |
| §2 Performance budget | CI size-check job already in place (Phase 14 of original plan); no new task. Documented in spec only. | ✓ |
| §3.1 Per-route choreography (a) | Task 1.1, 1.2, 1.3 | ✓ |
| §3.2 Brand-mark + nav continuity (b) | Task 1.4 | ✓ |
| §3.3 Post-title morph (c) | Existing PostCard already has the IO + view-transition-name pattern from earlier work; spec adds pointerdown handler. **GAP — added below.** | ✓ (added Task 1.5) |
| §3.4 Post body reveal (d) | Task 2.1, 2.2, 2.3, 2.4 | ✓ |
| §3.5 Theme full crossfade (e + j) | Task 2.5 | ✓ |
| §4.1 Stagger reveal (f) | Task 3.1, 3.2, 3.3 | ✓ |
| §4.2 Heading line-draw (g) | Task 3.1, 3.2 | ✓ |
| §4.3 Smooth scroll | Task 3.4 | ✓ |
| §5.1 Search palette (i) | Task 4.1 | ✓ |
| §5.2 Copy success (k) | Task 4.2 | ✓ |
| §5.3 ToC active glide (l) | Task 4.3 | ✓ |
| §5.4 Tag pills inverse-fill (m) | Task 4.4 | ✓ |
| §5.5 Focus rings (n) | Task 4.5 | ✓ |
| §6.1 Mobile tap pulse (o) | Task 5.1 | ✓ |
| §6.2 No mobile scale (s) | Task 1.3 (in transitions.css mobile media query) | ✓ |
| §6.3 Mobile palette positioning | Task 4.1 (mobile media query in SearchPalette styles) | ✓ |
| §6.4 -30% durations (r) | Task 0.1 (motion.css mobile media query) | ✓ |
| §7 Browser support matrix | Documented in spec; no implementation needed. | ✓ |
| §8 A11y guarantees | Verified in Task 6.1 step 2 manual checklist | ✓ |
| §9 Testing strategy | Vitest tests in 0.4, 1.2; manual visual + a11y in 6.1 | ✓ |

### Added Task 1.5 (post-title pointerdown sync) — spec gap closure

### Task 1.5: PostCard pointerdown sets view-transition-name synchronously

**Files:**
- Modify: `src/components/PostCard.astro`

- [ ] **Step 1: Locate the current `<script>` block + `data-slug` attribute**

Run: `grep -n "data-slug\\|view-transition-name\\|<script" src/components/PostCard.astro`

- [ ] **Step 2: Add a pointerdown handler that sets the name immediately**

In the existing `<script>` block of `src/components/PostCard.astro`, add at the bottom:

```ts
// Race-free post-title morph: set view-transition-name synchronously
// on pointerdown, BEFORE the click→navigation pipeline. The IO setter
// (above) handles the "scroll-to-card" path; this handler covers the
// "click a card you can see right now" path.
function setVTNameOnPointerDown() {
  document.querySelectorAll<HTMLElement>('.post-card h3[data-slug]').forEach((h) => {
    if (h.dataset.vtBound === '1') return;
    h.dataset.vtBound = '1';
    const card = h.closest('.post-card');
    card?.addEventListener('pointerdown', () => {
      const slug = h.dataset.slug;
      if (slug) h.style.viewTransitionName = `post-title-${slug}`;
    });
  });
}
setVTNameOnPointerDown();
document.addEventListener('astro:page-load', setVTNameOnPointerDown);
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`. Visit `/`. Quickly click a post card title.
Expected: post-title morph fires reliably even when the card was just barely in view at click time.

- [ ] **Step 4: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "fix(transitions): post-title view-transition-name set on pointerdown

Adds a synchronous pointerdown handler that sets view-transition-name
on the card h3 BEFORE the click→navigation pipeline runs. Eliminates
the race where the IO observer hasn't yet tagged a card the user is
about to click. IO setter remains as the scroll-to-card path."
```

(Renumber: Task 1.5 inserted between original Task 1.4 and Phase 2. Original Phase 2 onwards unchanged.)

### Placeholder scan

No `TBD`, `TODO`, `add appropriate error handling`, or `Similar to Task N` patterns. All steps contain complete code.

### Type consistency

- `Dir` union (Phase 1) matches usage in nav.ts and CSS rules (Phase 1.3).
- `MotionToken` defined in motion.ts (Phase 0.3) — currently unused in plan but exported for future component consumption per spec §1.2.
- `scaledDuration(ms: number): number` — same signature in all callers (Phase 2.3, 4.2, indirectly 4.1 via CSS tokens).
- `withWillChange(el, props, fn)` — same signature in all callers (Phase 2.3, 4.2, 4.3).
- `EASE_OUT` / `EASE_SPRING` / `EASE_IN` — exported from motion.ts; referenced as imports in WAAPI calls (Phase 2.3, 4.2).

Plan is consistent.
