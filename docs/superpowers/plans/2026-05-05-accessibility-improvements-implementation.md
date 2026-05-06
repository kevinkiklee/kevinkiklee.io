# Accessibility Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the site at WCAG 2.2 AA via durable CI gates, ship the D-wide polish backlog, and publish an `/accessibility` page with auto-rendered known-limits.

**Architecture:** Audit-first, then gates, then fixes, then tighten. Each gate ships with a baseline file (`*-baseline.json`) so it can land before the existing backlog is fixed; baselines drain in Phase 3 and are deleted in Phase 4.

**Tech Stack:** `@axe-core/playwright`, `playwright`, `@playwright/test`, `linkedom`, `@lhci/cli` (already installed), `vitest` (already installed), Astro 5 rehype plugins, custom `src/lib/remark-a11y/` plugins, `actions/github-script`.

**Spec:** `docs/superpowers/specs/2026-05-04-accessibility-improvements-design.md`

**Authoritative version verification (before installing):** Use Context7 (`mcp__context7__query-docs`) to confirm latest stable versions of `@axe-core/playwright`, `playwright`, `@playwright/test`, `linkedom`. Pin `axe-core@4.10.x` per spec.

**PR body convention:** every `gh pr create` command in this plan uses `--body "..."` as shorthand. Replace with a concrete heredoc body following this template:

```bash
gh pr create --title "..." --body "$(cat <<'EOF'
## Summary
- <one or two bullets describing what changed>
- Refs: <PR id from this plan, e.g. PR 2.1; polish-item ids if any>

## Test plan
- [ ] CI green (a11y, lighthouse, build, lint, test)
- [ ] Local: pnpm a11y:audit:primary clean
- [ ] Reviewer reads spec § referenced

Spec: docs/superpowers/specs/2026-05-04-accessibility-improvements-design.md
EOF
)"
```

The literal `"..."` in later tasks is a deliberate marker pointing back to this template, not a content placeholder.

---

## Phase 1 — Discover (1 PR)

**End state:** `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md` committed. Every WCAG-detectable issue catalogued with severity, criterion, location, and suggested fix. P1–P17 cross-referenced.

### Task 1.1: Set up ad-hoc audit tooling on a working branch

**Files:**
- Create: `scripts/_audit/run-axe.ts` (temporary; deleted at end of Phase 1)
- Create: `scripts/_audit/run-lhci.sh` (temporary)
- Create: `scripts/_audit/routes.json` (temporary; promoted to `audit-routes.ts` in Phase 2)

- [ ] **Step 1: Create branch**

```bash
git switch -c a11y/01-discover
```

- [ ] **Step 2: Install transient deps locally (will be made permanent in PR 2.0)**

```bash
pnpm add -D @axe-core/playwright@latest playwright@latest @playwright/test@latest axe-core@4.10
pnpm exec playwright install chromium
```

- [ ] **Step 3: Create `scripts/_audit/routes.json`** — sample URLs from spec §2

```json
{
  "primary": [
    { "id": "home", "path": "/" },
    { "id": "archive", "path": "/posts" },
    { "id": "post", "path": "/posts/hello-world" },
    { "id": "about", "path": "/about" },
    { "id": "search", "path": "/search" },
    { "id": "404", "path": "/this-route-does-not-exist" }
  ],
  "themes": ["light", "dark"]
}
```

- [ ] **Step 4: Create `scripts/_audit/run-axe.ts`** — minimal axe runner

```ts
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import routes from './routes.json' with { type: 'json' };
import { writeFile } from 'node:fs/promises';

const BASE = 'http://localhost:4321';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const findings: Array<unknown> = [];

for (const route of routes.primary) {
  for (const theme of routes.themes) {
    const page = await ctx.newPage();
    await page.addInitScript((t: string) => localStorage.setItem('theme', t), theme);
    await page.goto(BASE + route.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
      .analyze();
    findings.push({ route: route.id, theme, violations: results.violations });
    await page.close();
  }
}
await browser.close();
await writeFile('audit-axe-raw.json', JSON.stringify(findings, null, 2));
console.log(`Wrote ${findings.length} entries to audit-axe-raw.json`);
```

- [ ] **Step 5: Commit transient tooling**

```bash
git add scripts/_audit/ package.json pnpm-lock.yaml
git commit -m "chore(a11y): transient audit tooling for Phase 1 discovery"
```

### Task 1.2: Run axe + LHCI against the route matrix

- [ ] **Step 1: Build + preview in background**

```bash
pnpm build
pnpm preview &
sleep 3
```

- [ ] **Step 2: Run axe**

```bash
pnpm tsx scripts/_audit/run-axe.ts
```

Expected: writes `audit-axe-raw.json` with violations array per route×theme.

- [ ] **Step 3: Run LHCI for accessibility category only against each route**

```bash
for route in / /posts /posts/hello-world /about /search; do
  pnpm exec lhci collect --url=http://localhost:4321${route} --numberOfRuns=1 --settings.onlyCategories=accessibility
done
pnpm exec lhci assert --preset=lighthouse:recommended --assertions.categories:accessibility=error || true
```

Expected: per-route LH reports under `.lighthouseci/`. Don't fail on assertion — we want raw scores.

- [ ] **Step 4: Stop preview**

```bash
kill %1
```

### Task 1.3: Static structural review

For each file in `src/components/`, `src/layouts/`, `src/pages/`, run the static checklist from spec §2:

- [ ] **Step 1: Walk components, log issues to scratchpad**

```bash
ls src/components src/layouts src/pages -1
```

For each file, open it and check:
1. Single h1, no skipped levels.
2. Every `<button>` / `<a>` has accessible name (text or aria-label).
3. `<dialog>` returns focus to opener on close (search palette, shortcuts).
4. No `tabindex > 0`.
5. Live regions only on user-relevant updates.
6. `aria-current` values are spec-valid.
7. Hover-only affordances absent.
8. Token contrast in both themes.

Capture each issue as one row: `{file:line, severity, criterion, suggested fix}`.

- [ ] **Step 2: No code change. Issues collected for Task 1.4.**

### Task 1.4: Write the findings document

**Files:**
- Create: `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`

- [ ] **Step 1: Create document with the structure below**

```markdown
# Accessibility Audit Findings

**Date:** 2026-05-04
**Spec:** ./2026-05-04-accessibility-improvements-design.md
**Audit method:** A2 (code review + automated tools)

## Summary

| Severity | Count |
|---|---|
| Blocker | … |
| Major | … |
| Minor | … |
| Polish | … |

## Findings

### F-001 — <short title>

- **Severity:** Blocker | Major | Minor | Polish
- **WCAG:** 1.4.3 Contrast (Minimum) | n/a
- **Location:** `src/components/Foo.astro:42` | `route:/posts/<slug>`
- **Source:** axe | lighthouse | static-review
- **Description:** what the issue is, in 1–2 sentences.
- **Suggested fix:** one paragraph.
- **Status:** open
- **Maps to:** P1 | none

(repeat per finding)

## Polish item cross-reference

| Item | Status | Findings |
|---|---|---|
| P1 | confirmed | F-007 |
| P2 | confirmed | F-008 |
| … | … | … |
| P8 | verify-in-audit | (no finding; tracker only) |
| P10 | verify-in-audit | (no finding; tracker only) |

## Promised-but-unshipped reconcile (vs blog spec §3.7, §5.8, §6.6)

| Promise | Current state | Resolution |
|---|---|---|
| `pnpm a11y:check` in CI | script exists, not wired | gate G1 in PR 2.2 |
| Lighthouse a11y=1.0 | only `/` and `/posts` audited | gate G2 in PR 2.3 |
| Heading hierarchy build check | not implemented | gate G3 in PR 2.1 |
| Inline `<img>` alt enforcement | partial (`assert-img-dims.ts` is dimensions only) | gate G3 in PR 2.1 |
| (continue) | | |
```

- [ ] **Step 2: Populate every section with real data from `audit-axe-raw.json`, LHCI reports, and the static-review scratchpad. No placeholders.**

- [ ] **Step 3: Commit findings**

```bash
git add docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md
git commit -m "docs(a11y): Phase 1 audit findings"
```

### Task 1.5: Remove transient tooling, open PR

- [ ] **Step 1: Remove scratch scripts**

```bash
rm -rf scripts/_audit/
pnpm remove @axe-core/playwright playwright @playwright/test axe-core
git add -A
git commit -m "chore(a11y): remove transient Phase 1 tooling"
```

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin a11y/01-discover
gh pr create --title "docs(a11y): Phase 1 audit findings" --body "$(cat <<'EOF'
## Summary
- Audit findings doc per spec §2 methodology
- Cross-references P1–P17
- Reconciles original blog spec a11y promises against current state

