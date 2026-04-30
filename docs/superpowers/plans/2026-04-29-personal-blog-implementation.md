# kevinkiklee.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a refined brutalist-terminal personal blog at https://kevinkiklee.io — Astro 5 static site, MDX content, Vercel hosting, top-tier CWV/SEO/a11y, per-route view transitions, Speculation Rules, Pagefind search, Giscus + Mastodon comments, dynamic OG images.

**Architecture:** Static-first Astro 5 with `output: 'static'`. MDX content collections validated by Zod. View Transitions via `<ClientRouter />` with per-route choreography. Speculation Rules for prerender on Chrome. Pagefind for search. Giscus + webmentions for comments. `@vercel/og` for dynamic OG. Vercel Web Analytics + Speed Insights + GA4 via Partytown for instrumentation. Lighthouse CI on every PR.

**Tech Stack:** Astro 5, TypeScript strict, MDX, Shiki, Pagefind, Giscus, `@vercel/og`, `@vercel/analytics`, `@vercel/speed-insights`, Partytown, Biome, simple-git-hooks, commitlint, cspell, markdownlint, lychee, axe-core, Lighthouse CI, Renovate, pnpm, Node 24, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-29-personal-blog-design.md`

**Authoritative version verification (before installing):** Use Context7 (`mcp__context7__query-docs`) to confirm latest stable versions of Astro, integrations, and key packages. The spec lists the libraries; Context7 confirms exact versions.

---

## Phase 0 — Scaffolding & Tooling

End state: `pnpm dev` serves a blank Astro page; `pnpm check`, `pnpm format`, `pnpm build` all pass. Repo committed.

### Task 0.1: Verify package versions via Context7

**Files:** none (research only)

- [ ] **Step 1: Resolve and query latest stable versions**

Run via Context7 (or browser if MCP unavailable) for each:
- `astro` — confirm Astro 5 latest stable
- `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/partytown`
- `astro-pagefind`
- `pagefind`
- `@vercel/og`, `@vercel/analytics`, `@vercel/speed-insights`, `@vercel/config`
- `@biomejs/biome`
- `web-vitals`
- `simple-git-hooks`, `@commitlint/cli`, `@commitlint/config-conventional`
- `cspell`, `markdownlint-cli2`

Record exact versions in a temp note for use in Task 0.3.

- [ ] **Step 2: No commit (research only)**

### Task 0.2: Initialize Astro project (manual scaffold, not `npm create`)

The repo already exists with `.gitignore` and `docs/`. We hand-scaffold to keep control.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.ts`
- Create: `src/env.d.ts`
- Create: `.nvmrc`

- [ ] **Step 1: Create `.nvmrc`**

```
24
```

- [ ] **Step 2: Create `package.json`** (use confirmed versions from Task 0.1; `^` for libs, exact for tools)

```json
{
  "name": "kevinkiklee-io",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24.0.0" },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check && biome ci . && cspell '**/*.{md,mdx}' --no-progress && markdownlint-cli2 '**/*.{md,mdx}'",
    "format": "biome format --write .",
    "fonts:subset": "tsx scripts/subset-fonts.ts",
    "new:post": "tsx scripts/new-post.ts",
    "new:project": "tsx scripts/new-project.ts",
    "analyze": "open stats.html",
    "links:check": "lychee --no-progress dist/",
    "a11y:check": "axe http://localhost:4321 --exit",
    "lighthouse": "lhci collect --url=http://localhost:4321"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/rss": "^4.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/partytown": "^2.0.0",
    "astro-pagefind": "^1.6.0",
    "pagefind": "^1.1.0",
    "@vercel/og": "^0.6.0",
    "@vercel/analytics": "^1.4.0",
    "@vercel/speed-insights": "^1.1.0",
    "web-vitals": "^4.2.0",
    "satori": "^0.12.0",
    "yaml": "^2.6.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@commitlint/cli": "19.6.0",
    "@commitlint/config-conventional": "19.6.0",
    "@lhci/cli": "0.14.0",
    "@types/node": "22.9.0",
    "axe-core": "4.10.0",
    "cspell": "8.16.0",
    "lychee": "*",
    "markdownlint-cli2": "0.15.0",
    "rollup-plugin-visualizer": "5.12.0",
    "simple-git-hooks": "2.11.1",
    "tsx": "4.19.0"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm exec lint-staged",
    "commit-msg": "pnpm exec commitlint --edit $1"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": false,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "astro",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Create `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 5: Create `astro.config.ts`** (minimal — integrations added in later phases)

```ts
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kevinkiklee.io',
  trailingSlash: 'never',
  output: 'static',
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/api/') && !page.endsWith('/404'),
    }),
  ],
  env: {
    schema: {
      GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_REPO: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_REPO_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_CATEGORY: envField.string({ context: 'client', access: 'public', optional: true }),
      GISCUS_CATEGORY_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_HANDLE: envField.string({ context: 'client', access: 'public', optional: true }),
      MASTODON_INSTANCE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      WEBMENTION_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      VERCEL_DEPLOY_HOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
```

- [ ] **Step 6: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, no errors.

- [ ] **Step 7: Verify dev server starts (no pages yet)**

Run: `pnpm dev`
Expected: server starts on http://localhost:4321 (will 404 — no pages yet). Stop with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json astro.config.ts src/env.d.ts .nvmrc
git commit -m "chore: scaffold astro 5 project"
```

### Task 0.3: Configure Biome, EditorConfig, VS Code

**Files:**
- Create: `biome.jsonc`
- Create: `.editorconfig`
- Create: `.vscode/settings.json`
- Create: `.vscode/extensions.json`

- [ ] **Step 1: Create `biome.jsonc`**

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignore": ["dist", ".astro", "node_modules", "stats.html", ".vercel"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useImportType": "off" },
      "suspicious": { "noExplicitAny": "warn" }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" }
  },
  "json": { "formatter": { "trailingCommas": "none" } }
}
```

- [ ] **Step 2: Create `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: Create `.vscode/settings.json`**

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[mdx]": { "editor.defaultFormatter": "unifiedjs.vscode-mdx" },
  "[astro]": { "editor.defaultFormatter": "astro-build.astro-vscode" },
  "files.associations": { "*.mdx": "mdx" }
}
```

- [ ] **Step 4: Create `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "biomejs.biome",
    "unifiedjs.vscode-mdx",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens"
  ]
}
```

- [ ] **Step 5: Verify Biome formats**

Run: `pnpm format`
Expected: no errors; files reformatted in place if needed.

- [ ] **Step 6: Commit**

```bash
git add biome.jsonc .editorconfig .vscode/
git commit -m "chore: configure biome, editorconfig, vscode"
```

### Task 0.4: Configure pre-commit hooks, commitlint, cspell, markdownlint

**Files:**
- Create: `commitlint.config.cjs`
- Create: `cspell.config.cjs`
- Create: `cspell-words.txt`
- Create: `.markdownlint.jsonc`
- Modify: `package.json` (add `lint-staged` config)

- [ ] **Step 1: Create `commitlint.config.cjs`**

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'perf', 'style', 'test', 'ci', 'build', 'post'],
    ],
  },
};
```

- [ ] **Step 2: Create `cspell.config.cjs`**

```js
module.exports = {
  version: '0.2',
  language: 'en',
  words: [],
  dictionaryDefinitions: [
    { name: 'project-words', path: './cspell-words.txt', addWords: true },
  ],
  dictionaries: ['project-words'],
  ignorePaths: ['dist', '.astro', 'node_modules', 'pnpm-lock.yaml'],
};
```

- [ ] **Step 3: Create `cspell-words.txt`** (seed; expand over time)

```
astro
biome
biomejs
commitlint
cspell
devrel
dvh
fluid
giscus
indexnow
jetbrains
kevinkiklee
lhci
linkinator
lychee
markdownlint
mastodon
mdx
monochromatic
ncrement
pagefind
partytown
pnpm
pnpx
pyftsubset
satori
shiki
speculation
swr
tsconfig
tsx
turborepo
typegen
vercel
vitejs
webmention
webmentions
woff
zodiac
```

- [ ] **Step 4: Create `.markdownlint.jsonc`**

```jsonc
{
  "default": true,
  "MD013": false,
  "MD024": { "siblings_only": true },
  "MD033": false,
  "MD036": false,
  "MD041": false
}
```

- [ ] **Step 5: Add `lint-staged` config to `package.json`**

Add to `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx,astro}": ["biome format --write", "biome lint"],
  "*.{md,mdx}": ["cspell --no-progress", "markdownlint-cli2"]
}
```

Also add `lint-staged` to `devDependencies`: `"lint-staged": "15.2.10"`. Run `pnpm install`.

- [ ] **Step 6: Activate simple-git-hooks**

Run: `pnpm exec simple-git-hooks`
Expected: `[INFO] Hook 'pre-commit' is set` etc.

- [ ] **Step 7: Verify hooks fire (smoke test)**

```bash
echo "# scratch" > scratch.md
git add scratch.md
git commit -m "chore: hook smoke test"
```
Expected: cspell + markdownlint run; commit succeeds. Then:
```bash
git rm scratch.md
git commit -m "chore: remove scratch"
```

- [ ] **Step 8: Commit hook configs**

```bash
git add commitlint.config.cjs cspell.config.cjs cspell-words.txt .markdownlint.jsonc package.json pnpm-lock.yaml
git commit -m "chore: add commitlint, cspell, markdownlint, lint-staged"
```

### Task 0.5: Bare-bones layout + index page (smoke test)

End-of-phase verification: site renders at `/`.

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`** (minimal)

```astro
---
interface Props {
  title: string;
  description?: string;
}
const { title, description = '' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 2: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="kevinkiklee.io">
  <h1>kevinkiklee.io</h1>
  <p>placeholder</p>
</BaseLayout>
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds; `dist/index.html` exists.

- [ ] **Step 4: Verify dev server**

Run: `pnpm dev`, visit http://localhost:4321
Expected: page renders "kevinkiklee.io" heading. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: scaffold BaseLayout and homepage"
```

---

## Phase 1 — Visual Foundation (tokens, theme, fonts, header/footer, 404)

End state: branded shell with navigation, working theme toggle (no FOUC), self-hosted subset fonts, custom 404. All routes return shell. Light + dark verified WCAG.

### Task 1.1: Design token CSS

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/tokens.css`** (full content from spec §3.1–3.3)

```css
:root {
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --font-display: 'IBM Plex Mono', var(--font-mono);

  --text-xs:   clamp(0.72rem, 0.70rem + 0.10vw, 0.78rem);
  --text-sm:   clamp(0.82rem, 0.80rem + 0.13vw, 0.90rem);
  --text-base: clamp(0.95rem, 0.92rem + 0.18vw, 1.05rem);
  --text-lg:   clamp(1.10rem, 1.05rem + 0.25vw, 1.25rem);
  --text-xl:   clamp(1.40rem, 1.30rem + 0.50vw, 1.75rem);
  --text-2xl:  clamp(1.80rem, 1.60rem + 1.0vw,  2.50rem);

  --leading-body: 1.65;
  --leading-tight: 1.25;
  --measure: 68ch;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  --ease: cubic-bezier(0.32, 0.72, 0, 1);
}

:root[data-theme='light'] {
  --bg: #f5f4ee;
  --fg: #0a0a0a;
  --fg-muted: #4a4a4a;
  --fg-subtle: #767676;
  --rule: #0a0a0a;
  --rule-soft: #c8c5b8;
  --pill-bg: #0a0a0a;
  --pill-fg: #f5f4ee;
  --code-bg: #ebe9df;
  --selection-bg: #0a0a0a;
  --selection-fg: #f5f4ee;
}

:root[data-theme='dark'] {
  --bg: #0a0a0a;
  --fg: #ededed;
  --fg-muted: #b5b5b5;
  --fg-subtle: #888888;
  --rule: #ededed;
  --rule-soft: #2a2a2a;
  --pill-bg: #ededed;
  --pill-fg: #0a0a0a;
  --code-bg: #161616;
  --selection-bg: #ededed;
  --selection-fg: #0a0a0a;
}
```

- [ ] **Step 2: Create `src/styles/global.css`** (reset + base)

```css
@layer reset, tokens, base, components, prose, utilities;

@import './tokens.css' layer(tokens);

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { min-height: 100dvh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
  input, button, textarea, select { font: inherit; }
  p, h1, h2, h3, h4, h5, h6 { overflow-wrap: anywhere; }
  ul[role='list'], ol[role='list'] { list-style: none; padding: 0; }
}

