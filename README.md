# kevinkiklee.io

Personal site of Kevin Lee — Chrome DevRel. Built with Astro, deployed to
Vercel. Brutalist mono-typeface design, AEO-friendly content layout, and an
opinionated performance budget.

## Prereqs

- Node.js >= 24 (see `.nvmrc`)
- pnpm 9 (`corepack prepare pnpm@9.15.0 --activate`)

## Install + run

```sh
pnpm install
pnpm dev          # http://localhost:4321
```

## Scripts

| Script              | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `pnpm dev`          | Astro dev server (drafts visible)                             |
| `pnpm build`        | `astro check` + `astro build`                                 |
| `pnpm preview`      | Serve `dist/` locally (Pagefind index + OG endpoint work)     |
| `pnpm test`         | Vitest run                                                    |
| `pnpm test:watch`   | Vitest watch                                                  |
| `pnpm check`        | astro check + biome ci + cspell + markdownlint                |
| `pnpm format`       | biome format --write .                                        |
| `pnpm new:post`     | Scaffold a new post (`pnpm new:post "Title"`)                 |
| `pnpm new:project`  | Scaffold a new project entry                                  |
| `pnpm fonts:subset` | Re-subset JetBrains Mono                                      |
| `pnpm analyze`      | Open `stats.html` (rollup-plugin-visualizer)                  |
| `pnpm links:check`  | Run lychee against `dist/`                                    |
| `pnpm a11y:check`   | axe-core against `http://localhost:4321`                      |
| `pnpm lighthouse`   | Lighthouse CI collect against `http://localhost:4321`         |

## Environment variables

See [`.env.example`](./.env.example) for the canonical list. All variables are
optional — the site degrades cleanly when each is absent.

| Name                     | Where used                  | Optional |
| ------------------------ | --------------------------- | -------- |
| `GA_MEASUREMENT_ID`      | Partytown GA4 loader        | yes      |
| `GISCUS_REPO`            | Comments island             | yes      |
| `GISCUS_REPO_ID`         | Comments island             | yes      |
| `GISCUS_CATEGORY`        | Comments island             | yes      |
| `GISCUS_CATEGORY_ID`     | Comments island             | yes      |
| `MASTODON_HANDLE`        | DiscussFooter, rel-me link  | yes      |
| `MASTODON_INSTANCE_URL`  | DiscussFooter, rel-me link  | yes      |
| `WEBMENTION_TOKEN`       | webmention.io               | server   |
| `VERCEL_DEPLOY_HOOK_URL` | `/api/refresh` cron         | server   |
| `CRON_SECRET`            | `/api/refresh` auth         | server   |
| `SENTRY_DSN_OG`          | Sentry on `/api/og`         | server   |
| `INDEXNOW_KEY`           | IndexNow ping on push       | CI only  |

## Project layout

- `src/content/posts/` — MDX posts (`YYYY-MM-DD-slug.mdx`)
- `src/content/tags.json` — tag allowlist (the schema rejects unknown tags)
- `src/components/`, `src/layouts/`, `src/pages/` — Astro components
- `src/lib/` — pure helpers + Vitest tests
- `src/styles/` — global CSS layered as `reset, tokens, base, components, prose, utilities`
- `vercel.ts` — typed Vercel routes config (CSP, cache headers, crons)
- `astro.config.ts` — integrations, sitemap serializer, env schema
- `.github/workflows/` — `ci.yml` (typecheck, lint, build, link-check,
  Lighthouse), `size.yml` (6 KB / chunk gzip budget)
- `docs/superpowers/` — design spec + implementation plan

## Authoring

See [`AUTHORING.md`](./AUTHORING.md).

## Deployment

`git push origin main` triggers a Vercel production build. PRs get preview
deployments; CI runs typecheck, lint, build, link-check, Lighthouse, and the
size budget against every PR.

## References

- Spec: [`docs/superpowers/specs/2026-04-29-personal-blog-design.md`](./docs/superpowers/specs/2026-04-29-personal-blog-design.md)
- Plan: [`docs/superpowers/plans/2026-04-29-personal-blog-implementation.md`](./docs/superpowers/plans/2026-04-29-personal-blog-implementation.md)

## License

Personal site — all post content © Kevin Lee, all rights reserved. Source
code (everything outside `src/content/posts/`) is MIT-licensed; feel free
to crib the layout, components, or tooling.
