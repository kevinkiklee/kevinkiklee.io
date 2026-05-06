import { AxeBuilder } from '@axe-core/playwright';
import { type Browser, chromium } from 'playwright';
import { type AuditRoute, routes, themes } from '../../src/lib/audit-routes.ts';

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; target: string[] }>;
}

export interface AxeRunEntry {
  route: string;
  theme: string;
  violations: AxeViolation[];
}

export async function runAxe(opts: {
  baseUrl: string;
  primaryOnly: boolean;
}): Promise<AxeRunEntry[]> {
  const browser: Browser = await chromium.launch();
  const ctx = await browser.newContext();
  const list: AuditRoute[] = opts.primaryOnly ? routes.filter((r) => r.primary) : routes;
  const out: AxeRunEntry[] = [];

  for (const route of list) {
    if (route.exists === false) continue;
    for (const theme of themes) {
      const page = await ctx.newPage();
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(opts.baseUrl + route.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
        .analyze();
      out.push({
        route: route.id,
        theme,
        violations: results.violations as AxeViolation[],
      });
      await page.close();
    }
  }
  await browser.close();
  return out;
}
