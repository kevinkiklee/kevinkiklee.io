import { execFileSync } from 'node:child_process';
import { routes } from '../../src/lib/audit-routes.ts';

export function runLhci(opts: {
  baseUrl: string;
  primaryOnly: boolean;
}): void {
  const list = opts.primaryOnly ? routes.filter((r) => r.primary) : routes;
  for (const route of list) {
    execFileSync(
      'pnpm',
      [
        'exec',
        'lhci',
        'collect',
        `--url=${opts.baseUrl}${route.path}`,
        '--numberOfRuns=1',
        '--settings.onlyCategories=accessibility',
      ],
      { stdio: 'inherit' },
    );
  }
}
