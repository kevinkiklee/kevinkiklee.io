export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
/** Soft cap on a project's `name` field so the project card heading wraps
 *  at most twice on the narrowest mobile breakpoint. 60 is comfortably
 *  wider than any real project name; the YAML schema imposes no cap. */
export const PROJECT_NAME_MAX = 60;

export function validateTitleLength(s: string): boolean {
  return s.length > 0 && s.length <= TITLE_MAX;
}

export function validateDescriptionLength(s: string): boolean {
  return s.length > 0 && s.length <= DESCRIPTION_MAX;
}
