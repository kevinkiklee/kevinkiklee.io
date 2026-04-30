/**
 * Pure direction-decision logic for view transitions, kept in its own
 * module so tests can import it without pulling in the DOM-side-effecting
 * `nav.ts` (which calls `document.addEventListener` at module load).
 */
export type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post';
export type NavType = 'traverse' | 'push' | 'replace' | 'reload' | undefined;

export function decideDirection(
  navType: NavType,
  fromUrl: URL | undefined,
  toUrl: URL | undefined,
  _fromDepth: number,
): Dir {
  if (navType === 'traverse') return 'back';
  const toPath = toUrl?.pathname;
  const fromPath = fromUrl?.pathname;

  // A "post detail" is /posts/<slug> where <slug> is NOT the paginator
  // (`/posts/page/N`). Paginator pages stay treated as the listing.
  const toIsPost =
    !!toPath &&
    toPath.startsWith('/posts/') &&
    toPath !== '/posts' &&
    !toPath.startsWith('/posts/page/');
  if (toIsPost) return 'forward-into-post';

  // Otherwise, navigation that stays inside the same top-level section
  // (e.g. /posts ↔ /posts/page/2, /posts/tag/ai ↔ /posts) is lateral.
  const seg = (p: string) => p.split('/')[1] ?? '';
  if (toPath && fromPath && seg(toPath) === seg(fromPath) && seg(toPath) !== '') {
    return 'lateral';
  }
  return 'forward';
}
