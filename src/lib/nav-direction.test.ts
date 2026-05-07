import { describe, expect, it } from 'vitest';
import { decideDirection } from './nav-direction.ts';

const u = (path: string) => new URL(`https://example.com${path}`);

describe('decideDirection', () => {
  it('back-traverse to a non-post → back', () => {
    expect(decideDirection('traverse', u('/posts/x'), u('/posts'), 1)).toBe('back');
  });

  it('back-traverse into a post → back-into-post', () => {
    expect(decideDirection('traverse', u('/posts'), u('/posts/x'), 0)).toBe('back-into-post');
  });

  it('forward push to a post detail → forward-into-post', () => {
    expect(decideDirection('push', u('/posts'), u('/posts/x'), 0)).toBe('forward-into-post');
  });

  it('treats /posts itself as not a post detail', () => {
    expect(decideDirection('push', u('/'), u('/posts'), 0)).toBe('forward');
  });

  it('treats /posts/page/2 as not a post detail (paginated archive)', () => {
    expect(decideDirection('push', u('/posts'), u('/posts/page/2'), 0)).toBe('lateral');
  });

  it('same top-level segment (/tags ↔ /tags/ai) is lateral', () => {
    expect(decideDirection('push', u('/tags'), u('/tags/ai'), 0)).toBe('lateral');
  });

  it('cross-section navigation defaults to forward', () => {
    expect(decideDirection('push', u('/about'), u('/projects'), 0)).toBe('forward');
  });

  it('navigating from root → root segment is forward, not lateral', () => {
    // seg('/') === '' which the lateral rule explicitly excludes.
    expect(decideDirection('push', u('/'), u('/'), 0)).toBe('forward');
  });

  it('replace navtype is treated like a forward (no traverse semantics)', () => {
    expect(decideDirection('replace', u('/about'), u('/'), 0)).toBe('forward');
  });

  it('handles undefined fromUrl (cold load)', () => {
    expect(decideDirection('push', undefined, u('/posts/x'), 0)).toBe('forward-into-post');
    expect(decideDirection('push', undefined, u('/about'), 0)).toBe('forward');
  });
});