@layer base {
  html {
    color-scheme: light dark;
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-mono);
    font-size: 16px;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    font-size: var(--text-base);
    line-height: var(--leading-body);
    background: var(--bg);
    color: var(--fg);
  }
  ::selection { background: var(--selection-bg); color: var(--selection-fg); }
  a { color: inherit; text-decoration: none; }
  :focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  *::-webkit-scrollbar { width: 8px; height: 8px; }
  *::-webkit-scrollbar-thumb { background: var(--fg-subtle); }
  *::-webkit-scrollbar-track { background: transparent; }
  html { scrollbar-color: var(--fg-subtle) transparent; }

  h1, h2, h3 { font-family: var(--font-display); font-weight: 700; line-height: var(--leading-tight); text-wrap: balance; }
  p { text-wrap: pretty; }
  input, textarea { caret-color: var(--fg); accent-color: var(--fg); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
}
```

- [ ] **Step 3: Import in BaseLayout**

Modify `src/layouts/BaseLayout.astro` head:

```astro
---
import '~/styles/global.css';
interface Props { title: string; description?: string; }
const { title, description = '' } = Astro.props;
---
```

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev` → http://localhost:4321
Expected: page uses monospace font, has light/dark CSS vars (test by setting `<html data-theme="dark">` in DevTools).

- [ ] **Step 5: Commit**

```bash
git add src/styles/ src/layouts/BaseLayout.astro
git commit -m "feat: design tokens + global styles + reset"
```

### Task 1.2: Self-host fonts (subset variable WOFF2)

**Files:**
- Create: `scripts/subset-fonts.ts`
- Add: `public/fonts/` directory with subsetted WOFF2 files

- [ ] **Step 1: Place source TTFs**

Manual: download `JetBrainsMono[wght].ttf` (variable) from https://www.jetbrains.com/lp/mono/ to `fonts/source/`. Same for `IBMPlexMono` if used. Document in README.

- [ ] **Step 2: Create `scripts/subset-fonts.ts`** (uses `glyphhanger`-style approach via `subset-font` lib OR shell-out to `pyftsubset`)

```ts
#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Requires: pip install fonttools brotli; available as `pyftsubset`
const SOURCES = [
  { input: 'fonts/source/JetBrainsMono[wght].ttf', output: 'public/fonts/jetbrains-mono.woff2' },
];
const UNICODES = 'U+0000-007F,U+00A0-00FF,U+2010-2027,U+2030,U+2032-2033,U+2070,U+2074-2079,U+20A0-20BF,U+2122,U+2191-2199,U+2500-257F,U+2580-259F';

mkdirSync('public/fonts', { recursive: true });
mkdirSync('public/fonts/og', { recursive: true });

for (const { input, output } of SOURCES) {
  if (!existsSync(input)) {
    console.error(`missing source: ${input}`);
    process.exit(1);
  }
  console.log(`subsetting ${input} → ${output}`);
  execSync(
    `pyftsubset "${resolve(input)}" --output-file="${resolve(output)}" --flavor=woff2 --layout-features='*' --unicodes="${UNICODES}"`,
    { stdio: 'inherit' },
  );
}

// Copy raw TTF for Satori (server-side OG renderer)
execSync(`cp "fonts/source/JetBrainsMono[wght].ttf" public/fonts/og/JetBrainsMono-Variable.ttf`);
console.log('done');
```

- [ ] **Step 3: Run subset script**

Run: `pnpm fonts:subset`
Expected: `public/fonts/jetbrains-mono.woff2` (~25–35 KB) and `public/fonts/og/JetBrainsMono-Variable.ttf` exist.

- [ ] **Step 4: Add `@font-face` rule to `tokens.css`** (with metric overrides → CLS=0)

Append to `src/styles/tokens.css`:

```css
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono.woff2') format('woff2-variations');
  font-weight: 100 800;
  font-display: swap;
  unicode-range: U+0000-007F, U+00A0-00FF, U+2010-2027, U+2030, U+2032-2033, U+2070, U+2074-2079, U+20A0-20BF, U+2122, U+2191-2199, U+2500-257F, U+2580-259F;
  size-adjust: 102%;
  ascent-override: 80%;
  descent-override: 20%;
  line-gap-override: 0%;
}
```

- [ ] **Step 5: Add preload to BaseLayout `<head>`**

In `src/layouts/BaseLayout.astro` after `<meta>` tags:

```astro
<link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 6: Verify font loads**

Run: `pnpm dev`. DevTools → Network → reload → confirm `jetbrains-mono.woff2` returns 200 and is preloaded.

- [ ] **Step 7: Commit**

```bash
git add scripts/subset-fonts.ts public/fonts/ src/styles/tokens.css src/layouts/BaseLayout.astro
git commit -m "feat: self-host subset variable JetBrains Mono with metric overrides"
```

### Task 1.3: No-FOUC theme script + theme toggle

**Files:**
- Create: `src/lib/theme.ts` (client-side helpers)
- Create: `src/components/ThemeToggle.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add inline theme script + meta to BaseLayout `<head>`**

```astro
<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />

<script is:inline>
  (function () {
    var stored = localStorage.getItem('theme');
    var prefers = matchMedia('(prefers-color-scheme: dark)').matches;
    var t = stored || (prefers ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
    document.documentElement.style.background = t === 'dark' ? '#0a0a0a' : '#f5f4ee';
  })();
</script>
```

- [ ] **Step 2: Create `src/lib/theme.ts`**

```ts
export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || 'light';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  document.documentElement.style.background = t === 'dark' ? '#0a0a0a' : '#f5f4ee';
  try {
    localStorage.setItem('theme', t);
  } catch {}
  updateThemeColorMeta(t);
}

function updateThemeColorMeta(t: Theme) {
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0a0a' : '#f5f4ee');
}

export function initThemeListeners(): void {
  // cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      document.documentElement.dataset.theme = e.newValue;
    }
  });
  // OS theme change (only if user hasn't manually picked)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
```

- [ ] **Step 3: Create `src/components/ThemeToggle.astro`**

```astro
<button id="theme-toggle" type="button" aria-label="Toggle color theme">
  <span aria-hidden="true" data-icon="light">☀</span>
  <span aria-hidden="true" data-icon="dark">☾</span>
</button>

<style>
  #theme-toggle {
    background: none;
    border: 1px solid var(--rule);
    color: var(--fg);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :root[data-theme='light'] #theme-toggle [data-icon='light'],
  :root[data-theme='dark']  #theme-toggle [data-icon='dark'] { display: none; }
</style>

<script>
  import { getTheme, setTheme, initThemeListeners } from '~/lib/theme';
  initThemeListeners();
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
</script>
```

- [ ] **Step 4: Add toggle to homepage temporarily (verify)**

In `src/pages/index.astro`:

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
---
<BaseLayout title="kevinkiklee.io">
  <h1>kevinkiklee.io</h1>
  <ThemeToggle />
</BaseLayout>
```

- [ ] **Step 5: Verify no FOUC + toggle works**

Run: `pnpm dev`. Reload several times → no flash. Toggle button switches theme; reload preserves; open second tab and toggle → first tab updates.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme.ts src/components/ThemeToggle.astro src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: theme toggle with no-FOUC, cross-tab sync, OS-change listener"
```

### Task 1.4: Header + Footer + landmarks + skip link

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
import ThemeToggle from './ThemeToggle.astro';
const path = Astro.url.pathname;
const links = [
  { href: '/', label: 'HOME' },
  { href: '/posts', label: 'POSTS' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/about', label: 'ABOUT' },
];
function isCurrent(href: string) {
  if (href === '/') return path === '/';
  return path.startsWith(href);
}
---
<header class="site-header">
  <div class="row">
    <a href="/" class="brand" aria-label="kevinkiklee.io home">[ KEVINKIKLEE.IO ]</a>
    <nav aria-label="Primary">
      <ul role="list">
        {links.map((l) => (
          <li><a href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
    <ThemeToggle />
  </div>
</header>

<style>
  .site-header {
    border-bottom: 2px solid var(--rule);
    padding: var(--space-4) var(--space-5);
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 10;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    max-width: 1100px;
    margin: 0 auto;
    flex-wrap: wrap;
  }
  .brand {
    font-weight: 700;
    letter-spacing: 0.04em;
    font-size: var(--text-sm);
  }
  nav ul {
    display: flex;
    gap: var(--space-5);
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: var(--text-xs);
    letter-spacing: 0.08em;
  }
  nav a { padding: var(--space-2) 0; }
  nav a[aria-current='page'] { border-bottom: 2px solid var(--fg); }
  @media (max-width: 640px) {
    .row { gap: var(--space-3); justify-content: flex-start; }
    nav { order: 3; width: 100%; overflow-x: auto; }
    nav ul { gap: var(--space-4); }
  }
</style>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
const mastodon = import.meta.env.PUBLIC_MASTODON_INSTANCE_URL ?? 'https://mastodon.social/@kevin';
---
<footer class="site-footer">
  <div class="row">
    <span>[ © {year} KEVIN LEE ]</span>
    <ul role="list">
      <li><a href={mastodon} rel="me">MASTODON</a></li>
      <li><a href="https://github.com/kevinkiklee">GITHUB</a></li>
      <li><a href="/rss.xml">RSS</a></li>
      <li><a href="/feed.json">JSON FEED</a></li>
      <li><a href="/privacy">PRIVACY</a></li>
    </ul>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 2px solid var(--rule);
    padding: var(--space-5);
    margin-top: var(--space-8);
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
  }
  .row { display: flex; justify-content: space-between; gap: var(--space-5); max-width: 1100px; margin: 0 auto; flex-wrap: wrap; }
  ul { display: flex; gap: var(--space-4); list-style: none; padding: 0; margin: 0; }
</style>
```

- [ ] **Step 3: Update BaseLayout with skip-link + landmarks**

Replace `src/layouts/BaseLayout.astro` body:

```astro
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <Header />
  <main id="main" tabindex="-1">
    <slot />
  </main>
  <Footer />
  <div id="route-announce" aria-live="polite" aria-atomic="true" class="sr-only"></div>
</body>
```

Add to `global.css` base layer:

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--fg);
  color: var(--bg);
  padding: var(--space-2) var(--space-4);
  z-index: 100;
}
.skip-link:focus { left: 0; }
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
main { max-width: 1100px; margin: 0 auto; padding: var(--space-6) var(--space-5); }
```

Import `Header` and `Footer` in BaseLayout frontmatter.

- [ ] **Step 4: Verify build + visual**

Run: `pnpm dev`. Confirm header (sticky), footer, theme toggle, skip link (Tab from address bar shows it).

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/layouts/ src/styles/global.css
git commit -m "feat: header, footer, skip link, landmarks"
```

### Task 1.5: Custom 404 page

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="404 · kevinkiklee.io" description="Page not found">
  <section class="not-found">
    <pre aria-hidden="true">
┌─────────────────────────────────────────┐
│  ERROR 404 — file not found             │
│  $ ls /posts/{Astro.url.pathname.replace(/^\//, '')}_</span>
└─────────────────────────────────────────┘
    </pre>
    <h1>Nothing here</h1>
    <p>That URL does not match a post or page on this site.</p>
    <ul role="list">
      <li><a href="/">→ home</a></li>
      <li><a href="/posts">→ all posts</a></li>
      <li><a href="/search">→ search</a></li>
    </ul>
  </section>
</BaseLayout>

<style>
  .not-found { max-width: 600px; }
  pre { font-size: var(--text-xs); color: var(--fg-muted); margin-bottom: var(--space-5); white-space: pre; overflow-x: auto; }
  h1 { font-size: var(--text-2xl); margin-bottom: var(--space-3); }
  ul { margin-top: var(--space-5); }
  li { padding: var(--space-2) 0; }
</style>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, visit http://localhost:4321/does-not-exist
Expected: 404 page renders.

- [ ] **Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: custom brutalist 404"
```

### Task 1.6: PHASE 1 verification + push

- [ ] **Step 1: Lighthouse smoke**

Run: `pnpm build && pnpm preview` (in another shell), then `pnpm lighthouse` (or open Chrome → DevTools → Lighthouse → Mobile, Performance + Accessibility).
Expected: Performance ≥ 95, Accessibility 100, SEO ≥ 90, Best-Practices 100.

If anything fails: fix inline before phase 2 begins.

- [ ] **Step 2: Tag release**

```bash
git tag phase-1-foundation
```

---

## Phase 2 — Content collections + Post rendering

End state: post pages render from MDX, code highlighted, reading time computed, dual themes work.

### Task 2.1: Content config + tags allowlist

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/tags.json`
- Create: `src/content/posts/.gitkeep`
- Create: `src/content/projects/projects.yaml`

- [ ] **Step 1: Create `src/content/tags.json`** (allowlist; expand as needed)

```json
{
  "tags": [
    "ai",
    "web-platform",
    "chrome",
    "performance",
    "accessibility",
    "devrel",
    "javascript",
    "typescript",
    "tooling",
    "personal"
  ]
}
```

- [ ] **Step 2: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import tagsJson from './content/tags.json' with { type: 'json' };

const TAG_SET = new Set(tagsJson.tags);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(80),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z
        .array(z.string())
        .default([])
        .refine((tags) => tags.every((t) => TAG_SET.has(t)), {
          message: `Tag not in allowlist (src/content/tags.json). Add it there first.`,
        }),
      draft: z.boolean().default(false),
      cover: z
        .object({ src: image(), alt: z.string().min(1) })
        .optional(),
      mastodonUrl: z.string().url().optional(),
      series: z
        .object({ name: z.string(), order: z.number().int().positive() })
        .optional(),
    }),
});

const projects = defineCollection({
  loader: file('./src/content/projects/projects.yaml'),
  schema: z.object({
    name: z.string(),
    blurb: z.string().max(200),
    url: z.string().url(),
    repoUrl: z.string().url().optional(),
    tech: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { posts, projects };
```

- [ ] **Step 3: Seed `src/content/projects/projects.yaml`**

```yaml
- id: photo-tools
  name: photo-tools
  blurb: Photography toolkit — sensor comparison, lens calculators. Canvas/WebGL.
  url: https://github.com/kevinkiklee/photo-tools
  repoUrl: https://github.com/kevinkiklee/photo-tools
  tech: [nextjs, typescript, canvas, webgl]
  featured: true
  order: 1
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: succeeds; `astro check` reports content collections OK.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/
git commit -m "feat: content collections (posts + projects) + tags allowlist"
```

### Task 2.2: Reading-time remark plugin (TDD)

**Files:**
- Create: `src/lib/reading-time.ts`
- Create: `src/lib/reading-time.test.ts`

- [ ] **Step 1: Add Vitest**

```bash
pnpm add -D vitest@^2.1.0
```
Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`.

- [ ] **Step 2: Write failing test**

`src/lib/reading-time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeReadingTime } from './reading-time';

describe('computeReadingTime', () => {
  it('rounds 200 wpm to nearest minute, minimum 1', () => {
    expect(computeReadingTime('one')).toBe(1);
    expect(computeReadingTime('word '.repeat(199))).toBe(1);
    expect(computeReadingTime('word '.repeat(200))).toBe(1);
    expect(computeReadingTime('word '.repeat(401))).toBe(2);
    expect(computeReadingTime('word '.repeat(1500))).toBe(8);
  });
  it('strips markdown syntax from word count', () => {
    expect(computeReadingTime('# Title\n\n[link](url) text')).toBe(1);
  });
});
```

- [ ] **Step 3: Run test (fails)**

Run: `pnpm test`
Expected: module not found.

- [ ] **Step 4: Implement**

`src/lib/reading-time.ts`:

```ts
const WPM = 200;

export function computeReadingTime(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = stripped.length === 0 ? 0 : stripped.split(/\s+/).length;
  return Math.max(1, Math.round(words / WPM));
}

import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';

export const remarkReadingTime: Plugin<[], Root> = () => (tree, file) => {
  const text = toString(tree);
  const minutes = computeReadingTime(text);
  // Astro injects astro.frontmatter into file.data
  const data = file.data as { astro?: { frontmatter?: Record<string, unknown> } };
  data.astro ??= {};
  data.astro.frontmatter ??= {};
  data.astro.frontmatter.minutesRead = minutes;
};
```

Install peer: `pnpm add mdast-util-to-string`.

- [ ] **Step 5: Run test (passes)**

Run: `pnpm test`
Expected: 2 tests pass.

- [ ] **Step 6: Wire remark plugin into Astro config**

Modify `astro.config.ts`:

```ts
import { remarkReadingTime } from './src/lib/reading-time';

export default defineConfig({
  // ...
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      wrap: true,
    },
  },
  // ...
});
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/reading-time.ts src/lib/reading-time.test.ts astro.config.ts package.json pnpm-lock.yaml
git commit -m "feat: reading-time remark plugin (TDD)"
```

### Task 2.3: Post page template + sample post

**Files:**
- Create: `src/pages/posts/[...slug].astro`
- Create: `src/layouts/PostLayout.astro`
- Create: `src/components/PostMeta.astro`
- Create: `src/content/posts/2026-04-12-hello-world.mdx`

- [ ] **Step 1: Seed first post**

`src/content/posts/2026-04-12-hello-world.mdx`:

```mdx
---
title: Hello, world
description: First post on the new site — what it is and what to expect.
pubDate: 2026-04-12
tags: [personal, devrel]
draft: false
---

