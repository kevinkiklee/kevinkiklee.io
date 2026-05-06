# Accessibility Improvements — Design

**Author:** Kevin Lee
**Date:** 2026-05-04
**Status:** Approved (brainstorming complete)
**Scope:** kevinkiklee.io
**Related:** [`2026-04-29-personal-blog-design.md`](./2026-04-29-personal-blog-design.md)

---

## 1. Goals & non-goals

**Goals**

- **WCAG 2.2 Level AA conformance** on all owned routes, asserted via the gates in Section 3. WCAG 2.2 (not 2.1) because it's the current recommendation and adds the `target-size` (24×24 CSS px) AA criterion that matches our existing 44px policy.
- **Lighthouse accessibility = 1.0** on all routes via expanded LHCI coverage. (Lighthouse is a heuristic subset of WCAG; a 1.0 score is necessary but not sufficient — `axe-playwright` covers the broader rule set.)
- **Contrast tokens reach AAA** in both themes for body text. Smaller / decorative tokens may stay AA.
- **Zero promised-but-unshipped a11y features.** Every commitment in the original blog spec (`§3.7`, `§5.8`, `§6.6`) is either delivered, formally re-scoped, or covered by an audit-finding ticket in Section 4. The audit findings doc is the source of truth.
- **No undetected regression.** Any new code that would fail `axe-playwright`, the LHCI a11y assertion, the `pnpm test` build-time lints (alt, heading hierarchy), or the keyboard-traversal smoke test, fails PR CI. Issues outside that detection envelope are explicitly outside the gate.
- **`/accessibility` route** documenting target conformance, known limits, third-party scope (Giscus, webmention.io, Pagefind), and a reporting channel.

**Non-goals (v1)**

- Manual screen-reader certification or live AT smoke testing — bugs that surface only under live VoiceOver/NVDA (announcement order, focus-feel, scrollspy chatter) are out of envelope.
- AAA conformance globally — only contrast tokens reach AAA; criteria like `2.4.9 Link Purpose (Link Only)` etc. stay at AA.
- Per-keystroke search-results announcements — polite, debounced, summarized announcements (e.g., "5 results") are in scope; we won't talk over the user.
- Forking or rebuilding third-party surfaces — Giscus iframe, webmention.io response shape, upstream Pagefind UI styles. We wrap, label, and announce around them; we don't fix their internals.
- Mobile-AT field testing (TalkBack, VoiceOver-iOS).
- i18n a11y (`hreflang` per locale, RTL, lang variants) — site is `en-US`-only.
- Cookie-consent banner a11y — site is cookieless, no banner exists.
- Continuous re-audit cadence — we rely on CI gates, not a recurring manual pass.

---

## 2. Audit methodology

**Coverage matrix.** Every route in the original blog spec `§2.1` is audited. We **sample**, not exhaust: posts share a template, so one canonical post is audited per shape-variant, not every URL.

| Route class | Sample URLs |
|---|---|
| Home | `/` |
| Archive | `/posts`, `/posts/page/2` |
| Post (sampled by shape) | short, long w/ TOC, with cover image, with FAQ block, with code-block-heavy body, with footnotes |
| Tag pages | `/tags`, one populated `/tags/<tag>`, one thin (noindex) tag page |
| Projects | `/projects` |
| About | `/about` |
| Search | `/search`, plus the palette `<dialog>` opened on `/` |
| Privacy / Accessibility | `/privacy`, `/accessibility` (after it ships) |
| Errors | `/404` |
| Feeds | `/rss.xml`, `/feed.json`, `/sitemap-index.xml` (HTTP-level only; not user-facing) |

The discovery step reads `dist/sitemap-0.xml` (already produced by `@astrojs/sitemap`, drafts excluded) plus a small list of non-sitemap routes (`/404`, dialog states). Adding a new route class to the audit means appending one entry to a `audit-routes.ts` config.

**Three-track audit per route, per theme.**

Each route is audited under **two themes** (`data-theme="light"` and `data-theme="dark"`) and **two motion preferences** (default + `prefers-reduced-motion: reduce`), since contrast ratios and motion behavior diverge across these. Reduced-data emulation is tested on post pages only (where the cover-image opt-out lives).

