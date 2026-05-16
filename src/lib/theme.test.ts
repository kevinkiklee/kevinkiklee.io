// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vitest's jsdom env (jsdom 29) ships a stubbed `localStorage` that is missing
// most Storage methods. theme.ts wraps storage in try/catch precisely because
// real browsers throw under sandboxed/private contexts; mirror that here with
// an in-memory shim so the assertions can probe `localStorage.getItem` after
// `setTheme`.
const memStore = new Map<string, string>();
const storageShim: Storage = {
  get length() {
    return memStore.size;
  },
  clear: () => memStore.clear(),
  getItem: (k) => memStore.get(k) ?? null,
  key: (i) => Array.from(memStore.keys())[i] ?? null,
  removeItem: (k) => void memStore.delete(k),
  setItem: (k, v) => void memStore.set(k, String(v)),
};
Object.defineProperty(window, 'localStorage', { value: storageShim, configurable: true });

import { getTheme, initThemeListeners, setTheme } from './theme';

function setMatchMediaMock(matchers: Record<string, boolean>) {
  globalThis.matchMedia = ((query: string) => ({
    matches: matchers[query] ?? false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof globalThis.matchMedia;
}

function clearHead() {
  while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.background = '';
  clearHead();
  setMatchMediaMock({ '(prefers-reduced-motion: reduce)': false });
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('getTheme', () => {
  it("defaults to 'light' when no data-theme attribute is set", () => {
    expect(getTheme()).toBe('light');
  });
  it('returns the value of the data-theme attribute', () => {
    document.documentElement.dataset.theme = 'dark';
    expect(getTheme()).toBe('dark');
  });
});

describe('setTheme', () => {
  it("writes data-theme + inline background + theme-color meta for 'dark'", () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    setTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.background).toBe('rgb(10, 10, 10)');
    expect(meta.getAttribute('content')).toBe('#0a0a0a');
  });

  it("writes the light palette for 'light'", () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    setTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.background).toBe('rgb(245, 244, 238)');
    expect(meta.getAttribute('content')).toBe('#f5f4ee');
  });

  it("ignores theme-color metas with a media= attribute (those track the OS, not the user's manual pick)", () => {
    const tracked = document.createElement('meta');
    tracked.setAttribute('name', 'theme-color');
    tracked.setAttribute('media', '(prefers-color-scheme: dark)');
    tracked.setAttribute('content', '#0a0a0a');
    document.head.appendChild(tracked);

    setTheme('light');
    // Mediaed meta should be unchanged.
    expect(tracked.getAttribute('content')).toBe('#0a0a0a');
  });

  it('persists the choice to localStorage so the no-FOUC bootstrap can read it', () => {
    setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('swallows localStorage errors so a sandboxed iframe still themes', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    expect(() => setTheme('dark')).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});

describe('initThemeListeners', () => {
  it('mirrors cross-tab theme changes via the storage event', () => {
    initThemeListeners();
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores storage events for unrelated keys', () => {
    initThemeListeners();
    document.documentElement.dataset.theme = 'light';
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', newValue: 'dark' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('ignores storage events with an invalid newValue', () => {
    initThemeListeners();
    document.documentElement.dataset.theme = 'light';
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'rainbow' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