## Test plan
- [ ] Reviewer reads findings doc top-to-bottom
- [ ] Severity counts in summary match table rows
- [ ] Every Blocker/Major has a `Maps to` entry or a P-item
EOF
)"
```

---

## Phase 2 — Gate

**End state:** Six PRs (2.0–2.5) merged. `pnpm a11y:audit` runs end-to-end. Every gate green on `main` with its baseline. CI wall-time ≤ 4 min added on PR.

### PR 2.0 — Prep (deps + script wrapper)

#### Task 2.0.1: Install permanent deps + Playwright browser

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c a11y/02-prep
```

- [ ] **Step 2: Install (versions per Context7 verification)**

```bash
pnpm add -D @axe-core/playwright@latest playwright@latest @playwright/test@latest axe-core@4.10 linkedom@latest
pnpm exec playwright install chromium
```

- [ ] **Step 3: Verify lockfile committed**

```bash
git status pnpm-lock.yaml
```

#### Task 2.0.2: Create `audit-routes.ts` (single source of truth for matrix)

**Files:**
- Create: `src/lib/audit-routes.ts`

- [ ] **Step 1: Write the config**

```ts
export type RouteId =
  | 'home' | 'archive' | 'archive-page2'
  | 'post-short' | 'post-long' | 'post-cover' | 'post-faq' | 'post-code' | 'post-footnotes'
  | 'tags-index' | 'tag-populated' | 'tag-thin'
  | 'projects' | 'about'
  | 'search' | 'search-palette'
  | 'privacy' | 'accessibility'
  | '404';

export interface AuditRoute {
  id: RouteId;
  path: string;
  primary: boolean;
  /** True once `/accessibility` ships in PR 3.6. */
  exists?: boolean;
}

export const routes: AuditRoute[] = [
  { id: 'home',           path: '/',                       primary: true },
  { id: 'archive',        path: '/posts',                  primary: true },
  { id: 'archive-page2',  path: '/posts/page/2',           primary: false },
  { id: 'post-short',     path: '/posts/hello-world',      primary: true },
  { id: 'post-long',      path: '/posts/hello-world',      primary: false },
  { id: 'post-cover',     path: '/posts/hello-world',      primary: false },
  { id: 'post-faq',       path: '/posts/hello-world',      primary: false },
  { id: 'post-code',      path: '/posts/hello-world',      primary: false },
  { id: 'post-footnotes', path: '/posts/hello-world',      primary: false },
  { id: 'tags-index',     path: '/tags',                   primary: false },
  { id: 'tag-populated',  path: '/tags/intro',             primary: false },
  { id: 'tag-thin',       path: '/tags/intro',             primary: false },
  { id: 'projects',       path: '/projects',               primary: false },
  { id: 'about',          path: '/about',                  primary: true },
  { id: 'search',         path: '/search',                 primary: true },
  { id: 'search-palette', path: '/?palette=open',          primary: true },
  { id: 'privacy',        path: '/privacy',                primary: false },
  { id: 'accessibility',  path: '/accessibility',          primary: true, exists: false },
  { id: '404',            path: '/this-route-does-not-exist', primary: false },
];

export const themes = ['light', 'dark'] as const;
export const motionPrefs = ['default', 'reduce'] as const;
```

> **Note for engineer:** the post-* IDs all point to `/posts/hello-world` until more posts exist with the relevant shapes. Update paths as posts are added; the IDs are the contract. The `search-palette` route uses a query string the palette opens on (script in `src/components/SearchPalette.astro` honors `?palette=open`); this script change lands in PR 2.2 alongside the gate that depends on it.

#### Task 2.0.3: Create `pnpm a11y:audit` wrapper script

**Files:**
- Create: `scripts/a11y/audit.ts`
- Create: `scripts/a11y/run-axe.ts`
- Create: `scripts/a11y/run-lhci.ts`
- Create: `scripts/a11y/format-findings.ts`
- Modify: `package.json` (replace `a11y:check` with `a11y:audit`)

- [ ] **Step 1: Write `scripts/a11y/run-axe.ts`** — pure runner, no formatting

```ts
import { chromium, type Browser } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { routes, themes, type AuditRoute } from '../../src/lib/audit-routes.ts';

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; target: string[] }>;
}

export interface AxeRunEntry {
  route: string;
  theme: string;
  violations: AxeViolation[];
}

export async function runAxe(opts: { baseUrl: string; primaryOnly: boolean }): Promise<AxeRunEntry[]> {
  const browser: Browser = await chromium.launch();
  const ctx = await browser.newContext();
  const list: AuditRoute[] = opts.primaryOnly ? routes.filter(r => r.primary) : routes;
  const out: AxeRunEntry[] = [];

  for (const route of list) {
    if (route.exists === false) continue;
    for (const theme of themes) {
      const page = await ctx.newPage();
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(opts.baseUrl + route.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
        .analyze();
      out.push({ route: route.id, theme, violations: results.violations as AxeViolation[] });
      await page.close();
    }
  }
  await browser.close();
  return out;
}
```

- [ ] **Step 2: Write `scripts/a11y/run-lhci.ts`** — wrapper around lhci collect

```ts
import { execFileSync } from 'node:child_process';
import { routes } from '../../src/lib/audit-routes.ts';

export function runLhci(opts: { baseUrl: string; primaryOnly: boolean }): void {
  const list = opts.primaryOnly ? routes.filter(r => r.primary) : routes;
  for (const route of list) {
    if (route.exists === false) continue;
    execFileSync('pnpm', ['exec', 'lhci', 'collect',
      `--url=${opts.baseUrl}${route.path}`,
      '--numberOfRuns=1',
      '--settings.onlyCategories=accessibility',
    ], { stdio: 'inherit' });
  }
}
```

- [ ] **Step 3: Write `scripts/a11y/format-findings.ts`** — turns axe + LH output into findings.md rows

```ts
import type { AxeRunEntry, AxeViolation } from './run-axe.ts';

const SEVERITY_BY_IMPACT: Record<string, 'Blocker' | 'Major' | 'Minor' | 'Polish'> = {
  critical: 'Blocker',
  serious: 'Major',
  moderate: 'Minor',
  minor: 'Polish',
};

export function severityFor(v: AxeViolation, primary: boolean): 'Blocker' | 'Major' | 'Minor' | 'Polish' {
  const base = SEVERITY_BY_IMPACT[v.impact ?? 'minor'] ?? 'Polish';
  if (base === 'Blocker' && !primary) return 'Major';
  return base;
}

export function toMarkdown(entries: AxeRunEntry[]): string {
  const rows = entries.flatMap(e => e.violations.map((v, i) => ({
    id: `F-${e.route}-${e.theme}-${v.id}-${i}`,
    severity: severityFor(v, /* primary */ true),
    wcag: v.helpUrl,
    location: `${e.route}/${e.theme}: ${v.nodes[0]?.target.join(' ')}`,
    description: v.help,
  })));
  return rows.map(r =>
    `### ${r.id}\n- **Severity:** ${r.severity}\n- **WCAG:** ${r.wcag}\n- **Location:** ${r.location}\n- **Description:** ${r.description}\n- **Status:** open\n`
  ).join('\n');
}
```

- [ ] **Step 4: Write `scripts/a11y/audit.ts`** — orchestrator

```ts
import { runAxe } from './run-axe.ts';
import { runLhci } from './run-lhci.ts';
import { toMarkdown } from './format-findings.ts';
import { writeFile } from 'node:fs/promises';

const baseUrl = process.env.A11Y_BASE_URL ?? 'http://localhost:4321';
const primaryOnly = process.argv.includes('--primary-only');

const axe = await runAxe({ baseUrl, primaryOnly });
runLhci({ baseUrl, primaryOnly });

await writeFile('a11y-findings.md', toMarkdown(axe));
await writeFile('a11y-findings.json', JSON.stringify(axe, null, 2));

const blockerOrMajor = axe.flatMap(e => e.violations).filter(v =>
  v.impact === 'critical' || v.impact === 'serious'
).length;

