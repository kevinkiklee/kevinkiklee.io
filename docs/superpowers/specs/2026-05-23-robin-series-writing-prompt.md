# Building Robin — blog series writing prompt

A reusable prompt for drafting a five-post series about building Robin, a
personal AI assistant. Each post documents one subsystem and carries one
woven-in lesson about agentic coding. This file is the brief you hand a
drafting agent — shared rules first, then one block per post.

## How to use this prompt

1. Feed the drafting agent the **Series overview** + the entire **Shared
   rules** section, then **exactly one** per-post block. Draft one post per
   session; do not batch all five.
2. **The Robin source lives in a different repo than the blog.** Code:
   `/Users/iser/workspace/robin/robin-assistant-v3/`. Posts are authored in
   `/Users/iser/workspace/kevinkiklee.io/src/content/posts/`. The agent needs
   read access to both.
3. Every post ships as `draft: true`. Kevin reads it, edits the voice by hand,
   flips `draft: false` when it's his.
4. Run `pnpm check` in the blog repo before considering any post done (astro
   check + biome + cspell + markdownlint + tests). An unlisted tag or an
   over-length title fails the build.

## Series overview

- **Series name (frontmatter):** `Building Robin` (≤ 60 chars — fits).
- **What it is:** five posts, subsystem-led, ordered 1–5 via the native
  `series` frontmatter field. Read in order.
- **Thesis (the arc the series earns):** agentic coding changed the *unit of
  work* from lines-per-hour to decisions-per-hour (**D**), which made Robin's
  scope sane for one person (**A**), which freed budget for quality machinery
  most side projects skip (**B**), which produced an ouroboros — building an AI
  assistant *with* an AI assistant, using Robin to build Robin (**C**). Post 1
  states this arc in one paragraph; posts 2–5 each cash one beat.
- **Audience:** developers curious enough to build their own. SQL- and
  cron-fluent. "MCP" and "tiered memory" get a one-line definition on first
  use, then are used freely. Do not talk down; do not over-explain.
- **Voice (one line):** reflective practitioner who teaches — first person and
  personal, but you finish each post able to rebuild the subsystem.
- **Length:** 800–1,200 words per post.

## Shared rules (apply to EVERY post)

### Voice

- First person. Past tense for what you did and decided; present tense for how
  the system works.
- Two obligations held together every post:
  - **Reflection (B):** keep Kevin in the post — the call he made, what
    surprised him, what he got wrong on the first attempt, what changed his
    mind.
  - **Teaching (C):** a reader should be able to rebuild the subsystem from the
    post. Show the design, the data shapes, the cadence — concretely.
- The agentic-coding aside is **woven in, not a section.** One natural
  digression of 2–4 sentences where the subsystem's design decision invites it.
  Never a heading called "What I learned about AI."
- Concrete over abstract: "every 15 minutes" not "frequently"; "4096-dim
  embeddings" not "high-dimensional vectors"; name the actual tool, table, or
  job.

### Anti-AI-tells (forbidden — these betray the voice)

- No throat-clearing openers: "Let's dive in", "In this post we'll explore",
  "Let's take a look".
- No rule-of-three padding ("fast, simple, and powerful").
- No filler hedges: "It's worth noting that", "It's important to understand".
- No promotional adjectives: seamless, robust, powerful, cutting-edge,
  game-changing, elegant, delightful.
- No negative parallelism ("It's not just X — it's Y").
- No fake enthusiasm or exclamation marks.
- No vague attributions ("many developers believe", "it's widely known").
- Don't lean on em-dashes for rhythm; use them sparingly and deliberately.
- Open each post with a declarative first sentence that answers the title's
  implicit question — no warm-up.

### Conventions & frontmatter

File: `src/content/posts/YYYY-MM-DD-<slug>.mdx` (date prefix is stripped from
the URL; pick the publish date when drafting).

```yaml
---
title: <≤ 60 chars>
description: <≤ 160 chars; the citable one-sentence summary>
pubDate: <YYYY-MM-DD>
tags: [ai, typescript, tooling]   # see tag decision below
draft: true
series:
  name: Building Robin
  order: <1–5>
faq:                               # optional; 2–3 entries is plenty
  - q: <≤ 200 chars>
    a: <≤ 1000 chars>
---
```

- **Tag decision (must resolve before drafting):** the `tags.json` allowlist
  has no `robin`/`agents`/`llm`/`memory` tag, and an unlisted tag fails the
  build. Either (a) reuse `ai` + `typescript` + `tooling`, or (b) add one new
  tag (suggest `agents`) to `src/content/tags.json` — alphabetical — first.
  Default to (a) unless Kevin says otherwise.
- `cover` (image + alt) is optional and powers OG + LCP. Skip unless Kevin
  supplies art; do not invent image paths.
- Keep all five posts on the same `series.name` string exactly, or they won't
  group.

### Verify-against-code mandate

Before drafting, read the implementation files listed in the post block and
ground **every** factual claim — cadences, tool counts, embedding dims, job
names, file paths — in the actual code at
`/Users/iser/workspace/robin/robin-assistant-v3/`. If the code and this brief
disagree, the code wins; note the discrepancy for Kevin rather than smoothing
over it. Do not invent tool names, schedules, or numbers.

---

## Post 1 — "Robin, briefly"