This is the inaugural post on kevinkiklee.io. Notes from a Chrome DevRel — heavy on AI and the web platform, lighter on everything else.

## What's in here

Posts arrive when something feels worth saying. Expect a mix of:

- web platform deep-dives (View Transitions, Speculation Rules, Cache Components)
- AI workflows and prompting
- random tangents

```ts
console.log('hello, world');
```

That's it. Subscribe via [RSS](/rss.xml) or [JSON Feed](/feed.json).
```

- [ ] **Step 2: Create `src/components/PostMeta.astro`**

```astro
---
interface Props {
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  minutesRead?: number;
}
const { pubDate, updatedDate, tags, minutesRead } = Astro.props;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
---
<div class="meta">
  <time datetime={pubDate.toISOString()}>{fmt(pubDate)}</time>
  {updatedDate && <span> · UPDATED {fmt(updatedDate)}</span>}
  {minutesRead && <span> · {minutesRead} MIN READ</span>}
  {tags.length > 0 && (
    <span> · {tags.map((t, i) => (
      <>{i > 0 && ' '}<a href={`/tags/${t}`} class="pill">{t.toUpperCase()}</a></>
    ))}</span>
  )}
</div>

<style>
  .meta {
    font-size: var(--text-xs);
    color: var(--fg-muted);
    letter-spacing: 0.06em;
    font-variant-numeric: tabular-nums slashed-zero;
  }
  .pill {
    background: var(--pill-bg);
    color: var(--pill-fg);
    padding: 1px 6px;
    text-decoration: none;
  }
</style>
```

- [ ] **Step 3: Create `src/layouts/PostLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import PostMeta from '~/components/PostMeta.astro';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'posts'>;
  minutesRead?: number;
}
const { post, minutesRead } = Astro.props;
const { title, description, pubDate, updatedDate, tags } = post.data;
---
<BaseLayout title={`${title} · kevinkiklee.io`} description={description}>
  <article class="post">
    <header>
      <h1>{title}</h1>
      <PostMeta {pubDate} {updatedDate} {tags} {minutesRead} />
    </header>
    <div class="prose">
      <slot />
    </div>
  </article>
</BaseLayout>

<style>
  .post header { margin-bottom: var(--space-6); }
  h1 {
    font-size: var(--text-2xl);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-bottom: var(--space-3);
  }
  .prose { max-width: var(--measure); }
</style>
```

- [ ] **Step 4: Create `src/pages/posts/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '~/layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => {
    if (import.meta.env.PROD) return data.draft !== true;
    return true;
  });
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(post);
const minutesRead = remarkPluginFrontmatter.minutesRead as number | undefined;
---
<PostLayout post={post} minutesRead={minutesRead}>
  <Content />
</PostLayout>
```

- [ ] **Step 5: Add prose CSS**

Create `src/styles/prose.css`:

```css
@layer prose {
  .prose { font-size: var(--text-base); line-height: var(--leading-body); }
  .prose > * + * { margin-top: var(--space-5); }
  .prose h2 {
    font-size: var(--text-xl);
    text-transform: uppercase;
    border-bottom: 2px solid var(--rule);
    padding-bottom: var(--space-2);
    margin-top: var(--space-7);
  }
  .prose h3 { font-size: var(--text-lg); text-transform: uppercase; margin-top: var(--space-6); }
  .prose ul, .prose ol { padding-left: var(--space-5); }
  .prose li + li { margin-top: var(--space-2); }
  .prose a {
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 100% 1px;
    background-position: 0 100%;
    background-repeat: no-repeat;
  }
  .prose code {
    background: var(--code-bg);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 0.92em;
  }
  .prose pre {
    background: var(--code-bg);
    padding: var(--space-4);
    overflow-x: auto;
    border: 1px solid var(--rule-soft);
  }
  .prose pre code { background: transparent; padding: 0; }
  .prose blockquote {
    border-left: 3px solid var(--rule);
    padding-left: var(--space-4);
    color: var(--fg-muted);
  }
  .prose hr { border: none; border-top: 1px dashed var(--rule-soft); margin: var(--space-7) 0; }
}
```

Import in `global.css`: append `@import './prose.css' layer(prose);`.

Wire Shiki dual-theme via CSS:

```css
@layer prose {
  html[data-theme='dark'] .prose .astro-code,
  html[data-theme='dark'] .prose .astro-code span { color: var(--shiki-dark) !important; background: var(--code-bg) !important; }
  html[data-theme='light'] .prose .astro-code,
  html[data-theme='light'] .prose .astro-code span { color: var(--shiki-light) !important; background: var(--code-bg) !important; }
}
```

(Astro's Shiki integration emits both themes as CSS vars when `themes: { light, dark }` is configured.)

- [ ] **Step 6: Verify post renders**

Run: `pnpm dev`, visit http://localhost:4321/posts/hello-world
Expected: post renders with title, meta, formatted prose, dual-theme code block (toggle theme to confirm).

- [ ] **Step 7: Commit**

```bash
git add src/pages/posts/ src/layouts/PostLayout.astro src/components/PostMeta.astro src/content/posts/ src/styles/
git commit -m "feat: post page template, prose styles, Shiki dual-theme"
```

---

## Phase 3 — Listing pages

End state: home, /posts (paginated), /tags, /tags/[tag], /projects, /about, /privacy all render.

### Task 3.1: Helpers — sorted posts, tag counts

**Files:**
- Create: `src/lib/posts.ts`
- Create: `src/lib/posts.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { sortByDateDesc, tagCounts } from './posts';

describe('sortByDateDesc', () => {
  it('sorts posts newest first', () => {
    const a = { data: { pubDate: new Date('2026-01-01') } } as any;
    const b = { data: { pubDate: new Date('2026-04-01') } } as any;
    expect(sortByDateDesc([a, b])[0]).toBe(b);
  });
});

describe('tagCounts', () => {
  it('counts tags across posts', () => {
    const posts = [
      { data: { tags: ['ai', 'devrel'] } },
      { data: { tags: ['ai'] } },
      { data: { tags: [] } },
    ] as any;
    expect(tagCounts(posts)).toEqual({ ai: 2, devrel: 1 });
  });
});
```

- [ ] **Step 2: Run test (fails)**

Run: `pnpm test`

- [ ] **Step 3: Implement**

```ts
import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function tagCounts(posts: Post[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of posts) for (const t of p.data.tags) out[t] = (out[t] ?? 0) + 1;
  return out;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const { getCollection } = await import('astro:content');
  const env = import.meta.env;
  return getCollection('posts', ({ data }) => {
    if (env.PROD && env.VERCEL_ENV !== 'preview') return data.draft !== true;
    return true;
  });
}
```

- [ ] **Step 4: Run test (passes)**

- [ ] **Step 5: Commit**

```bash
git add src/lib/posts.ts src/lib/posts.test.ts
git commit -m "feat: post helpers (sort, tag counts, drafts filter)"
```

### Task 3.2: Home page

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/PostCard.astro`
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Create `src/components/PostCard.astro`**

```astro
---
import PostMeta from './PostMeta.astro';
import type { CollectionEntry } from 'astro:content';

interface Props { post: CollectionEntry<'posts'>; index?: number; }
const { post, index = 0 } = Astro.props;
const { title, description, pubDate, tags } = post.data;
const num = String(index + 1).padStart(2, '0');
---
<article class="post-card" style={`--i:${index}`}>
  <a href={`/posts/${post.id}`}>
    <h3>[{num}] {title.toUpperCase()}</h3>
    <PostMeta {pubDate} {tags} />
    <p>{description}</p>
    <span class="cta">→ READ POST</span>
  </a>
</article>

<style>
  .post-card {
    border-top: 1px solid var(--rule-soft);
    padding: var(--space-5) 0;
    container-type: inline-size;
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
</style>
```

- [ ] **Step 2: Create `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props { project: CollectionEntry<'projects'>; }
const { project } = Astro.props;
const { name, blurb, url, repoUrl, tech } = project.data;
---
<article class="project-card">
  <h3><a href={url}>{name.toUpperCase()} ↗</a></h3>
  <p>{blurb}</p>
  <ul role="list" class="tech">
    {tech.map((t) => <li>{t}</li>)}
  </ul>
  {repoUrl && <a href={repoUrl} class="repo">[ view repo ]</a>}
</article>

<style>
  .project-card { border: 1px solid var(--rule-soft); padding: var(--space-4); }
  h3 { font-size: var(--text-base); text-transform: uppercase; }
  p { color: var(--fg-muted); margin: var(--space-3) 0; }
  .tech { display: flex; gap: var(--space-2); flex-wrap: wrap; font-size: var(--text-xs); color: var(--fg-subtle); }
  .tech li::before { content: '['; }
  .tech li::after { content: ']'; }
  .repo { display: inline-block; margin-top: var(--space-3); font-size: var(--text-xs); color: var(--fg-muted); }
</style>
```