if (blockerOrMajor > 0) {
  console.error(`${blockerOrMajor} Blocker/Major findings`);
  process.exit(1);
}
```

- [ ] **Step 5: Replace `a11y:check` with `a11y:audit` in package.json scripts**

Edit `package.json`:

```diff
-    "a11y:check": "axe http://localhost:4321 --exit",
+    "a11y:audit": "tsx scripts/a11y/audit.ts",
+    "a11y:audit:primary": "tsx scripts/a11y/audit.ts --primary-only"
```

Also remove the now-unused `axe-core/cli` dep:

```bash
pnpm remove axe-core   # cli is gone; runtime version pinned via @axe-core/playwright transitive
pnpm add -D axe-core@4.10
```

(Pinning `axe-core@4.10` directly because spec §3 requires version control independent of `@axe-core/playwright`'s transitive bumps.)

#### Task 2.0.4: Smoke-test the wrapper locally

- [ ] **Step 1: Run end-to-end against preview**

```bash
pnpm build
pnpm preview &
sleep 3
A11Y_BASE_URL=http://localhost:4321 pnpm a11y:audit:primary
kill %1
```

Expected: writes `a11y-findings.md` and `a11y-findings.json`. Exits 1 if Blocker/Major present (this is fine; the gate doesn't fire yet).

- [ ] **Step 2: Add gitignore for output artifacts**

Edit `.gitignore`:

```diff
+a11y-findings.md
+a11y-findings.json
+.lighthouseci/
```

- [ ] **Step 3: Commit + PR**

```bash
git add -A
git commit -m "feat(a11y): scaffold pnpm a11y:audit + audit-routes.ts

PR 2.0 of accessibility plan. No assertions yet; just plumbing.
Replaces stub a11y:check script."
git push -u origin a11y/02-prep
gh pr create --title "feat(a11y): a11y:audit scaffolding (PR 2.0)" --body "..."
```

---

### PR 2.1 — G3 (MDX a11y lints) + G6 (token-contrast unit tests)

#### Task 2.1.1: Write WCAG contrast helper + tests

**Files:**
- Create: `src/lib/contrast.ts`
- Create: `src/lib/contrast.test.ts`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c a11y/03-lints-and-contrast
```

- [ ] **Step 2: Write the failing test**

`src/lib/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.ts';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });
  it('returns 1 for white on white', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });
  it('returns ~7 for #767676 on white (AAA-large boundary)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});
```

- [ ] **Step 3: Run test (expect fail)**

```bash
pnpm test src/lib/contrast.test.ts
```

Expected: FAIL — `contrastRatio` is not defined.

- [ ] **Step 4: Implement `src/lib/contrast.ts`**

```ts
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 5: Run test (expect pass)**

```bash
pnpm test src/lib/contrast.test.ts
```

Expected: PASS.

#### Task 2.1.2: Token-contrast unit tests (G6) with skip-list baseline

**Files:**
- Create: `src/lib/tokens.ts` (parsed from `tokens.css`)
- Create: `src/lib/tokens.test.ts`
- Create: `tokens-baseline.json`

- [ ] **Step 1: Manually transcribe token values from `src/styles/tokens.css`**

Open `src/styles/tokens.css`, copy the actual hex values from `[data-theme='light']` and `[data-theme='dark']` blocks into `src/lib/tokens.ts`:

```ts
export const tokens = {
  light: {
    bg:        '#f5f4ee',
    fg:        '#0a0a0a',
    fgMuted:   '#4a4a4a',
    fgSubtle:  '#767676',
    rule:      '#0a0a0a',
    ruleSoft:  '#c8c5b8',
    pillBg:    '#0a0a0a',
    pillFg:    '#f5f4ee',
    codeBg:    '#ebe9df',
  },
  dark: {
    bg:        '#0a0a0a',
    fg:        '#ededed',
    fgMuted:   '#b5b5b5',
    fgSubtle:  '#888888',
    rule:      '#ededed',
    ruleSoft:  '#2a2a2a',
    pillBg:    '#ededed',
    pillFg:    '#0a0a0a',
    codeBg:    '#161616',
  },
} as const;

/** Pairs that must reach the AAA body threshold (7:1). */
export const aaaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'bg'],
  ['fgMuted', 'bg'],
  ['fgSubtle', 'bg'],
];

/** Pairs that must reach AA (4.5:1). */
export const aaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['pillFg', 'pillBg'],
  ['fg', 'codeBg'],
];
```

- [ ] **Step 2: Create `tokens-baseline.json` (empty for now; populated after first test run)**

```json
{
  "skip": []
}
```

- [ ] **Step 3: Write tokens test**

`src/lib/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import baseline from '../../tokens-baseline.json' with { type: 'json' };
import { contrastRatio } from './contrast.ts';
import { tokens, aaaPairs, aaPairs } from './tokens.ts';

const skip = new Set<string>(baseline.skip);

