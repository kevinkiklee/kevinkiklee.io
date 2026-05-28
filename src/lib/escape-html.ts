/**
 * HTML-escape a string for safe interpolation into HTML or HTML-like
 * template literals (satori-html, search-result innerHTML, etc.).
 *
 * Without this, a hostile string containing `<script>` could close the
 * surrounding context early or, worst case, execute injected markup.
 *
 * The five characters covered (`& < > " '`) are the OWASP-recommended
 * minimum for HTML body / attribute contexts. For JSON-LD specifically,
 * see `safeJsonLd` in `json-ld-escape.ts` — that function escapes only
 * `<` and `>` because the surrounding context is `application/ld+json`,
 * not HTML body, and `&` is a valid JSON literal.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strip all HTML tags from a string EXCEPT `<mark>` and `</mark>`.
 *
 * Pagefind returns excerpts pre-wrapped with `<mark>` highlighting. We
 * trust the `<mark>` wrapper but nothing else — if the Pagefind index
 * ever contains stale or injected markup (e.g. `<img onerror=…>`), this
 * allowlist approach neutralises it while keeping highlight previews.
 */
export function stripHtmlExceptMark(s: string): string {
  return s.replace(/<(?!\/?mark\b)[^>]*>/gi, '');
}
