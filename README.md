# kevinkiklee.io

Personal site of Kevin Lee — Chrome DevRel. Astro 5 + MDX, deployed
to Vercel as a near-static site. Brutalist mono-typeface design,
AEO-friendly content layout, and an opinionated 6 KB / chunk JS
budget enforced in CI.

## Highlights

- **Static-first.** The whole site prerenders. The only server
  routes are `/api/og` (dynamic OG images via Satori) and
  `/api/refresh` (Vercel Cron → deploy hook).
- **Tight perf budget.** Per-chunk JS gzip ≤ 6 KB, enforced by
  [`size.yml`](./.github/workflows/size.yml). Subset JetBrains Mono
  WOFF2, Pagefind for client-side search, Partytown for analytics.
- **A11y as a CI gate.** axe + structural HTML checks + keyboard
  smoke tests + token-contrast unit tests run on every PR. Targets
  WCAG 2.2 AA / AAA body contrast. See
  [`docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`](./docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md).
- **AEO-aware.** Ships `/llms.txt`, `/llms-full.txt`, RSS, JSON Feed,
  IndexNow ping, and an image sitemap.
- **Webmention-native.** Comments are Mastodon/Bluesky replies
  ingested via webmention.io. No Giscus, no Disqus.

## Prereqs

- Node.js >= 24 (see `.nvmrc`)
- pnpm 9 (`corepack prepare pnpm@9.15.0 --activate`)

## Install + run

```sh
pnpm install
pnpm dev          # http://localhost:4321
```

## Scripts

### Dev / build

| Script                | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `pnpm dev`            | Astro dev server (drafts visible)                      |
| `pnpm build`          | `astro check` + `astro build`                          |
| `pnpm preview`        | `astro preview` against the built output               |
| `pnpm preview:static` | `serve dist/client` on :4321 (Pagefind + static)       |
| `pnpm clean`          | Remove `dist`, caches, reports, and `node_modules/.vite` |

### Quality

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `pnpm typecheck`    | `astro check`                                      |
| `pnpm check`        | `astro check` + `biome ci` + `cspell` + markdownlint |
| `pnpm format`       | `biome format --write .`                           |
| `pnpm test`         | Vitest run                                         |
| `pnpm test:watch`   | Vitest watch                                       |
| `pnpm links:check`  | `lychee` against `dist/` (run after `pnpm build`)  |

### Accessibility & perf

| Script                     | What it does                                       |
| -------------------------- | -------------------------------------------------- |
| `pnpm a11y:audit`          | axe-playwright across the full route matrix        |
| `pnpm a11y:audit:primary`  | axe-playwright, primary routes only (faster)       |
| `pnpm a11y:html`           | Static HTML structural check against `dist/`       |
| `pnpm a11y:keyboard`       | Playwright keyboard-traversal smoke test           |
| `pnpm lighthouse`          | Lighthouse CI collect against `http://localhost:4321` |
| `pnpm analyze`             | Open `stats.html` (rollup-plugin-visualizer)       |

### Authoring & assets

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `pnpm new:post`     | Scaffold a new post (`pnpm new:post "Title"`)         |
| `pnpm new:project`  | Scaffold a new project entry                          |
| `pnpm fonts:subset` | Re-subset JetBrains Mono → WOFF2 in `public/fonts/`   |

## Environment variables

See [`.env.example`](./.env.example) for the canonical list and inline
docs. Every variable is optional — the site degrades cleanly when
each is absent.

| Name                     | Scope  | Where used                              |
| ------------------------ | ------ | --------------------------------------- |
| `GA_MEASUREMENT_ID`      | client | Partytown GA4 loader                    |
| `MASTODON_INSTANCE_URL`  | client | rel-me link, footer, about, a11y page   |
| `TWITTER_HANDLE`         | client | `twitter:site` / `twitter:creator` meta |
| `WEBMENTION_TOKEN`       | server | webmention.io sender                    |
| `VERCEL_DEPLOY_HOOK_URL` | server | `/api/refresh` cron target              |
| `CRON_SECRET`            | server | `/api/refresh` Bearer auth              |
| `SENTRY_DSN_OG`          | server | Sentry on `/api/og`                     |
| `INDEXNOW_KEY`           | CI     | IndexNow ping after deploy              |

## Project layout

```text
src/
  components/       # .astro components (BaseHead, Header, PostCard, …)
  content/
    posts/          # MDX posts: YYYY-MM-DD-slug.mdx
    projects/       # projects.yaml
    tags.json       # tag allowlist (Zod refines against this)
  integrations/     # custom Astro integrations (image-sitemap)
  layouts/          # BaseLayout, PostLayout
  lib/              # pure helpers + colocated *.test.ts (vitest)
  pages/            # static routes + /api/og.ts, /api/refresh.ts,
                    # rss.xml.ts, feed.json.ts, llms.txt.ts, …
  styles/           # layered: reset → tokens → base → components
                    #          → prose → utilities
astro.config.ts     # integrations + sitemap serializer + envField schema
vercel.ts           # typed CSP, cache headers, crons
```

Other top-level directories:

- `docs/superpowers/` — design spec, implementation plan, a11y audit
- `scripts/` — `new-post.ts`, `new-project.ts`, `subset-fonts.ts`,
  `indexnow.ts`, `a11y/` (audit + html-check)
- `.github/workflows/` — `ci.yml` (typecheck, lint, build, link-check,
  Lighthouse, a11y), `size.yml` (6 KB / chunk gzip budget)
- `fonts/` — JetBrains Mono source TTFs (subset to WOFF2 in `public/fonts/`)

## Authoring

See [`AUTHORING.md`](./AUTHORING.md). New tags must be added to
[`src/content/tags.json`](./src/content/tags.json) (alphabetical) — Zod
refines post frontmatter against the allowlist and the build fails
otherwise.

## Deployment

`git push origin main` triggers a Vercel production build. PRs get
preview deployments and run the full CI suite (typecheck, lint, build,
link-check, a11y gates, Lighthouse, 6 KB / chunk size budget).

After production deploys, `scripts/indexnow.ts` pings IndexNow if
`INDEXNOW_KEY` is set.

## References

- Spec: [`docs/superpowers/specs/2026-04-29-personal-blog-design.md`](./docs/superpowers/specs/2026-04-29-personal-blog-design.md)
- Plan: [`docs/superpowers/plans/2026-04-29-personal-blog-implementation.md`](./docs/superpowers/plans/2026-04-29-personal-blog-implementation.md)
- A11y findings: [`docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`](./docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md)
- Working notes for AI assistants: [`CLAUDE.md`](./CLAUDE.md)

## License

Personal site — all post content © Kevin Lee, all rights reserved.
Source code (everything outside `src/content/posts/`) is MIT-licensed;
feel free to crib the layout, components, or tooling.