- [ ] **Step 3: Update `src/pages/index.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import PostCard from '~/components/PostCard.astro';
import ProjectCard from '~/components/ProjectCard.astro';
import { sortByDateDesc, getPublishedPosts } from '~/lib/posts';
import { getCollection } from 'astro:content';

const posts = sortByDateDesc(await getPublishedPosts()).slice(0, 5);
const projects = (await getCollection('projects'))
  .filter((p) => p.data.featured)
  .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
---
<BaseLayout
  title="kevinkiklee.io"
  description="Field notes from a Chrome DevRel — AI, web platform, and tangents."
>
  <section class="hero">
    <p class="prompt">$ whoami</p>
    <h1>// FIELD NOTES</h1>
    <p class="tag">DEVREL @ GOOGLE CHROME · AI · WEB PLATFORM · TANGENTS</p>
  </section>

  <section aria-labelledby="latest">
    <h2 id="latest" class="section-title">[ LATEST POSTS ]</h2>
    {posts.map((post, i) => <PostCard {post} index={i} />)}
    <p class="more"><a href="/posts">→ all posts</a></p>
  </section>

  {projects.length > 0 && (
    <section aria-labelledby="featured">
      <h2 id="featured" class="section-title">[ FEATURED PROJECTS ]</h2>
      <div class="grid">
        {projects.map((project) => <ProjectCard {project} />)}
      </div>
      <p class="more"><a href="/projects">→ all projects</a></p>
    </section>
  )}
</BaseLayout>

<style>
  .hero { padding: var(--space-7) 0 var(--space-6); border-bottom: 2px solid var(--rule); margin-bottom: var(--space-6); }
  .prompt { color: var(--fg-subtle); font-size: var(--text-sm); }
  .hero h1 { font-size: var(--text-2xl); letter-spacing: 0.02em; text-transform: uppercase; margin: var(--space-2) 0; }
  .tag { font-size: var(--text-xs); letter-spacing: 0.08em; color: var(--fg-muted); }
  .section-title { font-size: var(--text-base); letter-spacing: 0.06em; margin: var(--space-7) 0 var(--space-4); }
  .grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .more { margin-top: var(--space-5); font-size: var(--text-xs); }
</style>
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`. Home page shows hero, latest posts, featured projects.

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/pages/index.astro
git commit -m "feat: home page with hero + latest posts + featured projects"
```

### Task 3.3: /posts paginated archive + /tags + /tags/[tag]

**Files:**
- Create: `src/pages/posts/index.astro`
- Create: `src/pages/posts/[page].astro`
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Create `src/pages/posts/index.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import { sortByDateDesc, getPublishedPosts } from '~/lib/posts';

const posts = sortByDateDesc(await getPublishedPosts()).slice(0, 30);
const groupedByYear = posts.reduce<Record<number, typeof posts>>((acc, p) => {
  const y = p.data.pubDate.getFullYear();
  (acc[y] ??= []).push(p);
  return acc;
}, {});
const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);
---
<BaseLayout title="Posts · kevinkiklee.io" description="Archive of all posts.">
  <h1 class="page-title">// POSTS</h1>
  {years.map((year) => (
    <section>
      <h2>{year}</h2>
      <ul role="list" class="archive">
        {groupedByYear[year].map((p) => (
          <li>
            <a href={`/posts/${p.id}`}>
              <time datetime={p.data.pubDate.toISOString()}>{p.data.pubDate.toISOString().slice(5, 10)}</time>
              <span>{p.data.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  ))}
</BaseLayout>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
  h2 { font-size: var(--text-lg); border-bottom: 2px solid var(--rule); padding-bottom: var(--space-2); margin: var(--space-6) 0 var(--space-3); }
  .archive { font-variant-numeric: tabular-nums; }
  .archive li { padding: var(--space-2) 0; border-top: 1px solid var(--rule-soft); }
  .archive a { display: grid; grid-template-columns: 80px 1fr; gap: var(--space-4); align-items: baseline; min-height: 44px; }
  .archive time { color: var(--fg-subtle); font-size: var(--text-sm); }
</style>
```

- [ ] **Step 2: Create paginated `src/pages/posts/[page].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import BaseLayout from '~/layouts/BaseLayout.astro';
import { sortByDateDesc, getPublishedPosts } from '~/lib/posts';

export const getStaticPaths = (async ({ paginate }) => {
  const posts = sortByDateDesc(await getPublishedPosts());
  return paginate(posts, { pageSize: 30 });
}) satisfies GetStaticPaths;

const { page } = Astro.props;
---
<BaseLayout title={`Posts · page ${page.currentPage}`} description="Older posts.">
  <h1>POSTS — PAGE {page.currentPage}/{page.lastPage}</h1>
  <ul role="list">
    {page.data.map((p) => (
      <li><a href={`/posts/${p.id}`}>{p.data.pubDate.toISOString().slice(0, 10)} — {p.data.title}</a></li>
    ))}
  </ul>
  <nav aria-label="Pagination">
    {page.url.prev && <a href={page.url.prev}>← newer</a>}
    {' · '}
    {page.url.next && <a href={page.url.next}>older →</a>}
  </nav>
  <link rel="canonical" slot="head" href={`https://kevinkiklee.io${page.url.current}`} />
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/tags/index.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import { getPublishedPosts } from '~/lib/posts';
import { tagCounts } from '~/lib/posts';

const counts = tagCounts(await getPublishedPosts());
const tags = Object.entries(counts).sort(([, a], [, b]) => b - a);
---
<BaseLayout title="Tags · kevinkiklee.io" description="Browse posts by tag.">
  <h1 class="page-title">// TAGS</h1>
  <ul role="list" class="tag-grid">
    {tags.map(([tag, count]) => (
      <li><a href={`/tags/${tag}`}>{tag.toUpperCase()} <span class="count">[{count}]</span></a></li>
    ))}
  </ul>
</BaseLayout>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
  .tag-grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
  .tag-grid a { padding: var(--space-3); border: 1px solid var(--rule-soft); display: block; min-height: 44px; }
  .count { color: var(--fg-subtle); font-size: var(--text-xs); }
</style>
```

- [ ] **Step 4: Create `src/pages/tags/[tag].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import BaseLayout from '~/layouts/BaseLayout.astro';
import PostCard from '~/components/PostCard.astro';
import { sortByDateDesc, getPublishedPosts, tagCounts } from '~/lib/posts';

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  const counts = tagCounts(posts);
  return Object.keys(counts).map((tag) => {
    const tagPosts = sortByDateDesc(posts.filter((p) => p.data.tags.includes(tag)));
    return { params: { tag }, props: { tag, posts: tagPosts, count: counts[tag] } };
  });
}) satisfies GetStaticPaths;

const { tag, posts, count } = Astro.props;
const noindex = count < 3;
---
<BaseLayout title={`#${tag} · kevinkiklee.io`} description={`Posts tagged ${tag}.`}>
  {noindex && <meta name="robots" content="noindex" slot="head" />}
  <h1 class="page-title">// TAG: {tag.toUpperCase()} <span class="count">[{count}]</span></h1>
  {posts.map((post, i) => <PostCard {post} index={i} />)}
</BaseLayout>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
  .count { color: var(--fg-subtle); }
</style>
```

Note: BaseLayout needs to support a `head` slot — modify `src/layouts/BaseLayout.astro`:

```astro
<head>
  <!-- existing meta -->
  <slot name="head" />
</head>
```

- [ ] **Step 5: Verify**

Run: `pnpm dev`. Visit `/posts`, `/tags`, `/tags/personal`. All render.

- [ ] **Step 6: Commit**

```bash
git add src/pages/posts/ src/pages/tags/ src/layouts/BaseLayout.astro
git commit -m "feat: posts archive, tags grid, tag pages with thin-content noindex"
```

### Task 3.4: /projects, /about, /privacy

**Files:**
- Create: `src/pages/projects.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: `src/pages/projects.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import ProjectCard from '~/components/ProjectCard.astro';
import { getCollection } from 'astro:content';

const projects = (await getCollection('projects'))
  .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
---
<BaseLayout title="Projects · kevinkiklee.io" description="Open-source projects and side experiments.">
  <h1 class="page-title">// PROJECTS</h1>
  <div class="grid">
    {projects.map((project) => <ProjectCard {project} />)}
  </div>
</BaseLayout>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
  .grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
</style>
```

- [ ] **Step 2: `src/pages/about.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
const mastodon = import.meta.env.PUBLIC_MASTODON_INSTANCE_URL ?? 'https://mastodon.social/@kevin';
---
<BaseLayout title="About · kevinkiklee.io" description="Who I am, what I work on, how to reach me.">
  <article class="h-card">
    <h1 class="page-title">// ABOUT</h1>
    <p class="lead">
      Hi, I'm <a class="p-name u-url" rel="me" href="https://kevinkiklee.io">Kevin Lee</a>.
      I work as a <span class="p-job-title">Developer Relations Engineer</span>
      at <span class="p-org">Google Chrome</span>.
    </p>
    <p>This site is a place for field notes — heavy on AI and the web platform, lighter on everything else. Most posts are short. Some are long. RSS welcome.</p>
    <h2>FIND ME</h2>
    <ul class="links" role="list">
      <li><a class="u-url" rel="me" href={mastodon}>↗ Mastodon — primary social</a></li>
      <li><a class="u-url" rel="me" href="https://github.com/kevinkiklee">↗ GitHub</a></li>
      <li><a class="u-url" rel="me" href="https://www.linkedin.com/in/kevinkiklee/">↗ LinkedIn</a></li>
    </ul>
    <p class="discuss">Best way to reach me is on Mastodon. I read everything.</p>
  </article>
</BaseLayout>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
  .lead { font-size: var(--text-lg); max-width: var(--measure); }
  h2 { font-size: var(--text-base); border-bottom: 2px solid var(--rule); padding-bottom: var(--space-2); margin: var(--space-7) 0 var(--space-3); }
  .links li { padding: var(--space-2) 0; }
  .discuss { margin-top: var(--space-5); color: var(--fg-muted); }
</style>
```

- [ ] **Step 3: `src/pages/privacy.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="Privacy · kevinkiklee.io" description="What this site collects and why.">
  <article class="prose" style="max-width: var(--measure);">
    <h1>// PRIVACY</h1>
    <p>This site collects the bare minimum needed to understand whether anyone is reading it and whether the site is fast.</p>
    <h2>What's collected</h2>
    <ul>
      <li><strong>Vercel Web Analytics</strong> — pageviews, referrers, country. Cookieless. Aggregated. ~30-day retention.</li>
      <li><strong>Vercel Speed Insights</strong> — anonymous Core Web Vitals (LCP, INP, CLS) from real visits. Cookieless.</li>
      <li><strong>Google Analytics 4</strong> — pageviews, referrers, country, anonymized IP. Loaded off the main thread via Partytown. ~14-month retention. No ad-personalization signals sent.</li>
      <li><strong>webmention.io</strong> — when this site fetches replies from Mastodon/Bluesky for display alongside posts. Their privacy policy applies.</li>
      <li><strong>Giscus</strong> — when you scroll to the comments section on a post, GitHub's iframe loads. GitHub's privacy policy applies.</li>
    </ul>
    <h2>What's NOT collected</h2>
    <ul>
      <li>Cookies — none set by this site.</li>
      <li>Personal data — no email/contact form on this site.</li>
      <li>Cross-site tracking, ad networks, fingerprinting.</li>
    </ul>
    <h2>Contact</h2>
    <p>Mastodon DM. Listed on the <a href="/about">about page</a>.</p>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`. All three pages render.

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects.astro src/pages/about.astro src/pages/privacy.astro
git commit -m "feat: projects, about (h-card), privacy pages"
```

---

## Phase 4 — Feeds & SEO foundations

End state: sitemap, RSS, JSON Feed, robots, canonical URLs all present.

### Task 4.1: BaseHead component (canonical, OG, Twitter, alternates)

**Files:**
- Create: `src/components/BaseHead.astro`
- Modify: `src/layouts/BaseLayout.astro` (use it)

- [ ] **Step 1: Create `src/components/BaseHead.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  ogImageUrl?: string;
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
}
const {
  title,
  description,
  ogType = 'website',
  ogImageUrl,
  publishedTime,
  modifiedTime,
  tags = [],
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const ogImage = ogImageUrl ?? new URL('/og-default.png', Astro.site).toString();
---
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<meta property="og:type" content={ogType} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content="kevinkiklee.io" />
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={title} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />

{publishedTime && <meta property="article:published_time" content={publishedTime.toISOString()} />}
{modifiedTime && <meta property="article:modified_time" content={modifiedTime.toISOString()} />}
{tags.map((t) => <meta property="article:tag" content={t} />)}

<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="kevinkiklee.io" />
<link rel="alternate" type="application/feed+json" href="/feed.json" title="kevinkiklee.io" />
<link rel="me" href={import.meta.env.PUBLIC_MASTODON_INSTANCE_URL ?? 'https://mastodon.social/@kevin'} />
<link rel="webmention" href="https://webmention.io/kevinkiklee.io/webmention" />

<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/favicon-192.png" />
```

- [ ] **Step 2: Refactor `BaseLayout.astro` to use `BaseHead`**

Replace existing meta block in `<head>` with:

```astro
---
import BaseHead from '~/components/BaseHead.astro';
import Header from '~/components/Header.astro';
import Footer from '~/components/Footer.astro';
import '~/styles/global.css';

interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  ogImageUrl?: string;
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
}
const props = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <BaseHead {...props} />
    <link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin />
    <meta name="color-scheme" content="dark light" />
    <meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    <script is:inline>
      (function () {
        var stored = localStorage.getItem('theme');
        var prefers = matchMedia('(prefers-color-scheme: dark)').matches;
        var t = stored || (prefers ? 'dark' : 'light');
        document.documentElement.dataset.theme = t;
        document.documentElement.style.background = t === 'dark' ? '#0a0a0a' : '#f5f4ee';
      })();
    </script>
    <slot name="head" />
  </head>
  <body>
    <a href="#main" class="skip-link">Skip to content</a>
    <Header />
    <main id="main" tabindex="-1"><slot /></main>
    <Footer />
    <div id="route-announce" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  </body>
</html>
```

Update every page using `BaseLayout` to pass `description` (already done). For the post layout, also pass `ogType="article"`, `publishedTime`, `modifiedTime`, `tags`.

Update `src/layouts/PostLayout.astro`:

```astro
---
const { title, description, pubDate, updatedDate, tags } = post.data;
---
<BaseLayout
  title={`${title} · kevinkiklee.io`}
  description={description}
  ogType="article"
  publishedTime={pubDate}
  modifiedTime={updatedDate}
  {tags}
>
```

- [ ] **Step 3: Verify HTML head includes everything**

Run: `pnpm build && pnpm preview`. Curl any page, confirm canonical/OG/Twitter/rel=me/webmention all present.

- [ ] **Step 4: Commit**

```bash
git add src/components/BaseHead.astro src/layouts/
git commit -m "feat: BaseHead component (canonical, OG, Twitter, rel=me, webmention)"
```

### Task 4.2: RSS feed + JSON Feed + per-tag feeds

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/feed.json.ts`
- Create: `src/pages/tags/[tag]/rss.xml.ts`

- [ ] **Step 1: Install `@astrojs/rss`** (already in deps from Task 0.2)

- [ ] **Step 2: Create `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sortByDateDesc, getPublishedPosts } from '~/lib/posts';

export async function GET(context: APIContext) {
  const posts = sortByDateDesc(await getPublishedPosts());
  return rss({
    title: 'kevinkiklee.io',
    description: 'Field notes from a Chrome DevRel — AI, web platform, tangents.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
    })),
    customData: '<language>en-us</language>',
    stylesheet: '/rss-style.xsl',
  });
}
```

- [ ] **Step 3: Create `src/pages/feed.json.ts`**

```ts
import type { APIContext } from 'astro';
import { sortByDateDesc, getPublishedPosts } from '~/lib/posts';

export async function GET(context: APIContext) {
  const site = context.site!;
  const posts = sortByDateDesc(await getPublishedPosts());
  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'kevinkiklee.io',
    home_page_url: site.toString(),
    feed_url: new URL('/feed.json', site).toString(),
    description: 'Field notes from a Chrome DevRel.',
    language: 'en-US',
    authors: [{ name: 'Kevin Lee', url: site.toString() }],
    items: posts.map((p) => ({
      id: new URL(`/posts/${p.id}`, site).toString(),
      url: new URL(`/posts/${p.id}`, site).toString(),
      title: p.data.title,
      summary: p.data.description,
      date_published: p.data.pubDate.toISOString(),
      date_modified: (p.data.updatedDate ?? p.data.pubDate).toISOString(),
      tags: p.data.tags,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
```

- [ ] **Step 4: Create per-tag RSS — `src/pages/tags/[tag]/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import type { APIContext, GetStaticPaths } from 'astro';
import { getPublishedPosts, tagCounts, sortByDateDesc } from '~/lib/posts';

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return Object.keys(tagCounts(posts)).map((tag) => ({ params: { tag } }));
}) satisfies GetStaticPaths;

export async function GET(context: APIContext) {
  const tag = context.params.tag!;
  const posts = sortByDateDesc(
    (await getPublishedPosts()).filter((p) => p.data.tags.includes(tag)),
  );
  return rss({
    title: `kevinkiklee.io — #${tag}`,
    description: `Posts tagged ${tag}.`,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
    })),
  });
}
```

- [ ] **Step 5: Create `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://kevinkiklee.io/sitemap-index.xml
```

- [ ] **Step 6: Create `public/og-default.png`** placeholder

Generate a 1200×630 brutalist black-on-cream PNG with the brand text. Manual or via `pnpm` script in a later phase. Commit a placeholder for now.

```bash
# placeholder (replace with real OG later)
echo "placeholder — replace with real 1200x630 png"
```

- [ ] **Step 7: Verify feeds**

Run: `pnpm build && pnpm preview`.
- `curl http://localhost:4321/rss.xml` returns valid RSS 2.0.
- `curl http://localhost:4321/feed.json` returns valid JSON Feed 1.1.
- `curl http://localhost:4321/tags/personal/rss.xml` returns RSS for that tag.
- `curl http://localhost:4321/sitemap-index.xml` returns sitemap.
- `curl http://localhost:4321/robots.txt` returns the file.

