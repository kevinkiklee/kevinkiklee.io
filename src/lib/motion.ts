// src/lib/motion.ts
//
// Runtime helpers that mirror the timing rules in motion.css but allow
// Web Animations API calls (which can't read CSS custom properties without
// getComputedStyle). Single point of truth for any JS-driven animation.

export const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const EASE_SPRING = 'cubic-bezier(0.34, 1.40, 0.64, 1)';

const _isMobile = typeof matchMedia !== 'undefined' ? matchMedia('(max-width: 640px)') : null;
const _reduce =
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const _reduceData =
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-data: reduce)') : null;
const _reduceTransparency =
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-transparency: reduce)') : null;

interface NavConn {
  saveData?: boolean;
  effectiveType?: string;
}

function navConn(): NavConn | undefined {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return undefined;
  try {
    return (navigator as unknown as { connection?: NavConn }).connection;
  } catch {
    // Some legacy WebKit builds throw on `navigator.connection` access even
    // when the property exists (e.g. cross-origin iframe contexts). Treat as
    // "no signal" so the caller falls through to the unscaled-duration path.
    return undefined;
  }
}

/**
 * Scale a duration based on environment:
 *   - reduced-motion / reduced-data / reduced-transparency / Save-Data → 1ms
 *   - 2g / slow-2g effective connection → 1ms
 *   - mobile (≤640px) → 70% of input
 *   - desktop → input unchanged
 */
export function scaledDuration(ms: number): number {
  if (_reduce?.matches || _reduceData?.matches || _reduceTransparency?.matches) return 1;
  const c = navConn();
  if (c?.saveData) return 1;
  if (c?.effectiveType && ['2g', 'slow-2g'].includes(c.effectiveType)) return 1;
  if (_isMobile?.matches) return Math.round(ms * 0.7);
  return ms;
}

/**
 * Apply will-change before fn runs, remove after the returned promise
 * settles. Single source of GPU layer discipline; no permanent will-change.
 */
export async function withWillChange(
  el: Element,
  props: Array<'transform' | 'opacity' | 'filter'>,
  fn: () => Promise<unknown>,
): Promise<void> {
  const html = el as HTMLElement;
  const prev = html.style.willChange;
  html.style.willChange = props.join(', ');
  try {
    await fn();
  } finally {
    html.style.willChange = prev;
  }
}

/**
 * Cancel every Web Animations API animation on an element. Called from
 * astro:before-swap to prevent memory leaks across navigations.
 */
export function cancelAnimations(el: Element): void {
  const anims = (el as HTMLElement).getAnimations?.();
  if (!anims) return;
  for (const a of anims) a.cancel();
}
