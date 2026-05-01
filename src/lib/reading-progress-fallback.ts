/**
 * Reading progress fallback for browsers without CSS scroll-driven
 * animations (Safari < 26, older Firefox). Updates --rp on body
 * via passive scroll + rAF throttle. Idempotent across view transitions.
 *
 * Imported only when `!CSS.supports('animation-timeline', '--x')`.
 */
let raf = 0;
let attached = false;

function compute(): number {
  const article = document.querySelector<HTMLElement>('.post');
  if (!article) return 0;
  const rect = article.getBoundingClientRect();
  const vh = window.innerHeight;
  // Range: from when article top hits viewport bottom (start)
  // to when article bottom hits viewport top (end).
  const total = rect.height + vh;
  const passed = vh - rect.top;
  return Math.min(1, Math.max(0, passed / total));
}

function tick(): void {
  raf = 0;
  // Short-circuit on non-post pages: listeners stay attached but do no
  // work. Cheaper than detach/reattach on every route change.
  if (!document.body.hasAttribute('data-progress')) return;
  document.body.style.setProperty('--rp', String(compute()));
}

function onScroll(): void {
  if (raf !== 0) return;
  raf = requestAnimationFrame(tick);
}

export function attach(): void {
  if (attached) return;
  attached = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  tick();
}

export function detach(): void {
  if (!attached) return;
  attached = false;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (raf !== 0) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}