describe('token contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg] of aaaPairs) {
      const key = `${theme}:${fg}/${bg}:aaa`;
      it(`${key} ≥ 7:1`, () => {
        if (skip.has(key)) return;
        const r = contrastRatio(tokens[theme][fg], tokens[theme][bg]);
        expect(r, `${theme} ${fg} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
      });
    }
    for (const [fg, bg] of aaPairs) {
      const key = `${theme}:${fg}/${bg}:aa`;
      it(`${key} ≥ 4.5:1`, () => {
        if (skip.has(key)) return;
        const r = contrastRatio(tokens[theme][fg], tokens[theme][bg]);
        expect(r, `${theme} ${fg} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
```

- [ ] **Step 4: Run tests; populate baseline with currently-failing pairs**

```bash
pnpm test src/lib/tokens.test.ts
```

For each failing pair, add its `key` to `tokens-baseline.json`'s `skip` array. Expected after baseline pass: all tests pass (skipped ones are no-op).

- [ ] **Step 5: Commit baseline state**

```bash
git add src/lib/contrast.ts src/lib/contrast.test.ts src/lib/tokens.ts src/lib/tokens.test.ts tokens-baseline.json
git commit -m "feat(a11y): G6 token-contrast tests with current-state skip-list baseline"
```

#### Task 2.1.3: Custom remark-a11y plugins (G3) — heading-increment

**Files:**
- Create: `src/lib/remark-a11y/heading-increment.ts`
- Create: `src/lib/remark-a11y/heading-increment.test.ts`
- Modify: `astro.config.ts` (add to remark plugins)

- [ ] **Step 1: Write failing test**

`src/lib/remark-a11y/heading-increment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { remarkHeadingIncrement } from './heading-increment.ts';

function process(md: string): Promise<string> {
  return remark().use(remarkMdx).use(remarkHeadingIncrement).process(md).then(r => String(r));
}

describe('remarkHeadingIncrement', () => {
  it('passes h2 → h3 → h2 → h3', async () => {
    await expect(process('## a\n### b\n## c\n### d')).resolves.toBeDefined();
  });
  it('fails on h2 → h4 (skipped h3)', async () => {
    await expect(process('## a\n#### b')).rejects.toThrow(/skipped from h2 to h4/);
  });
});
```

- [ ] **Step 2: Run test (expect fail)**

```bash
pnpm test src/lib/remark-a11y/heading-increment.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement plugin**

`src/lib/remark-a11y/heading-increment.ts`:

```ts
import type { Root, Heading } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkHeadingIncrement() {
  return (tree: Root, file: { fail: (msg: string) => never }) => {
    let prev = 1;
    visit(tree, 'heading', (node: Heading) => {
      if (node.depth > prev + 1) {
        file.fail(`heading hierarchy skipped from h${prev} to h${node.depth}`);
      }
      prev = node.depth;
    });
  };
}
```

> **Note on imports:** `unist-util-visit` is a transitive dep of `@astrojs/mdx`; verify it's resolvable via `pnpm why unist-util-visit`. If not, `pnpm add -D unist-util-visit`.

- [ ] **Step 4: Run test (expect pass)**

```bash
pnpm test src/lib/remark-a11y/heading-increment.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire into astro.config.ts**

Add to the `remarkPlugins` array of the `mdx()` integration call:

```ts
import { remarkHeadingIncrement } from './src/lib/remark-a11y/heading-increment.ts';

// inside mdx({ remarkPlugins: [...existing, remarkHeadingIncrement] })
```

- [ ] **Step 6: Run `pnpm build` to confirm no existing post breaks**

```bash
pnpm build
```

Expected: PASS. If a post fails, fix the post in this PR.

#### Task 2.1.4: Custom remark-a11y plugins (G3) — img-alt

**Files:**
- Create: `src/lib/remark-a11y/img-alt.ts`
- Create: `src/lib/remark-a11y/img-alt.test.ts`
- Modify: `astro.config.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { remarkImgAlt } from './img-alt.ts';

function process(md: string): Promise<string> {
  return remark().use(remarkMdx).use(remarkImgAlt).process(md).then(r => String(r));
}

describe('remarkImgAlt', () => {
  it('passes ![alt](src)', async () => {
    await expect(process('![cat](cat.jpg)')).resolves.toBeDefined();
  });
  it('fails ![](src) without explicit decorative role', async () => {
    await expect(process('![](cat.jpg)')).rejects.toThrow(/missing alt/);
  });
  it('passes <img alt="" role="presentation">', async () => {
    await expect(process('<img src="cat.jpg" alt="" role="presentation" />')).resolves.toBeDefined();
  });
  it('fails <img> with no alt attribute', async () => {
    await expect(process('<img src="cat.jpg" />')).rejects.toThrow(/missing alt/);
  });
});
```

- [ ] **Step 2: Run test (expect fail)**

```bash
pnpm test src/lib/remark-a11y/img-alt.test.ts
```

- [ ] **Step 3: Implement plugin**

`src/lib/remark-a11y/img-alt.ts`:

```ts
import type { Root, Image } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import { visit } from 'unist-util-visit';

function attrValue(node: MdxJsxFlowElement | MdxJsxTextElement, name: string): string | null {
  const attr = node.attributes.find(a => a.type === 'mdxJsxAttribute' && a.name === name);
  if (!attr || attr.type !== 'mdxJsxAttribute') return null;
  return typeof attr.value === 'string' ? attr.value : null;
}

export function remarkImgAlt() {
  return (tree: Root, file: { fail: (msg: string) => never }) => {
    visit(tree, (node) => {
      if (node.type === 'image') {
        const img = node as Image;
        if (img.alt === undefined || img.alt === null) {
          file.fail(`image missing alt: ${img.url}`);
        }
        if (img.alt === '') {
          file.fail(`image has empty alt without decorative intent (use <img alt="" role="presentation"> instead): ${img.url}`);
        }
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const jsx = node as MdxJsxFlowElement | MdxJsxTextElement;
        if (jsx.name !== 'img') return;
        const alt = attrValue(jsx, 'alt');
        const role = attrValue(jsx, 'role');
        if (alt === null) {
          file.fail(`<img> missing alt attribute`);
        }
        if (alt === '' && role !== 'presentation') {
          file.fail(`<img> has empty alt without role="presentation"`);
        }
      }
    });
  };
}
```

- [ ] **Step 4: Run test (expect pass), wire into astro.config.ts, build**

```bash
pnpm test src/lib/remark-a11y/img-alt.test.ts
# add to astro.config.ts mdx remarkPlugins
pnpm build
```

If existing posts/MDX fail, fix them in this PR.

#### Task 2.1.5: Wire G3 + G6 into `pnpm test` and commit

- [ ] **Step 1: Verify `pnpm test` runs all new tests**

```bash
pnpm test
```

Expected: contrast + tokens + heading-increment + img-alt tests all pass.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(a11y): G3 remark-a11y lints (heading-increment + img-alt)"
git push -u origin a11y/03-lints-and-contrast
gh pr create --title "feat(a11y): G3 lints + G6 token contrast (PR 2.1)" --body "..."
```

---

### PR 2.2 — G1 (`@axe-core/playwright` PR job)

#### Task 2.2.1: Add the `?palette=open` open-state hook

**Files:**
- Modify: `src/components/SearchPalette.astro`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c a11y/04-axe-playwright-job
```

- [ ] **Step 2: Add open-on-querystring hook to the existing palette script**

Inside the existing `<script>` block of `src/components/SearchPalette.astro`, after the `keydown` listener, append:

```ts
// Test/audit hook: ?palette=open opens the palette on load.
// Used by `audit-routes.ts` `search-palette` entry. Removed from URL after open
// so subsequent navigation isn't sticky.
if (new URLSearchParams(window.location.search).get('palette') === 'open') {
  open();
  history.replaceState(null, '', window.location.pathname);
}
```

#### Task 2.2.2: Generate the axe baseline

- [ ] **Step 1: Run `pnpm a11y:audit:primary` against preview**

```bash
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary || true   # baseline run; expected to exit 1
kill %1
```

- [ ] **Step 2: Capture current state into `axe-baseline.json`**

Take the violation IDs from `a11y-findings.json` and write them to a baseline file. Each entry's key is `{routeId}:{themeId}:{ruleId}:{nodeIndex}`.

```bash
node -e "
const f = JSON.parse(require('fs').readFileSync('a11y-findings.json', 'utf8'));
const skip = [];
for (const e of f) {
  for (const v of e.violations) {
    v.nodes.forEach((_, i) => {
      skip.push(\`\${e.route}:\${e.theme}:\${v.id}:\${i}\`);
    });
  }
}
require('fs').writeFileSync('axe-baseline.json', JSON.stringify({ skip }, null, 2));
console.log('Baseline:', skip.length, 'entries');
"
git add axe-baseline.json
```

#### Task 2.2.3: Add baseline-aware exit logic to the audit script

**Files:**
- Modify: `scripts/a11y/audit.ts`

- [ ] **Step 1: Read baseline + filter violations before counting Blocker/Major**

Replace the bottom block of `scripts/a11y/audit.ts`:

```ts
import { readFile } from 'node:fs/promises';

let baseline: { skip: string[] } = { skip: [] };
try {
  baseline = JSON.parse(await readFile('axe-baseline.json', 'utf8'));
} catch {}
const skip = new Set(baseline.skip);

const newFindings = axe.flatMap(e =>
  e.violations.flatMap((v, _vi) =>
    v.nodes.map((_n, ni) => ({ key: `${e.route}:${e.theme}:${v.id}:${ni}`, impact: v.impact }))
  )
).filter(x => !skip.has(x.key));

const blockerOrMajor = newFindings.filter(x =>
  x.impact === 'critical' || x.impact === 'serious'
).length;

if (blockerOrMajor > 0) {
  console.error(`${blockerOrMajor} new Blocker/Major findings (not in baseline)`);
  process.exit(1);
}
```

- [ ] **Step 2: Verify it now exits 0 with baseline in place**

```bash
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary
echo "Exit code: $?"
kill %1
```

Expected: exit code 0.

#### Task 2.2.4: Wire into `.github/workflows/ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add `a11y` job after `build`**

```yaml
  a11y:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm preview &
      - run: sleep 5
      - run: pnpm a11y:audit:primary
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-findings
          path: |
            a11y-findings.md
            a11y-findings.json
      - if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const md = fs.readFileSync('a11y-findings.md', 'utf8');
            const body = `## a11y findings\n\n${md.slice(0, 60000)}`;
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body,
            });
```

- [ ] **Step 2: Push, observe one PR cycle to confirm green**

```bash
git add -A
git commit -m "feat(a11y): G1 axe-playwright PR job + axe-baseline.json"
git push -u origin a11y/04-axe-playwright-job
gh pr create --title "feat(a11y): G1 axe-playwright job (PR 2.2)" --body "..."
```

Expected: CI runs, `a11y` job green (baseline absorbs current state).

---

### PR 2.3 — G2 (Expanded LHCI)

#### Task 2.3.1: Compute current per-URL LH a11y floors

**Files:**
- Modify: `lighthouserc.cjs`

- [ ] **Step 1: Branch + run LHCI on every primary route**

```bash
git switch main && git pull
git switch -c a11y/05-lhci-expansion
pnpm build && pnpm preview &
sleep 3
for path in / /posts /posts/hello-world /about /search; do
  pnpm exec lhci collect --url=http://localhost:4321${path} --numberOfRuns=1 --settings.onlyCategories=accessibility
done
pnpm exec lhci assert --preset=lighthouse:no-pwa
kill %1
```

Record each URL's `accessibility` score.

- [ ] **Step 2: Edit `lighthouserc.cjs` with per-URL minScore floors**

```js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/posts',
        'http://localhost:4321/posts/hello-world',
        'http://localhost:4321/about',
        'http://localhost:4321/search',
      ],
      numberOfRuns: 1,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertMatrix: [
        {
          matchingUrlPattern: 'http://localhost:4321/$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/posts$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
        // …one block per URL with the actual current score as minScore
      ],
    },
  },
};
```

> **Note:** primary path uses 1.0 if already at 1.0; secondary routes use their **current floor** (e.g., 0.95). Phase 4 Task 4.x lifts every floor to 1.0.

#### Task 2.3.2: Update CI workflow to use the matrix

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace the two-URL `lighthouse` job step with `lhci autorun`**

```yaml
  lighthouse:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Wait for Vercel preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        id: vercel
        with: { token: '${{ secrets.GITHUB_TOKEN }}', max_timeout: 600 }
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm install -g @lhci/cli@0.15.1
      - run: |
          # Substitute localhost URLs in lighthouserc.cjs with the preview URL
          sed -i "s|http://localhost:4321|${{ steps.vercel.outputs.url }}|g" lighthouserc.cjs
          lhci autorun
```

- [ ] **Step 2: Commit and push**

```bash
git add lighthouserc.cjs .github/workflows/ci.yml
git commit -m "feat(a11y): G2 expanded LHCI matrix with per-URL floors"
git push -u origin a11y/05-lhci-expansion
gh pr create --title "feat(a11y): G2 LHCI matrix (PR 2.3)" --body "..."
```

---

### PR 2.4 — G4 (Post-build HTML structural assertion)

#### Task 2.4.1: Write the structural-check script

**Files:**
- Create: `scripts/a11y/html-check.ts`
- Create: `scripts/a11y/html-check.test.ts`
- Create: `html-checks-baseline.json`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c a11y/06-html-structural-check
```

- [ ] **Step 2: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { check } from './html-check.ts';

describe('html-check', () => {
  it('flags multiple <h1>', () => {
    const html = '<html><body><main><h1>a</h1><h1>b</h1></main></body></html>';
    const r = check(html);
    expect(r.find(x => x.rule === 'single-h1')).toBeDefined();
  });
  it('flags missing <main>', () => {
    const html = '<html><body><h1>a</h1></body></html>';
    expect(check(html).find(x => x.rule === 'single-main')).toBeDefined();
  });
  it('flags tabindex=1', () => {
    const html = '<html><body><main><a tabindex="1">x</a></main></body></html>';
    expect(check(html).find(x => x.rule === 'no-positive-tabindex')).toBeDefined();
  });
  it('flags <button> with no accessible name', () => {
    const html = '<html><body><main><button></button></main></body></html>';
    expect(check(html).find(x => x.rule === 'button-name')).toBeDefined();
  });
  it('passes a complete page', () => {
    const html = '<html><body><main><h1>Hi</h1><nav aria-label="Primary"><a href="/">home</a></nav></main></body></html>';
    expect(check(html)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test (expect fail)**

```bash
pnpm test scripts/a11y/html-check.test.ts
```

- [ ] **Step 4: Implement `scripts/a11y/html-check.ts`**

```ts
import { parseHTML } from 'linkedom';

export interface CheckResult {
  rule: 'single-h1' | 'single-main' | 'nav-name' | 'no-positive-tabindex' | 'button-name' | 'link-name';
  selector: string;
}

export function check(html: string): CheckResult[] {
  const { document } = parseHTML(html);
  const out: CheckResult[] = [];

  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) out.push({ rule: 'single-h1', selector: `count=${h1s.length}` });

  const mains = document.querySelectorAll('main');
  if (mains.length !== 1) out.push({ rule: 'single-main', selector: `count=${mains.length}` });

  document.querySelectorAll('nav').forEach((n: Element, i: number) => {
    const name = n.getAttribute('aria-label') ?? n.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'nav-name', selector: `nav:nth-of-type(${i + 1})` });
  });

  document.querySelectorAll('[tabindex]').forEach((el: Element) => {
    const t = parseInt(el.getAttribute('tabindex') ?? '0', 10);
    if (t > 0) out.push({ rule: 'no-positive-tabindex', selector: el.tagName.toLowerCase() });
  });

  document.querySelectorAll('button').forEach((b: Element, i: number) => {
    const name = (b.textContent ?? '').trim() || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'button-name', selector: `button:nth-of-type(${i + 1})` });
  });

  document.querySelectorAll('a').forEach((a: Element, i: number) => {
    const name = (a.textContent ?? '').trim() || a.getAttribute('aria-label') || a.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'link-name', selector: `a:nth-of-type(${i + 1})` });
  });

  return out;
}
```

- [ ] **Step 5: Run test (expect pass)**

```bash
pnpm test scripts/a11y/html-check.test.ts
```

#### Task 2.4.2: Walk `dist/` and apply check; create baseline

**Files:**
- Create: `scripts/a11y/html-check-dist.ts`
- Modify: `package.json` (add `a11y:html` script)

- [ ] **Step 1: Walker script**

```ts
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';   // Node 22+
import { check } from './html-check.ts';

let baseline: { skip: string[] } = { skip: [] };
try {
  baseline = JSON.parse(await readFile('html-checks-baseline.json', 'utf8'));
} catch {}
const skip = new Set(baseline.skip);

let failures = 0;
for await (const file of glob('dist/**/*.html')) {
  const html = await readFile(file, 'utf8');
  const issues = check(html);
  for (const issue of issues) {
    const key = `${file}:${issue.rule}:${issue.selector}`;
    if (skip.has(key)) continue;
    console.error(`${file}: ${issue.rule} (${issue.selector})`);
    failures++;
  }
}
if (failures > 0) {
  console.error(`${failures} new HTML structural failures (not in baseline)`);
  process.exit(1);
}
```

- [ ] **Step 2: Add script**

```json
"a11y:html": "tsx scripts/a11y/html-check-dist.ts"
```

- [ ] **Step 3: Build, run, capture baseline**

```bash
pnpm build
pnpm a11y:html 2>&1 | tee html-violations.txt || true

# Each line of the form `path/to/file.html: rule-name (selector)` becomes a baseline entry
node -e "
const lines = require('fs').readFileSync('html-violations.txt', 'utf8').split('\n')
  .filter(l => l.includes(': ') && l.includes('('))
  .map(l => {
    const [file, rest] = l.split(': ');
    const [rule, sel] = rest.replace(')', '').split(' (');
    return \`\${file}:\${rule}:\${sel}\`;
  });
require('fs').writeFileSync('html-checks-baseline.json', JSON.stringify({ skip: lines }, null, 2));
"
rm html-violations.txt
```

- [ ] **Step 4: Re-run; expect 0 failures with baseline in place**

```bash
pnpm a11y:html
echo "Exit: $?"
```

Expected: exit 0.

#### Task 2.4.3: Wire into CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add to existing `build` job after `pnpm build`**

```yaml
      - name: HTML a11y check
        run: pnpm a11y:html
```

- [ ] **Step 2: Commit + PR**

```bash
git add -A
git commit -m "feat(a11y): G4 post-build HTML structural assertion + baseline"
git push -u origin a11y/06-html-structural-check
gh pr create --title "feat(a11y): G4 HTML structural check (PR 2.4)" --body "..."
```

---

### PR 2.5 — G5 (Playwright keyboard-traversal smoke)

#### Task 2.5.1: Set up Playwright project

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/a11y/keyboard.spec.ts`
- Create: `keyboard-baseline.json`

- [ ] **Step 1: Branch + config**

```bash
git switch main && git pull
git switch -c a11y/07-keyboard-traversal
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
  },
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
```

#### Task 2.5.2: Write the traversal test (with baseline)

`tests/a11y/keyboard.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { routes } from '../../src/lib/audit-routes.ts';

const baseline: { skip: string[] } = (() => {
  try { return JSON.parse(readFileSync('keyboard-baseline.json', 'utf8')); }
  catch { return { skip: [] }; }
})();
const skip = new Set(baseline.skip);

for (const route of routes.filter(r => r.primary && r.exists !== false)) {
  test(`keyboard traversal — ${route.id}`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    let prevFocus: string | null = null;
    let traps = 0;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const sel = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        return `${tag}${id}`;
      });
      if (sel === prevFocus) {
        if (++traps > 2) {
          const key = `${route.id}:trap:${sel}`;
          if (!skip.has(key)) throw new Error(`focus trap at ${sel}`);
          break;
        }
      } else {
        traps = 0;
        prevFocus = sel;
      }
    }
  });

  test(`focus visible — ${route.id}`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    const before = await page.screenshot();
    // Move focus elsewhere then back
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const after = await page.screenshot();
    const key = `${route.id}:focus-visible`;
    if (skip.has(key)) test.skip();
    expect(Buffer.compare(before, after)).not.toBe(0); // some visual diff present
  });
}
```

> **Note:** dialog focus-return assertions live in PR 3.1 (Group A: P2). This first version is structural traversal only.

- [ ] **Step 1: Run; populate baseline as needed**

```bash
pnpm exec playwright test tests/a11y/keyboard.spec.ts || true
# inspect output, populate keyboard-baseline.json with current failure keys
```

- [ ] **Step 2: Re-run; expect green**

```bash
pnpm exec playwright test tests/a11y/keyboard.spec.ts
echo $?
```

#### Task 2.5.3: Wire into CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add to existing `a11y` job (or create dedicated keyboard job)**

```yaml
      - name: Keyboard traversal
        run: pnpm exec playwright test tests/a11y/keyboard.spec.ts
```

- [ ] **Step 2: Add `playwright` script to package.json**

```json
"a11y:keyboard": "playwright test tests/a11y/keyboard.spec.ts"
```

- [ ] **Step 3: Commit + PR**

```bash
git add -A
git commit -m "feat(a11y): G5 Playwright keyboard-traversal smoke (PR 2.5)"
git push -u origin a11y/07-keyboard-traversal
gh pr create --title "feat(a11y): G5 keyboard traversal (PR 2.5)" --body "..."
```

---

## Phase 3 — Fix & polish

**End state:** every `*-baseline.json` is empty (or its remaining entries are formally `wontfix-rationale` and rendered on `/accessibility`). Polish items P1–P17 shipped per spec §4.

> **Workflow note for every Phase 3 PR:** as fixes land, the corresponding entries in `axe-baseline.json` / `html-checks-baseline.json` / `keyboard-baseline.json` / `tokens-baseline.json` come out. Re-run `pnpm a11y:audit:primary`, `pnpm a11y:html`, `pnpm a11y:keyboard`, and `pnpm test` after each fix to verify the baseline shrinks rather than grows.

### PR 3.1 — Group A: search & dialogs (P1, P2, P3)

#### Task 3.1.1: P1 — Search results live region + list semantics

**Files:**
- Modify: `src/components/SearchPalette.astro`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c a11y/08-group-a-dialogs
```

- [ ] **Step 2: Add live region beneath the form, change results to `<ul>`**

In `src/components/SearchPalette.astro`, in the markup:

```diff
     <div id="palette-results" class="results" aria-label="Search results"></div>
+    <p id="palette-status" class="sr-only" aria-live="polite" aria-atomic="true"></p>
```

In the script, change result rendering:

```diff
-        results!.innerHTML = top
-          .map((d) => {
-            const title = escapeHtml(d.meta.title ?? d.url);
-            const url = escapeHtml(d.url);
-            return `<a href="${url}" aria-label="Open: ${title}"><strong>${title}</strong><small>${d.excerpt}</small></a>`;
-          })
-          .join('');
+        results!.innerHTML = '<ul role="list">' + top
+          .map((d) => {
+            const title = escapeHtml(d.meta.title ?? d.url);
+            const url = escapeHtml(d.url);
+            return `<li><a href="${url}" aria-label="Open: ${title}"><strong>${title}</strong><small>${d.excerpt}</small></a></li>`;
+          })
+          .join('') + '</ul>';
+        document.getElementById('palette-status')!.textContent =
+          `${top.length} result${top.length === 1 ? '' : 's'} for ${q}`;
```

Update CSS selector for `.results :global(a)` to `.results :global(li > a)` (or just `.results :global(a)` continues to match — verify).

- [ ] **Step 3: Build + manually verify in browser**

```bash
pnpm build && pnpm preview
# Open localhost:4321, press '/', type a query, verify SR announcement firing once after settle
```

#### Task 3.1.2: P2 — Dialog focus return on close

**Files:**
- Modify: `src/components/SearchPalette.astro`
- Modify: `src/components/ShortcutsOverlay.astro`

- [ ] **Step 1: SearchPalette — capture + restore in script**

In the existing script, modify `open()` and `close()`:

```ts
let opener: HTMLElement | null = null;

function open() {
  opener = (document.activeElement instanceof HTMLElement && document.activeElement !== document.body)
    ? document.activeElement
    : null;
  if (!dlg!.open) dlg!.showModal();
  setTimeout(() => input!.focus(), 0);
  void loadPagefind();
}
function close() {
  if (dlg!.open) dlg!.close();
}

dlg.addEventListener('close', () => {
  const target = opener ?? (document.getElementById('main') as HTMLElement | null);
  target?.focus({ preventScroll: true });
  opener = null;
});
```

- [ ] **Step 2: ShortcutsOverlay — same pattern in its script (currently inline `<dialog>` with no JS)**

Add a `<script>` block:

```astro
<script>
  const dlg = document.getElementById('shortcuts-overlay') as HTMLDialogElement | null;
  if (dlg) {
    let opener: HTMLElement | null = null;
    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement | null)?.tagName ?? '')) {
        e.preventDefault();
        opener = (document.activeElement instanceof HTMLElement && document.activeElement !== document.body)
          ? document.activeElement : null;
        dlg.showModal();
      }
    });
    dlg.addEventListener('close', () => {
      const target = opener ?? (document.getElementById('main') as HTMLElement | null);
      target?.focus({ preventScroll: true });
      opener = null;
    });
  }
</script>
```

> **Note:** if there's already a shortcuts opener wired in `src/components/KeyboardShortcuts.astro`, adapt the focus capture there instead of duplicating the keydown listener. Verify before adding.

#### Task 3.1.3: P3 — `prefers-reduced-transparency` on dialog backdrops

**Files:**
- Modify: `src/components/SearchPalette.astro` (CSS only)
- Modify: `src/components/ShortcutsOverlay.astro` (CSS only)

- [ ] **Step 1: Add media query in both `<style>` blocks**

```css
@media (prefers-reduced-transparency: reduce) {
  dialog::backdrop {
    backdrop-filter: none;
    background: var(--bg);
  }
}
```

#### Task 3.1.4: Drain Group A baselines + commit

- [ ] **Step 1: Build + run audits**

```bash
pnpm build
pnpm preview &
sleep 3
pnpm a11y:audit:primary
pnpm a11y:keyboard
kill %1
```

- [ ] **Step 2: Remove fixed entries from `axe-baseline.json` and `keyboard-baseline.json`**

For each entry that's no longer reported, delete it from the `skip` array. If any entries are still reported and intentionally `wontfix-rationale`, move them to the audit findings doc with that status.

- [ ] **Step 3: Commit + PR**

```bash
git add -A
git commit -m "feat(a11y): Group A — P1/P2/P3 (search palette + dialogs)"
git push -u origin a11y/08-group-a-dialogs
gh pr create --title "feat(a11y): Group A — search & dialogs (PR 3.1)" --body "..."
```

---

### PR 3.2 — Group B: code & content surfaces (P4, P5, P6)

#### Task 3.2.1: P4 — Conditional code-block keyboard scroll region

**Files:**
- Modify: `src/layouts/PostLayout.astro` (or new component / inline script)

- [ ] **Step 1: Add inline script in PostLayout**

After the post body renders:

```astro
<script>
  document.querySelectorAll('main pre').forEach((pre) => {
    const el = pre as HTMLElement;
    if (el.scrollWidth > el.clientWidth) {
      el.tabIndex = 0;
      el.setAttribute('role', 'region');
      const langClass = Array.from(el.classList).find(c => c.startsWith('language-')) ??
        Array.from(el.querySelector('code')?.classList ?? []).find((c: string) => c.startsWith('language-'));
      const lang = langClass?.replace('language-', '');
      el.setAttribute('aria-label', lang && lang !== 'plaintext' ? `Code, ${lang}` : 'Code');
    }
  });
</script>
```

> **Note:** runs after MDX hydration on every post page. If a post page uses ClientRouter and the script doesn't re-run on swap, wrap in an `astro:page-load` listener.

#### Task 3.2.2: P5 — Conditional table scroll region

**Files:**
- Create: `src/lib/remark-a11y/table-scroll.ts`
- Modify: `astro.config.ts`

- [ ] **Step 1: Write the rehype plugin (runtime, not build-time, since overflow is layout-dependent)**

Actually a rehype plugin can't measure layout. Use the same script-based approach as P4:

In `src/layouts/PostLayout.astro`:

```astro
<script>
  document.querySelectorAll('main table').forEach((table) => {
    const t = table as HTMLElement;
    requestAnimationFrame(() => {
      if (t.scrollWidth <= t.clientWidth) return;
      const wrap = document.createElement('div');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Table');
      wrap.tabIndex = 0;
      wrap.style.overflowX = 'auto';
      t.parentNode?.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  });
</script>
```

- [ ] **Step 2: Drop the rehype-plugin file from the file list above; this is script-only.**

#### Task 3.2.3: P6 — `lang` authoring rule documentation

**Files:**
- Modify: `AUTHORING.md`
- Modify: post scaffold (`scripts/new-post.ts` if it has a frontmatter template)

- [ ] **Step 1: Add a section to `AUTHORING.md`**

```md
## Non-English passages

Use `<span lang="…">…</span>` (e.g., `<span lang="ja">こんにちは</span>`)
when quoting non-English text. This lets screen readers select the right
voice. The build does not lint for this — it's an author convention.
```

#### Task 3.2.4: Drain Group B baselines + commit

```bash
pnpm build
pnpm preview &
sleep 3
pnpm a11y:audit:primary
pnpm a11y:html
kill %1
# remove fixed entries from baselines
git add -A
git commit -m "feat(a11y): Group B — P4/P5/P6 (code blocks, tables, lang)"
git push -u origin a11y/09-group-b-content
gh pr create --title "feat(a11y): Group B — code & content (PR 3.2)" --body "..."
```

---

### PR 3.3 — Group C: tokens, themes, focus (P7, P8, P9)

#### Task 3.3.1: P7 — Bump body tokens to AAA in both themes

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/lib/tokens.ts`
- Modify: `tokens-baseline.json`

- [ ] **Step 1: Use `pnpm test src/lib/contrast.test.ts` interactively to find AAA-passing values**

For each token in `tokens-baseline.json`'s skip list, find a hex that:
- Reaches ≥ 7:1 against its `bg`.
- Is visually distinguishable from its theme's existing scale (don't collapse muted/subtle).
- Stays brutalist (avoid color shifts; only luminance changes).

Example process:

```bash
node -e "
const { contrastRatio } = require('./dist-test/contrast.js');
// or use tsx + vitest --run --reporter=tap to compute interactively
['#888', '#929292', '#9c9c9c', '#a6a6a6'].forEach(c =>
  console.log(c, contrastRatio(c, '#0a0a0a').toFixed(2))
);
"
```

- [ ] **Step 2: Update `tokens.css`** with the chosen hex values; **update `src/lib/tokens.ts`** to match.

- [ ] **Step 3: Empty the relevant entries in `tokens-baseline.json`**, run tests:

```bash
pnpm test src/lib/tokens.test.ts
```

Expected: PASS without skips.

#### Task 3.3.2: P8 — Forced-colors focus-ring verification

**Files:**
- Maybe modify: `src/styles/global.css`

- [ ] **Step 1: Audit current rule**

```bash
grep -n "focus-visible\|outline" src/styles/global.css
```

- [ ] **Step 2: Confirm in audit findings doc whether forced-colors mode preserves focus rings**

If the audit (Phase 1) flagged any `focus-visible` rule using a fixed color in a forced-colors media block, change it to `CanvasText`. Otherwise no change — record P8 as `verified, no fix needed` in audit findings.

#### Task 3.3.3: P9 — Reading-progress bar `aria-hidden`

**Files:**
- Modify: file containing the reading-progress indicator

- [ ] **Step 1: Find and confirm**

```bash
grep -rn "reading-progress\|progress" src/components src/styles
```

- [ ] **Step 2: Confirm `aria-hidden="true"` on the visual indicator**

If missing, add it.

#### Task 3.3.4: Drain Group C baselines + commit

```bash
pnpm test   # tokens-baseline should be empty for the bumped pairs
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary
kill %1
git add -A
git commit -m "feat(a11y): Group C — P7/P8/P9 (tokens, focus rings, decorative bar)"
git push -u origin a11y/10-group-c-tokens
gh pr create --title "feat(a11y): Group C — tokens & focus (PR 3.3)" --body "..."
```

---

### PR 3.4 — Group D: component semantics (P10, P11, P12, P13)

#### Task 3.4.1: P10 — ToC `aria-current` value choice

**Files:**
- Maybe modify: `src/components/TableOfContents.astro`

- [ ] **Step 1: Consult audit findings doc**

If the static review flagged `aria-current="location"` as misbehaving in any tested AT, change all occurrences to `aria-current="true"`. Otherwise no change; record `verified, kept location` in findings.

#### Task 3.4.2: P11 — CopyButton live region split

**Files:**
- Modify: `src/components/CopyButton.astro`

- [ ] **Step 1: Add hidden live region near the copy button**

In the markup section, alongside the button-injection script, add a sibling element:

```astro
<span id="copy-status" class="sr-only" aria-live="polite" aria-atomic="true"></span>
```

If the button is dynamically injected per code block, inject the status span as a sibling of each button.

- [ ] **Step 2: Update the copy handler**

Inside `src/components/CopyButton.astro` script, change:

```diff
-      btn.setAttribute('aria-label', 'Copy code');
-      btn.setAttribute('aria-live', 'polite');
+      btn.setAttribute('aria-label', 'Copy code');
+      // status announcement happens via a sibling live region, not via this button
```

In the click handler, after a successful copy:

```ts
const status = btn.parentElement?.querySelector('.copy-status') as HTMLElement | null;
if (status) status.textContent = 'Copied';
setTimeout(() => { if (status) status.textContent = ''; }, 2000);
```

#### Task 3.4.3: P12 — ToC scrollspy debounce

**Files:**
- Modify: `src/components/TableOfContents.astro`

- [ ] **Step 1: Find the scroll handler that updates `aria-current`**

```bash
grep -n "aria-current\|setAttribute" src/components/TableOfContents.astro
```

- [ ] **Step 2: Wrap the update in a requestIdleCallback / 150ms debounce**

```ts
let scrollIdleTimer: number | undefined;
function scheduleUpdate(slug: string) {
  clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(() => {
    toc.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'));
    const link = toc.querySelector(`a[href="#${slug}"]`);
    link?.setAttribute('aria-current', 'location');
  }, 150);
}
```

Replace the immediate `setAttribute` calls with `scheduleUpdate(slug)`.

#### Task 3.4.4: P13 — Webmentions reply semantics

**Files:**
- Modify: `src/components/Webmentions.astro`

- [ ] **Step 1: Open file, identify the rendering loop**

```bash
sed -n '1,80p' src/components/Webmentions.astro
```

- [ ] **Step 2: Wrap each reply in `<article>`, ensure author name is the link's accessible name, ensure `<time datetime>` for timestamp**

```astro
{replies.map(r => (
  <article class="webmention" data-h-entry>
    <a href={r.author.url} class="p-author h-card">
      <img src={r.author.photo} alt="" />
      <span class="p-name">{r.author.name}</span>
    </a>
    <time class="dt-published" datetime={r.published}>{format(r.published)}</time>
    <p class="p-content">{r.content}</p>
  </article>
))}
```

#### Task 3.4.5: Drain Group D baselines + commit

```bash
pnpm test
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary
pnpm a11y:html
kill %1
git add -A
git commit -m "feat(a11y): Group D — P10/P11/P12/P13 (component semantics)"
git push -u origin a11y/11-group-d-semantics
gh pr create --title "feat(a11y): Group D — component semantics (PR 3.4)" --body "..."
```

---

### PR 3.5 — Group E: navigation & landmarks (P14a, P14b, P15)

#### Task 3.5.1: P14a — Skip-link menu

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Update layout markup**

```diff
-    <a href="#main" class="skip-link">Skip to content</a>
+    <nav class="skip-links" aria-label="Skip links">
+      <a href="#main">Skip to content</a>
+      <a href="#site-nav">Skip to navigation</a>
+    </nav>
```

> **Note:** `<nav id="site-nav">` already exists in `src/components/Header.astro` per the grep earlier; if not, add `id="site-nav"` to its existing `<nav class="site-nav">` element.

- [ ] **Step 2: Update CSS to handle multiple links visible-on-focus**

```css
.skip-links {
  position: absolute;
  top: -100px;
  left: 0;
}
.skip-links:focus-within {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 9999;
  display: flex;
  gap: 8px;
}
```

(Replace the existing `.skip-link` rules.)

#### Task 3.5.2: P14b — Pagefind UI style overrides

**Files:**
- Maybe create: `src/styles/pagefind.css`
- Maybe modify: `src/pages/search.astro`

- [ ] **Step 1: Audit `/search` for Pagefind contrast issues**

```bash
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary 2>&1 | grep -A5 "search"
kill %1
```

- [ ] **Step 2: If contrast violations on Pagefind UI, scope-override**

Create `src/styles/pagefind.css` if needed, importing CSS variables and selecting `.pagefind-ui *` to apply tokens. Import from `src/pages/search.astro`.

If no violations, P14b is `verified, no fix needed`.

#### Task 3.5.3: P15 — Heading hierarchy normalization (one-time pass)

**Files:**
- Multiple under `src/components/`, `src/pages/`

- [ ] **Step 1: Run G3 + G4 against the build**

```bash
pnpm build
pnpm a11y:html
```

Expected: any heading-related entries in `html-checks-baseline.json` are either now passing or are documented as intentional structure choices.

- [ ] **Step 2: For each remaining heading skip, fix the template**

Common fixes: changing an `<h3>` inside an `<aside>` to `<h2>` if the aside is its own landmark, or vice versa.

- [ ] **Step 3: Empty heading-related entries in `html-checks-baseline.json`**

#### Task 3.5.4: Drain Group E baselines + commit

```bash
pnpm test
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary
pnpm a11y:html
pnpm a11y:keyboard
kill %1
git add -A
git commit -m "feat(a11y): Group E — P14a/P14b/P15 (skip links, Pagefind, headings)"
git push -u origin a11y/12-group-e-landmarks
gh pr create --title "feat(a11y): Group E — navigation & landmarks (PR 3.5)" --body "..."
```

---

### PR 3.6 — Group F: public surface (P16, P17, G7)

#### Task 3.6.1: P16 — `/accessibility` page (static portion)

**Files:**
- Create: `src/pages/accessibility.astro`
- Modify: `src/components/Footer.astro` (link)

- [ ] **Step 1: Create page with static frontmatter + body**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import Breadcrumbs from '~/components/Breadcrumbs.astro';
import KnownLimits from '~/components/a11y/KnownLimits.astro';
---
<BaseLayout title="Accessibility" description="Accessibility statement and reporting channel for kevinkiklee.io.">
  <Breadcrumbs trail={[{ name: 'Home', url: '/' }, { name: 'Accessibility' }]} />
  <main id="main" tabindex="-1">
    <h1>Accessibility</h1>
    <p>This site targets <strong>WCAG 2.2 Level AA</strong> conformance, plus
    AAA contrast for body text. The full design lives in
    <a href="https://github.com/kevinkiklee/kevinkiklee.io/blob/main/docs/superpowers/specs/2026-05-04-accessibility-improvements-design.md">the accessibility design doc</a>.</p>

    <h2>What's tested in CI</h2>
    <ul>
      <li>axe-core via Playwright on every PR</li>
      <li>Lighthouse accessibility category, every audited route</li>
      <li>Token contrast unit tests</li>
      <li>Heading-increment + img-alt MDX lints</li>
      <li>Post-build HTML structural assertion</li>
      <li>Keyboard-traversal smoke</li>
    </ul>

    <h2>Third-party scope</h2>
    <p>The following surfaces are tested at the container level only;
    their internals are upstream:</p>
    <ul>
      <li><strong>Giscus comments</strong> — the iframe wrapper is gated; iframe contents are not.</li>
      <li><strong>webmention.io</strong> — the response shape is upstream; the rendered list is gated.</li>
      <li><strong>Pagefind UI</strong> — default styles on <code>/search</code>; we scope-override where needed.</li>
    </ul>

    <h2>Known limits</h2>
    <KnownLimits />

    <h2>Reporting an issue</h2>
    <p>Either DM me on
    <a rel="me" href={import.meta.env.PUBLIC_MASTODON_URL ?? 'https://hachyderm.io/@kevin'}>Mastodon</a>
    or
    <a href="https://github.com/kevinkiklee/kevinkiklee.io/issues/new">open a GitHub issue</a>.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Add footer link**

In `src/components/Footer.astro`, add `<li><a href="/accessibility">Accessibility</a></li>` next to the privacy link.

#### Task 3.6.2: G7 — `KnownLimits` component sources from findings doc

**Files:**
- Create: `src/components/a11y/KnownLimits.astro`
- Create: `src/lib/known-limits.ts`
- Create: `src/lib/known-limits.test.ts`

- [ ] **Step 1: Write failing test**

`src/lib/known-limits.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseKnownLimits } from './known-limits.ts';

const sample = `
### F-001 — short title
- **Severity:** Major
- **Status:** wontfix-rationale
- **Description:** Pagefind ships its own UI styles
- **WCAG:** 1.4.3

### F-002 — fixed thing
- **Severity:** Major
- **Status:** fixed
- **Description:** something
`;

describe('parseKnownLimits', () => {
  it('returns only wontfix-rationale entries', () => {
    const out = parseKnownLimits(sample);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('F-001');
    expect(out[0]?.description).toBe('Pagefind ships its own UI styles');
  });
});
```

- [ ] **Step 2: Run (expect fail)**

```bash
pnpm test src/lib/known-limits.test.ts
```

- [ ] **Step 3: Implement**

`src/lib/known-limits.ts`:

```ts
export interface KnownLimit {
  id: string;
  title: string;
  severity: string;
  description: string;
  wcag: string;
}

export function parseKnownLimits(md: string): KnownLimit[] {
  const sections = md.split(/^### /m).slice(1);
  const out: KnownLimit[] = [];
  for (const sec of sections) {
    const [headLine, ...lines] = sec.split('\n');
    const head = headLine ?? '';
    const idMatch = head.match(/^(F-\S+)\s+—\s+(.+)$/);
    if (!idMatch) continue;
    const get = (k: string) => {
      const re = new RegExp(`^- \\*\\*${k}:\\*\\*\\s+(.+)$`, 'm');
      return sec.match(re)?.[1]?.trim() ?? '';
    };
    if (get('Status') !== 'wontfix-rationale') continue;
    out.push({
      id: idMatch[1] ?? '',
      title: idMatch[2] ?? '',
      severity: get('Severity'),
      description: get('Description'),
      wcag: get('WCAG'),
    });
  }
  return out;
}
```

- [ ] **Step 4: Run (expect pass)**

```bash
pnpm test src/lib/known-limits.test.ts
```

- [ ] **Step 5: Build the component**

`src/components/a11y/KnownLimits.astro`:

```astro
---
import { parseKnownLimits } from '~/lib/known-limits';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const findingsPath = fileURLToPath(new URL('../../../docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md', import.meta.url));
const md = readFileSync(findingsPath, 'utf8');
const limits = parseKnownLimits(md);
---
{limits.length === 0 ? (
  <p>None currently. (If a `wontfix-rationale` finding lands later, this list updates automatically.)</p>
) : (
  <ul>
    {limits.map(l => (
      <li>
        <strong>{l.title}</strong> ({l.severity}, WCAG {l.wcag}) — {l.description}
      </li>
    ))}
  </ul>
)}
```

#### Task 3.6.3: P17 — Schema.org accessibility metadata

**Files:**
- Modify: `src/lib/schema.ts`

- [ ] **Step 1: Find the JSON-LD builders**

```bash
grep -n "BlogPosting\|WebPage" src/lib/schema.ts
```

- [ ] **Step 2: Add fields to the relevant builders**

```ts
accessibilityFeature: ['structuralNavigation', 'highContrastDisplay', 'highContrast/CSSEnabled'],
accessibilityHazard: 'none',
accessibilityAPI: 'ARIA',
```

#### Task 3.6.4: Drain Group F baselines + commit

```bash
pnpm test
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit:primary
pnpm a11y:html
pnpm a11y:keyboard
kill %1
# update audit-routes.ts to set accessibility { exists: true }
git add -A
git commit -m "feat(a11y): Group F — P16/P17 + G7 (/accessibility page)"
git push -u origin a11y/13-group-f-public
gh pr create --title "feat(a11y): Group F — /accessibility page (PR 3.6)" --body "..."
```

---

## Phase 4 — Tighten (1 PR)

**End state:** baselines deleted, G2 strict, `CLAUDE.md` updated.

### Task 4.1: Verify all baselines empty

```bash
git switch main && git pull
git switch -c a11y/14-tighten

cat axe-baseline.json
cat html-checks-baseline.json
cat keyboard-baseline.json
cat tokens-baseline.json
```

Each should show `"skip": []` (or remaining entries should match `wontfix-rationale` findings rendered on `/accessibility`). If non-empty entries exist that aren't documented as wontfix, return to Phase 3 — do not proceed.

### Task 4.2: Delete baseline files

```bash
rm axe-baseline.json html-checks-baseline.json keyboard-baseline.json tokens-baseline.json
```

Update the audit script to no-op when baseline files are missing (already does, via try/catch on read).

### Task 4.3: Lift G2 to strict 1.0 on every URL

**File:** `lighthouserc.cjs`

Change every per-URL `minScore` to `1.0`:

```js
'categories:accessibility': ['error', { minScore: 1.0 }],
```

(Apply to every entry in `assertMatrix`.)

### Task 4.4: Update CLAUDE.md

Add a section pointing future a11y work at the audit findings doc:

```md
## Accessibility

- Target: **WCAG 2.2 AA**, AAA body contrast.
- Source of truth for known issues: `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`.
- Gates: `pnpm a11y:audit`, `pnpm a11y:html`, `pnpm a11y:keyboard`, `pnpm test` (token contrast). All run on every PR.
- New findings: open as PR comments via `actions/github-script`; fix or document `wontfix-rationale` on `/accessibility`.
```

### Task 4.5: Final audit, flip spec status, commit

```bash
pnpm build && pnpm preview &
sleep 3
pnpm a11y:audit
pnpm a11y:html
pnpm a11y:keyboard
pnpm test
kill %1
```

Expected: zero failures across all gates.

In `docs/superpowers/specs/2026-05-04-accessibility-improvements-design.md`, change `Status:` from `Approved (brainstorming complete)` to `Implemented`.

```bash
git add -A
git commit -m "feat(a11y): Phase 4 — tighten gates, delete baselines (PR 4.1)"
git push -u origin a11y/14-tighten
gh pr create --title "feat(a11y): Phase 4 tighten (PR 4.1)" --body "..."
```

---

## Self-review checklist

After implementing:

- [ ] Every Section 4 polish item P1–P17 has a Phase 3 task.
- [ ] Every Section 3 gate G1–G7 has a Phase 2 (or 3.6 for G7) task.
- [ ] Every Section 6 validation row has either a CI assertion or a `Phase N stop` task.
- [ ] No `*-baseline.json` files remain after Phase 4.
- [ ] `pnpm a11y:audit` succeeds end-to-end on `main`.
- [ ] `/accessibility` route renders, footer link works, known-limits list reflects current findings.
- [ ] Audit findings doc Status column is `fixed` or `wontfix-rationale` for every row.
- [ ] Spec doc status flipped to `Implemented`.