- [ ] **Step 8: Commit**

```bash
git add src/pages/rss.xml.ts src/pages/feed.json.ts src/pages/tags/[tag]/rss.xml.ts public/robots.txt public/og-default.png
git commit -m "feat: RSS, JSON Feed, per-tag RSS, robots.txt, OG fallback"
```

### Task 4.3: JSON-LD builders

**Files:**
- Create: `src/lib/schema.ts`
- Create: `src/lib/schema.test.ts`
- Create: `src/components/JsonLd.astro`
- Modify: relevant page files to render schema

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildBlogPosting, buildPerson, buildBreadcrumbs } from './schema';

describe('buildBlogPosting', () => {
  it('produces a valid BlogPosting', () => {
    const ld = buildBlogPosting({
      url: 'https://kevinkiklee.io/posts/x',
      title: 'Title',
      description: 'desc',
      pubDate: new Date('2026-04-12'),
      tags: ['ai'],
      imageUrl: 'https://kevinkiklee.io/api/og?slug=x',
      wordCount: 600,
      minutesRead: 3,
      authorUrl: 'https://kevinkiklee.io/about',
    });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('Title');
    expect(ld.timeRequired).toBe('PT3M');
    expect(ld.inLanguage).toBe('en-US');
  });
});

describe('buildBreadcrumbs', () => {
  it('builds breadcrumbs from path segments', () => {
    const ld = buildBreadcrumbs([
      { name: 'Home', url: 'https://kevinkiklee.io/' },
      { name: 'Posts', url: 'https://kevinkiklee.io/posts' },
      { name: 'Title', url: 'https://kevinkiklee.io/posts/x' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
  });
});
```

- [ ] **Step 2: Run test (fails)**

- [ ] **Step 3: Implement `src/lib/schema.ts`**

```ts
const SITE = 'https://kevinkiklee.io';
const PERSON_REF = { '@type': 'Person', name: 'Kevin Lee', url: `${SITE}/about` };

export function buildBlogPosting(args: {
  url: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  imageUrl: string;
  wordCount?: number;
  minutesRead?: number;
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

export function buildPerson(args: { mastodon: string; github: string; linkedin?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kevin Lee',
    url: `${SITE}/about`,
    jobTitle: 'Developer Relations Engineer',
    worksFor: { '@type': 'Organization', name: 'Google Chrome' },
    sameAs: [args.mastodon, args.github, args.linkedin].filter(Boolean),
  } as const;
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'kevinkiklee.io',
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search?q={query}` },
      'query-input': 'required name=query',
    },
  } as const;
}

export function buildBreadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  } as const;
}
```

- [ ] **Step 4: Run test (passes)**

- [ ] **Step 5: Create `src/components/JsonLd.astro`**

```astro
---
interface Props { data: Record<string, unknown> | Record<string, unknown>[]; }
const { data } = Astro.props;
const json = JSON.stringify(data);
---
<script type="application/ld+json" set:html={json}></script>
```

- [ ] **Step 6: Wire JSON-LD into pages**

Home (`src/pages/index.astro`) — add to `<BaseLayout>`:

```astro
<JsonLd slot="head" data={buildWebSite()} />
```

About (`src/pages/about.astro`):

```astro
<JsonLd slot="head" data={buildPerson({
  mastodon: 'https://mastodon.social/@kevin',
  github: 'https://github.com/kevinkiklee',
  linkedin: 'https://www.linkedin.com/in/kevinkiklee/'
})} />
```

Post layout (`src/layouts/PostLayout.astro`):

```astro
<JsonLd slot="head" data={[
  buildBlogPosting({
    url: new URL(`/posts/${post.id}`, Astro.site).toString(),
    title,
    description,
    pubDate,
    updatedDate,
    tags,
    imageUrl: new URL(`/api/og?slug=${post.id}`, Astro.site).toString(),
    minutesRead,
    authorUrl: new URL('/about', Astro.site).toString(),
  }),
  buildBreadcrumbs([
    { name: 'Home', url: new URL('/', Astro.site).toString() },
    { name: 'Posts', url: new URL('/posts', Astro.site).toString() },
    { name: title, url: new URL(`/posts/${post.id}`, Astro.site).toString() },
  ]),
]} />
```

- [ ] **Step 7: Validate JSON-LD**

Build, then paste a post URL into https://search.google.com/test/rich-results (or use `npx schema-dts-check`). Confirm BlogPosting + BreadcrumbList parse without errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts src/components/JsonLd.astro src/pages/ src/layouts/
git commit -m "feat: JSON-LD (BlogPosting, Person, WebSite/SearchAction, BreadcrumbList)"
```

### Task 4.4: PHASE 4 verification

- [ ] **Step 1: Lighthouse SEO 100**

Build, preview, run Lighthouse on home + a post. SEO must be 100. Fix any failures inline.

- [ ] **Step 2: Tag**

```bash
git tag phase-4-feeds-seo
```

---

## Phase 5 — Search (Pagefind + ⌘K palette)

End state: `/search` route works; ⌘K / `/` palette opens; Pagefind UI lazy-loaded.

### Task 5.1: Add `astro-pagefind` integration

**Files:**
- Modify: `astro.config.ts`

- [ ] **Step 1: Add integration**

```ts
import pagefind from 'astro-pagefind';

export default defineConfig({
  // ...
  integrations: [
    mdx(),
    sitemap({ /* ... */ }),
    pagefind(),
  ],
  // ...
});
```

- [ ] **Step 2: Build to generate index**

Run: `pnpm build`
Expected: `dist/pagefind/` contains the index.

- [ ] **Step 3: Commit**

```bash
git add astro.config.ts
git commit -m "feat: add astro-pagefind integration"
```

### Task 5.2: /search route

**Files:**
- Create: `src/pages/search.astro`

- [ ] **Step 1: Create page**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import Search from 'astro-pagefind/components/Search';
---
<BaseLayout title="Search · kevinkiklee.io" description="Search the archive.">
  <h1 class="page-title">// SEARCH</h1>
  <Search id="search" className="pagefind-ui" uiOptions={{ showImages: false, resetStyles: false }} />
</BaseLayout>

<style is:global>
  .pagefind-ui { --pagefind-ui-primary: var(--fg); --pagefind-ui-text: var(--fg); --pagefind-ui-background: var(--bg); --pagefind-ui-border: var(--rule); --pagefind-ui-tag: var(--code-bg); --pagefind-ui-border-radius: 0; --pagefind-ui-font: var(--font-mono); }
</style>

<style>
  .page-title { font-size: var(--text-2xl); text-transform: uppercase; margin-bottom: var(--space-6); }
</style>
```

- [ ] **Step 2: Verify**

`pnpm build && pnpm preview` → `/search` works (input + results).

- [ ] **Step 3: Commit**

```bash
git add src/pages/search.astro
git commit -m "feat: /search route via astro-pagefind"
```

### Task 5.3: Global ⌘K / `/` search palette

**Files:**
- Create: `src/components/SearchPalette.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create palette component**

```astro
---
import { PagefindSearch } from 'astro-pagefind/components/Search';
---
<dialog id="search-palette" aria-label="Search">
  <form method="dialog" class="palette-frame">
    <div class="bar">
      <span aria-hidden="true">/ </span>
      <input id="palette-input" type="search" name="q" autocomplete="off" placeholder="search posts…" />
      <button type="submit" aria-label="Close">[ESC]</button>
    </div>
    <div id="palette-results" class="results"></div>
  </form>
</dialog>

<style>
  dialog { background: var(--bg); color: var(--fg); border: 2px solid var(--rule); padding: 0; max-width: min(680px, 92vw); width: 100%; margin-top: 10vh; }
  dialog::backdrop { background: rgba(0,0,0,0.4); }
  .palette-frame { padding: var(--space-4); }
  .bar { display: flex; align-items: center; gap: var(--space-3); border-bottom: 1px solid var(--rule); padding-bottom: var(--space-3); margin-bottom: var(--space-3); }
  input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--fg); font: inherit; }
  button { background: transparent; border: 0; color: var(--fg-muted); font: inherit; cursor: pointer; }
  .results { min-height: 100px; max-height: 60vh; overflow-y: auto; }
</style>

<script>
  const dlg = document.getElementById('search-palette') as HTMLDialogElement;
  const input = document.getElementById('palette-input') as HTMLInputElement;
  const results = document.getElementById('palette-results') as HTMLDivElement;
  let pagefindLoaded: any = null;

  function open() {
    if (!dlg.open) dlg.showModal();
    setTimeout(() => input.focus(), 0);
    void loadPagefind();
  }
  function close() { if (dlg.open) dlg.close(); }

  async function loadPagefind() {
    if (pagefindLoaded) return pagefindLoaded;
    pagefindLoaded = await import(/* @vite-ignore */ '/pagefind/pagefind.js');
    await pagefindLoaded.options({ baseUrl: '/' });
    return pagefindLoaded;
  }

  let timer: number | undefined;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      const pf = await loadPagefind();
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      const search = await pf.search(q);
      const top = await Promise.all(search.results.slice(0, 8).map((r: any) => r.data()));
      results.innerHTML = top
        .map((d) => `<a href="${d.url}"><strong>${d.meta.title}</strong><br><small>${d.excerpt}</small></a>`)
        .join('');
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); open(); }
    else if (k === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); open(); }
    else if (k === 'escape' && dlg.open) close();
  });
