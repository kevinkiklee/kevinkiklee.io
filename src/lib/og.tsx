import { html } from 'satori-html';

/**
 * HTML-escape a string for safe interpolation into the OG template literal.
 * Without this, a post titled `<script>` (or one with stray `&` characters)
 * could produce malformed satori-html input or, worst case, exfiltrate
 * data via crafted markup. Cheap belt-and-braces.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function ogTemplate(args: { title: string; date: string; tags: string[] }) {
  const safeTitle = escapeHtml(args.title.toUpperCase());
  const safeDate = escapeHtml(args.date);
  const tagLine = args.tags.map((t) => `#${escapeHtml(t)}`).join(' ');
  return html(`
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#f5f4ee;color:#0a0a0a;font-family:'JetBrains Mono';padding:64px;">
      <div style="display:flex;font-size:18px;border-bottom:3px solid #0a0a0a;padding-bottom:16px;letter-spacing:0.08em;">[ KEVINKIKLEE.IO ]</div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <div style="display:flex;font-size:14px;letter-spacing:0.08em;color:#4a4a4a;margin-bottom:16px;">${safeDate} · ${tagLine}</div>
        <div style="display:flex;font-size:64px;font-weight:700;line-height:1.15;text-transform:uppercase;letter-spacing:0.01em;">${safeTitle}</div>
      </div>
      <div style="display:flex;font-size:18px;letter-spacing:0.08em;border-top:3px solid #0a0a0a;padding-top:16px;">// FIELD NOTES — DEVREL @ GOOGLE CHROME</div>
    </div>
  `);
}