1. **Automated rule scan.** `@axe-core/playwright` against the built `dist/` served by `pnpm preview`. Rule set: the WCAG 2.2 AA tags supported by the installed axe-core version, plus `best-practice`. Pinned to `axe-core@4.10.x`; tag list is read from `axe.getRules()` at run time so a version bump can't silently widen scope. axe is told to descend into the Giscus iframe specifically (`run({ iframes: true, only: { include: [['#giscus', '*']] } })`); other iframes are skipped.
2. **Lighthouse a11y category.** LHCI per route, accessibility category only, asserted at 1.0.
3. **Static structural review.** One-time code-side pass over every file in `src/components/`, `src/layouts/`, `src/pages/`, against the checklist below. Output rolls into the same findings doc. **Ongoing enforcement is via the Section 3 gates, not by re-running this pass.**

**Static checklist (one-time pass):**

- Landmark presence + uniqueness (single `<main>`, named `<nav>`s, no nested mains).
- Heading hierarchy within a route (h1 → h2 → h3, no skips); single h1 per page.
- Interactive elements have an accessible name.
- Every `<dialog>` returns focus to the opener on close; no `tabindex > 0` anywhere.
- Live regions only on user-relevant updates.
- `aria-current` values are spec-valid.
- No hover-only or motion-only affordances; reduced-motion / reduced-data / reduced-transparency honored.
- Color contrast for every token, in both themes.

**Triage rubric.** Each finding gets:

- **Severity** — `Blocker`, `Major`, `Minor`, `Polish`.
  - `Blocker` = WCAG A failure on a **primary path** (home, post, archive, search palette).
  - `Major` = WCAG AA failure on any path, **or** A failure on a secondary path (tags, projects, about, 404, /accessibility).
  - `Minor` = AA edge case (e.g., `target-size` near threshold) or contrast token below AAA where we wanted AAA.
  - `Polish` = UX-feel issue, no WCAG criterion.
- **WCAG criterion** — e.g., `1.4.3 Contrast (Minimum)`. UX-only findings tagged `n/a`.
- **Location** — `src/components/Foo.astro:42` or `route:/posts/<slug>`.
- **Suggested fix** — one paragraph, code-level when practical.
- **Status** — `open` / `gated` / `fixed` / `wontfix-rationale`.

**Output.** `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md` — single living doc. Committed before any fix PR lands so its diff narrates the work.

**Reproducibility.** New `pnpm a11y:audit` script runs the discover→axe→LH pipeline locally and writes the same Markdown. CI runs it on every PR; fails the PR on `Blocker` + `Major`, surfaces `Minor`/`Polish` via a posted PR comment using `actions/github-script` (no third-party comment bot dep).

**Boundary.** Giscus and Pagefind UI are tested at the **container** level (label, focus return, no keyboard trap entering or leaving the iframe). axe descends into Giscus via the targeted `iframes: true` opt-in above so we get the wrapper-level a11y signals upstream Giscus cares about; we still don't fix their internals. Pagefind UI on `/search` is audited as default-styled output — if we wrap Pagefind output, the wrapper is on us.

---

## 3. CI / regression gates

The audit is a snapshot. These gates make it durable. Each gate is an independent PR; together they replace the current `pnpm a11y:check` stub and the two-URL Lighthouse run.

