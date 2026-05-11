import { html } from 'satori-html';
import { escapeHtml } from './escape-html';
import { SITE } from './site-config';

export { escapeHtml };

export function ogTemplate(args: { title: string; date: string; tags: string[] }) {
  // Title renders mixed-case as authored — matches the in-page <h1> and
  // BlogPosting.headline. The wordmark stays uppercase as visual signage.
  const safeTitle = escapeHtml(args.title);
  const safeDate = escapeHtml(args.date);
  const tagLine = args.tags.map((t) => `#${escapeHtml(t)}`).join(' ');
  // Footer string is derived from site-config so the OG card can't drift
  // from JSON-LD Person.jobTitle / worksFor or the about-page byline.
  const footerCopy = escapeHtml(
    `field notes — ${SITE.jobTitle.toLowerCase()} @ ${SITE.org.toLowerCase()}`,
  );
  const wordmark = escapeHtml(SITE.title.toUpperCase());
  return html(`
    <div style="display:flex;width:1200px;height:630px;background:#f5f4ee;color:#0a0a0a;font-family:'JetBrains Mono';">
      <div style="display:flex;width:14px;height:630px;background:#b83c10;"></div>
      <div style="display:flex;flex-direction:column;flex:1;padding:64px;">
        <div style="display:flex;font-size:18px;border-bottom:3px solid #0a0a0a;padding-bottom:16px;letter-spacing:0.08em;">${wordmark}</div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;font-size:14px;letter-spacing:0.04em;color:#4a4a4a;margin-bottom:16px;">${safeDate} · ${tagLine}</div>
          <div style="display:flex;font-size:64px;font-weight:700;line-height:1.1;letter-spacing:-0.01em;">${safeTitle}</div>
        </div>
        <div style="display:flex;font-size:18px;letter-spacing:0.04em;border-top:3px solid #0a0a0a;padding-top:16px;color:#4a4a4a;">${footerCopy}</div>
      </div>
    </div>
  `);
}
