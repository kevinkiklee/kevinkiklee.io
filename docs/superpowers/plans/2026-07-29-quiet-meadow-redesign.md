# Quiet Meadow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brutalist-terminal identity with the Quiet Meadow editorial-organic design (serif on sage paper, forest-night dark mode, animated field-guide-ink garden) per `docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md` (rev 2 — "the spec").

**Architecture:** Pure reskin + one decorative subsystem (garden SVG components + CSS animations + tiny head-script gating), one structural addition (home hero/h1), one replacement (progress bar → scroll-driven vine). Astro 5 static output is untouched; all work is CSS, .astro components, tokens, assets, and small inline JS.

**Tech Stack:** Astro 5, vanilla CSS (`@layer` cascade), Vitest, Source Serif 4 (static instances), JetBrains Mono (retained, code-only), Shiki `everforest-light`/`everforest-dark`.

## Global Constraints

- Package manager: **pnpm 9** (never npm/yarn). Node ≥ 24.
- Conventional Commits, subject ≤ 72 chars; use scope `redesign` for this branch.
- JS budget: **6 KB gzip per chunk** (`dist/client/_astro/*.js`) — CI-enforced. New inline JS in `<head>` ≤ 0.5 KB total added.
- Font budget: **≤ 125 KB total** in `public/fonts/` (excluding `public/fonts/og/`, which is server-side only).
- Per-page garden budget: **≤ 16 inline `<svg>` elements, ≤ 14 KB raw SVG** (counting hidden seasonal `<g>` groups).
- Token contrast: `fg`, `fgMuted`, `fgSubtle` vs `bg` must be **≥ 7:1 (AAA)** in both themes and all four seasonal backgrounds; `accent` ≥ 4.5:1 on `bg` and `codeBg`.
- Illustration register (spec §1.5): single-weight 1.2–1.4 strokes, `stroke-linecap="round"`, no fills (seed-dots/eye-dots excepted), `--garden-ink` at opacity 0.28–0.55, `aria-hidden="true"`, `pointer-events: none`, no faces/anthropomorphism/rotated-sticker placement.
- Animation: transforms/opacity on **whole `<svg>` elements** only; **never** the `animation` shorthand in garden rules (breaks pause cascade); declared paint exceptions: fin draw-in, autumn leaf.
- All work on branch `redesign/quiet-meadow`; one PR at the end.
- Do NOT touch: MDX content, content collections, schema/JSON-LD, feeds, sitemaps, llms.txt, IndexNow, Pagefind wiring, analytics, CSP contents, lighthouserc.cjs thresholds.

---

### Task 1: Branch preflight

**Files:**
- None created; git state only.

**Interfaces:**
- Produces: clean branch `redesign/quiet-meadow` all later tasks commit to.

- [ ] **Step 1: Verify the tree is clean**

