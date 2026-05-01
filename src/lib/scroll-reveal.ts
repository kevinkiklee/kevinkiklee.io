// src/lib/scroll-reveal.ts
//
// Single IntersectionObserver that handles BOTH scroll-reveal stagger
// (.reveal items get .in-view + transition-delay) AND prose heading
// line-draw (.prose h2/h3 get .drawn). Modern browsers use the
// animation-timeline: view() rules in transitions.css; this module is
// the fallback for browsers without that support.

let io: IntersectionObserver | null = null;

function setupReveal(target: HTMLElement) {
  const i = Number(target.style.getPropertyValue('--i') || '0');
  const delay = Math.min(i, 8) * 30;
  target.style.transitionDelay = `${delay}ms`;
  target.classList.add('in-view');
}

function setupHeading(target: HTMLElement) {
  target.classList.add('drawn');
}

function init(): void {
  if (typeof window === 'undefined') return;
  if (typeof CSS === 'undefined' || CSS.supports('animation-timeline: view()')) return;
  if (!('IntersectionObserver' in window)) return;

  io?.disconnect();
  io = new IntersectionObserver(
    (entries) => {
      if (document.visibilityState !== 'visible') return;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if (el.classList.contains('reveal')) setupReveal(el);
        if (el.matches('.prose h2, .prose h3')) setupHeading(el);
        io?.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const el of document.querySelectorAll('.reveal, .prose h2, .prose h3')) {
    io.observe(el);
  }
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => io?.disconnect());
