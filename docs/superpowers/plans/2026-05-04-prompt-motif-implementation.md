# Prompt Motif & Surface Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the prompt-rail motif (`$ ` + caret) to the brand mark and post-page eyebrow, plus four small surface refinements (footer finisher, home status line, post meta rail, removal of the existing url-prompt block).

**Architecture:** Pure presentation work. No new dependencies, no new components, no schema changes, no JS islands. Style + small markup edits inside six existing files.

**Tech Stack:** Astro 5 (static), TypeScript strict, vanilla CSS with custom-property tokens, Biome for lint+format, Vitest (project convention: tests for pure helpers only — no Astro component rendering tests).

**Source spec:** [`docs/superpowers/specs/2026-05-04-prompt-motif-design.md`](../specs/2026-05-04-prompt-motif-design.md)

---

## File Map

| File | What changes |
|---|---|
| `src/lib/site-config.ts` | Add `nowStatus: string` field. |
| `src/components/Header.astro` | Replace `::before/::after` bars with `<span class="dol">` and `<span class="cursor">`; add blink keyframe; add forced-colors override. |
| `src/components/Footer.astro` | Add `<span class="eof">$ exit </span>` inside the existing copyright span. |
| `src/components/PostMeta.astro` | Add `variant: 'inline' \| 'rail'` prop (default `'inline'`); add optional `wordCount` prop; render dt/dl rail when `variant === 'rail'`. |
| `src/layouts/PostLayout.astro` | Remove the `.url-prompt` markup + styles; render `<p class="eyebrow">` in its place; switch `<PostMeta>` to `variant="rail"` and pass `wordCount`. |
| `src/pages/index.astro` | Inline `<p class="status">` block above the latest section; scoped styles. |

## Branch + Verification Workflow

This repo uses branch-protected `main` (per `CLAUDE.md`); every change ships via PR. Each task ends with a `pnpm check` and a Conventional Commit. Visual verification is via `pnpm dev` (open `http://localhost:4321`); for code-only verification, `pnpm check && pnpm build`.

The pre-commit hook runs Biome + cspell + markdownlint + `astro check --noSync`, so commits fail fast on style/type errors. Do not pass `--no-verify`.

---

## Task 0: Create feature branch

**Files:** none.

- [ ] **Step 1: Verify clean working tree**

```bash
git status
```
Expected: working tree clean (or only `.claude/` untracked, which is fine).

- [ ] **Step 2: Confirm latest main**

```bash
git checkout main && git pull --ff-only
```

- [ ] **Step 3: Create branch**

```bash
git checkout -b feat/prompt-motif
```

---

## Task 1: Add `nowStatus` field to site config

**Files:**
- Modify: `src/lib/site-config.ts`

The status-line copy lives in `SITE` so Kevin can edit one constant and see the change everywhere it eventually renders.

- [ ] **Step 1: Add the field**

In `src/lib/site-config.ts`, add a new field to the `SITE` const literal. Place it after `bio:` and before `defaultMastodon:` so related personal-identity fields cluster together.

```ts
  bio: 'Developer Relations Engineer at Google Chrome. Writes about the web platform, AI tooling, and browser internals.',
  /** One-sentence "now" status shown on the home page. Update this when context changes. */
  nowStatus: 'TODO — Kevin to write a one-sentence "now" status before merge.',
  defaultMastodon: 'https://mastodon.social/@kevinkiklee',
```

The placeholder string is intentionally a TODO so it shows up in a `git grep TODO` and forces Kevin to replace it before merge.

- [ ] **Step 2: Run typecheck + lint**