Run: `git -C /Users/iser/workspace/kevinkiklee.io status --porcelain`
Expected: empty output. **If not empty: STOP and ask the user** whether to commit or stash their in-flight changes (10 dirty files existed at plan time — they are the user's work, not yours to commit).

- [ ] **Step 2: Create the branch**

```bash
git checkout main && git pull && git checkout -b redesign/quiet-meadow
```

Run: `git branch --show-current` → Expected: `redesign/quiet-meadow`

---

### Task 2: Serif font pipeline (Source Serif 4 static instances)

**Files:**
- Create: `public/fonts/source-serif-4-roman-400.woff2`, `public/fonts/source-serif-4-roman-600.woff2`, `public/fonts/source-serif-4-italic-400.woff2`
- Create: `public/fonts/og/SourceSerif4-Semibold-og.ttf` (subset TTF for Satori — Task 11 consumes it)
- Create: `scripts/subset-serif.sh`

**Interfaces:**
- Produces: the three woff2 filenames above — Task 3's `@font-face` blocks reference them verbatim.

- [ ] **Step 1: Download the official static TTFs**

```bash
cd /tmp && curl -LO https://github.com/adobe-fonts/source-serif/releases/download/4.005R/source-serif-4.005_Desktop.zip
unzip -o source-serif-4.005_Desktop.zip -d source-serif
ls source-serif/*/TTF/SourceSerif4-Regular.ttf source-serif/*/TTF/SourceSerif4-Semibold.ttf source-serif/*/TTF/SourceSerif4-It.ttf
```

Expected: three TTF paths print. (If the release layout differs, locate `SourceSerif4-Regular.ttf`, `SourceSerif4-Semibold.ttf`, `SourceSerif4-It.ttf` inside the zip and adjust paths in Step 2 — same filenames, different directory nesting.)

- [ ] **Step 2: Write `scripts/subset-serif.sh`**

```bash
#!/usr/bin/env bash
# Subsets Source Serif 4 static instances to the latin range the site uses.
# Requires: pipx (or pip-installed fonttools[woff]).
set -euo pipefail
SRC_DIR="${1:?usage: subset-serif.sh <dir containing SourceSerif4-*.ttf>}"
OUT=public/fonts
UNICODES='U+0000-00FF,U+2010-2027,U+2030,U+2039-203A,U+2044,U+2192,U+2197'
FLAGS=(--flavor=woff2 --layout-features='kern,liga' --unicodes="$UNICODES" --no-hinting --desubroutinize)
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Regular.ttf"  "${FLAGS[@]}" --output-file="$OUT/source-serif-4-roman-400.woff2"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Semibold.ttf" "${FLAGS[@]}" --output-file="$OUT/source-serif-4-roman-600.woff2"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-It.ttf"       "${FLAGS[@]}" --output-file="$OUT/source-serif-4-italic-400.woff2"
# OG variant keeps TTF flavor (Satori needs TTF) and only the glyphs titles use.
mkdir -p "$OUT/og"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Semibold.ttf" \
  --unicodes='U+0020-007E,U+2013,U+2014,U+2018-201D,U+2026' --layout-features='kern' \
  --output-file="$OUT/og/SourceSerif4-Semibold-og.ttf"
ls -la "$OUT"/source-serif-4-*.woff2 "$OUT/og/SourceSerif4-Semibold-og.ttf"
```

- [ ] **Step 3: Run it and verify the budget**

Run: `chmod +x scripts/subset-serif.sh && ./scripts/subset-serif.sh /tmp/source-serif/<dir-from-step-1>/TTF`
Then: `du -b public/fonts/*.woff2 | awk '{s+=$1; print} END {print "TOTAL", s}'`
Expected: each serif file ~15–25 KB; **TOTAL (all woff2 incl. the two existing JBM files) ≤ 128000 bytes**. If over: re-subset with `--layout-features=''` and/or trim `U+00A0-00FF` accents; if still over, STOP and flag — Q11's risk row says re-scope, never synthesize bold.

- [ ] **Step 4: Commit**

```bash
git add public/fonts scripts/subset-serif.sh
git commit -m "feat(redesign): add Source Serif 4 static-instance subsets"
```

---

### Task 3: Token rewrite — tokens.css, tokens.ts mirror, tests

**Files:**
- Modify: `src/styles/tokens.css` (full rewrite below)
- Modify: `src/lib/tokens.ts` (full rewrite below)
- Modify: `src/lib/tokens.test.ts` (extend to seasons)
- Modify: `src/lib/theme.test.ts` (replace `#0a0a0a`/`#f5f4ee` expectations with `#161b14`/`#eff1e7`)
- Modify: `src/lib/theme.ts` (same hex swap — grep confirms exact lines)

**Interfaces:**
- Produces: CSS custom properties `--bg --fg --fg-muted --fg-subtle --rule --rule-soft --panel --code-bg --accent --accent-rule --garden-ink --selection-bg --selection-fg --font-serif --font-sans --font-mono --weight-body`; `data-season="spring|summer|autumn|winter"` overrides; exports `tokens`, `seasonBackgrounds`, `aaaPairs`, `aaPairs` from `~/lib/tokens`.
- Consumes: font files from Task 2.

- [ ] **Step 1: Rewrite `src/styles/tokens.css`**

Replace the entire file with:

```css
@import "./motion.css";

:root {
  --font-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --text-xs: clamp(0.78rem, 0.75rem + 0.12vw, 0.83rem);
  --text-sm: clamp(0.92rem, 0.88rem + 0.18vw, 1.00rem);
  --text-base: clamp(1.0625rem, 1rem + 0.4vw, 1.125rem);
  --text-lg: clamp(1.20rem, 1.13rem + 0.35vw, 1.375rem);
  --text-xl: clamp(1.50rem, 1.40rem + 0.60vw, 1.875rem);
  --text-2xl: clamp(1.90rem, 1.70rem + 1.05vw, 2.625rem);

  --leading-body: 1.8;
  --leading-tight: 1.25;
  /* ~68 rendered chars of Source Serif 4 at 1em. Tuned by counting rendered
     characters (spec §1.2) — not ported from the mono-era 68ch. */
  --measure: 33em;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  --ease: cubic-bezier(0.33, 1, 0.68, 1);
  --header-h-mobile: 96px;
  --header-h-desktop: 80px;
  --weight-body: 400;
}

:root[data-theme="light"] {
  --bg: #eff1e7;
  --fg: #2c352b;
  --fg-muted: #49523f;
  --fg-subtle: #464f3b;
  --rule: #2c352b;
  --rule-soft: #ccd3bd;
  --panel: #f6f7ef;
  --pill-bg: var(--panel);      /* legacy alias until TagPill dies in Task 8 */
  --pill-fg: var(--fg);
  --code-bg: #e6e9da;
  --selection-bg: #2c352b;
  --selection-fg: #eff1e7;
  --accent: #8f4a26;
  --accent-rule: #8f4a26;
  --garden-ink: #3f4c3a;
}
:root[data-theme="light"][data-season="spring"] { --bg: #eef2e4; }
:root[data-theme="light"][data-season="autumn"] { --bg: #f2f0e3; }
:root[data-theme="light"][data-season="winter"] { --bg: #edefe9; }

:root[data-theme="dark"] {
  --bg: #161b14;
  --fg: #dfe3cf;
  --fg-muted: #aab599;
  --fg-subtle: #a0ac8e;
  --rule: #dfe3cf;
  --rule-soft: #313c2b;
  --panel: #1c221a;
  --pill-bg: var(--panel);
  --pill-fg: var(--fg);
  --code-bg: #10140e;
  --selection-bg: #dfe3cf;
  --selection-fg: #161b14;
  --accent: #d9a05b;
  --accent-rule: #d9a05b;
  --garden-ink: #7d8a6e;
}
:root[data-theme="dark"][data-season="spring"] { --bg: #151c12; }
:root[data-theme="dark"][data-season="autumn"] { --bg: #191b12; }
:root[data-theme="dark"][data-season="winter"] { --bg: #14181a; }

@media (forced-colors: active) {
  :root { --accent: LinkText; --accent-rule: LinkText; }
}
@media (prefers-contrast: more) {
  :root { --accent: var(--fg); --accent-rule: var(--fg); }
}

/*
 * Source Serif 4 static instances (latin subset, Task 2). Georgia fallback
 * is metric-matched so the swap costs zero CLS — the override numbers below
 * are STARTING values; Task 13 verifies CLS 0.00 and tunes if needed.
 */
@font-face {
  font-family: "Source Serif 4";
  src: url("/fonts/source-serif-4-roman-400.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
  size-adjust: 106%; ascent-override: 66%; descent-override: 21%; line-gap-override: 0%;
}
@font-face {
  font-family: "Source Serif 4";
  src: url("/fonts/source-serif-4-roman-600.woff2") format("woff2");
  font-weight: 600; font-style: normal; font-display: swap;
  size-adjust: 106%; ascent-override: 66%; descent-override: 21%; line-gap-override: 0%;
}
@font-face {
  font-family: "Source Serif 4";
  src: url("/fonts/source-serif-4-italic-400.woff2") format("woff2");
  font-weight: 400; font-style: italic; font-display: swap;
  size-adjust: 106%; ascent-override: 66%; descent-override: 21%; line-gap-override: 0%;
}

/* JetBrains Mono — code blocks only. Both subsets retained; existing posts
   use box-drawing glyphs from the extended file. Metric overrides unchanged. */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono.woff2") format("woff2-variations");
  font-weight: 100 800; font-display: swap;
  unicode-range: U+0000-007F, U+00A0-00FF, U+2192, U+2197;
  size-adjust: 102%; ascent-override: 80%; descent-override: 20%; line-gap-override: 0%;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-ext.woff2") format("woff2-variations");
  font-weight: 100 800; font-display: swap;
  unicode-range: U+2010-2027, U+2030, U+2032-2033, U+2070, U+2074-2079, U+20A0-20BF, U+2122, U+2191,
    U+2193-2196, U+2198-2199, U+2500-257F, U+2580-259F;
  size-adjust: 102%; ascent-override: 80%; descent-override: 20%; line-gap-override: 0%;
}
```

Note: `--font-display` (IBM Plex Mono) is intentionally gone (spec Q4). `--weight-body` is 400 in both themes (static instances; the 450 dark bump was mono-specific).

- [ ] **Step 2: Rewrite `src/lib/tokens.ts`**

```ts
// Mirror of src/styles/tokens.css — keep in sync when tokens change.
export const tokens = {
  light: {
    bg: '#eff1e7',
    fg: '#2c352b',
    fgMuted: '#49523f',
    fgSubtle: '#464f3b',
    rule: '#2c352b',
    ruleSoft: '#ccd3bd',
    panel: '#f6f7ef',
    codeBg: '#e6e9da',
    accent: '#8f4a26',
    gardenInk: '#3f4c3a',
  },
  dark: {
    bg: '#161b14',
    fg: '#dfe3cf',
    fgMuted: '#aab599',
    fgSubtle: '#a0ac8e',
    rule: '#dfe3cf',
    ruleSoft: '#313c2b',
    panel: '#1c221a',
    codeBg: '#10140e',
    accent: '#d9a05b',
    gardenInk: '#7d8a6e',
  },
} as const;

/** Seasonal --bg overrides (spec §3.4): only bg and garden-ink may vary. */
export const seasonBackgrounds = {
  light: { spring: '#eef2e4', summer: '#eff1e7', autumn: '#f2f0e3', winter: '#edefe9' },
  dark: { spring: '#151c12', summer: '#161b14', autumn: '#191b12', winter: '#14181a' },
} as const;

/** Pairs that must reach the AAA body threshold (7:1). */
export const aaaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'bg'],
  ['fgMuted', 'bg'],
  ['fgSubtle', 'bg'],
];

/** Pairs that must reach AA (4.5:1). */
export const aaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'codeBg'],
  ['accent', 'bg'],
  ['accent', 'codeBg'],
];
```

(`pillFg`/`pillBg` pair deleted — the pill inversion dies in Task 8.)

- [ ] **Step 3: Extend `src/lib/tokens.test.ts` for seasons**

Open the file; it iterates `aaaPairs`/`aaPairs` against `tokens.light`/`tokens.dark` using an existing contrast helper. Keep that machinery and ADD:

```ts
import { seasonBackgrounds } from './tokens';

describe('seasonal backgrounds hold AAA text contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [season, bg] of Object.entries(seasonBackgrounds[theme])) {
      for (const fgKey of ['fg', 'fgMuted', 'fgSubtle'] as const) {
        it(`${theme}/${season}: ${fgKey} on ${bg} ≥ 7:1`, () => {
          expect(contrast(tokens[theme][fgKey], bg)).toBeGreaterThanOrEqual(7);
        });
      }
      it(`${theme}/${season}: accent on ${bg} ≥ 4.5:1`, () => {
        expect(contrast(tokens[theme].accent, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
```

(Use the file's actual contrast helper name — read it first; if it lives in another module, import from there.)

- [ ] **Step 4: Update theme lib + test hexes**

Run: `grep -rn '#0a0a0a\|#f5f4ee' src/lib/ src/layouts/BaseLayout.astro`
In `src/lib/theme.ts` and `src/lib/theme.test.ts`: replace `#0a0a0a` → `#161b14` and `#f5f4ee` → `#eff1e7` (BaseLayout is Task 4's job — leave it).

- [ ] **Step 5: Run the token/theme tests**

Run: `pnpm vitest run src/lib/tokens.test.ts src/lib/theme.test.ts`
Expected: PASS (all pairs ≥ thresholds; if a seasonal pair fails, the seasonal bg value is wrong — fix the value, not the test).

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/lib/tokens.ts src/lib/tokens.test.ts src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat(redesign): quiet-meadow tokens, serif faces, season backgrounds"
```

---

### Task 4: BaseLayout — head script (theme hexes, season, pause restore, prerender gate), theme-color metas

**Files:**
- Modify: `src/layouts/BaseLayout.astro:41-77` (metas + inline script)

**Interfaces:**
- Produces: `html[data-season="…"]`, `html[data-garden-paused]` (presence = paused), `html[data-garden-anim]` (presence = one-shots may run). Task 5's CSS and Task 6's pause button consume these exact attribute names, and `localStorage` keys `theme`, `garden-paused`.

- [ ] **Step 1: Update the three `theme-color` metas**

`#f5f4ee` → `#eff1e7` (both occurrences), `#0a0a0a` → `#161b14`.

- [ ] **Step 2: Extend the inline theme script**

Replace the body of the existing `apply()` IIFE (BaseLayout.astro:51-77) with:

```js
(function () {
  function apply() {
    var stored = null, paused = null;
    try { stored = localStorage.getItem('theme'); paused = localStorage.getItem('garden-paused'); } catch (e) {}
    var prefers = matchMedia('(prefers-color-scheme: dark)').matches;
    var t = stored === 'dark' || stored === 'light' ? stored : (prefers ? 'dark' : 'light');
    var bg = t === 'dark' ? '#161b14' : '#eff1e7';
    var d = document.documentElement;
    d.dataset.theme = t;
    d.style.background = bg;
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', bg);
    // Season by the author's calendar (spec §3.4) — month-based, NH.
    var m = new Date().getMonth(); // 0-11
    d.dataset.season = m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
    // WCAG 2.2.2 pause state (spec §3.5).
    if (paused === '1') d.dataset.gardenPaused = '';
    else delete d.dataset.gardenPaused;
    // One-shot gate: never run entrance animations inside a prerender (§3.3).
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', function () { d.dataset.gardenAnim = ''; }, { once: true });
    } else {
      d.dataset.gardenAnim = '';
    }
  }
  apply();
  document.addEventListener('astro:after-swap', apply);
})();
```

- [ ] **Step 3: Swap the font preload (spec §1.2: preload roman 400 only)**

Run: `grep -rn "preload" src/components/BaseHead.astro`
Replace any JetBrains Mono font preload with:

```html
<link rel="preload" href="/fonts/source-serif-4-roman-400.woff2" as="font" type="font/woff2" crossorigin />
```

(JBM is code-only now — it must NOT be preloaded; it lazy-loads on pages with code blocks via `unicode-range`.)

- [ ] **Step 4: Verify size + behavior**

Run: `pnpm build` → Expected: builds green.
Run: `pnpm dev`, open `http://localhost:4321/`, in DevTools console check: `document.documentElement.dataset` → Expected: `theme`, `season: "summer"` (July), `gardenAnim: ""` present.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(redesign): season/pause/prerender head-script, meadow theme-colors"
```

---

### Task 5: Garden system — SVG component library + garden.css

**Files:**
- Create: `src/components/garden/Wren.astro`, `Swallow.astro`, `HeroCluster.astro`, `MeadowTuft.astro`, `Sprig.astro`, `FinMark.astro`, `Heron.astro`, `ProgressVine.astro`, `SeedScene.astro`, `LeafMarker.astro`
- Create: `src/styles/garden.css`
- Modify: `src/styles/global.css:3-8` (add import)

**Interfaces:**
- Produces: the ten components above (all prop-less except `MeadowTuft` (`variant: 1|2|3|4|5`) and `Sprig` (`kind?: 'grass'|'fern'`)); CSS classes `garden-sway garden-sway-b garden-sway-c garden-flick garden-fly garden-draw garden-fall`; all animation gated by `html[data-garden-anim]` (one-shots) and paused by `html[data-garden-paused]`.
- Consumes: `--garden-ink` token (Task 3), html data attributes (Task 4).

- [ ] **Step 1: Write `src/styles/garden.css`**

```css
@layer components {
  /* Field-guide ink garden (spec §3). LONGHAND animation properties only —
     the pause rule below must never be reset by a shorthand. */
  .garden { pointer-events: none; }
  .garden svg { display: inline-block; }

  .garden-sway,
  .garden-sway-b,
  .garden-sway-c {
    animation-name: garden-sway;
    animation-duration: 7s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    transform-origin: 50% 100%;
  }
  .garden-sway-b { animation-duration: 9.5s; animation-delay: -3.2s; }
  .garden-sway-c { animation-duration: 8.2s; animation-delay: -5.1s; }
  @keyframes garden-sway { from { transform: rotate(-1.6deg); } to { transform: rotate(2deg); } }

  .garden-flick {
    animation-name: garden-flick;
    animation-duration: 7s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    transform-origin: 70% 80%;
  }
  @keyframes garden-flick {
    0%, 88%, 100% { transform: rotate(0); }
    92% { transform: rotate(-3deg); }
    96% { transform: rotate(1.5deg); }
  }

  /* One-shots: run only once the head script clears the prerender gate. */
  html[data-garden-anim] .garden-fly {
    animation-name: garden-fly;
    animation-duration: 14s;
    animation-timing-function: linear;
    animation-delay: 2s;
    animation-fill-mode: both;
    animation-iteration-count: 1;
  }
  .garden-fly { opacity: 0; }
  @keyframes garden-fly {
    0% { transform: translate(-8vw, 10px); opacity: 0; }
    6% { opacity: 0.5; }
    94% { opacity: 0.5; }
    100% { transform: translate(105vw, -6px); opacity: 0; }
  }

  html[data-garden-anim] .garden-draw path {
    stroke-dasharray: 260;
    stroke-dashoffset: 260;
    animation-name: garden-draw;
    animation-duration: 0.6s;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
  }
  @keyframes garden-draw { to { stroke-dashoffset: 0; } }

  html[data-season="autumn"][data-garden-anim] .garden-fall {
    animation-name: garden-fall;
    animation-duration: 11s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
  .garden-fall { opacity: 0; }
  html:not([data-season="autumn"]) .garden-fall { display: none; }
  @keyframes garden-fall {
    0% { transform: translate(0, -10px) rotate(0); opacity: 0; }
    8% { opacity: 0.5; }
    50% { transform: translate(-14px, 60px) rotate(70deg); }
    90% { opacity: 0.45; }
    100% { transform: translate(6px, 130px) rotate(150deg); opacity: 0; }
  }

  /* Seasonal slots: exactly one <g> visible per season (spec §3.1). */
  .garden [data-g-season] { display: none; }
  html[data-season="spring"] .garden [data-g-season="spring"],
  html[data-season="summer"] .garden [data-g-season="summer"],
  html[data-season="autumn"] .garden [data-g-season="autumn"],
  html[data-season="winter"] .garden [data-g-season="winter"] { display: inline; }
}

/* Pause + reduced motion live OUTSIDE @layer so they outrank every layered
   rule regardless of future layer edits (spec §3.5 cascade requirement). */
html[data-garden-paused] .garden-sway,
html[data-garden-paused] .garden-sway-b,
html[data-garden-paused] .garden-sway-c,
html[data-garden-paused] .garden-flick,
html[data-garden-paused] .garden-fall {
  animation-play-state: paused;
}
/* One-shots jump to END state when paused — a frozen pre-run fin is
   invisible and a mid-air swallow is worse than none. */
html[data-garden-paused] .garden-fly { animation-name: none; opacity: 0; }
html[data-garden-paused] .garden-draw path { animation-name: none; stroke-dashoffset: 0; stroke-dasharray: none; }

@media (prefers-reduced-motion: reduce) {
  .garden-sway, .garden-sway-b, .garden-sway-c, .garden-flick, .garden-fall { animation-name: none; }
  .garden-fly { animation-name: none; opacity: 0; }
  .garden-draw path { animation-name: none !important; stroke-dashoffset: 0 !important; stroke-dasharray: none !important; }
}

@media print {
  .garden { display: none; }
}
```

- [ ] **Step 2: Add the import to `src/styles/global.css`**

After line 4 (`progress.css` import — which Task 8 deletes):

```css
@import "./garden.css" layer(components);
```

- [ ] **Step 3: Write the ten components**

Every component root: `<span class="garden" aria-hidden="true">…</span>`. All strokes `stroke="var(--garden-ink)"` `stroke-width="1.3"` `fill="none"` `stroke-linecap="round"`; opacities per spec register. Full source:

`Wren.astro`:
```astro
<span class="garden garden-wren" aria-hidden="true">
  <svg class="garden-flick" viewBox="0 0 56 40" width="50" height="36">
    <g fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.55">
      <path d="M12 29 C13 21 21 15 29 16 C36 16.5 40 20 41 24 C41.5 26.5 39 28.5 36 29.2 L14 29.2" />
      <path d="M13 29 L4 34" />
      <path d="M41 24 L46.5 23.2" />
      <circle cx="34.5" cy="20.5" r="0.9" fill="var(--garden-ink)" stroke="none" />
      <path d="M27 29.2 L27 36 M32 29.2 L32 36" />
    </g>
  </svg>
</span>
```

`Swallow.astro`:
```astro
<span class="garden garden-swallow" aria-hidden="true">
  <svg class="garden-fly" viewBox="0 0 40 20" width="26" height="13">
    <path d="M2 13 C8 5 14 5 20 11 C26 5 32 5 38 13 M20 11 L20 14"
      fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" />
  </svg>
</span>
```

`HeroCluster.astro` (ONE `<svg>`, four seasonal `<g>` groups — spec §3.1):
```astro
<span class="garden garden-hero-cluster" aria-hidden="true">
  <svg class="garden-sway" viewBox="0 0 60 70" width="62" height="72">
    <g data-g-season="spring" fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.42">
      <path d="M30 68 C30 50 30 40 30 28 M30 28 C30 21 33 16 39 13 M30 38 C25 36 22 31 23 25" />
      <ellipse cx="40" cy="11.5" rx="2.4" ry="3.4" /><ellipse cx="22" cy="23" rx="2" ry="3" />
    </g>
    <g data-g-season="summer" fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.42">
      <path d="M30 68 C28 50 21 36 12 26 M30 68 C31 48 36 34 46 22 M30 68 C29 52 27 40 25 30 M30 68 C33 54 38 46 44 40" />
    </g>
    <g data-g-season="autumn" fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.42">
      <path d="M30 68 C30 46 34 30 30 22 M30 22 L19 11 M30 22 L26 8 M30 22 L35 7 M30 22 L41 12" />
      <circle cx="19" cy="11" r="1.7" /><circle cx="26" cy="8" r="1.7" /><circle cx="35" cy="7" r="1.7" /><circle cx="41" cy="12" r="1.7" />
    </g>
    <g data-g-season="winter" fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.42">
      <path d="M30 68 C30 50 30 38 30 24 M30 40 L22 32 M30 40 L38 32 M30 30 L24 24 M30 30 L36 24" />
      <circle cx="17" cy="16" r="0.9" fill="var(--garden-ink)" stroke="none" />
      <circle cx="41" cy="12" r="0.9" fill="var(--garden-ink)" stroke="none" />
      <circle cx="34" cy="20" r="0.9" fill="var(--garden-ink)" stroke="none" />
    </g>
  </svg>
</span>
```

`MeadowTuft.astro` (5 shape variants × 4 seasonal groups; sway class rotates by variant):
```astro
---
interface Props { variant: 1 | 2 | 3 | 4 | 5 }
const { variant } = Astro.props;
const sway = ['garden-sway', 'garden-sway-b', 'garden-sway-c'][variant % 3];
// Five silhouettes so the meadow doesn't repeat; seasons alter density.
const summer: Record<number, string> = {
  1: 'M30 58 C28 44 22 34 14 27 M30 58 C31 42 36 32 45 24 M30 58 C30 46 29 38 28 30',
  2: 'M30 58 C28 42 21 30 12 22 M30 58 C31 40 36 28 46 18 M30 58 C33 46 38 40 44 36',
  3: 'M14 58 C20 46 30 34 46 24 M22 47 C20 44 20 40 21 36 M30 39 C27 37 26 33 27 29 M38 31 C35 30 33 26 34 22',
  4: 'M30 58 C29 46 24 36 16 30 M30 58 C32 44 38 36 46 30 M30 58 C30 48 30 40 30 34',
  5: 'M30 58 C30 44 30 36 30 26 M30 26 L21 18 M30 26 L30 12 M30 26 L39 17',
};
const winter: Record<number, string> = {
  1: 'M30 58 C30 46 30 38 30 28 M30 38 L24 32 M30 38 L36 32',
  2: 'M30 58 C29 44 27 36 26 28 M26 34 L21 29',
  3: 'M30 58 C31 46 33 38 34 30 M34 36 L39 31',
  4: 'M30 58 C30 48 30 42 30 34',
  5: 'M30 58 C30 46 30 40 30 30 M30 36 L25 31 M30 36 L35 31',
};
---
<span class="garden garden-tuft" aria-hidden="true">
  <svg class={sway} viewBox="0 0 60 60" width="38" height="42">
    <g data-g-season="spring" fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.3">
      <path d={winter[variant]} /><ellipse cx="30" cy="26" rx="1.8" ry="2.6" />
    </g>
    <g data-g-season="summer" fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.3">
      <path d={summer[variant]} />
    </g>
    <g data-g-season="autumn" fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.3">
      <path d={summer[variant]} /><circle cx="30" cy="24" r="1.5" /><circle cx="22" cy="20" r="1.5" />
    </g>
    <g data-g-season="winter" fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.3">
      <path d={winter[variant]} />
    </g>
  </svg>
</span>
```

`Sprig.astro`:
```astro
---
interface Props { kind?: 'grass' | 'fern' }
const { kind = 'grass' } = Astro.props;
const d = kind === 'fern'
  ? 'M2 10 C10 9 14 6 20 3 M8 8 C8 6 8 5 9 3 M14 6 C13 4 13 3 14 1'
  : 'M2 9 C10 9 12 3 20 3 M20 3 L24 6 M20 3 L25 1';
---
<span class="garden garden-sprig" aria-hidden="true">
  <svg viewBox="0 0 46 12" width="40" height="11">
    <path d={d} fill="none" stroke="var(--garden-ink)" stroke-width="1" stroke-linecap="round" opacity="0.6" />
  </svg>
</span>
```

`FinMark.astro`:
```astro
<span class="garden garden-fin" aria-hidden="true">
  <svg class="garden-draw" viewBox="0 0 80 34" width="72" height="30">
    <path d="M8 28 C24 26 34 18 40 6 M40 6 C46 18 56 26 72 28 M40 6 L40 28"
      fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.55" />
  </svg>
</span>
```

`Heron.astro`:
```astro
<span class="garden garden-heron" aria-hidden="true">
  <svg viewBox="0 0 60 92" width="44" height="66">
    <g fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.55">
      <path d="M24 10 L38 7 M24 10 C20 10 18 13 19 16 C20 19 24 20 26 18" />
      <circle cx="22.5" cy="12.5" r="0.9" fill="var(--garden-ink)" stroke="none" />
      <path d="M19 16 C14 24 16 32 22 38 C28 44 30 50 28 56 C26 62 20 64 16 62" />
      <path d="M28 44 C36 42 42 46 42 54 C42 62 34 66 26 64 C20 62.5 16 58 16 52" />
      <path d="M26 64 L26 84 M33 63 L33 84 M26 84 L21 88 M33 84 L38 88" />
    </g>
  </svg>
</span>
```

`ProgressVine.astro` (spec §3.2 — masked reveal, reuses the existing `--post` view-timeline):
```astro
<div class="garden vine" aria-hidden="true">
  <svg viewBox="0 0 30 600" preserveAspectRatio="none">
    <path d="M15 4 C10 40 20 76 15 116 C10 156 20 192 15 232 C11 268 19 304 15 344 C12 380 17 420 15 460 C13 500 17 550 15 596"
      fill="none" stroke="var(--garden-ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.5" />
    <path d="M15 60 C10 56 8 51 9 46 M15 140 C20 136 22 131 21 126 M15 220 C10 216 8 211 9 206 M15 300 C20 296 22 291 21 286 M15 380 C10 376 8 371 9 366 M15 460 C20 456 22 451 21 446 M15 540 C10 536 8 531 9 526"
      fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.5" />
  </svg>
  <span class="vine-cover"></span>
</div>

<style>
  .vine {
    display: none;
    position: absolute;
    left: calc(-1 * var(--space-7));
    top: 0;
    bottom: 0;
    width: 26px;
    overflow: hidden;
  }
  .vine svg { width: 26px; height: 100%; }
  /* Fallback (Firefox stable, old Safari): fully grown, no cover. */
  .vine-cover { display: none; }
  @media (min-width: 1100px) {
    .vine { display: block; }
  }
  @supports (animation-timeline: --x) {
    .vine-cover {
      display: block;
      position: absolute;
      inset: 0;
      background: var(--bg);
      /* Compositor-only reveal: cover translates down as the post scrolls.
         NEVER scroll-drive stroke-dashoffset (paints every frame). */
      animation-name: vine-reveal;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --post;
      animation-range: cover 0% cover 100%;
    }
    @keyframes vine-reveal { to { transform: translateY(101%); } }
  }
  @media (prefers-reduced-motion: reduce) {
    .vine-cover { display: none; }
  }
  @media print {
    .vine { display: none; }
  }
</style>
```

`SeedScene.astro` (404):
```astro
<span class="garden garden-seedscene" aria-hidden="true">
  <svg class="garden-sway" viewBox="0 0 100 70" width="120" height="84">
    <g fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.5">
      <path d="M50 66 C50 48 49 38 50 28 M50 28 L38 16 M50 28 L46 12 M50 28 L57 11 M50 28 L63 15" />
      <circle cx="38" cy="16" r="1.8" /><circle cx="46" cy="12" r="1.8" /><circle cx="57" cy="11" r="1.8" /><circle cx="63" cy="15" r="1.8" />
      <path d="M20 66 C19 56 15 48 9 43 M20 66 C22 54 27 47 34 42 M80 66 C79 58 76 52 71 48 M80 66 C82 56 86 50 92 46" />
    </g>
  </svg>
</span>
```

`LeafMarker.astro`:
```astro
<span class="garden garden-leaf" aria-hidden="true">
  <svg viewBox="0 0 20 20" width="18" height="18">
    <path d="M10 17 C10 11 11 7 16 3 M10 17 C10 12 8 8 4 5"
      fill="none" stroke="var(--garden-ink)" stroke-width="1.2" stroke-linecap="round" opacity="0.6" />
  </svg>
</span>
```

- [ ] **Step 4: Build check + commit**

Run: `pnpm build` → Expected: green (components unused so far; import graph still validates).

```bash
git add src/components/garden src/styles/garden.css src/styles/global.css
git commit -m "feat(redesign): garden SVG library, animation system, pause/season CSS"
```

---

### Task 6: Header, Footer, ThemeToggle frame + GardenPause control

**Files:**
- Modify: `src/components/Header.astro` (drop `$`/caret terminal branding; serif-adjacent sans frame; add Wren)
- Modify: `src/components/Footer.astro` (meadow + pause control)
- Create: `src/components/GardenPause.astro`
- Modify: `src/components/ShortcutsOverlay.astro` (mirror the pause control — grep for its list markup and append one row rendering `<GardenPause />`)

**Interfaces:**
- Consumes: `Wren`, `MeadowTuft` from Task 5; `data-garden-paused` + localStorage key `garden-paused` from Task 4.
- Produces: `<GardenPause />` — a self-contained toggle button component (no props).

- [ ] **Step 1: Write `src/components/GardenPause.astro`**

```astro
<button type="button" class="garden-pause" data-garden-pause aria-pressed="false">
  <span class="when-running">Pause the garden</span>
  <span class="when-paused">Resume the garden</span>
</button>

<script>
  // WCAG 2.2.2 mechanism (spec §3.5). Head script restores persisted state
  // pre-paint; this button toggles it. Document-level delegation survives
  // ClientRouter swaps (same pattern as Header's #search-trigger).
  function syncPauseButtons() {
    const paused = 'gardenPaused' in document.documentElement.dataset;
    document.querySelectorAll<HTMLButtonElement>('[data-garden-pause]').forEach((b) => {
      b.setAttribute('aria-pressed', String(paused));
    });
  }
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest('[data-garden-pause]');
    if (!btn) return;
    const d = document.documentElement;
    const paused = !('gardenPaused' in d.dataset);
    if (paused) d.dataset.gardenPaused = '';
    else delete d.dataset.gardenPaused;
    try { localStorage.setItem('garden-paused', paused ? '1' : '0'); } catch {}
    syncPauseButtons();
  });
  syncPauseButtons();
  document.addEventListener('astro:page-load', syncPauseButtons);
</script>

<style>
  .garden-pause {
    background: none;
    border: 1px solid var(--rule-soft);
    color: var(--fg-muted);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-4);
    min-height: 44px;
    cursor: pointer;
    transition: color 180ms var(--ease), border-color 180ms var(--ease);
  }
  .garden-pause:hover, .garden-pause:focus-visible { color: var(--fg); border-color: var(--fg-muted); }
  .garden-pause .when-paused { display: none; }
  :global(html[data-garden-paused]) .garden-pause .when-running { display: none; }
  :global(html[data-garden-paused]) .garden-pause .when-paused { display: inline; }
</style>
```

- [ ] **Step 2: Restyle Header**

In `src/components/Header.astro`: delete the `$` prompt span, the `.cursor` span and its `caret-blink` keyframes + forced-colors override (lines 21, 92-113); brand becomes `Kevin Lee` (keep `view-transition-name: site-brand`, drop `is-caps`). Insert `<Wren />` absolutely positioned on the border-bottom (import from `~/components/garden/Wren.astro`). Style deltas:

```css
.site-header { border-bottom: 1px solid var(--rule-soft); /* was 2px solid var(--rule) */ position: sticky; /* keep rest */ }
.brand { font-family: var(--font-sans); font-weight: 650; font-size: var(--text-sm); letter-spacing: -0.01em; }
.garden-wren { position: absolute; right: 64px; bottom: -2px; }
@media (max-width: 640px) { .garden-wren { display: none; } }
```

(`.site-header` needs `position: sticky` retained and no `overflow: hidden` — the wren hangs on the rule. Keep nav/tap-target/mask rules unchanged; swap `letter-spacing: 0.06em` caps styling for sentence-case links: change link labels to `Writing`, `Projects`, `About` and `/` search stays.)

- [ ] **Step 3: Restyle Footer + plant the meadow**

In `src/components/Footer.astro`: delete the `$ exit` `.eof` span; add above the `.row` a meadow strip and the pause control into the link list:

```astro
---
import GardenPause from './GardenPause.astro';
import MeadowTuft from './garden/MeadowTuft.astro';
// existing imports stay
---
<footer class="site-footer">
  <div class="meadow" aria-hidden="true">
    <MeadowTuft variant={1} /><MeadowTuft variant={2} /><MeadowTuft variant={3} /><MeadowTuft variant={4} /><MeadowTuft variant={5} />
  </div>
  <div class="row">
    <span>© {year} {SITE.author}</span>
    <ul role="list" aria-label="Footer links"> …existing links… </ul>
    <GardenPause />
  </div>
</footer>
```

```css
.site-footer { border-top: 1px solid var(--rule-soft); position: relative; content-visibility: auto; contain-intrinsic-size: 1px 160px; }
.meadow { position: absolute; top: -42px; left: 0; right: 0; height: 42px; display: flex; justify-content: space-between; padding: 0 6%; pointer-events: none; }
```

Home-only small bird in the meadow (spec §3.1): Footer is rendered by BaseLayout, so gate on the URL:

```astro
---
const isHome = Astro.url.pathname === '/';
---
{isHome && (
  <span class="garden meadow-bird" aria-hidden="true">
    <svg viewBox="0 0 56 40" width="30" height="22">
      <g fill="none" stroke="var(--garden-ink)" stroke-width="1.3" stroke-linecap="round" opacity="0.45">
        <path d="M12 29 C13 21 21 15 29 16 C36 16.5 40 20 41 24 C41.5 26.5 39 28.5 36 29.2 L14 29.2" />
        <path d="M13 29 L4 34" />
        <circle cx="34.5" cy="20.5" r="0.9" fill="var(--garden-ink)" stroke="none" />
      </g>
    </svg>
  </span>
)}
```

(placed inside `.meadow`, static — no animation class.)

- [ ] **Step 4: Verify + commit**

Run: `pnpm dev` — check header wren flicks, footer meadow sways, pause button freezes both and persists across reload (`localStorage.getItem('garden-paused')` → `"1"`).

```bash
git add src/components/Header.astro src/components/Footer.astro src/components/GardenPause.astro src/components/ShortcutsOverlay.astro
git commit -m "feat(redesign): meadow frame — header wren, footer meadow, garden pause"
```

---

### Task 7: Home page — hero (new h1), post rows, section labels, project tiles

**Files:**
- Modify: `src/pages/index.astro` (hero section)
- Modify: `src/components/PostCard.astro` (bordered block → hairline list row; KEEP both `<script>` blocks — the view-transition morph must survive)
- Modify: `src/components/SectionTitle.astro` (sprig + letterspaced sans label)
- Modify: `src/components/ProjectCard.astro` (panel tile restyle)

**Interfaces:**
- Consumes: `HeroCluster`, `Swallow`, `Sprig` (Task 5).
- Produces: home `<h1 id="hero-title">` — the page's LCP candidate and the F-005 resolution Task 12 documents.

- [ ] **Step 1: Add the hero to `src/pages/index.astro`**

Before the `latest` section:

```astro
---
import HeroCluster from '~/components/garden/HeroCluster.astro';
import Swallow from '~/components/garden/Swallow.astro';
// existing imports stay
---
<section class="hero" aria-labelledby="hero-title">
  <Swallow />
  <h1 id="hero-title">Essays on the web platform, written at a walking pace.</h1>
  <p class="hero-sub">Developer relations at Chrome. Prerendering, performance, and the parts of the platform nobody reads the spec for.</p>
  <HeroCluster />
</section>

<style>
  .hero { position: relative; margin-top: var(--space-7); overflow-x: clip; }
  .hero h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: 400;
    line-height: 1.3;
    max-width: 22ch;
  }
  .hero-sub {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--fg-muted);
    margin-top: var(--space-4);
    max-width: 48ch;
  }
  .hero .garden-hero-cluster { position: absolute; right: var(--space-4); bottom: -6px; }
  .hero .garden-swallow { position: absolute; left: 0; top: -18px; }
  @media (max-width: 640px) { .hero .garden-hero-cluster { display: none; } }