</script>
```

- [ ] **Step 2: Add to BaseLayout body**

```astro
<SearchPalette />
```

- [ ] **Step 3: Verify**

Build, preview, press `/` → palette opens, search works.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchPalette.astro src/layouts/BaseLayout.astro
git commit -m "feat: global Cmd-K / '/' search palette using <dialog>"
```

---

## Phase 6 — Comments + Mastodon + Webmentions

End state: every post page has Giscus, "Discuss on Mastodon", and webmention list.

### Task 6.1: Giscus island (lazy)

**Files:**
- Create: `src/components/Giscus.astro`

- [ ] **Step 1: Create component**

```astro
---
const repo = import.meta.env.PUBLIC_GISCUS_REPO ?? 'kevinkiklee/kevinkiklee.io';
const repoId = import.meta.env.PUBLIC_GISCUS_REPO_ID ?? '';
const category = import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'General';
const categoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? '';
---
<div id="giscus-mount" data-repo={repo} data-repo-id={repoId} data-category={category} data-category-id={categoryId}>
  <noscript>Comments require JavaScript. <a href={`https://github.com/${repo}/discussions`}>Open in GitHub Discussions ↗</a></noscript>
</div>

<script>
  const mount = document.getElementById('giscus-mount');
  if (mount && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          obs.disconnect();
          const s = document.createElement('script');
          s.src = 'https://giscus.app/client.js';
          s.async = true; s.crossOrigin = 'anonymous';
          s.dataset.repo = mount.dataset.repo!;
          s.dataset.repoId = mount.dataset.repoId!;
          s.dataset.category = mount.dataset.category!;
          s.dataset.categoryId = mount.dataset.categoryId!;
          s.dataset.mapping = 'pathname';
          s.dataset.strict = '0';
          s.dataset.reactionsEnabled = '1';
          s.dataset.emitMetadata = '0';
          s.dataset.inputPosition = 'top';
          s.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'dark_dimmed' : 'light';
          s.dataset.lang = 'en';
          mount.appendChild(s);
        }
      }
    }, { rootMargin: '200px' });
    io.observe(mount);
  }
</script>
```

- [ ] **Step 2: No commit yet — bundled with next task**

### Task 6.2: Webmentions fetcher + display

**Files:**
- Create: `src/lib/webmentions.ts`
- Create: `src/components/Webmentions.astro`

- [ ] **Step 1: `src/lib/webmentions.ts`**

```ts
export type Webmention = {
  source: string;
  author: { name: string; photo?: string; url: string };
  content: { text: string };
  published: string;
  type: 'reply' | 'like' | 'repost' | 'mention';
  url: string;
};

export async function fetchWebmentions(target: string): Promise<Webmention[]> {
  const token = import.meta.env.WEBMENTION_TOKEN;
  if (!token) return [];
  const url = new URL('https://webmention.io/api/mentions.jf2');
  url.searchParams.set('target', target);
  url.searchParams.set('per-page', '100');
  url.searchParams.set('token', token);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = (await res.json()) as { children: any[] };
  return json.children.map((c: any) => ({
    source: c.url,
    author: { name: c.author?.name ?? 'Anonymous', photo: c.author?.photo, url: c.author?.url ?? '' },
    content: { text: c.content?.text ?? '' },
    published: c.published ?? '',
    type: (c['wm-property'] === 'in-reply-to' ? 'reply' : c['wm-property'] === 'like-of' ? 'like' : c['wm-property'] === 'repost-of' ? 'repost' : 'mention'),
    url: c.url,
  }));
}
```

- [ ] **Step 2: `src/components/Webmentions.astro`**

```astro
---
import { fetchWebmentions } from '~/lib/webmentions';
interface Props { url: string; }
const { url } = Astro.props;
const mentions = await fetchWebmentions(url);
const replies = mentions.filter((m) => m.type === 'reply');
const likes = mentions.filter((m) => m.type === 'like');
const reposts = mentions.filter((m) => m.type === 'repost');
---
{mentions.length > 0 && (
  <section class="webmentions" aria-labelledby="wm">
    <h2 id="wm">[ WEBMENTIONS ]</h2>
    {(likes.length + reposts.length) > 0 && (
      <p class="reactions">{likes.length} ♥ · {reposts.length} ↻</p>
    )}
    <ul role="list">
      {replies.map((m) => (
        <li>
          <a href={m.author.url}><strong>{m.author.name}</strong></a> — <a href={m.url}>{new Date(m.published).toISOString().slice(0, 10)}</a>
          <p>{m.content.text}</p>
        </li>
      ))}
    </ul>
  </section>
)}

<style>
  .webmentions { margin-top: var(--space-7); border-top: 2px solid var(--rule); padding-top: var(--space-5); }
  h2 { font-size: var(--text-base); letter-spacing: 0.06em; }
  .reactions { color: var(--fg-muted); font-size: var(--text-sm); }
  li { padding: var(--space-3) 0; border-top: 1px solid var(--rule-soft); }
  li p { margin-top: var(--space-2); color: var(--fg-muted); }
</style>
```

- [ ] **Step 3: No commit yet**

### Task 6.3: DiscussFooter (Mastodon + Giscus + webmentions)

**Files:**
- Create: `src/components/DiscussFooter.astro`
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: `src/components/DiscussFooter.astro`**

```astro
---
import Giscus from './Giscus.astro';
import Webmentions from './Webmentions.astro';
interface Props {
  postUrl: string;
  postTitle: string;
  mastodonUrl?: string;
}
const { postUrl, postTitle, mastodonUrl } = Astro.props;
const elkShare = `https://elk.zone/intent/post?text=${encodeURIComponent(`"${postTitle}" — ${postUrl}`)}`;
---
<aside class="discuss" aria-labelledby="discuss-h">
  <h2 id="discuss-h">[ DISCUSS ]</h2>
  <ul role="list" class="links">
    {mastodonUrl
      ? <li><a href={mastodonUrl}>↗ Reply on Mastodon (existing thread)</a></li>
      : <li><a href={elkShare}>↗ Start a thread on Mastodon</a></li>
    }
    <li><a href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`"${postTitle}" — ${postUrl}`)}`}>↗ Share on Bluesky</a></li>
  </ul>
  <Webmentions url={postUrl} />
  <h2 style="margin-top: var(--space-7);">[ COMMENTS ]</h2>
  <Giscus />
</aside>

<style>
  .discuss { margin-top: var(--space-7); border-top: 2px solid var(--rule); padding-top: var(--space-5); }
  h2 { font-size: var(--text-base); letter-spacing: 0.06em; margin-bottom: var(--space-3); }
  .links li { padding: var(--space-2) 0; }
</style>
```

- [ ] **Step 2: Wire into `PostLayout.astro`**

```astro
import DiscussFooter from '~/components/DiscussFooter.astro';
// ...
<article class="post">
  <header>...</header>
  <div class="prose"><slot /></div>
  <DiscussFooter
    postUrl={new URL(`/posts/${post.id}`, Astro.site).toString()}
    postTitle={title}
    mastodonUrl={post.data.mastodonUrl}
  />
</article>
```

- [ ] **Step 3: Verify**

Build, preview a post page → "Discuss on Mastodon" link present, Giscus loads when scrolled near (check Network panel).

- [ ] **Step 4: Commit**

```bash
git add src/components/Giscus.astro src/components/Webmentions.astro src/components/DiscussFooter.astro src/lib/webmentions.ts src/layouts/PostLayout.astro
git commit -m "feat: discuss footer (Mastodon + Giscus + webmentions)"
```

---

## Phase 7 — Dynamic OG images

End state: `/api/og?slug=...` returns 1200×630 brutalist PNG; cached at edge.

### Task 7.1: Vercel adapter (hybrid for the OG endpoint)

**Files:**
- Modify: `astro.config.ts`

- [ ] **Step 1: Add adapter**

```bash
pnpm add @astrojs/vercel
```

```ts
import vercel from '@astrojs/vercel';

export default defineConfig({
  // ...
  output: 'static',
  adapter: vercel({
    imageService: false,           // we use astro:assets static images
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
  // ...
});
```

This keeps the site static; only `prerender = false` routes deploy as functions.

- [ ] **Step 2: Commit**

```bash
git add astro.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add Vercel adapter (hybrid for OG endpoint)"
```

### Task 7.2: /api/og endpoint

**Files:**
- Create: `src/pages/api/og.ts`
- Create: `src/lib/og.tsx`

- [ ] **Step 1: `src/lib/og.tsx`** (Satori template)

```tsx
import { html } from 'satori-html';

export function ogTemplate(args: { title: string; date: string; tags: string[] }) {
  const tagLine = args.tags.map((t) => `#${t}`).join(' ');
  return html(`
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#f5f4ee;color:#0a0a0a;font-family:'JetBrains Mono';padding:64px;">
      <div style="font-size:18px;border-bottom:3px solid #0a0a0a;padding-bottom:16px;letter-spacing:0.08em;">[ KEVINKIKLEE.IO ]</div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:14px;letter-spacing:0.08em;color:#4a4a4a;margin-bottom:16px;">${args.date} · ${tagLine}</div>
        <div style="font-size:64px;font-weight:700;line-height:1.15;text-transform:uppercase;letter-spacing:0.01em;">${args.title.toUpperCase()}</div>
      </div>
      <div style="font-size:18px;letter-spacing:0.08em;border-top:3px solid #0a0a0a;padding-top:16px;">// FIELD NOTES — DEVREL @ GOOGLE CHROME</div>
    </div>
  `);
}
```

Install: `pnpm add satori-html`.

- [ ] **Step 2: `src/pages/api/og.ts`**

```ts
import type { APIContext } from 'astro';
import { ImageResponse } from '@vercel/og';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ogTemplate } from '~/lib/og';
import { getCollection } from 'astro:content';

export const prerender = false;

const fontPath = resolve('./public/fonts/og/JetBrainsMono-Variable.ttf');
const fontData = readFileSync(fontPath);

export async function GET(ctx: APIContext) {
  const slug = ctx.url.searchParams.get('slug');
  if (!slug) return new Response('missing slug', { status: 400 });
  const posts = await getCollection('posts');
  const post = posts.find((p) => p.id === slug);
  if (!post) return new Response('not found', { status: 404 });
  const tree = ogTemplate({
    title: post.data.title,
    date: post.data.pubDate.toISOString().slice(0, 10),
    tags: post.data.tags,
  });
  return new ImageResponse(tree as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'JetBrains Mono', data: fontData, weight: 700, style: 'normal' }],
    headers: {
      'Cache-Control': 'public, s-maxage=31536000, immutable, stale-while-revalidate=86400',
    },
  });
}
```

- [ ] **Step 3: Verify locally**

Run: `pnpm build && pnpm preview`. Visit `http://localhost:4321/api/og?slug=hello-world` → returns brutalist OG PNG.

- [ ] **Step 4: Commit**

```bash
git add src/lib/og.tsx src/pages/api/og.ts package.json pnpm-lock.yaml
git commit -m "feat: dynamic OG image endpoint via @vercel/og + Satori"
```

---

## Phase 8 — View transitions (per-route)

End state: `<ClientRouter />` mounted; per-route choreography; view-transition-name continuity for post titles; reduced-motion + save-data fallbacks.

### Task 8.1: Mount ClientRouter + transition CSS

