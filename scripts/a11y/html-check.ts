import { parseHTML } from 'linkedom';

export type Rule =
  | 'single-h1'
  | 'single-main'
  | 'nav-name'
  | 'no-positive-tabindex'
  | 'button-name'
  | 'link-name';

export interface CheckResult {
  rule: Rule;
  selector: string;
}

export function check(html: string): CheckResult[] {
  const { document } = parseHTML(html);
  const out: CheckResult[] = [];

  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) out.push({ rule: 'single-h1', selector: `count=${h1s.length}` });

  const mains = document.querySelectorAll('main');
  if (mains.length !== 1) out.push({ rule: 'single-main', selector: `count=${mains.length}` });

  let navIdx = 0;
  for (const n of document.querySelectorAll('nav')) {
    navIdx++;
    const name = n.getAttribute('aria-label') ?? n.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'nav-name', selector: `nav:nth-of-type(${navIdx})` });
  }

  for (const el of document.querySelectorAll('[tabindex]')) {
    const t = Number.parseInt(el.getAttribute('tabindex') ?? '0', 10);
    if (t > 0) out.push({ rule: 'no-positive-tabindex', selector: el.tagName.toLowerCase() });
  }

  let btnIdx = 0;
  for (const b of document.querySelectorAll('button')) {
    btnIdx++;
    const text = (b.textContent ?? '').trim();
    const name = text || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'button-name', selector: `button:nth-of-type(${btnIdx})` });
  }

  let aIdx = 0;
  for (const a of document.querySelectorAll('a')) {
    aIdx++;
    const text = (a.textContent ?? '').trim();
    const name = text || a.getAttribute('aria-label') || a.getAttribute('aria-labelledby');
    if (!name) out.push({ rule: 'link-name', selector: `a:nth-of-type(${aIdx})` });
  }

  return out;
}