| # | Gate | What it asserts | Trigger | Failure mode |
|---|---|---|---|---|
| G1 | **`pnpm a11y:audit` job** | `@axe-core/playwright` against the route matrix. Pinned `axe-core@4.10.x`. | PR: **primary path** only (home, archive, post sample, search palette open, /accessibility) × 2 themes × default motion. Push-to-main: full matrix incl. tag/projects/about/404/reduced-motion/reduced-data. | PR fails on `Blocker` + `Major`; comment posted via `actions/github-script` |
| G2 | **Expanded LHCI** | LH accessibility = 1.0 on every audited route. | PR: primary path. Push-to-main: full route matrix. | PR fails on a11y < 1.0 |
| G3 | **MDX a11y lints (`src/lib/remark-a11y/`)** | Small custom plugins: heading-increment validator + img-alt validator (non-empty `alt`, or explicit `alt="" role="presentation"` for decorative). | every PR (`pnpm check`) | Build fails with file:line |
| G4 | **Post-build HTML structural assertion** | Parse every `dist/**/*.html` with `linkedom`; assert: single `<h1>`, single `<main>`, every `<nav>` has accessible name, no `tabindex > 0`, every `<button>`/`<a>` has computed accessible name. New `scripts/a11y-html-check.ts`. | PR (after `astro build`) | Fails with route + selector |
| G5 | **Playwright keyboard-traversal smoke** (shares Playwright project with G1) | Tab from skip-link through footer on primary-path routes; assert: no trap, focus visible at every step (Playwright screenshot diff between focused + non-focused state — non-zero pixel delta required), focus returns to opener after `<dialog>` close, falls back to skip-link target when no opener (search palette opened via `/` shortcut from idle), focus lands on `main h1` after view transition. | every PR | PR fails with the failing step's screenshot |
| G6 | **Token-contrast unit tests** | TS test of every `(bg, fg)` token pair in light + dark using WCAG 2.x relative-luminance contrast (vendored ~30-line helper, no deps). Catches token edits that drop ratios. | every PR (`pnpm test`) | Fails with token name + ratio |
| G7 | **`/accessibility` page generator + sanity test** | Build step renders the page's "known limits" section from `accessibility-audit-findings.md`'s `wontfix-rationale` entries (single source of truth). A `pnpm test` case asserts the generator produced non-empty output and parsed every `wontfix` entry. | every PR | Test fails listing parse errors |

(Existing `size.yml` covers bundle-size; nothing new there.)

**CI time envelope.** Primary-path PR run targets ≤ 4 minutes added wall-time vs current CI (axe ≈ 90s, LHCI primary path ≈ 90s, Playwright traversal + screenshot ≈ 60s). Push-to-main full matrix is allowed up to ~10 minutes. If the matrix outgrows that, we shard by route class across runners (pre-decided shape; not part of v1 work).

**axe version policy.** `axe-core` is pinned in `package.json` with Renovate set to **manual** for this dep only. Bumps go through a dedicated PR that includes the audit-findings diff so new rule failures are reviewed, not surprises.

**Pagefind UI on `/search`.** Audited under G1 + G2; if Pagefind's default styles produce contrast failures we cannot fix upstream, we record the failures as `wontfix-rationale` on G7's page rather than bypassing the gate.

**Live-AT gap, again.** Gates G3–G7 detect what's machine-detectable. Announcement timing, scrollspy chatter, focus *feel* remain outside the envelope.

---

## 4. D-wide polish backlog

Each item lists: **what**, **why** (WCAG ref or rationale), **where** (file or surface), **gated by** (which Section 3 gate prevents regression).

### Group A — Search & dialogs

**P1. Search-palette results live region.** `<div id="palette-results">` swaps `innerHTML` per keystroke; AT users hear nothing. Add a separate `<p class="sr-only" aria-live="polite" aria-atomic="true">` that updates **only after the search settles** (the existing 120ms debounce window has elapsed *and* results have rendered) with a brief summary like `"5 results for astro"`. The results container itself is *not* a live region. Switch results from `<div>` of `<a>`s to `<ul role="list">` of `<li>`s. WCAG 4.1.3. File: `src/components/SearchPalette.astro`. Gated by G1.

**P2. Dialog focus return on close.** Capture `document.activeElement` at open time; restore it on close. If captured target is `<body>` or null (e.g., dialog opened from idle state), restore to the skip-link target. Same pattern in both dialogs. WCAG 2.4.3. Files: `src/components/SearchPalette.astro`, `src/components/ShortcutsOverlay.astro`. Gated by G5.

**P3. `prefers-reduced-transparency` on dialog backdrops.** Targets `dialog::backdrop`, not the dialog box. Drop `backdrop-filter: blur(2px)` and raise alpha to 1.0 inside the media query. WCAG 1.4.12 (related). Files: `src/components/SearchPalette.astro`, `src/components/ShortcutsOverlay.astro`. Gated by G1 with reduced-transparency emulation (push-to-main matrix).

### Group B — Code & content surfaces

**P4. Conditional code-block keyboard scroll region.** Detect overflow at runtime: if `pre.scrollWidth > pre.clientWidth`, set `tabindex="0"`, `role="region"`, `aria-label="Code"` (with language appended only when shiki emitted a recognized class). Non-overflowing pres remain ordinary, no extra tab stops. WCAG 2.1.1, 4.1.2. Files: small inline script in `src/layouts/PostLayout.astro` or rehype hook. Gated by G4 + G5.

