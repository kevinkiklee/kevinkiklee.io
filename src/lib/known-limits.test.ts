import { describe, expect, it } from 'vitest';
import { parseKnownLimits } from './known-limits.ts';

const sample = `
### F-001 — short title
- **Severity:** Major
- **Status:** wontfix-rationale
- **Description:** Pagefind ships its own UI styles
- **WCAG:** 1.4.3

### F-002 — fixed thing
- **Severity:** Major
- **Status:** fixed
- **Description:** something
`;

describe('parseKnownLimits', () => {
  it('returns only wontfix-rationale entries', () => {
    const out = parseKnownLimits(sample);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('F-001');
    expect(out[0]?.description).toBe('Pagefind ships its own UI styles');
  });

  it('returns empty list when there are no wontfix-rationale entries', () => {
    const onlyFixed = '### F-001 — t\n- **Status:** fixed\n- **Description:** d\n';
    expect(parseKnownLimits(onlyFixed)).toEqual([]);
  });
});
