import { readFile, writeFile } from 'node:fs/promises';
import { toMarkdown } from './format-findings.ts';
import { runAxe } from './run-axe.ts';
import { runLhci } from './run-lhci.ts';

const baseUrl = process.env.A11Y_BASE_URL ?? 'http://localhost:4321';
const primaryOnly = process.argv.includes('--primary-only');

// Fail fast on a misconfigured env var so we surface a usable error instead of
// letting Playwright spin its wheels on `javascript:` or a missing host.
try {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`unsupported protocol "${parsed.protocol}" — only http(s) allowed`);
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`a11y audit: invalid A11Y_BASE_URL "${baseUrl}": ${msg}`);
  process.exit(1);
}

const axe = await runAxe({ baseUrl, primaryOnly });
runLhci({ baseUrl, primaryOnly });

await writeFile('a11y-findings.md', toMarkdown(axe));
await writeFile('a11y-findings.json', JSON.stringify(axe, null, 2));

let baseline: { skip: string[] } = { skip: [] };
try {
  baseline = JSON.parse(await readFile('axe-baseline.json', 'utf8'));
} catch {
  // No baseline yet — that's expected on first run.
}
const skip = new Set(baseline.skip);

const newFindings = axe
  .flatMap((e) =>
    e.violations.flatMap((v) =>
      v.nodes.map((_n, ni) => ({
        key: `${e.route}:${e.theme}:${v.id}:${ni}`,
        impact: v.impact,
      })),
    ),
  )
  .filter((x) => !skip.has(x.key));

const blockerOrMajor = newFindings.filter(
  (x) => x.impact === 'critical' || x.impact === 'serious',
).length;

if (blockerOrMajor > 0) {
  console.error(`${blockerOrMajor} new Blocker/Major findings (not in baseline)`);
  process.exit(1);
}
