import { glob, readFile } from 'node:fs/promises';
import { check } from './html-check.ts';

let baseline: { skip: string[] } = { skip: [] };
try {
  baseline = JSON.parse(await readFile('html-checks-baseline.json', 'utf8'));
} catch {}
const skip = new Set(baseline.skip);

let failures = 0;
for await (const file of glob('dist/client/**/*.html')) {
  const html = await readFile(file, 'utf8');
  const issues = check(html);
  for (const issue of issues) {
    const key = `${file}:${issue.rule}:${issue.selector}`;
    if (skip.has(key)) continue;
    console.error(`${file}: ${issue.rule} (${issue.selector})`);
    failures++;
  }
}
if (failures > 0) {
  console.error(`${failures} new HTML structural failures (not in baseline)`);
  process.exit(1);
}