```bash
pnpm check
```
Expected: exit 0. (`SITE` is a `const`-asserted object literal, so adding a field automatically widens the inferred type.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/site-config.ts
git commit -m "feat(site-config): add nowStatus field for home status line"
```

---

## Task 2: Header — replace brand bars with prompt + caret

**Files:**
- Modify: `src/components/Header.astro`

Replace the two CSS pseudo-element bars (`::before` / `::after`) with a leading orange `$` span and a trailing block-shape caret span. Caret blinks via a 1.1s keyframe; `prefers-reduced-motion` respects via the existing global animation-duration override; `forced-colors: active` overrides the caret color.

- [ ] **Step 1: Update brand markup**

In `src/components/Header.astro`, replace this anchor:

```astro
<a href="/" class="brand is-caps" aria-label="kevinkiklee.io home" style="view-transition-name: site-brand; view-transition-class: persistent;">kevinkiklee.io</a>
```

with:

```astro
<a href="/" class="brand is-caps" aria-label="kevinkiklee.io home" style="view-transition-name: site-brand; view-transition-class: persistent;">
  <span class="dol" aria-hidden="true">$</span>kevinkiklee.io<span class="cursor" aria-hidden="true"></span>
</a>
```

Notes:
- Keep all existing attributes (`href`, `class`, `aria-label`, `style`).
- The text "kevinkiklee.io" stays mixed-case in source; `class="is-caps"` uppercases at render time (existing rule in `global.css`).
- Both spans are `aria-hidden` so AT users hear only "kevinkiklee.io home" exactly as today.

- [ ] **Step 2: Replace `.brand` CSS block**

In the `<style>` block, find and replace this whole block:

```css
  .brand {
    display: inline-flex;
    align-items: center;
    font-weight: 700;
    font-size: var(--text-sm);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .brand::before,
  .brand::after {
    content: "";
    display: inline-block;
    width: 0.18em;
    height: 0.95em;
    background: currentColor;
    flex: 0 0 auto;
  }
  .brand::before { margin-right: 0.45em; }
  .brand::after  { margin-left: 0.45em; }
```

with this block:

```css
  /*
   * Brand: leading orange `$` (session prompt) + the wordmark + a blinking
   * block caret. Caret renders as a CSS shape so the JetBrains Mono extended
   * subset stays lazy. Blink keyframe runs forever; the global
   * prefers-reduced-motion override in global.css collapses
   * animation-duration to 0.01ms, so reduced-motion users see a steady caret.
   */
  .brand {
    display: inline-flex;
    align-items: center;
    font-weight: 700;
    font-size: var(--text-sm);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .brand .dol {
    color: var(--accent);
    margin-right: 0.45em;
    font-weight: 700;
    flex: 0 0 auto;
  }
  .brand .cursor {
    display: inline-block;
    flex: 0 0 auto;
    width: 0.55em;
    height: 0.95em;
    background: currentColor;
    margin-left: 0.18em;
    vertical-align: -0.1em;
    animation: caret-blink 1.1s steps(2) infinite;
  }
  @keyframes caret-blink {
    50% { opacity: 0; }
  }
  @media (forced-colors: active) {
    .brand .dol { color: LinkText; }
    .brand .cursor {
      background: CanvasText;
      animation: none;
    }
  }
```

- [ ] **Step 3: Visual verification — light theme**

```bash
pnpm dev
```

Open `http://localhost:4321/`. In light theme expect:
- Brand reads as `$ KEVINKIKLEE.IO█` (orange `$` left of the wordmark; blinking solid block right of it).
- The two old bars (`▌ ▐`) are gone.
- Header layout/height is unchanged (the caret occupies similar inline space as the old right bar).

- [ ] **Step 4: Visual verification — dark theme**

Toggle the theme via the header button (or set OS to dark). Expect:
- `$` renders in `#ff7849` (the dark-theme accent).
- Caret renders in `#f4f4f4` (currentColor on dark `--fg`).
- Blink continues smoothly.

- [ ] **Step 5: Visual verification — reduced motion**

In macOS: System Settings → Accessibility → Display → "Reduce motion" ON. In the browser: hard reload. Expect: caret stops blinking (steady block). If blink still occurs, the global reset isn't catching the keyframe — check `global.css` `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 6: Run typecheck + lint + build**

```bash
pnpm check && pnpm build
```
Expected: both exit 0; bundle stays under the 6 KB JS budget (size-check task in CI confirms).

- [ ] **Step 7: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat(header): replace brand bars with prompt + blinking caret"
```

---

## Task 3: Footer — `$ exit` finisher

**Files:**
- Modify: `src/components/Footer.astro`

Add a small accent-coloured `$ exit ` prefix inside the existing copyright span. `aria-hidden` keeps it out of the AT readout.

- [ ] **Step 1: Update copyright markup**

Find this line (`src/components/Footer.astro`):

```astro
    <span>© {year} Kevin Lee</span>
```

Replace with:

```astro
    <span><span class="eof" aria-hidden="true">$ exit </span>© {year} Kevin Lee</span>
```

- [ ] **Step 2: Add `.eof` CSS rule**

Inside the existing `<style>` block, add at the end (after the existing rules):

```css
  .site-footer .eof {
    color: var(--accent);
    margin-right: 0.5em;
    font-weight: 600;
  }
  @media (forced-colors: active) {
    .site-footer .eof { color: LinkText; }
  }
```

- [ ] **Step 3: Visual verification**

Reload `http://localhost:4321/`. Scroll to footer. Expect: footer reads `$ exit © 2026 Kevin Lee  · mastodon · github · rss · json feed · privacy`. The `$ exit` is in accent orange, slightly bold; spacing reads naturally with the copyright.

- [ ] **Step 4: AT verification (optional but quick)**

In Safari/Chrome with VoiceOver enabled, navigate to the footer. Expect: VoiceOver reads "© 2026 Kevin Lee" and skips "$ exit" entirely. (If you don't have VoiceOver up, inspect the rendered DOM and confirm `aria-hidden="true"` is on the `.eof` span.)

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm check
```
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(footer): add \$ exit finisher before copyright"
```

(Note the escaped `$` in the commit message — Conventional Commits don't care, but the shell would.)

---

## Task 4: Home — inline status line

**Files:**
- Modify: `src/pages/index.astro`

The status line is one sentence wrapped in a `<p>` with an accent left rule. No new component (per spec § 1.3 and the spec's own non-goal). Copy comes from `SITE.nowStatus`.

- [ ] **Step 1: Render the status line**

In `src/pages/index.astro`, the current frontmatter already imports `getCollection`, etc. Add `SITE` to the imports. Find:

```astro
import { getPublishedPosts, sortByDateDesc } from '~/lib/posts';
import { ENTITY_IDS, buildBlog, buildPageGraph, buildWebSite } from '~/lib/schema';
```

Add immediately below:

```astro
import { SITE } from '~/lib/site-config';
```

Then in the template, find the opening of the latest section:

```astro
  <section aria-labelledby="latest">
    <SectionTitle id="latest" name="latest" allHref="/posts" allLabel="all posts" />
```

Insert a status line above the `<section>`:

```astro
  <p class="status">
    <span class="key" aria-hidden="true">// now</span>
    <span class="text">{SITE.nowStatus}</span>
  </p>

  <section aria-labelledby="latest">
    <SectionTitle id="latest" name="latest" allHref="/posts" allLabel="all posts" />
```

- [ ] **Step 2: Add scoped styles**

Replace the existing `<style>` block at the bottom of `src/pages/index.astro`:

```astro
<style>
  .grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
</style>
```

with:

```astro
<style>
  .grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .status {
    border-left: 2px solid var(--accent);
    padding: var(--space-1) var(--space-3);
    margin: 0 0 var(--space-6);
    max-width: 60ch;
    font-family: var(--font-mono);
  }
  .status .key {
    color: var(--fg-muted);
    margin-right: var(--space-2);
    font-size: var(--text-xs);
  }
  .status .text {
    font-size: var(--text-sm);
    line-height: 1.55;
    color: var(--fg);
  }
  @media (forced-colors: active) {
    .status { border-left-color: LinkText; }
  }
</style>
```

- [ ] **Step 3: Visual verification — both themes**

Reload `http://localhost:4321/`. Expect, above the "latest" rule:
- A short paragraph with a 2px orange left border, ~60ch wide.
- `// now` prefix in muted grey, then the placeholder sentence in body color.
- Spacing reads as a deliberate intro block, not as an error/warning.

Toggle to dark theme; verify left border switches to dark accent (`#ff7849`).

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm check
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): add // now status line above latest section"
```

---

## Task 5: PostMeta — add `variant="rail"` and `wordCount` prop

**Files:**
- Modify: `src/components/PostMeta.astro`

Add a `variant` prop. Default (`'inline'`) keeps today's behavior so `PostCard` is unaffected. New `'rail'` variant renders a 2-column dt/dl block. Also add an optional `wordCount` prop used only in the rail variant.

- [ ] **Step 1: Update component**

Replace the entire contents of `src/components/PostMeta.astro` with:

```astro
---
import { formatDate } from '~/lib/format';
import TagPill from './TagPill.astro';

interface Props {
  pubDate: Date;
  updatedDate?: Date | undefined;
  tags: string[];
  minutesRead?: number | undefined;
  wordCount?: number | undefined;
  /** 'inline' = compact one-liner used by PostCard. 'rail' = manpage-style
      dt/dl block used by the post page itself. */
  variant?: 'inline' | 'rail' | undefined;
}
const {
  pubDate,
  updatedDate,
  tags,
  minutesRead,
  wordCount,
  variant = 'inline',
} = Astro.props;

const readLabel =
  minutesRead && wordCount
    ? `${minutesRead} min · ${wordCount.toLocaleString('en-US')} words`
    : minutesRead
      ? `${minutesRead} min read`
      : undefined;
---
{variant === 'inline' && (
  <div class="meta">
    <time datetime={pubDate.toISOString()}>{formatDate(pubDate)}</time>
    {updatedDate && <span> · updated {formatDate(updatedDate)}</span>}
    {minutesRead && <span> · {minutesRead} min read</span>}
    {tags.length > 0 && (
      <span> · {tags.map((t, i) => (
        <>{i > 0 && ' '}<TagPill tag={t} /></>
      ))}</span>
    )}
  </div>
)}
{variant === 'rail' && (
  <dl class="meta meta-rail">
    <dt>Published</dt>
    <dd><time datetime={pubDate.toISOString()}>{formatDate(pubDate)}</time></dd>
    {updatedDate && (
      <>
        <dt>Updated</dt>
        <dd><time datetime={updatedDate.toISOString()}>{formatDate(updatedDate)}</time></dd>
      </>
    )}
    {readLabel && (
      <>
        <dt>Read</dt>
        <dd>{readLabel}</dd>
      </>
    )}
    {tags.length > 0 && (
      <>
        <dt>Tags</dt>
        <dd class="tags">
          {tags.map((t) => <TagPill tag={t} />)}
        </dd>
      </>
    )}
  </dl>
)}

<style>
  .meta {
    font-size: var(--text-xs);
    color: var(--fg-muted);
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums slashed-zero;
  }
  .meta-rail {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-4);
    border-top: 1px solid var(--rule-soft);
    border-bottom: 1px solid var(--rule-soft);
    padding: var(--space-3) 0;
    margin: var(--space-3) 0 var(--space-6);
  }
  .meta-rail dt {
    color: var(--fg-muted);
    letter-spacing: 0.04em;
    font-size: var(--text-xs);
  }
  .meta-rail dd {
    color: var(--fg);
    font-size: var(--text-xs);
    margin: 0;
    font-variant-numeric: tabular-nums slashed-zero;
  }
  .meta-rail dd.tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  /* On narrow viewports, collapse to one column: each label sits above its
     value. Keep the borders and the same vertical rhythm. */
  @media (max-width: 640px) {
    .meta-rail {
      display: block;
    }
    .meta-rail dt {
      display: block;
      margin-top: var(--space-2);
    }
    .meta-rail dt:first-child { margin-top: 0; }
    .meta-rail dd { display: block; }
  }
</style>
```

Key points:
- The `inline` branch is byte-identical to the existing component, so `PostCard` consumers are unaffected.
- `dt` labels are mixed case (`Published`, not `PUBLISHED`) to honor decision A3 from the prior aesthetics spec ("caps reserved for chrome / signage / wordmark; meta is mixed case").
- `wordCount` is formatted with `toLocaleString('en-US')` so it renders as `1,420` not `1420`.
- The `<>` fragments around dt/dd pairs are required because Astro doesn't allow bare adjacent siblings in a conditional expression result.

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm check
```
Expected: exit 0. (PostCard's call site doesn't pass `variant`, so it falls through to `'inline'` and renders identically.)

- [ ] **Step 3: Visual verification — PostCard unchanged**

Reload `http://localhost:4321/`. Each post card on the home page should look pixel-identical to before this task. (The `variant === 'inline'` branch matches the prior single-block markup exactly.)

- [ ] **Step 4: Commit**

```bash
git add src/components/PostMeta.astro
git commit -m "feat(post-meta): add rail variant with manpage-style dt/dl meta"
```

---

## Task 6: PostLayout — replace url-prompt with eyebrow; switch PostMeta to rail

**Files:**
- Modify: `src/layouts/PostLayout.astro`

This is where Tasks 2 and 5 land on the post page. The existing `.url-prompt` block (`$ posts/<slug>`) is replaced with the new `.eyebrow` (`$ cat <slug>.md`); the `<PostMeta>` call is switched to the rail variant and gains `wordCount`.

- [ ] **Step 1: Replace the url-prompt with eyebrow**

In `src/layouts/PostLayout.astro`, find this block (currently around line 112):

```astro
    <p class="url-prompt"><span aria-hidden="true">$</span> posts/{post.id}</p>
    <header>
      <h1 data-no-anim style={`view-transition-name: post-title-${post.id};`}>{title}</h1>
      <PostMeta {pubDate} {updatedDate} {tags} {minutesRead} />
    </header>
```

Replace with:

```astro
    <p class="eyebrow" aria-hidden="true">
      <span class="dol">$</span> cat {post.id}.md
    </p>
    <header>
      <h1 data-no-anim style={`view-transition-name: post-title-${post.id};`}>{title}</h1>
      <PostMeta variant="rail" {pubDate} {updatedDate} {tags} {minutesRead} {wordCount} />
    </header>
```

What changed:
- `.url-prompt` → `.eyebrow`.
- The format `posts/{post.id}` → `cat {post.id}.md`.
- The `$` is hoisted into a named class (`.dol`) so it can be styled with the accent color, matching the brand-mark `$` from Task 2.
- The whole `<p>` carries `aria-hidden="true"` (was already on the inner `<span>`); the eyebrow is decorative and the H1 already provides the announced heading.
- `<PostMeta>` gains `variant="rail"` and `{wordCount}`.

- [ ] **Step 2: Replace the `.url-prompt` styles with `.eyebrow` styles**

In the `<style>` block of the same file, find:

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

Replace with:

```css
  .eyebrow {
    font-size: var(--text-xs);
    color: var(--fg-muted);
    margin-bottom: var(--space-2);
    letter-spacing: 0.02em;
    font-family: var(--font-mono);
  }
  .eyebrow .dol {
    color: var(--accent);
    margin-right: 0.35em;
    font-weight: 700;
  }
  @media (forced-colors: active) {
    .eyebrow .dol { color: LinkText; }
  }
```

Letter-spacing is tightened from 0.04em to 0.02em because mixed-case content reads better with less tracking than the previous all-monospace URL string.

- [ ] **Step 3: Visual verification — post page**

```bash
pnpm dev
```

Open any post — easiest is `http://localhost:4321/posts/hello-world`. Expect, above the H1:
- One short muted line: `$ cat hello-world.md` with the `$` in accent orange.
- Below the H1, the meta line is now a 2-column dt/dl block:
  - `Published 2026-04-12`
  - `Updated …` (only if the post has an `updatedDate`)
  - `Read 7 min · 1,420 words` (only if the post has body text — should always be true)
  - `Tags ai web-platform` (as pills)
- A 1px `--rule-soft` border above and below the rail.

- [ ] **Step 4: Visual verification — narrow viewport**

Resize browser to ≤640px. The dt/dl rail should collapse to single-column: each `dt` sits above its `dd`, borders preserved, no horizontal scroll.

- [ ] **Step 5: Visual verification — long slugs**

If you have a post with a long slug, confirm the eyebrow wraps cleanly (`overflow-wrap: anywhere` is set globally on `<p>` per `global.css:42-49`). No horizontal scroll on mobile.

- [ ] **Step 6: Verify the AT readout is unchanged**

The eyebrow is `aria-hidden`; the H1 text is unchanged. Confirm in DevTools accessibility tree that the post page's first announced item under `<main>` is still the H1 ("How Chrome ships features" or whichever post you opened).

- [ ] **Step 7: Typecheck + lint + build**

```bash
pnpm check && pnpm build
```
Expected: both exit 0. The CI bundle-size assertion is `≤ 6 KB initial JS` — this task adds zero JS, so we're safe.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/PostLayout.astro
git commit -m "feat(post): replace url-prompt with eyebrow; switch meta to rail variant"
```

---

## Task 7: Final verification & PR

**Files:** none modified.

- [ ] **Step 1: Full check**

```bash
pnpm check && pnpm build && pnpm test
```
Expected: all three exit 0. (`pnpm test` runs Vitest on existing `*.test.ts` files; this plan adds no tests because the project convention is "pure helpers only.")

- [ ] **Step 2: Re-walk the surfaces**

```bash
pnpm dev
```

Walk every change in light AND dark themes:
1. **Header**: `$ KEVINKIKLEE.IO█` with blinking caret. Verify on `/`, `/posts`, a post page, `/about`. Caret persists across navigation (header `view-transition-name: site-header` keeps the element).
2. **Home**: status line above "latest"; reads as one sentence with accent left rule.
3. **Post page**: eyebrow `$ cat <slug>.md`, H1, then meta rail.
4. **Footer**: `$ exit © 2026 Kevin Lee` with `$ exit` in accent.
5. **Reduced-motion**: caret stops blinking; nothing else changes.

- [ ] **Step 3: Verify the placeholder TODO still stands out**

```bash
git grep "TODO — Kevin"
```
Expected: one match in `src/lib/site-config.ts`. **Before merging, replace this with Kevin's actual current "now" sentence.** Leaving the TODO in production would render literally on the home page.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/prompt-motif
gh pr create --title "feat: prompt motif & surface polish" --body "$(cat <<'EOF'
## Summary
- Header brand mark: replace bars with `$` + blinking caret
- Footer: add `$ exit` finisher before copyright
- Home: add `// now` status line above latest section
- Post page: replace url-prompt with `$ cat <slug>.md` eyebrow; switch meta line to manpage-style dt/dl rail

Spec: `docs/superpowers/specs/2026-05-04-prompt-motif-design.md`

## Test plan
- [ ] Header brand renders correctly in light + dark themes
- [ ] Caret blinks at ~1.1s; stops blinking under prefers-reduced-motion
- [ ] Home status line renders above latest, accent left rule visible
- [ ] Post page eyebrow + meta rail render; mobile collapses meta rail to single column
- [ ] Footer `$ exit` reads correctly; aria-hidden so AT skips it
- [ ] `pnpm check && pnpm build && pnpm test` all green
- [ ] Lighthouse CI on preview holds: perf ≥ 0.95, a11y/best-practices/SEO 1.00, CLS 0.00, LCP ≤ 1.5s
- [ ] **REPLACE THE `SITE.nowStatus` TODO WITH REAL COPY BEFORE MERGE**
EOF
)"
```

- [ ] **Step 5: Wait for CI**

```bash
gh pr checks --watch
```
Expected: all checks pass — typecheck, lint, spell, markdownlint, build, link-check, a11y, lighthouse, size-check.

- [ ] **Step 6: Final reminder before merging**

Before clicking merge, replace the `SITE.nowStatus` placeholder with the real one-sentence status. Push that fix, wait for CI, then merge.

---

## What this plan does NOT do

- No new tests (project convention: tests for pure helpers only; this work touches Astro components).
- No new dependencies.
- No changes to `astro.config.ts`, `vercel.ts`, JSON-LD schema, sitemap, OG generation, or any test file.
- No changes to body prose styles, code-block styles, link underlines, or PostCard markup.
- No `.url-prompt` references remain anywhere in the codebase after Task 6 (Step 1 grep should return empty).
