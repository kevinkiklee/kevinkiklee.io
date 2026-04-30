# CLAUDE.md

Guidance for Claude Code / AI assistants working in this repo.

## TL;DR

Personal site for Kevin Lee (Chrome DevRel). Astro 5 + MDX, deployed
to Vercel as a static site with one OG image edge function. Brutalist
mono-typeface design. AEO-friendly content layout. 6 KB / chunk JS
budget.

## Where to read first

- **Spec** — [`docs/superpowers/specs/2026-04-29-personal-blog-design.md`](./docs/superpowers/specs/2026-04-29-personal-blog-design.md)
  has the design rationale and an "Implementation status" appendix that
  maps spec features to source files.
- **Plan** — [`docs/superpowers/plans/2026-04-29-personal-blog-implementation.md`](./docs/superpowers/plans/2026-04-29-personal-blog-implementation.md)
  is the original implementation plan; treat the spec's status section as
  more current.
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

- The visual design is intentional. Do NOT redesign without explicit
  user direction. Theme tokens live in `src/styles/tokens.css`.
- Do NOT fabricate blog post content. The only sample post is
  `2026-04-12-hello-world.mdx`.
- Do NOT add new dependencies without checking the bundle-size budget
  in `.github/workflows/size.yml`.
- The OG image function (`src/pages/api/og.tsx`) is the ONLY non-static
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
  pages/         # routes (incl. /api/og.tsx, rss.xml.ts, feed.json.ts)
  styles/        # layered: reset → tokens → base → components → prose → utilities
astro.config.ts  # integrations + sitemap serializer + envField schema
vercel.ts        # typed CSP, cache headers, crons
```

## When in doubt

Read the spec's "Implementation status" section to find which file
implements a given feature, then read that file before changing it.
