import { html } from 'satori-html';

export function ogTemplate(args: { title: string; date: string; tags: string[] }) {
  const tagLine = args.tags.map((t) => `#${t}`).join(' ');
  return html(`
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#f5f4ee;color:#0a0a0a;font-family:'JetBrains Mono';padding:64px;">
      <div style="display:flex;font-size:18px;border-bottom:3px solid #0a0a0a;padding-bottom:16px;letter-spacing:0.08em;">[ KEVINKIKLEE.IO ]</div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <div style="display:flex;font-size:14px;letter-spacing:0.08em;color:#4a4a4a;margin-bottom:16px;">${args.date} · ${tagLine}</div>
        <div style="display:flex;font-size:64px;font-weight:700;line-height:1.15;text-transform:uppercase;letter-spacing:0.01em;">${args.title.toUpperCase()}</div>
      </div>
      <div style="display:flex;font-size:18px;letter-spacing:0.08em;border-top:3px solid #0a0a0a;padding-top:16px;">// FIELD NOTES — DEVREL @ GOOGLE CHROME</div>
    </div>
  `);
}