</style>
```

- [ ] **Step 2: PostCard → list row**

Markup unchanged except: drop `.marker` span + its CSS triangle; add a date element PostMeta already renders. Replace the `<style>` block's card rules:

```css
.post-card { border-top: 1px solid var(--rule-soft); padding: var(--space-4) 0; /* keep container/content-visibility/contain lines */ }
.post-card h3 { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-lg); }
.post-card p { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--fg-muted); }
.post-card .cta { font-family: var(--font-sans); color: var(--accent); }
```

Keep hover/focus-within rules and BOTH `<script>` blocks byte-identical.

- [ ] **Step 3: SectionTitle → label + sprig**

```astro
---
import Sprig from './garden/Sprig.astro';
// props unchanged
---
<Tag class="section-title" id={id}>
  <span class="name">{name}</span>
  <Sprig />
  {allHref && <a class="all" href={allHref}>All →</a>}
</Tag>
```

```css
.section-title .name {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--fg-subtle);
}
.section-title .all { margin-left: auto; font-family: var(--font-sans); font-size: var(--text-xs); color: var(--accent); }
```

(Callers pass lowercase names like `latest`; uppercase now comes from CSS so the accessible name stays lowercase — no caller changes.)

- [ ] **Step 4: ProjectCard → panel tile**

Replace its border/background rules with: `border: 1px solid var(--rule-soft); background: var(--panel); padding: var(--space-4); font-family: var(--font-sans);` — keep link/title semantics and any scripts untouched.

- [ ] **Step 5: Verify + commit**

Run: `pnpm dev` — home shows hero h1 (serif), swallow flies once ~2s after load, cluster sways; rows are hairline separated; `pnpm build` green.

```bash
git add src/pages/index.astro src/components/PostCard.astro src/components/SectionTitle.astro src/components/ProjectCard.astro
git commit -m "feat(redesign): home hero with h1, hairline post rows, sprig labels"
```

---

### Task 8: Post experience — prose, code, vine (bar removed), fin, tags

**Files:**
- Modify: `src/styles/prose.css` (serif body), `src/styles/code.css` (panel + everforest)
- Modify: `astro.config.ts` (Shiki themes: `min-light`→`everforest-light`, `min-dark`→`everforest-dark`)
- Modify: `src/layouts/PostLayout.astro` (mount `ProgressVine` + `FinMark`; DELETE the progress `<script>` block at ~263-277 and `body[data-progress]` usage)
- Delete: `src/styles/progress.css`, `src/lib/reading-progress-fallback.ts`
- Modify: `src/styles/global.css` (remove progress.css import; base font swap; focus outline; link policy)
- Modify: `src/components/TagPill.astro` (pill → metadata text link), `src/components/Breadcrumbs.astro`, `src/components/PostMeta.astro`, `src/components/PostNav.astro`, `src/components/RelatedPosts.astro`, `src/components/TableOfContents.astro` (font-family/border swaps only: `var(--font-mono)`→`var(--font-sans)`, `2px solid var(--rule)`→`1px solid var(--rule-soft)` — grep each file for those two patterns)

**Interfaces:**
- Consumes: `ProgressVine`, `FinMark`, `LeafMarker` (Task 5).
- Produces: none consumed later.

- [ ] **Step 1: Base typography + focus + links in `global.css`**

In `@layer base`: `html { font-family: var(--font-serif); }` (was `var(--font-mono)`); headings `h1,h2,h3 { font-family: var(--font-serif); font-weight: 600; }` (drop `--font-display`); replace the `:focus-visible` box-shadow block + keyframes with:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  box-shadow: none;
}
```

