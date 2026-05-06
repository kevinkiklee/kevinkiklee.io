import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { routes } from '../../src/lib/audit-routes.ts';

const baseline: { skip: string[] } = (() => {
  try {
    return JSON.parse(readFileSync('keyboard-baseline.json', 'utf8'));
  } catch {
    return { skip: [] };
  }
})();
const skip = new Set(baseline.skip);

for (const route of routes.filter((r) => r.primary && r.exists !== false)) {
  test(`keyboard traversal — ${route.id}`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    let prevFocus: string | null = null;
    let traps = 0;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const sel = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        return `${tag}${id}`;
      });
      if (sel === prevFocus) {
        if (++traps > 2) {
          const key = `${route.id}:trap:${sel}`;
          if (!skip.has(key)) throw new Error(`focus trap at ${sel}`);
          break;
        }
      } else {
        traps = 0;
        prevFocus = sel;
      }
    }
  });

  test(`focus visible — ${route.id}`, async ({ page }) => {
    const key = `${route.id}:focus-visible`;
    test.skip(skip.has(key), 'baselined');
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    // Capture state with focus on first focusable
    await page.keyboard.press('Tab');
    const before = await page.screenshot();
    // Move focus elsewhere then back
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const after = await page.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0); // some visual diff present
  });
}