**P5. Conditional table scroll region.** Only wrap MDX tables when they overflow their container. Wrapper: `<div role="region" aria-label="Table" tabindex="0">`. Skip the `<figure>` since we have no caption to attach. WCAG 1.3.1. File: rehype plugin under `src/lib/remark-a11y/`. Gated by G4.

**P6. `lang` attribute authoring rule.** Document in `AUTHORING.md`: use `<span lang="…">…</span>` for non-English passages; add a comment in the post template. **No automated lint** — heuristics for "non-English" are unreliable. WCAG 3.1.2. Files: `AUTHORING.md`, post scaffold.

### Group C — Tokens, themes, focus

**P7. Token contrast targets.** Body-equivalent muted/subtle text in **both** themes reaches **≥ 7:1** (AAA body). Specific hex values determined during implementation by running G6's contrast helper iteratively. WCAG 1.4.6 (AAA). File: `src/styles/tokens.css`. Gated by G6.

**P8. Forced-colors focus ring (audit-then-fix).** Verify whether existing `outline: 2px solid` rules survive forced-colors via `currentColor` substitution. If they do, no change. If any rule uses an explicit color in forced-colors mode, replace with `CanvasText`. WCAG 2.4.7, 1.4.11. Files: `src/styles/global.css`. Gated by G1.

**P9. Reading-progress bar is decorative.** Confirm `aria-hidden="true"` on the progress indicator (currently the header underline). It reinforces scroll position visually; AT users get nothing useful from a percentage that changes constantly. File: `src/components/PostMeta.astro` or wherever the indicator lives. Gated by static review.

### Group D — Component semantics

**P10. ToC `aria-current` value choice (audit-then-decide).** `aria-current="location"` is spec-valid; AT support is acceptable in current major engines. Verify in audit; only change to `aria-current="true"` if a tested AT misbehaves. Files: `src/components/TableOfContents.astro`. Gated by static review.

**P11. CopyButton live region split.** `aria-live` is currently on the `<button>`, conflating control-state changes with status. Split into a separate visually-hidden `<span aria-live="polite" id="copy-status">` element; button label stays static. WCAG 4.1.3. File: `src/components/CopyButton.astro`. Gated by G1.

**P12. ToC scrollspy debounce.** `aria-current` updates on every scroll tick can cause AT chatter. Update only after scroll has been idle for ~150ms. WCAG outside envelope (UX-felt only); listed because the cost is trivial. File: `src/components/TableOfContents.astro`. Gated by static review.

**P13. Webmentions semantics.** Each reply rendered as `<article>` with author link as accessible name and timestamp as `<time datetime="…">`. Keep h-entry microformat for outbound webmention reciprocity. WCAG 1.3.1. File: `src/components/Webmentions.astro`. Gated by G4.

### Group E — Navigation & landmarks

**P14a. Skip-link menu.** Replace single skip link with `<nav aria-label="Skip links">` containing **two** entries: skip to main content, skip to primary navigation. Skip-to-footer dropped (footer is short and not navigationally rich). WCAG 2.4.1. Files: `src/layouts/BaseLayout.astro`, `src/styles/global.css`. Gated by G5.

**P14b. Pagefind UI style overrides on `/search`.** Pagefind ships its own CSS for the `/search` route; if any selector fails contrast against our tokens, override under a scoped wrapper rather than carrying a `wontfix-rationale` entry. File: `src/styles/code.css` or new `src/styles/pagefind.css`. Gated by G1 + G2.

**P15. Heading hierarchy normalization (one-time pass).** Audit every page template's h-levels; fix skips found. Specifically suspect: aside-nested h3s. WCAG 1.3.1. Files: across `src/components/`, `src/pages/`. Gated by G3 + G4.

### Group F — Public surface

**P16. `/accessibility` page.** Content: target conformance (WCAG 2.2 AA), what's tested in CI vs not, third-party scope (Giscus, webmention.io, Pagefind), known limits (auto-rendered from `wontfix-rationale` entries via G7), reporting channel (Mastodon DM + GitHub issue link). Surfaced in footer next to `/privacy`. Files: `src/pages/accessibility.astro`, `src/components/Footer.astro`. Gated by G7.

