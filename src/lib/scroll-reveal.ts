/**
 * Scroll-reveal JS fallback.
 *
 * The CSS-first path uses `animation-timeline: view()` (gated via
 * `@supports` in src/styles/transitions.css). For browsers without that
 * feature we fall back to IntersectionObserver, which adds the `.in-view`
 * class once an element scrolls into view.
 *
 * Re-runs on `astro:page-load` so newly mounted `.reveal` nodes are
 * observed after every ClientRouter view transition.
 */
function init(): void {
  if (typeof window === 'undefined') return;
  if (typeof CSS === 'undefined' || CSS.supports('animation-timeline: view()')) return;
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).classList.add('in-view');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const el of document.querySelectorAll('.reveal')) io.observe(el);
}

init();
document.addEventListener('astro:page-load', init);