Add the link policy (spec §1.3):

```css
.prose a { text-decoration: underline; text-underline-offset: 0.2em; text-decoration-color: var(--accent); }
```

Delete line 4 of global.css (`@import "./progress.css" layer(components);`).

- [ ] **Step 2: prose.css + code.css**

prose.css: body text inherits serif now; set `.prose { max-width: var(--measure); }`, blockquote:

```css
.prose blockquote {
  border-left: 2px solid var(--garden-ink);
  padding-left: var(--space-4);
  font-style: italic;
  color: var(--fg-muted);
  position: relative;
}
```

(Task step in PostLayout mounts `<LeafMarker />` at the blockquote rule head via `.prose blockquote > :global(.garden-leaf) { position: absolute; left: -10px; top: -10px; background: var(--bg); }` — if injecting into rendered MDX is impractical, apply the leaf to blockquote via the component only in layouts that own their markup and skip MDX blockquotes; do NOT post-process MDX HTML.)

code.css: `pre { background: var(--code-bg) !important; border: 1px solid var(--rule-soft); }` and inline code `code { background: var(--code-bg); font-family: var(--font-mono); }`.

astro.config.ts: change the two Shiki theme strings to `everforest-light` / `everforest-dark`.

- [ ] **Step 3: Replace progress bar with vine**