**P17. Schema.org accessibility metadata (low priority).** Add `accessibilityFeature`, `accessibilityHazard: "none"`, `accessibilityAPI: "ARIA"` to `WebPage`/`BlogPosting` JSON-LD. Search engines mostly ignore these but they're cheap. File: `src/lib/schema.ts`. Gated by existing JSON-LD tests.

---

**Items deliberately *not* on this list** (and why):

- Live region for view-transition route changes — already shipped (`#route-announce`).
- Per-keystroke search announcement — Section 1 non-goal.
- Bypass-to-main on every interactive island — overkill for a 3-dialog site.
- Comprehensive ARIA-pattern compliance for the search results listbox — Pagefind owns it.
- ThemeToggle `role="switch"` rebrand — `aria-pressed` is correct; status-quo wins.
- Initial-page-load focus management — browser default is fine; we have no live-AT data to validate a change.

---

## 5. Phasing & PR strategy

### Phase 1 — Discover (1 PR, max 3 evenings)

Output: `docs/superpowers/specs/2026-05-04-accessibility-audit-findings.md`. No source changes. Contains:

- Route matrix (the canonical source for Phase 2's `audit-routes.ts`).
- Findings from `@axe-core/playwright` + LHCI run locally.
- Findings from the static-review checklist.
- Each polish item (P1–P17) cross-referenced to either a validated finding or a `verify-in-audit` checkbox (P8, P10).

**Stop condition:** doc is complete and committed. Findings PR runtime capped at 3 evenings; any audit work remaining at that point splits into a Phase 1.5 PR rather than blocking Phase 2.

### Phase 2 — Gate (5 PRs)

Each gate ships independently with **a baseline appropriate to its mechanism** so it can land without forcing every fix at once. New violations on top of the baseline fail PRs; existing violations get tracked for Phase 3.

| PR | Gate(s) | Baseline mechanism |
|---|---|---|
| 2.0 (prep) | `audit-routes.ts` config + shared Playwright project skeleton | n/a |
| 2.1 | G3 (MDX lints) + G6 (token-contrast unit tests) | G3: empty (existing MDX should pass; if not, fix in PR). G6: skip-list of currently-failing token pairs in `tokens-baseline.json`, removed token-by-token in P7. |
| 2.2 | G1 (`@axe-core/playwright` PR job, primary path only) | `axe-baseline.json` of current violations (axe's native diff format). New violations fail CI. |
| 2.3 | G2 (expanded LHCI) | Per-URL floor in `lighthouserc.cjs` set to current LH a11y score at PR creation; PR fails on regression below floor. (1.0 target lifts in Phase 4.) |
| 2.4 | G4 (post-build HTML structural assertion) | `html-checks-baseline.json` of currently-failing route+selector pairs. |
| 2.5 | G5 (Playwright keyboard-traversal smoke) | `keyboard-baseline.json` of currently-failing steps per route. |

PRs 2.1–2.5 are independent once 2.0 lands and may be reviewed in any order.

After Phase 2, no new a11y regression detectable by these gates can ship. (Live-AT and other out-of-envelope issues remain unverified per Section 1.)

### Phase 3 — Fix & polish (~6 PRs, group-ordered alphabetically for review surface, *not* impact-ordered)

Each PR removes its scope's baseline entries and lands the polish items in that group:

1. **PR 3.1 (Group A — search & dialogs)**: P1, P2, P3.
2. **PR 3.2 (Group B — code & content)**: P4, P5, P6.
3. **PR 3.3 (Group C — tokens, themes, focus)**: P7, P8, P9.
4. **PR 3.4 (Group D — component semantics)**: P10, P11, P12, P13.
5. **PR 3.5 (Group E — navigation & landmarks)**: P14a, P14b, P15.
6. **PR 3.6 (Group F — public surface)**: P16, P17. **G7 (`/accessibility` generator) lands here**, since it depends on the page existing.

If a group's PR grows beyond a one-sitting review, it splits. The 6-PR count is target, not contract.

### Phase 4 — Tighten (1 PR)

When all baseline files are empty (or remaining entries are formally `wontfix-rationale` and rendered on `/accessibility`):

- Delete every `*-baseline.json`.
- Edit `lighthouserc.cjs` to lift G2 from per-URL floor to `accessibility: 1.0` (single line).
- Update `CLAUDE.md` to point future a11y work at the audit findings doc.

### Branch strategy

Each PR opens off `main` directly. "Phase" is a logical grouping for review and tracking, not a branch hierarchy — single-committer project doesn't earn the rebase-cost of a long-lived `feat/a11y`.

### Rollback

Each PR is small enough that `git revert` is the rollback. No phase rolls back as a unit; rollback granularity is per PR.

### Total PR count

1 (discover) + 1 (prep) + 5 (gates) + ~6 (fix) + 1 (tighten) = **~14 PRs**, target not contract.

---

## 6. Validation plan

| Goal (from §1) | Evidence | Where it lives | When it's checked |
|---|---|---|---|
| **WCAG 2.2 AA conformance on owned routes** | `pnpm a11y:audit` produces no `Blocker` / `Major` findings on the **full route × theme × motion-pref matrix** | CI artifact `a11y-findings-{commit}.json` from G1 + G2 push-to-main run | Final check at end of Phase 4; ongoing on every push to `main` |
| **Lighthouse a11y = 1.0 on every audited route** | LHCI report shows `accessibility: 1.0` on every URL in `audit-routes.ts` | LHCI artifact, gated by G2 strict mode | Phase 4 PR cannot merge until this passes |
| **Contrast tokens reach AAA for body text** | G6 unit-test output shows every body-equivalent `(bg, fg)` pair ≥ 7:1 in both themes | `pnpm test` log; failing test prevents merge | Per PR, ongoing |
| **Zero promised-but-unshipped a11y features** | Section-by-section reconcile of original blog spec (§3.7, §5.8, §6.6) against final state — every promise tagged `delivered` / `gated` / `wontfix-rationale` | Appendix to audit findings doc; visible in Phase 1 PR + updated in Phase 4 PR | Final check at end of Phase 4 |
| **No undetected regression (within envelope)** | All seven gates green on `main`; baseline files deleted | Latest `main` run of `ci.yml` | Phase 4 stop condition |
| **`/accessibility` route exists** | Route renders; footer link present; `wontfix-rationale` entries auto-rendered from findings doc; reporting channel reachable | G7 generator output + manual visit to deployed preview | PR 3.6 review + Phase 4 stop condition |

### Phase-stop validations (per phase, not per PR)

- **End of Phase 1:** findings doc compiles cleanly (it's just markdown, but `pnpm check` runs `cspell` + `markdownlint` over it); every finding has severity + WCAG ref + location + suggested fix populated.
- **End of Phase 2:** `pnpm a11y:audit` runs end-to-end locally without infra errors; every gate green on `main` with its baseline; CI wall-time within the ≤ 4 min PR envelope from §3.
- **End of Phase 3:** every baseline file empty *or* remaining entries documented on `/accessibility` as known limits; no new findings introduced (audit doc reconciled against current state).
- **End of Phase 4:** baseline files deleted; G2 lifted to `1.0`; `CLAUDE.md` updated; one final `pnpm a11y:audit` produces zero `Blocker`/`Major` findings.

### Out-of-envelope acknowledgment

The validation plan above does **not** validate:

- Announcement timing under live VoiceOver / NVDA / TalkBack.
- Focus *feel* (whether returned focus position matches user expectation).
- Scrollspy / live-region chatter as experienced by AT users.
- Mobile screen-reader compatibility.
- Pagefind UI internal a11y (only its container is gated).
- Giscus iframe internal a11y (only its wrapper is gated).

These are stated on `/accessibility` as known limits, with a reporting channel for users who hit issues we couldn't detect.

### Post-launch failure handling

User-reported issue → open GitHub issue with route + AT + steps → triage to severity per §2 rubric → either fix (PR through Phase 3-shaped flow against current `main`) or formal `wontfix-rationale` entry on `/accessibility`. No silent decisions.

### Spec close-out

This spec is considered *closed* when Phase 4 lands on `main` and the Validation table above is fully checked. The audit findings doc remains live afterwards; this design doc gets a status flip from `Approved` to `Implemented` and is otherwise frozen.
