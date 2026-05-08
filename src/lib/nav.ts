import { type Dir, decideDirection } from './nav-direction';

export { decideDirection };
export type { Dir, NavType } from './nav-direction';

function getDepth(): number {
  // history.state may be null, an unrelated object, or carry a depth set by a
  // previous load. Coerce defensively so a corrupt state never breaks the
  // direction decision.
  const d = (history.state as { depth?: unknown } | null)?.depth;
  return typeof d === 'number' && Number.isFinite(d) ? d : 0;
}

function setDirOnHtml(dir: Dir) {
  document.documentElement.dataset.navDirection = dir;
}

document.addEventListener('astro:before-preparation', (e: Event) => {
  const evt = e as ViewTransitionPreparationEvent;
  document.documentElement.dataset.transitioning = '';
  const fromDepth = getDepth();
  const dir = decideDirection(evt.navigationType, evt.from, evt.to, fromDepth);
  setDirOnHtml(dir);
  if (evt.navigationType !== 'traverse') {
    history.replaceState({ ...(history.state ?? {}), depth: fromDepth + 1 }, '');
  }

  // Reduced motion or save-data → skip transition
  let slow = false;
  try {
    const c = navigator.connection;
    slow =
      Boolean(c?.saveData) ||
      (c?.effectiveType !== undefined && ['slow-2g', '2g'].includes(c.effectiveType));
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
