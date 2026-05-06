import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import routes from './routes.json' with { type: 'json' };
import { writeFile } from 'node:fs/promises';

const BASE = 'http://localhost:4321';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const findings: Array<unknown> = [];

for (const route of routes.primary) {
  for (const theme of routes.themes) {
    const page = await ctx.newPage();
    await page.addInitScript((t: string) => localStorage.setItem('theme', t), theme);
    await page.goto(BASE + route.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
      .analyze();
    findings.push({ route: route.id, theme, violations: results.violations });
    await page.close();
  }
}
await browser.close();
await writeFile('audit-axe-raw.json', JSON.stringify(findings, null, 2));
console.log(`Wrote ${findings.length} entries to audit-axe-raw.json`);
