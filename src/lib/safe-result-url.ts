/**
 * Validate a same-origin URL string before injecting it into an `<a href>`.
 *
 * Used by SearchPalette to defend against a poisoned Pagefind index that
 * could otherwise smuggle a `javascript:`/`data:`/cross-origin URL into a
 * dynamically-rendered result link. HTML-escaping alone doesn't help: the
 * special characters in `javascript:alert(1)` survive entity-escaping
 * unchanged.
 *
 * Returns the path+search+hash on success (so the rendered link stays
 * relative and doesn't leak our hostname), or `null` on any failure —
 * malformed URL, non-http(s) protocol, cross-origin.
 *
 * Exported so it can be unit-tested against hostile inputs. The browser
 * version in SearchPalette uses `window.location.origin`; this lib version
 * takes an explicit `origin` so the same logic is verifiable in node tests.
 */
export function safeResultUrl(raw: string, origin: string): string | null {
  try {
    const u = new URL(raw, origin);
    if (u.origin !== new URL(origin).origin) return null;
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}
