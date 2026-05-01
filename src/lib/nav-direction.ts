/**
 * Pure direction-decision logic for view transitions, kept in its own
 * module so tests can import it without pulling in the DOM-side-effecting
 * `nav.ts` (which calls `document.addEventListener` at module load).
 */
export type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post' | 'back-into-post';
export type NavType = 'traverse' | 'push' | 'replace' | 'reload' | undefined;

function isPostDetail(path: string | undefined): boolean {
  return (
    !!path && path.startsWith('/posts/') && path !== '/posts' && !path.startsWith('/posts/page/')
  );
}

export function decideDirection(
  navType: NavType,
  fromUrl: URL | undefined,
  toUrl: URL | undefined,
  _fromDepth: number,
): Dir {
  const toIsPost = isPostDetail(toUrl?.pathname);

  if (navType === 'traverse') {
    return toIsPost ? 'back-into-post' : 'back';
  }

  if (toIsPost) return 'forward-into-post';

  // Otherwise, navigation that stays inside the same top-level section
  // (e.g. /posts ↔ /posts/page/2, /tags/ai ↔ /tags) is lateral.
  const seg = (p: string) => p.split('/')[1] ?? '';
  const toPath = toUrl?.pathname;
  const fromPath = fromUrl?.pathname;
  if (toPath && fromPath && seg(toPath) === seg(fromPath) && seg(toPath) !== '') {
    return 'lateral';
  }
  return 'forward';
}