- **`series.order`:** 1
- **Slug direction:** `building-robin-overview` or similar.
- **Spine (non-obvious decision):** Robin has *no UI*. It's an invisible Node
  daemon plus MCP servers, and Claude Code is the interface. "I didn't build a
  chatbot; I built a memory the agent plugs into."
- **Covers:** the single daemon; SQLite + sqlite-vec + FTS5 tiered store in one
  sentence each; the two MCP servers — `robin-core` (13 tools) and
  `robin-extension` (13 tools, per-project opt-in); the cognition cadence
  (biographer 15 min, embed-backfill 1 min, dream daily 03:00).
- **Arc seed:** one paragraph stating the D→A→B→C thesis the series will spend
  four posts earning. This is the only post that previews the whole arc.
- **Aside:** none beyond the arc seed — post 1 sets up the lessons, it doesn't
  cash one.
- **Verify against:** `README.md` (Architecture section),
  `system/surfaces/mcp/core/server.ts`,
  `system/surfaces/mcp/extension/server.ts`,
  `system/kernel/runtime/daemon.ts`.

## Post 2 — "Tiered memory" · aside D (unit of work)

- **`series.order`:** 2
- **Spine:** three representations, not one — an append-only events firehose,
  content rows with 4096-dim Matryoshka embeddings (sqlite-vec), and an
  entities/relations graph (with an optional Kuzu projection). Argue why one
  store can't do the job alone.
- **Covers:** the recall fan-out — a query hits FTS5 + vector search + the graph
  and gets reranked; what each tier answers that the others can't.
- **Aside (D):** designing the tier boundaries was a *review* decision, not a
  typing job. The attention went into the shape of the tiers; the SQL was the
  cheap part. That inversion — where schema judgment costs more than
  implementation — is the unit-of-work shift.
- **Verify against:** `system/brain/memory/` (schema + recall),
  `system/brain/memory/embed-content.ts`,
  `system/brain/llm/types.ts` (embed role), `README.md` (tiered-memory bullets).

## Post 3 — "The biographer loop" · aside A (scope expansion)

- **`series.order`:** 3
- **Spine:** entity extraction runs as a *scheduled batch job* every 15 minutes,
  deliberately off the capture hot-path — and zod validation structurally
  prevents the v2 JSON-parse failure class (the parser can't accept malformed
  extraction output, so a whole category of bug is gone by construction).
- **Covers:** capture → `biographer.run` → entities + relations;
  `embed-backfill.run` as the every-minute, single-flight companion against
  Ollama; why deferring both off ingest matters for latency.
- **Aside (A):** entity-extraction-from-unstructured-logs is a *real project* —
  the kind you'd refuse to start solo on evenings. It shipped because the agent
  could hold the whole extract-and-validate loop in context at once.
- **Verify against:** `system/brain/cognition/biographer.ts`,
  `system/brain/cognition/jobs.ts`, `system/brain/memory/embed-content.ts`,
  `system/kernel/invariants/builtins/jobs-discoverable.ts`.

## Post 4 — "The dream loop" · aside B (quality budget)

- **`series.order`:** 4
- **Spine:** an AI assistant with an offline consolidation phase. A daily 03:00
  job resolves overdue predictions, writes daily metrics, and generates a
  journal entry. Predictions + corrections + journals form a feedback loop on
  the assistant's *own* accuracy.
- **Covers:** the `predict` → `record_correction` → `dream.run` (resolves) →
  `journal` cycle; the invariants framework (runs every 60s) and typed
  telemetry as the correctness scaffolding around it.
- **Aside (B):** the dream loop, the invariants, and the typed telemetry exist
  *because* typing was no longer the bottleneck. Freed budget went into
  correctness machinery a normal side project skips — the real unlock was
  quality, not speed.
- **Verify against:** `system/brain/cognition/` (dream job),
  `system/kernel/invariants/builtins/` (invariant set),
  `system/kernel/runtime/health-monitor.ts`, telemetry writer.

## Post 5 — "The extensions runtime" · aside C (the ouroboros)

- **`series.order`:** 5
- **Spine:** one loader, two extension shapes. Integrations read external data
  *in* on a read-tick (gmail, google_calendar, github, linear, chrome,
  finance_quote, weather); jobs do cognitive work on a cron (the shipped
  `daily-brief` example). Both hot-reload from `user-data/extensions/`.
- **Covers:** the read-tick lifecycle; the job contract (`job.yaml` with
  `schedule`/`tz` + `index.ts` exporting `run(ctx)`); how the
  `robin-extension` MCP action-dispatchers expose each integration to Claude.
- **Aside (C):** the ouroboros. Robin is a memory layer *for* Claude Code, so
  Kevin used Robin to build Robin — `recall` helped debug `recall`; captured
  sessions recorded the work that produced the capture pipeline. Dogfooding
  bent the design in ways a spec couldn't have.
- **Verify against:** `system/integrations/builtin/*/index.ts`,
  `system/kernel/scheduler/cron.ts`, `system/kernel/scheduler/runner.ts`,
  `system/integrations/_runtime/scheduler-glue.ts`,
  `user-data/extensions/AUTHORING.md` (job/integration contract).

---

## Open items for Kevin

- **Tag decision:** reuse `ai`/`typescript`/`tooling` (default) vs. add
  `agents` to `tags.json`.
- **Cover art:** none assumed. Add per-post `cover` if you want OG images.
- **Publish cadence:** dates are per-post; decide whether to ship all five at
  once or stagger (the `series` field groups them regardless of `pubDate`).
