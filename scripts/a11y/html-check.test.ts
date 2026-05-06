import { describe, expect, it } from 'vitest';
import { check } from './html-check.ts';

describe('html-check', () => {
  it('flags multiple <h1>', () => {
    const html = '<html><body><main><h1>a</h1><h1>b</h1></main></body></html>';
    const r = check(html);
    expect(r.find((x) => x.rule === 'single-h1')).toBeDefined();
  });
  it('flags missing <main>', () => {
    const html = '<html><body><h1>a</h1></body></html>';
    expect(check(html).find((x) => x.rule === 'single-main')).toBeDefined();
  });
  it('flags tabindex=1', () => {
    const html = '<html><body><main><a tabindex="1">x</a></main></body></html>';
    expect(check(html).find((x) => x.rule === 'no-positive-tabindex')).toBeDefined();
  });
  it('flags <button> with no accessible name', () => {
    const html = '<html><body><main><button></button></main></body></html>';
    expect(check(html).find((x) => x.rule === 'button-name')).toBeDefined();
  });
  it('passes a complete page', () => {
    const html =
      '<html><body><main><h1>Hi</h1><nav aria-label="Primary"><a href="/">home</a></nav></main></body></html>';
    expect(check(html)).toEqual([]);
  });
});