In PostLayout.astro: import + mount `<ProgressVine />` as the first child of the `.post` article (which already carries `view-timeline-name: --post` — MOVE that declaration from the deleted progress.css into ProgressVine's parent selector in PostLayout's style block: `.post { view-timeline-name: --post; position: relative; }`). Mount `<FinMark />` after the article body slot. Delete the `setProgress/clearProgress` script block and the dynamic `import('~/lib/reading-progress-fallback')`. Then:

```bash
git rm src/styles/progress.css src/lib/reading-progress-fallback.ts
grep -rn "data-progress\|reading-progress" src/ && echo "LEFTOVERS — fix" || echo "clean"
```

- [ ] **Step 4: TagPill → metadata link**

Replace pill markup/styles: `<a class="tag" href={…}>{tag}</a>` with `color: var(--accent); font-family: var(--font-sans); font-size: var(--text-xs);` + underline on hover/focus only. Remove `background: var(--pill-bg)` styles. Then remove the `--pill-bg/--pill-fg` aliases from tokens.css (added in Task 3 as temporary) and run `grep -rn "pill" src/` → expected: no CSS/TS references left (global.css forced-colors `.pill` selector: delete it).

- [ ] **Step 5: Test + commit**

Run: `pnpm build && pnpm test`
Expected: green. Open a post in `pnpm dev` at ≥1100px: vine reveals on scroll; narrow window: no vine; fin draws at article end.

