# CLAUDE.md

Guidance for Claude Code / AI assistants working in this repo.

## TL;DR

Personal site for Kevin Lee (Chrome DevRel). Astro 5 + MDX, deployed
to Vercel as a static site with one OG image edge function. **Quiet
Meadow** identity: serif-led editorial-organic design on sage paper
(forest-night in dark mode), with an illustrated garden system of
line-drawn plants and birds. AEO-friendly content layout. 6 KB / chunk
JS budget.

## Where to read first

- **Spec** — [`docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md`](./docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md)
  is the current design spec: the Quiet Meadow visual identity, the
  garden system, and the migration/verification plan that replaced the
  prior brutalist terminal look.
- **Prior spec** — [`docs/superpowers/specs/2026-04-29-personal-blog-design.md`](./docs/superpowers/specs/2026-04-29-personal-blog-design.md)
  is the original design spec. Its visual sections are superseded by
  Quiet Meadow (see the note at the top of that file), but its
  architecture, content model, SEO/AEO, analytics, comments, CI, and
  hosting decisions remain in force — keep it as a historical/
  architecture reference.
- **Plan** — [`docs/superpowers/plans/2026-04-29-personal-blog-implementation.md`](./docs/superpowers/plans/2026-04-29-personal-blog-implementation.md)
  is the original implementation plan; treat the current spec as more
  current for anything visual.
- **README.md** — install + scripts + project layout for humans.
- **AUTHORING.md** — how to write a post.

## Conventions

- **Package manager**: pnpm 9 (`packageManager` pinned in `package.json`).
  Do NOT use `npm` or `yarn`.
- **Node**: `>=24` (see `.nvmrc`).
- **TypeScript**: strict, `verbatimModuleSyntax` on, `exactOptionalPropertyTypes` on.
  Use `import type` for type-only imports.
- **Linting/formatting**: Biome (`pnpm check` runs `biome ci`). Don't add
  ESLint or Prettier.
- **Commits**: Conventional Commits, enforced by commitlint. Common
  scopes: `posts`, `seo`, `a11y`, `perf`, `mobile`, `og`, `security`,
  `site-config`. Keep subject ≤ 72 chars.
- **Tests**: Vitest, colocated `*.test.ts` next to source. Pure helpers
  only; no Astro component rendering tests.
- **Content**: posts live in `src/content/posts/YYYY-MM-DD-slug.mdx`.
  Tags must be in the `src/content/tags.json` allowlist or the build
  fails (Zod refinement). Draft posts hide in production but show in
  dev and Vercel preview deploys.

## Important guardrails

- The visual design is intentional — see [`docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md`](./docs/superpowers/specs/2026-07-29-quiet-meadow-redesign-design.md).
  Do NOT redesign without explicit user direction. Theme tokens live in
  `src/styles/tokens.css`.
- Do NOT fabricate blog post content. The only sample post is
  `2026-04-12-hello-world.mdx`.
- Do NOT add new dependencies without checking the bundle-size budget
  in `.github/workflows/size.yml`.
- The OG image function (`src/pages/api/og.ts`) is the ONLY non-static
  route. Do not add API routes casually.

## Common tasks

- **Add a post**: `pnpm new:post "Title"` then edit the generated MDX file.
- **Add a project**: `pnpm new:project` and follow prompts.
- **Add a tag**: edit `src/content/tags.json` (alphabetical).
- **Run tests**: `pnpm test`.
- **Full check**: `pnpm check` (astro check + biome + cspell + markdownlint).
- **Build**: `pnpm build` (runs astro check first).

## Architecture sketch

```text
src/
  components/    # .astro components (PostCard, Header, BaseHead, ...)
  content/       # posts/ + projects.yaml + tags.json
  integrations/  # custom Astro integrations (image-sitemap)
  layouts/       # BaseLayout, PostLayout
  lib/           # pure TS helpers + colocated *.test.ts
  pages/         # routes (incl. /api/og.ts, rss.xml.ts, feed.json.ts)
  styles/        # layered: reset → tokens → base → components → prose → utilities
astro.config.ts  # integrations + sitemap serializer + envField schema
vercel.ts        # typed CSP, cache headers, crons
```

## When in doubt

For a visual/garden-system feature, check the current spec's numbered
sections (§1 identity, §2 layout, §3 garden system) to find the
relevant component, then read that file before changing it. For an
architecture/content/SEO feature, the prior spec's "Implementation
status" appendix still maps those features to source files.

## Accessibility

- **Target:** WCAG 2.2 AA, AAA body contrast.
- **Source of truth for known issues:** [`docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`](./docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md). Items with `Status: wontfix-rationale` auto-render on `/accessibility` via `src/components/a11y/KnownLimits.astro`.
- **Gates running on every PR:** `pnpm a11y:audit:primary` (axe-playwright), `pnpm a11y:html` (post-build HTML structural assertion), `pnpm a11y:keyboard` (keyboard-traversal smoke), `pnpm test` (token contrast + remark lints + KnownLimits parser).
- **Baselines:** `axe-baseline.json`, `html-checks-baseline.json`, `keyboard-baseline.json`, `tokens-baseline.json` capture currently-accepted violations. New violations (not in a baseline) fail PR CI. To resolve a baseline entry, fix the underlying issue and remove the entry; or, if it's an intentional design tradeoff, document it as `wontfix-rationale` in the audit findings doc.
- **Adding a new finding:** open a GitHub issue with route + AT + reproduction steps. Triage to severity per spec §2 rubric. Either fix in a PR (and drain the baseline) or add a `wontfix-rationale` entry.
