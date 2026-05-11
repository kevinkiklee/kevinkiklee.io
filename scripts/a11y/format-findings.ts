import type { AxeRunEntry, AxeViolation } from './run-axe.ts';

const SEVERITY_BY_IMPACT: Record<string, 'Blocker' | 'Major' | 'Minor' | 'Polish'> = {
  critical: 'Blocker',
  serious: 'Major',
  moderate: 'Minor',
  minor: 'Polish',
};

/**
 * Map an axe violation's impact onto the project's severity ladder.
 * The previous signature took a `primary` flag to downgrade Blocker → Major
 * on non-primary routes, but `toMarkdown` only ever passed `true`, so the
 * downgrade path never fired. Caller couldn't supply per-route primary
 * info anyway (AxeRunEntry doesn't carry it). Drop the dead branch.
 */
export function severityFor(v: AxeViolation): 'Blocker' | 'Major' | 'Minor' | 'Polish' {
  return SEVERITY_BY_IMPACT[v.impact ?? 'minor'] ?? 'Polish';
}

export function toMarkdown(entries: AxeRunEntry[]): string {
  const rows = entries.flatMap((e) =>
    e.violations.map((v, i) => ({
      id: `F-${e.route}-${e.theme}-${v.id}-${i}`,
      severity: severityFor(v),
      wcag: v.helpUrl,
      location: `${e.route}/${e.theme}: ${v.nodes[0]?.target.join(' ')}`,
      description: v.help,
    })),
  );
  return rows
    .map(
      (r) =>
        `### ${r.id}\n- **Severity:** ${r.severity}\n- **WCAG:** ${r.wcag}\n- **Location:** ${r.location}\n- **Description:** ${r.description}\n- **Status:** open\n`,
    )
    .join('\n');
}
