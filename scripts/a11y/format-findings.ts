import type { AxeRunEntry, AxeViolation } from './run-axe.ts';

const SEVERITY_BY_IMPACT: Record<string, 'Blocker' | 'Major' | 'Minor' | 'Polish'> = {
  critical: 'Blocker',
  serious: 'Major',
  moderate: 'Minor',
  minor: 'Polish',
};

export function severityFor(
  v: AxeViolation,
  primary: boolean,
): 'Blocker' | 'Major' | 'Minor' | 'Polish' {
  const base = SEVERITY_BY_IMPACT[v.impact ?? 'minor'] ?? 'Polish';
  if (base === 'Blocker' && !primary) return 'Major';
  return base;
}

export function toMarkdown(entries: AxeRunEntry[]): string {
  const rows = entries.flatMap((e) =>
    e.violations.map((v, i) => ({
      id: `F-${e.route}-${e.theme}-${v.id}-${i}`,
      severity: severityFor(v, /* primary */ true),
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
