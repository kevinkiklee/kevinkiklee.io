type Dir = 'forward' | 'back' | 'lateral' | 'forward-into-post';

function getDepth(): number {
  return (history.state?.depth as number) ?? 0;
}

function setDirOnHtml(dir: Dir) {
  document.documentElement.dataset.navDirection = dir;
}

document.addEventListener('astro:before-preparation', (e: Event) => {
  // biome-ignore lint/suspicious/noExplicitAny: Astro transition event types are loose
  const evt = e as any;
  document.documentElement.dataset.transitioning = '';
  const fromDepth = getDepth();
  const toPath: string | undefined = evt.to?.pathname;
  const toIsPost = toPath?.startsWith('/posts/') && toPath !== '/posts';
  const isTraverse = evt.navigationType === 'traverse';
  const dir: Dir = isTraverse ? 'back' : toIsPost ? 'forward-into-post' : 'forward';
  setDirOnHtml(dir);
  if (!isTraverse) {
    history.replaceState({ ...(history.state ?? {}), depth: fromDepth + 1 }, '');
  }

  // Reduced motion or save-data → skip transition
  let slow = false;
  try {
    // biome-ignore lint/suspicious/noExplicitAny: Connection API not in TS lib
    const c = (navigator as any).connection;
    slow = Boolean(c?.saveData) || ['slow-2g', '2g'].includes(c?.effectiveType);
  } catch {
    slow = false;
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || slow) {
    evt.viewTransition?.skipTransition?.();
  }
});

document.addEventListener('astro:after-swap', () => {
  delete document.documentElement.dataset.transitioning;
  // Focus management
  const h1 = document.querySelector('main h1') as HTMLElement | null;
  if (h1) {
    h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  }
  const announce = document.getElementById('route-announce');
  if (announce && document.title) announce.textContent = `Loaded: ${document.title}`;
});