**Files:**
- Create: `src/styles/transitions.css`
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/lib/nav.ts`

- [ ] **Step 1: Add ClientRouter to BaseLayout `<head>`**

```astro
import { ClientRouter } from 'astro:transitions';
// ...
<ClientRouter fallback="swap" />
```

- [ ] **Step 2: Create `src/styles/transitions.css`**

```css
@layer utilities {
  ::view-transition-old(root) { animation: 180ms cubic-bezier(.32,.72,0,1) both fade-out; }
  ::view-transition-new(root) { animation: 180ms cubic-bezier(.32,.72,0,1) both fade-in; }

  html[data-nav-direction='forward-into-post'] ::view-transition-old(root) { animation-name: scale-fade-out; }
  html[data-nav-direction='forward-into-post'] ::view-transition-new(root) { animation-name: scale-fade-in; }

  html[data-nav-direction='back'] ::view-transition-old(root) { animation-name: slide-out-back; }
  html[data-nav-direction='back'] ::view-transition-new(root) { animation-name: slide-in-back; }

  @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes scale-fade-in  { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }
  @keyframes scale-fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.015); } }
  @keyframes slide-in-back  { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
  @keyframes slide-out-back { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(16px); } }

  :root[data-transitioning] *,
  :root[data-transitioning] { transition: none !important; }

  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
  }
}
```

Append in `global.css`: `@import './transitions.css' layer(utilities);`.

- [ ] **Step 3: `src/lib/nav.ts`** (direction detection + lifecycle wiring)

```ts
type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post';

function getDepth(): number {
  return (history.state?.depth as number) ?? 0;
}

function setDirOnHtml(dir: Dir) {
  document.documentElement.dataset.navDirection = dir;
}

document.addEventListener('astro:before-preparation', (e: any) => {
  document.documentElement.dataset.transitioning = '';
  const fromDepth = getDepth();
  const toIsPost = e.to?.pathname?.startsWith('/posts/') && e.to?.pathname !== '/posts';
  const isTraverse = e.navigationType === 'traverse';
  const dir: Dir = isTraverse
    ? 'back'
    : toIsPost
    ? 'forward-into-post'
    : 'forward';
  setDirOnHtml(dir);
  if (!isTraverse) {
    history.replaceState({ ...history.state, depth: fromDepth + 1 }, '');
  }

  // Reduced motion or save-data → skip transition
  const c = (navigator as any).connection;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slow = c?.saveData || ['slow-2g', '2g'].includes(c?.effectiveType);
  if (reduce || slow) {
    e.viewTransition?.skipTransition?.();
  }
});

document.addEventListener('astro:after-swap', () => {
  delete document.documentElement.dataset.transitioning;
  // Focus management
  const h1 = document.querySelector('main h1') as HTMLElement | null;
  if (h1) {
    h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  }
  const announce = document.getElementById('route-announce');
  if (announce && document.title) announce.textContent = `Loaded: ${document.title}`;
});
```

Import this once globally — add `<script>import '~/lib/nav';</script>` to BaseLayout.

- [ ] **Step 4: Verify**

Build, preview, click between pages → smooth transitions. Toggle `prefers-reduced-motion` in DevTools → instant swap. Browser back → slide-back direction.

- [ ] **Step 5: Commit**

```bash
git add src/styles/transitions.css src/lib/nav.ts src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: per-route view transitions with direction detection + a11y fallbacks"
```

### Task 8.2: view-transition-name on post titles (continuity)

**Files:**
- Modify: `src/components/PostCard.astro`
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: Add to PostCard**

```astro
<h3 style={`view-transition-name: post-title-${post.id};`}>...</h3>
```

But uniqueness matters — only the in-viewport card should carry the name. Add this script in PostCard (or as a global utility):

```astro
<script>
  // Only the topmost in-viewport post-card carries view-transition-name.
  const cards = Array.from(document.querySelectorAll('.post-card h3'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      const slug = el.dataset.slug;
      if (!slug) continue;
      el.style.viewTransitionName = e.isIntersecting ? `post-title-${slug}` : '';
    }
  }, { threshold: 0.5 });
  cards.forEach((c) => io.observe(c));
</script>
```

Update PostCard `<h3>` to set `data-slug={post.id}` and not inline `view-transition-name`.

- [ ] **Step 2: Add to PostLayout**

```astro
<h1 style={`view-transition-name: post-title-${post.id};`}>{title}</h1>
```

- [ ] **Step 3: Verify**

Build, preview, click a post on home page → title morphs from card to hero. Test on Chrome ≥111.

- [ ] **Step 4: Commit**

```bash
git add src/components/PostCard.astro src/layouts/PostLayout.astro
git commit -m "feat: view-transition-name continuity for post titles"
```

---

## Phase 9 — Speculation Rules + prerender-aware analytics

### Task 9.1: PrerenderRules component

**Files:**
- Create: `src/components/PrerenderRules.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: `src/components/PrerenderRules.astro`**

```astro
<script type="speculationrules" set:html={JSON.stringify({
  prerender: [{
    where: { and: [
      { href_matches: '/*' },
      { not: { href_matches: '/api/*' }},
      { not: { selector_matches: '[data-no-prerender]' }},
    ]},
    eagerness: 'conservative',
  }],
  prefetch: [{
    where: { and: [
      { href_matches: '/*' },
      { not: { href_matches: '/api/*' }},
    ]},
    eagerness: 'moderate',
  }],
})}></script>
```

- [ ] **Step 2: Add to `<head>` in BaseLayout**

- [ ] **Step 3: Commit**

```bash
git add src/components/PrerenderRules.astro src/layouts/BaseLayout.astro
git commit -m "feat: Speculation Rules (conservative prerender + moderate prefetch)"
```

### Task 9.2: Prerender-aware analytics

**Files:**
- Create: `src/lib/prerender-analytics.ts`
- Create: `src/components/Analytics.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: `src/lib/prerender-analytics.ts`**

```ts
export function whenActivated(fn: () => void) {
  if ((document as any).prerendering) {
    document.addEventListener('prerenderingchange', fn, { once: true });
  } else {
    fn();
  }
}
```

- [ ] **Step 2: `src/components/Analytics.astro`**

```astro
---
const ga = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
---
<script type="module">
  import { whenActivated } from '~/lib/prerender-analytics';
  whenActivated(() => {
    requestIdleCallback ? requestIdleCallback(load, { timeout: 1500 }) : setTimeout(load, 800);
  });

  async function load() {
    const [{ inject }, { injectSpeedInsights }] = await Promise.all([
      import('@vercel/analytics'),
      import('@vercel/speed-insights'),
    ]);
    inject();
    injectSpeedInsights();
  }
</script>

{ga && (
  <>
    <script type="text/partytown" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} async></script>
    <script type="text/partytown" set:html={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true,allow_google_signals:false});`}></script>
  </>
)}
```

Add Partytown integration to `astro.config.ts`:

```ts
import partytown from '@astrojs/partytown';
// ...
integrations: [..., partytown({ config: { forward: ['dataLayer.push'] } })],
```

- [ ] **Step 3: Add to BaseLayout `<head>`**

```astro
<Analytics />
```

- [ ] **Step 4: Verify**

Build, preview. Inspect head → Speculation Rules present. Open a post → Vercel Analytics + Speed Insights ping fires only after activation. GA loads off-thread (Sources panel shows worker).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prerender-analytics.ts src/components/Analytics.astro src/layouts/BaseLayout.astro astro.config.ts
git commit -m "feat: prerender-aware analytics + Partytown GA4"
```

---

## Phase 10 — Animations & polish (scroll-reveal, link underlines, hover, copy-code)

### Task 10.1: Scroll-reveal (CSS-first, JS fallback)

**Files:**
- Append to: `src/styles/transitions.css`
- Create: `src/lib/scroll-reveal.ts`

- [ ] **Step 1: CSS-first via animation-timeline**

```css
@layer utilities {
  .reveal {
    animation: reveal-fade linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 30%;
  }
  @keyframes reveal-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal { animation: none; }
  }
  @media (prefers-reduced-data: reduce) {
    .reveal { animation: none; }
  }
}
```

- [ ] **Step 2: JS fallback**

`src/lib/scroll-reveal.ts`:

```ts
if (CSS && !CSS.supports('animation-timeline: view()') && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      (e.target as HTMLElement).classList.add('in-view');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
```

Import in BaseLayout: `<script>import '~/lib/scroll-reveal';</script>`.

CSS for fallback:

```css
.reveal { opacity: 0; transform: translateY(8px); transition: opacity 240ms var(--ease), transform 240ms var(--ease); }
.reveal.in-view { opacity: 1; transform: none; }
@supports (animation-timeline: view()) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 3: Add `.reveal` class to home post cards, project cards**

In templates: `<PostCard ... class="reveal">` etc. Or wrap in `<div class="reveal">`.

- [ ] **Step 4: Verify**

Build, preview. Scroll → cards fade in. Toggle reduced-motion → no animation.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scroll-reveal.ts src/styles/transitions.css src/components/ src/pages/
git commit -m "feat: scroll-reveal (CSS-first, JS fallback)"
```

### Task 10.2: Code copy button island

**Files:**
- Create: `src/components/CopyButton.astro`
- Modify: `src/styles/prose.css` (style)

- [ ] **Step 1: Create CopyButton (delegated handler — works for all `pre` in prose)**

`src/components/CopyButton.astro`:

```astro
<script>
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll('.prose pre').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'copy-btn'; btn.textContent = 'COPY';
      btn.setAttribute('aria-label', 'Copy code');
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.textContent ?? '';
        try { await navigator.clipboard.writeText(code); btn.textContent = 'COPIED'; setTimeout(() => (btn.textContent = 'COPY'), 1200); }
        catch { btn.textContent = 'ERR'; }
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  });
</script>
```

CSS in `prose.css`:

```css
.prose pre { position: relative; }
.copy-btn { position: absolute; top: var(--space-2); right: var(--space-2); background: var(--bg); border: 1px solid var(--rule-soft); color: var(--fg-muted); font: inherit; font-size: var(--text-xs); padding: 2px 6px; cursor: pointer; opacity: 0; transition: opacity 180ms var(--ease); }
@media (hover: hover) { .prose pre:hover .copy-btn { opacity: 1; } }
@media (hover: none) { .copy-btn { opacity: 1; } }
```

- [ ] **Step 2: Add to BaseLayout (or PostLayout) so handler attaches site-wide**

```astro
<CopyButton />
```

- [ ] **Step 3: Verify**

Visit a post with code → hover code block → COPY button appears, click copies.

- [ ] **Step 4: Commit**

```bash
git add src/components/CopyButton.astro src/styles/prose.css src/layouts/
git commit -m "feat: code copy button (delegated, works across view transitions)"
```

---

## Phase 11 — Performance hardening

### Task 11.1: Image LCP preload + content-visibility

- [ ] **Step 1: For post pages with cover image, emit `<link rel="preload" as="image" imagesrcset>`**

In `BaseHead.astro`, accept optional `lcpImage?: { srcset: string; sizes: string }` prop:

```astro
{lcpImage && (
  <link rel="preload" as="image" imagesrcset={lcpImage.srcset} imagesizes={lcpImage.sizes} />
)}
```

`PostLayout` extracts srcset/sizes from `astro:assets` `getImage()` and forwards.

- [ ] **Step 2: Add `content-visibility: auto` to below-fold sections**

In `prose.css`:

```css
.prose > section { content-visibility: auto; contain-intrinsic-size: 1px 500px; }
.archive li { content-visibility: auto; contain-intrinsic-size: 1px 60px; }
.post-card { contain: layout paint; }
```

- [ ] **Step 3: Verify**

Lighthouse on a long post → LCP element identified as cover image; content-visibility skips below-fold rendering.

- [ ] **Step 4: Commit**

```bash
git add src/components/BaseHead.astro src/layouts/PostLayout.astro src/styles/prose.css
git commit -m "perf: image LCP preload + content-visibility on long lists"
```

### Task 11.2: Bundle visualizer

- [ ] **Step 1: Add to `astro.config.ts` vite config**

```ts
import { visualizer } from 'rollup-plugin-visualizer';
// ...
vite: {
  build: { cssCodeSplit: true },
  plugins: [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true })],
},
```

- [ ] **Step 2: Verify**

`pnpm build` → `stats.html` in repo root.

- [ ] **Step 3: Commit**

```bash
git add astro.config.ts
git commit -m "build: add bundle visualizer"
```

---

## Phase 12 — Security headers (vercel.ts)

### Task 12.1: vercel.ts with CSP, HSTS, etc.

**Files:**
- Create: `vercel.ts`
- Create: `src/lib/csp.ts`

- [ ] **Step 1: Add `@vercel/config`**

```bash
pnpm add -D @vercel/config
```

- [ ] **Step 2: `src/lib/csp.ts`**

```ts
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://giscus.app https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://giscus.app",
  "img-src 'self' data: https://*.giscus.app https://*.gravatar.com https://avatars.githubusercontent.com",
  "frame-src https://giscus.app",
  "connect-src 'self' https://*.vercel-insights.com https://*.google-analytics.com https://webmention.io",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
