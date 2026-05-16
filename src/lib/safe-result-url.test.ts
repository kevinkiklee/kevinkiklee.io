import { describe, expect, it } from 'vitest';
import { safeResultUrl } from './safe-result-url';

const ORIGIN = 'https://kevinkiklee.io';

describe('safeResultUrl', () => {
  it('accepts relative same-origin paths', () => {
    expect(safeResultUrl('/posts/hello', ORIGIN)).toBe('/posts/hello');
    expect(safeResultUrl('/about', ORIGIN)).toBe('/about');
    expect(safeResultUrl('/posts/hello?utm=x', ORIGIN)).toBe('/posts/hello?utm=x');
    expect(safeResultUrl('/posts/hello#section', ORIGIN)).toBe('/posts/hello#section');
  });

  it('accepts absolute same-origin URLs and strips the origin', () => {
    expect(safeResultUrl(`${ORIGIN}/posts/foo`, ORIGIN)).toBe('/posts/foo');
  });

  it('rejects cross-origin URLs', () => {
    expect(safeResultUrl('https://evil.example/posts/foo', ORIGIN)).toBeNull();
    expect(safeResultUrl('http://kevinkiklee.io/posts/foo', ORIGIN)).toBeNull(); // wrong scheme = different origin
  });

  it('rejects dangerous protocols', () => {
    expect(safeResultUrl('javascript:alert(1)', ORIGIN)).toBeNull();
    expect(safeResultUrl('data:text/html,<script>alert(1)</script>', ORIGIN)).toBeNull();
    expect(safeResultUrl('vbscript:msgbox', ORIGIN)).toBeNull();
    expect(safeResultUrl('file:///etc/passwd', ORIGIN)).toBeNull();
  });

  it('handles edge inputs', () => {
    // Empty resolves to the origin root — acceptable, not a security hole.
    expect(safeResultUrl('', ORIGIN)).toBe('/');
    // Strings that fail URL parsing return null instead of throwing.
    expect(safeResultUrl('http://[malformed', ORIGIN)).toBeNull();
  });

  it('rejects protocol-relative URLs that escape origin', () => {
    expect(safeResultUrl('//evil.example/foo', ORIGIN)).toBeNull();
  });
});