```bash
git add -A
git commit -m "feat(redesign): serif prose, everforest code, progress vine replaces bar"
```

---

### Task 9: Remaining pages — tags, about, 404, search, accessibility, privacy, projects

**Files:**
- Modify: `src/pages/tags/index.astro` (two static `<Swallow />` without `garden-fly` — wrap in plain `<span class="garden">` with the same path, no animation class)
- Modify: `src/pages/about.astro` (mount `<Heron />` beside the bio block)
- Modify: `src/pages/404.astro` (SeedScene + copy: heading `This page went to seed.`, body `The path you followed doesn't grow here anymore.`, link `← Back to the garden` → `/`)
- Modify: `src/components/SearchPalette.astro` + `src/pages/search.astro` (empty-state copy: `Nothing sprouted for that query.` + `LeafMarker`)
- Modify: `src/pages/accessibility.astro` (document the pause control + reduced-motion behavior; one short section, plain prose)

**Interfaces:**
- Consumes: `Heron`, `SeedScene`, `LeafMarker`, `Swallow` (Task 5).

- [ ] **Step 1: Apply each page edit above** (styles inherit from tokens/base; only garden mounts + copy changes are per-page)
- [ ] **Step 2: Verify garden budget on the heaviest page**

Run: `pnpm build && node -e "
const fs=require('fs');
const html=fs.readFileSync('dist/client/index.html','utf8');
const n=(html.match(/<svg/g)||[]).length;
const bytes=[...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].reduce((s,m)=>s+m[0].length,0);
console.log({svgCount:n, svgBytes:bytes});
if(n>16||bytes>14336)process.exit(1);"`
Expected: prints counts within budget, exit 0. (Adjust `dist/client` to `dist` if the build layout differs — check `ls dist`.)

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(redesign): plant tags/about/404/search pages, a11y docs for pause"
```

---

### Task 10: SearchPalette + ShortcutsOverlay + KeyboardShortcuts restyle

**Files:**
- Modify: `src/components/SearchPalette.astro`, `src/components/ShortcutsOverlay.astro`, `src/components/CopyButton.astro`

- [ ] **Step 1: Panel restyle** — in each component's `<style>`: dialogs/panels get `background: var(--panel); border: 1px solid var(--rule-soft); color: var(--fg);` replacing any `var(--bg)`+`2px solid var(--fg)` combos; interactive text to `var(--font-sans)`; kbd hints stay `var(--font-mono)`. Behavior scripts untouched.
- [ ] **Step 2: CopyButton** → ghost button: `background: none; border: 1px solid var(--rule-soft); color: var(--fg-muted); font-family: var(--font-sans);`.
- [ ] **Step 3: Verify + commit**

Run: `pnpm dev` — Cmd-K palette and `?` overlay match the palette; copy button on a code block reads quietly.

```bash
git add -A && git commit -m "feat(redesign): palette/overlay/copy-button to meadow panels"
```

---

### Task 11: OG function + brand assets

**Files:**
- Modify: `src/pages/api/og.ts` (embed `public/fonts/og/SourceSerif4-Semibold-og.ttf`; sage/loam colors; keep existing structure & JBM only if still used for the URL line)
- Replace: `public/og-default.png`, `public/favicon.svg`, `public/favicon-192.png`, `public/favicon-512.png`, `public/icon-maskable.png`
- Modify: `public/manifest.webmanifest` (`background_color`/`theme_color` → `#eff1e7`)
- Create: `scripts/generate-icons.mjs`

