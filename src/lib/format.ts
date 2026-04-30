/**
 * Site-wide date formatting helpers. Keep these tiny and synchronous —
 * they're called from .astro components at build time.
 */

/** ISO date in YYYY-MM-DD form (UTC). Used in post meta + archive lists. */
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** MM-DD slice. Used in the per-year archive list. */
export function formatMonthDay(d: Date): string {
  return d.toISOString().slice(5, 10);
}
