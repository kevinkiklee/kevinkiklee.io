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

export function validateTitleLength(s: string): boolean {
  return s.length > 0 && s.length <= TITLE_MAX;
}

export function validateDescriptionLength(s: string): boolean {
  return s.length > 0 && s.length <= DESCRIPTION_MAX;
}
