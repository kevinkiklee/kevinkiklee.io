export interface KnownLimit {
  id: string;
  title: string;
  severity: string;
  description: string;
  wcag: string;
}

export function parseKnownLimits(md: string): KnownLimit[] {
  const sections = md.split(/^### /m).slice(1);
  const out: KnownLimit[] = [];
  for (const sec of sections) {
    const lines = sec.split('\n');
    const head = lines[0] ?? '';
    const idMatch = head.match(/^(F-\S+)\s+—\s+(.+)$/);
    if (!idMatch) continue;

    const get = (k: string): string => {
      const re = new RegExp(`^- \\*\\*${k}:\\*\\*\\s+(.+)$`, 'm');
      return sec.match(re)?.[1]?.trim() ?? '';
    };

    if (get('Status') !== 'wontfix-rationale') continue;
    out.push({
      id: idMatch[1] ?? '',
      title: idMatch[2] ?? '',
      severity: get('Severity'),
      description: get('Description'),
      wcag: get('WCAG'),
    });
  }
  return out;
}
