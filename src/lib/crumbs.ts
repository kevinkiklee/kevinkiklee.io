export interface Crumb {
  name: string;
  url: string;
}

export interface CrumbsContext {
  /** Title for the current page; used as the active crumb on /posts/[slug]. */
  title?: string;
}

const TITLE_MAX_CRUMB = 50;

function truncate(s: string, max: number): string {
  // String.slice counts UTF-16 code units, so slicing in the middle of a
  // surrogate pair (any emoji past the BMP, CJK supplementary characters)
  // would leave a lone surrogate at the cut and the breadcrumb would render
  // a replacement-character glyph. Iterate by code point so emoji-laden
  // post titles clip cleanly at the visual character boundary.
  const cps = Array.from(s);
  if (cps.length <= max) return s;
  return `${cps.slice(0, max - 1).join('')}…`;
}

export function crumbsFor(pathname: string, ctx: CrumbsContext = {}): Crumb[] {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/' || path === '/404') return [];

  const home: Crumb = { name: '~', url: '/' };

  const pageMatch = path.match(/^\/posts\/page\/(\d+)$/);
  if (pageMatch) {
    return [home, { name: 'posts', url: '/posts' }, { name: `page ${pageMatch[1]}`, url: path }];
  }

  const postMatch = path.match(/^\/posts\/([^/]+)$/);
  if (postMatch && postMatch[1] !== 'page') {
    const title = ctx.title ?? postMatch[1] ?? 'post';
    return [
      home,
      { name: 'posts', url: '/posts' },
      { name: truncate(title, TITLE_MAX_CRUMB), url: path },
    ];
  }

  const tagMatch = path.match(/^\/tags\/([^/]+)$/);
  if (tagMatch) {
    return [home, { name: 'tags', url: '/tags' }, { name: tagMatch[1] ?? '', url: path }];
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1) {
    return [home, { name: segments[0] ?? '', url: path }];
  }

  const out: Crumb[] = [home];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    out.push({ name: seg, url: acc });
  }
  return out;
}