**Interfaces:**
- Consumes: OG TTF from Task 2.

- [ ] **Step 1: og.ts** — swap the font `readFileSync` path to `public/fonts/og/SourceSerif4-Semibold-og.ttf` (name: `'Source Serif 4'`, weight 600 — static instance; Satori cannot parse variable fvar tables, og.ts:30 documents this for JBM). Update the template's colors: bg `#eff1e7`, title `#2c352b`, accent `#8f4a26`, and border rules `1px solid #ccd3bd`. Keep dimensions, caching headers, and `fallbackResponse()` untouched.
- [ ] **Step 2: New favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#eff1e7"/>
  <g fill="none" stroke="#3f4c3a" stroke-width="3" stroke-linecap="round">
    <path d="M32 54 C30 40 24 30 16 24"/>
    <path d="M32 54 C33 38 38 28 48 20"/>
    <path d="M32 54 C32 42 31 34 30 28"/>
  </g>
</svg>
```

- [ ] **Step 3: `scripts/generate-icons.mjs`** (sharp is already in the dependency tree via Astro):

```js
import sharp from 'sharp';
const svg = 'public/favicon.svg';
await sharp(svg).resize(192, 192).png().toFile('public/favicon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/favicon-512.png');
// Maskable: same mark with extra safe-zone padding.
await sharp(svg).resize(400, 400).extend({ top: 56, bottom: 56, left: 56, right: 56, background: '#eff1e7' }).png().toFile('public/icon-maskable.png');
console.log('icons written');
```

Run: `node scripts/generate-icons.mjs` → Expected: `icons written`, three PNGs updated.

- [ ] **Step 4: og-default.png** — with `pnpm dev` running: `curl -s "http://localhost:4321/api/og?title=Kevin%20Lee&subtitle=Essays%20on%20the%20web%20platform" -o public/og-default.png && file public/og-default.png` → Expected: `PNG image data, 1200 x 630`. (If the endpoint's query params differ, read og.ts's param parsing first and match it.)
- [ ] **Step 5: manifest hexes + commit**

```bash
git add -A && git commit -m "feat(redesign): meadow OG images, favicons, manifest colors"
```

---

### Task 12: Motion retune, print, docs, baseline re-triage

**Files:**
- Modify: `src/styles/motion.css` / `src/styles/transitions.css` (easing → `cubic-bezier(0.33, 1, 0.68, 1)` where `--ease` isn't already used; reveal travel → 8px)
- Modify: `src/components/PostBodyReveal.astro` (if travel distance is inline there: reduce to 8px)
- Modify: `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md` (close F-005 — resolved by the home hero h1; re-review the other mono-era wontfix and remove/rewrite it)
- Modify: `CLAUDE.md` (point "the visual design is intentional" guardrail at the 2026-07-29 spec)
- Modify: `src/lib/csp.ts` (comment only: "Self-hosted JetBrains Mono + IBM Plex Mono" → "Self-hosted Source Serif 4 + JetBrains Mono"; verify `pnpm vitest run src/lib/csp.test.ts` still passes — if the test pins the comment's neighboring string values, adjust nothing else)
- Modify: `axe-baseline.json`, `html-checks-baseline.json`, `keyboard-baseline.json` (re-triage)

- [ ] **Step 1: Motion + print edits** (print.css: ensure `.garden`, `.vine` hidden — garden.css already does; add serif body if print.css sets a font).
- [ ] **Step 2: Run every a11y suite and re-triage**

```bash
pnpm build
pnpm a11y:audit:primary; pnpm a11y:html; pnpm a11y:keyboard
```

For each failure: fix the underlying issue if it's new from the redesign; if it matches an old baseline entry that no longer reproduces, DELETE the entry (drain); only re-add with a written justification. Expected end state: all three suites green with **zero new entries**.

- [ ] **Step 3: Docs edits + commit**

```bash
git add -A && git commit -m "chore(redesign): motion retune, baseline re-triage, docs pointers"
```

---

### Task 13: Fonts CI step, full verification, PR

**Files:**
- Modify: `.github/workflows/size.yml` (new step after the JS check)

- [ ] **Step 1: Add the fonts budget step to size.yml**

```yaml
      - name: Check font budget (125 KB total, public/fonts excl. og/)
        shell: bash
        run: |
          set -euo pipefail
          BUDGET=$((125 * 1024))
          total=0
          while IFS= read -r -d '' f; do
            b=$(wc -c <"$f" | tr -d ' ')
            total=$((total + b))
            printf '%8d B  %s\n' "$b" "$f"
          done < <(find public/fonts -maxdepth 1 -type f \( -name '*.woff2' -o -name '*.woff' -o -name '*.ttf' \) -print0)
          echo "TOTAL: $total B (budget $BUDGET B)"
          if [ "$total" -gt "$BUDGET" ]; then
            echo "::error::Fonts exceed the 125 KB budget"
            exit 1
          fi