```

- [ ] **Step 3: `vercel.ts`**

```ts
import { defineConfig, routes, type VercelConfig } from '@vercel/config/v1';
import { CSP } from './src/lib/csp';

export const config: VercelConfig = defineConfig({
  framework: 'astro',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  outputDirectory: 'dist',
  redirects: [
    { source: '/(.*)/', destination: '/$1', statusCode: 308 },
    { source: '/feed', destination: '/rss.xml', statusCode: 308 },
  ],
  headers: [
    routes.header('/(.*)', [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: CSP },
    ]),
    routes.cacheControl('/_astro/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/fonts/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/api/og(.*)', { public: true, sMaxAge: '1 year', immutable: true, staleWhileRevalidate: '1 day' }),
    routes.cacheControl('/(rss\\.xml|feed\\.json|sitemap.*)', { public: true, maxAge: '10 min', sMaxAge: '1 hour' }),
    routes.cacheControl('/(.*)\\.html', { public: true, sMaxAge: '60s', staleWhileRevalidate: '1 day' }),
  ],
  crons: [{ path: '/api/refresh', schedule: '0 5 * * 1' }],
});
```

- [ ] **Step 4: Apex/www enforcement**

In Vercel dashboard, add `kevinkiklee.io` and `www.kevinkiklee.io`; set apex as primary; www auto-308s.

- [ ] **Step 5: Commit**

```bash
git add vercel.ts src/lib/csp.ts package.json pnpm-lock.yaml
git commit -m "feat: vercel.ts typed config — CSP, HSTS, cache headers, crons"
```

---

## Phase 13 — Vercel deployment

### Task 13.1: Initial deploy + domain

- [ ] **Step 1: Push repo**

```bash
gh repo create kevinkiklee/kevinkiklee.io --public --source=. --remote=origin --push
```

- [ ] **Step 2: Link Vercel**

```bash
pnpm dlx vercel@latest link
```

- [ ] **Step 3: Set env vars**

```bash
vercel env add GA_MEASUREMENT_ID production preview development
vercel env add GISCUS_REPO            production preview development
vercel env add GISCUS_REPO_ID         production preview
vercel env add GISCUS_CATEGORY        production preview development
vercel env add GISCUS_CATEGORY_ID     production preview
vercel env add MASTODON_HANDLE        production preview development
vercel env add MASTODON_INSTANCE_URL  production preview development
vercel env add WEBMENTION_TOKEN       production preview
vercel env add VERCEL_DEPLOY_HOOK_URL production
vercel pull
```

- [ ] **Step 4: Add domain**

```bash
vercel domains add kevinkiklee.io
```

Set DNS at registrar:
- ALIAS @ → cname.vercel-dns.com
- CNAME www → cname.vercel-dns.com

- [ ] **Step 5: Initial production deploy**

```bash
vercel --prod
```

Or `git push origin main`.

Verify: https://kevinkiklee.io serves the home page; HTTPS works; HSTS header present.

- [ ] **Step 6: Submit search-engine verification**

- Google Search Console: add kevinkiklee.io property, DNS TXT verification, submit `sitemap-index.xml`.
- Bing Webmaster Tools: same.

- [ ] **Step 7: No commit (deployment-only)**

---

## Phase 14 — CI/CD (GitHub Actions)

### Task 14.1: ci.yml

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/pull_request_template.md`
- Create: `lighthouserc.cjs`
- Create: `renovate.json`

- [ ] **Step 1: `lighthouserc.cjs`**

```js
module.exports = {
  ci: {
    collect: { numberOfRuns: 3 },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:seo': ['error', { minScore: 1.0 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0 }],
        'total-blocking-time': ['error', { maxNumericValue: 100 }],
        'render-blocking-resources': ['error', { maxLength: 0 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

- [ ] **Step 2: `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: 'pnpm' }
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Cache .astro
        uses: actions/cache@v4
        with:
          path: .astro
          key: astro-${{ hashFiles('src/content/**', 'astro.config.ts') }}
      - name: Type check
        run: pnpm astro check
      - name: Lint
        run: pnpm biome ci .
      - name: Spell
        run: pnpm exec cspell '**/*.{md,mdx}' --no-progress
      - name: Markdown lint
        run: pnpm exec markdownlint-cli2 '**/*.{md,mdx}'
      - name: Test
        run: pnpm test
      - name: Build
        run: pnpm build
      - name: Upload bundle stats
        uses: actions/upload-artifact@v4
        with: { name: stats-html, path: stats.html, if-no-files-found: ignore }

  link-check:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: lycheeverse/lychee-action@v2
        with: { args: --no-progress dist/ }

  lighthouse:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Wait for Vercel preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        id: vercel
        with: { token: ${{ secrets.GITHUB_TOKEN }}, max_timeout: 600 }
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm install -g @lhci/cli@0.14.0
      - run: lhci autorun --collect.url=${{ steps.vercel.outputs.url }} --collect.url=${{ steps.vercel.outputs.url }}/posts
```

- [ ] **Step 3: `.github/pull_request_template.md`**

```md
## Summary

## Checklist
- [ ] Preview deployed (Vercel comment)
- [ ] Lighthouse green (perf ≥ 95, a11y/seo/best-practices = 100)
- [ ] Tested on mobile (DevTools or device)
- [ ] No console errors
- [ ] If a post: spell-checked, links verified
```

- [ ] **Step 4: `renovate.json`**

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":automergeMinor", ":automergePatch"],
  "schedule": ["before 6am on monday"],
  "packageRules": [
    { "matchUpdateTypes": ["major"], "automerge": false },
    { "matchDepTypes": ["devDependencies"], "groupName": "dev deps" }
  ],
  "lockFileMaintenance": { "enabled": true, "automerge": true }
}
```

- [ ] **Step 5: Branch protection**

In GitHub: Settings → Branches → main → require CI to pass, no force push, linear history. Enable secret scanning + push protection.

- [ ] **Step 6: Commit & push**

```bash
git add .github/ lighthouserc.cjs renovate.json
git commit -m "ci: typecheck, lint, build, link-check, Lighthouse on PR previews"
git push
```

Verify CI runs green on the resulting PR-equivalent push.

---

## Phase 15 — Day-2 ops (cron, IndexNow, Sentry, uptime)

### Task 15.1: /api/refresh (cron-triggered deploy hook)

**Files:**
- Create: `src/pages/api/refresh.ts`

- [ ] **Step 1:**

```ts
import type { APIContext } from 'astro';
export const prerender = false;

export async function GET(_ctx: APIContext) {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return new Response('no hook configured', { status: 503 });
  const r = await fetch(url, { method: 'POST' });
  return new Response(JSON.stringify({ ok: r.ok }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Already wired into `vercel.ts` crons.

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/refresh.ts
git commit -m "feat: weekly cron refresh endpoint"
```

### Task 15.2: IndexNow on deploy

**Files:**
- Create: `scripts/indexnow.ts`
- Modify: GitHub workflow (or Vercel build hook)

- [ ] **Step 1: `scripts/indexnow.ts`**

```ts
#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';

const HOST = 'kevinkiklee.io';
const KEY = process.env.INDEXNOW_KEY!;
const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log('indexnow:', res.status);
```

Generate a key (UUID), save to `public/<KEY>.txt` containing just the key, set `INDEXNOW_KEY` in CI env.

Add post-deploy step in `ci.yml` (push-to-main job):

```yaml
  indexnow:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm install -g tsx
      - env: { INDEXNOW_KEY: ${{ secrets.INDEXNOW_KEY }} }
        run: tsx scripts/indexnow.ts
```

- [ ] **Step 2: Commit**

```bash
git add scripts/indexnow.ts public/ .github/workflows/ci.yml
git commit -m "ci: IndexNow ping on production deploys"
```

### Task 15.3: Sentry on /api/og

**Files:**
- Modify: `src/pages/api/og.ts`

- [ ] **Step 1: Install**

```bash
pnpm add @sentry/node
```

- [ ] **Step 2: Wrap handler**

```ts
import * as Sentry from '@sentry/node';
const dsn = process.env.SENTRY_DSN_OG;
if (dsn) Sentry.init({ dsn, tracesSampleRate: 0.1 });

export async function GET(ctx: APIContext) {
  try {
    // ... existing logic ...
  } catch (err) {
    Sentry.captureException(err);
    return new Response('OG render failed', { status: 500 });
  }
}
```

Add `SENTRY_DSN_OG` to Vercel env (production).

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/og.ts package.json pnpm-lock.yaml
git commit -m "feat: Sentry on /api/og"
```

### Task 15.4: Uptime monitoring

- [ ] **Step 1: Better Stack**

Manual: create Better Stack free account, add 2 monitors (root, /api/og?slug=hello-world). Slack/email alert. No code.

- [ ] **Step 2: HSTS preload**

After 30 days verified production HSTS, submit `kevinkiklee.io` at https://hstspreload.org/.

- [ ] **Step 3: No commit**

---

## Phase 16 — Authoring scripts

### Task 16.1: pnpm new:post

**Files:**
- Create: `scripts/new-post.ts`

- [ ] **Step 1:**

```ts
#!/usr/bin/env tsx
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) { console.error('usage: pnpm new:post "<title>"'); process.exit(1); }

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const date = new Date().toISOString().slice(0, 10);
const file = resolve(`src/content/posts/${date}-${slug}.mdx`);
if (existsSync(file)) { console.error(`exists: ${file}`); process.exit(1); }

const fm = `---
title: ${title}
description: TODO write a 1-2 sentence description (max 160 chars).
pubDate: ${date}
tags: []
draft: true
---

`;

writeFileSync(file, fm);
console.log(`created ${file}`);
```

- [ ] **Step 2: `scripts/new-project.ts`** (similar; appends to projects.yaml)

```ts
#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const name = process.argv.slice(2).join(' ').trim();
if (!name) { console.error('usage: pnpm new:project "<name>"'); process.exit(1); }

const path = 'src/content/projects/projects.yaml';
const data = parse(readFileSync(path, 'utf8')) ?? [];
const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
data.push({
  id,
  name,
  blurb: 'TODO',
  url: 'https://github.com/kevinkiklee/' + id,
  tech: [],
  featured: false,
});
writeFileSync(path, stringify(data));
console.log(`appended ${id} to ${path}`);
```

- [ ] **Step 3: Verify**

```bash
pnpm new:post "Test post"
# → src/content/posts/<date>-test-post.mdx exists
git checkout -- .  # discard
```

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: new:post and new:project authoring scripts"
```

---

## Phase 17 — Final verification & launch

### Task 17.1: Full local run

- [ ] `pnpm check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm preview` serves; manually click through home → posts → post → tags → about → search → 404
- [ ] Theme toggle works (no FOUC, persists, cross-tab sync)
- [ ] View transitions visible on Chrome
- [ ] Speculation Rules fire (DevTools → Application → Speculative loads)
- [ ] Lighthouse ≥ 95 perf, 100 a11y/best-practices/seo
- [ ] axe-core finds zero violations on each route
- [ ] Per-post OG image renders at /api/og?slug=...
- [ ] RSS, JSON Feed, sitemap valid

### Task 17.2: Production deploy

- [ ] `git push origin main` → Vercel deploys
- [ ] DNS resolves; HTTPS works; HSTS header live
- [ ] CSP not blocking expected resources (DevTools console)
- [ ] Search Console / Bing Webmaster verified, sitemap submitted
- [ ] Better Stack monitors green
- [ ] First post live

### Task 17.3: Tag release

```bash
git tag v1.0.0
git push --tags
```

---

## Spec self-review notes (post-write)

| Spec section | Coverage |
|---|---|
| §1 Architecture & Stack | Phases 0, 7, 12, 13 |
| §2 IA & Content Model | Phases 2, 3, 4 |
| §3 Visual System | Phase 1 (tokens, theme, fonts), Phase 8 (transitions) |
| §4 Animations & Transitions | Phases 8, 9, 10 |
| §5 Performance, CWV, SEO, AEO | Phases 4 (SEO), 11 (perf), 14 (Lighthouse CI), 15 (IndexNow) |
| §6 DX, Authoring, Deploy, Ops | Phases 0 (tooling), 13 (deploy), 14 (CI), 15 (ops), 16 (authoring) |

**Known TODOs to address during execution (not placeholders — flagged decisions):**

- `public/og-default.png` (Task 4.2) — placeholder; replace with a real 1200×630 brutalist PNG before launch (can be generated by visiting `/api/og?slug=hello-world` and saving once Phase 7 lands).
- IndexNow key file in `public/` (Task 15.2) — generate a UUID, save as `<KEY>.txt`, store the same value as `INDEXNOW_KEY` GH secret.
- Giscus repo/category IDs (Task 6.1, env) — must enable GitHub Discussions on `kevinkiklee.io` repo and run `https://giscus.app` configurator to get IDs.
- Mastodon instance URL (env) — depends on which Mastodon server Kevin's account lives on.
