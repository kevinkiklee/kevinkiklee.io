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

export function initThemeListeners(): void {
  // cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      document.documentElement.dataset.theme = e.newValue;
    }
  });
  // OS theme change (only if user hasn't manually picked)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
