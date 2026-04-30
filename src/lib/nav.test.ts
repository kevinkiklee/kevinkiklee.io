import { describe, expect, it } from 'vitest';
import { decideDirection } from './nav-direction';

const url = (path: string): URL => new URL(path, 'https://kevinkiklee.io');

describe('decideDirection', () => {
  it('returns "back" for browser back/forward (traverse)', () => {
    expect(decideDirection('traverse', url('/posts/foo'), url('/posts'), 2)).toBe('back');
  });

  it('returns "forward-into-post" when navigating into a post detail', () => {
    expect(decideDirection('push', url('/posts'), url('/posts/hello-world'), 1)).toBe(
      'forward-into-post',
    );
  });

  it('returns "forward" for a regular cross-section navigation', () => {
    expect(decideDirection('push', url('/'), url('/about'), 0)).toBe('forward');
  });

  it('returns "lateral" for same-section paginated navigation', () => {
    expect(decideDirection('push', url('/posts'), url('/posts/page/2'), 1)).toBe('lateral');
  });

  it('treats /posts (index) as not a post detail', () => {
    expect(decideDirection('push', url('/'), url('/posts'), 0)).toBe('forward');
  });

  it('handles undefined navigationType safely', () => {
    expect(decideDirection(undefined, url('/'), url('/about'), 0)).toBe('forward');
  });
});