```

- [ ] **Step 2: Full local verification sweep**

```bash
pnpm check && pnpm test && pnpm build
pnpm a11y:audit:primary && pnpm a11y:html && pnpm a11y:keyboard
```

Expected: everything green. Then manual matrix in `pnpm dev` (home + one post): light/dark toggle, all four seasons (`document.documentElement.dataset.season = 'winter'` etc. in console), garden pause (loops freeze, fin visible, swallow absent), `prefers-reduced-motion` emulation (garden static, vine fully grown), forced-colors emulation, 380px viewport. CLS: DevTools Performance → reload with cold cache → Layout Shift events = none from font swap (if the serif swap shifts, tune the four `size-adjust`/override values in tokens.css and re-measure).

- [ ] **Step 3: Prerender gate check** — `pnpm preview`, open a post via the ADDRESS BAR (not an in-site link) with Chrome's Speculation Rules active; the swallow/fin must not have pre-fired (spec §8).

- [ ] **Step 4: Push + PR**

```bash
git push -u origin redesign/quiet-meadow
gh pr create --title "feat: Quiet Meadow redesign" --body "Implements docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md (rev 2). Font sizes measured: <paste du output>. Baseline re-triage: <summary>. Preview deploy is the review surface."
```

Expected: PR CI green (size incl. new fonts step, Lighthouse at existing thresholds, all a11y gates).
