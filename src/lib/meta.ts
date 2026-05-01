export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

export function validateTitleLength(s: string): boolean {
  return s.length > 0 && s.length <= TITLE_MAX;
}

export function validateDescriptionLength(s: string): boolean {
  return s.length > 0 && s.length <= DESCRIPTION_MAX;
}
