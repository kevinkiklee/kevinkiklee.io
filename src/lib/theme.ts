export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || 'light';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  document.documentElement.style.background = t === 'dark' ? '#0a0a0a' : '#f5f4ee';
  try {
    localStorage.setItem('theme', t);
  } catch {}
  updateThemeColorMeta(t);
}

function updateThemeColorMeta(t: Theme) {
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0a0a' : '#f5f4ee');
}

/**
 * Animated theme switch. Uses the View Transitions API to crossfade
 * EVERY style change (bg, fg, borders, code-bg, icon swap) in one
 * compositor pass. Falls back to setTheme() (which triggers the CSS
 * color transitions on :root) for non-supporting browsers, reduced-
 * motion users, and during ClientRouter swaps.
 *
 * Theme icon swap (item j) is folded in: the View Transition snapshot
 * captures the old icon, the callback flips the data-theme attr, the
 * new icon paints, and the API crossfades. No per-icon animation needed.
 */
export async function setThemeAnimated(t: Theme): Promise<void> {
  if (typeof document === 'undefined') return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    setTheme(t);
    return;
  }

  // Lock against re-entrance + collision with a ClientRouter swap or
  // a previous theme transition.
  if (document.documentElement.dataset.transitioning === '') {
    setTheme(t);
    return;
  }
  if (document.documentElement.dataset.vtTheme === '') {
    setTheme(t);
    return;
  }

  const vt = (
    document as Document & {
      startViewTransition?: (cb: () => void) => { updateCallbackDone: Promise<void> };
    }
  ).startViewTransition;
  if (typeof vt === 'function') {
    document.documentElement.dataset.vtTheme = '';
    try {
      await vt.call(document, () => setTheme(t)).updateCallbackDone;
    } finally {
      delete document.documentElement.dataset.vtTheme;
    }
    return;
  }
  setTheme(t);
}

export function initThemeListeners(): void {
  // Cross-tab sync. The other tab's `setTheme()` writes data-theme AND an
  // inline background + the theme-color meta — replicating only data-theme
  // here would leave the inline background stuck on the prior value, so
  // every visible state property needs to flip in lockstep. localStorage
  // is already written by the originating tab; suppress the re-write by
  // calling setTheme but accepting the redundant set as cheap.
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      setTheme(e.newValue);
    }
  });
  // OS theme change (only if user hasn't manually picked).
  // localStorage may throw in private-mode / sandboxed contexts; treat the
  // throw as "no manual choice yet" and follow the OS preference.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('theme');
    } catch {}
    if (!stored) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
