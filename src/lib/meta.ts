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

export function validateTitleLength(s: string): boolean {
  return s.length > 0 && s.length <= TITLE_MAX;
}

export function validateDescriptionLength(s: string): boolean {
  return s.length > 0 && s.length <= DESCRIPTION_MAX;
}
