export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
/** Soft cap on a project's `name` field so the project card heading wraps
 *  at most twice on the narrowest mobile breakpoint. 60 is comfortably
 *  wider than any real project name; the YAML schema imposes no cap. */
export const PROJECT_NAME_MAX = 60;
/** Cap on a project's `blurb`. Surfaces in the card body AND in JSON-LD
 *  `SoftwareSourceCode.description`. Google's structured-data guidance
 *  prefers short, concrete descriptions; 200 leaves room for one sentence
 *  on the visual card without truncation. */
export const PROJECT_BLURB_MAX = 200;
/** Cap on a single `tech` chip on a project card. Anything longer wraps
 *  ugly on phones and exceeds the typical 24-char tech tag (e.g.
 *  "react-server-components"). The schema bounds it so a typo can't
 *  ship a 200-char chip that breaks the row layout. */
export const PROJECT_TECH_TAG_MAX = 32;
/** Cap on a post's `series.name`. Renders inline above the title on series
 *  posts; long names wrap onto two lines and dominate the header. */
export const SERIES_NAME_MAX = 60;
/** Cap on a single FAQ question. JSON-LD `Question.name` and on-page summary;
 *  Google's structured-data guidance prefers concise questions. */
export const FAQ_Q_MAX = 200;
/** Cap on a single FAQ answer. Surfaces inline AND in JSON-LD
 *  `Answer.text`. Generous enough for a paragraph; bounded so a
 *  malformed answer can't bloat the prerendered HTML. */
export const FAQ_A_MAX = 1000;
/** Cap on a single tag string. Tags are also allowlisted via tags.json,
 *  so this is defensive — a malformed tags.json entry would otherwise
 *  ship into `<meta property="article:tag">` and the OG card. */
export const TAG_MAX = 40;
/** Per-post tag count cap. Posts tagged with 15+ topics dilute every
 *  signal (RSS categories, article:tag head meta, the OG card line,
 *  related-posts overlap scoring). Six well-chosen tags is plenty for a
 *  personal blog; the cap is set high enough to never bite a real post
 *  but low enough that an accidental copy-paste of the full allowlist
 *  fails the build. */
export const TAGS_PER_POST_MAX = 10;
/** Per-post FAQ entry count cap. JSON-LD `FAQPage` emits one
 *  `Question`/`Answer` pair per entry; a runaway list (e.g. an LLM
 *  scaffold pasted in raw) bloats the prerendered HTML AND the
 *  structured-data payload Google reads. */
export const FAQ_ENTRIES_PER_POST_MAX = 25;
/** Per-project `tech` chip count cap. Each chip is wrapped in `[…]` on
 *  the project card and emitted as a `programmingLanguage` array entry
 *  in JSON-LD. More than a dozen chips per card breaks the card layout
 *  on phones AND signals nothing useful — it's a tech README, not the
 *  project's elevator pitch. */
export const PROJECT_TECH_ENTRIES_MAX = 12;

export function validateTitleLength(s: string): boolean {
  return s.length > 0 && s.length <= TITLE_MAX;
}

export function validateDescriptionLength(s: string): boolean {
  return s.length > 0 && s.length <= DESCRIPTION_MAX;
}
