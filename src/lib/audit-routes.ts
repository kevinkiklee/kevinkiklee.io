export type RouteId =
  | 'home'
  | 'archive'
  | 'archive-page2'
  | 'post-short'
  | 'post-long'
  | 'post-cover'
  | 'post-faq'
  | 'post-code'
  | 'post-footnotes'
  | 'tags-index'
  | 'tag-populated'
  | 'tag-thin'
  | 'projects'
  | 'about'
  | 'search'
  | 'search-palette'
  | 'privacy'
  | 'accessibility'
  | '404';

export interface AuditRoute {
  id: RouteId;
  path: string;
  primary: boolean;
}

export const routes: AuditRoute[] = [
  { id: 'home', path: '/', primary: true },
  { id: 'archive', path: '/posts', primary: true },
  { id: 'archive-page2', path: '/posts/page/2', primary: false },
  { id: 'post-short', path: '/posts/hello-world', primary: true },
  { id: 'post-long', path: '/posts/hello-world', primary: false },
  { id: 'post-cover', path: '/posts/hello-world', primary: false },
  { id: 'post-faq', path: '/posts/hello-world', primary: false },
  { id: 'post-code', path: '/posts/hello-world', primary: false },
  { id: 'post-footnotes', path: '/posts/hello-world', primary: false },
  { id: 'tags-index', path: '/tags', primary: false },
  // 'devrel' is the most-populated tag in the live content set; 'accessibility'
  // currently has the fewest published posts. Both must exist in tags.json
  // and be referenced by ≥1 published post for the audit to render the page.
  { id: 'tag-populated', path: '/tags/devrel', primary: false },
  { id: 'tag-thin', path: '/tags/accessibility', primary: false },
  { id: 'projects', path: '/projects', primary: false },
  { id: 'about', path: '/about', primary: true },
  { id: 'search', path: '/search', primary: true },
  { id: 'search-palette', path: '/?palette=open', primary: true },
  { id: 'privacy', path: '/privacy', primary: false },
  { id: 'accessibility', path: '/accessibility', primary: true },
  { id: '404', path: '/this-route-does-not-exist', primary: false },
];

export const themes = ['light', 'dark'] as const;
