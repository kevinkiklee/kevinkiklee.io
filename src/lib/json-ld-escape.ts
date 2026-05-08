/**
 * Serialise a value to a JSON string that's safe to embed inside a
 * `<script type="application/ld+json">` element.
 *
 * `JSON.stringify` does NOT escape `<` — a hostile string containing
 * `</script>` would otherwise close the script element early, and a
 * stray `<!--` could open an HTML comment context. We unicode-escape
 * `<` and `>` so the payload stays a valid JSON string AND a safe HTML
 * script body. Output is still parseable by every JSON-LD consumer
 * (Google, Bing, Yandex, etc.) because `<` is a standard JSON
 * escape sequence for `<`.
 *
 * The `application/ld+json` script isn't executed as JS, so we don't
 * need to worry about U+2028/U+2029 (which only matter for executed
 * JS in legacy parsers).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
