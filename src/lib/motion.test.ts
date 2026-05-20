// @vitest-environment jsdom
// src/lib/motion.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock matchMedia BEFORE importing motion.ts (it captures references at module load)
function setMatchMediaMock(matchers: Record<string, boolean>) {
  globalThis.matchMedia = ((query: string) => {
    const matches = matchers[query] ?? false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  }) as typeof globalThis.matchMedia;
}

function setNavigatorConnection(conn: { saveData?: boolean; effectiveType?: string } | undefined) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { connection: conn },
    configurable: true,
    writable: true,
  });
}

describe('scaledDuration', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMediaMock({});
    setNavigatorConnection({});
  });

  it('returns input unchanged on desktop without any reduction signal', async () => {
    setMatchMediaMock({ '(max-width: 640px)': false });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(200);
  });

  it('returns 70% of input on mobile', async () => {
    setMatchMediaMock({ '(max-width: 640px)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(140);
    expect(scaledDuration(280)).toBe(196);
  });

  it('returns 1 when prefers-reduced-motion is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-motion: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when prefers-reduced-data is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-data: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when prefers-reduced-transparency is set', async () => {
    setMatchMediaMock({ '(prefers-reduced-transparency: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 when navigator.connection.saveData is true', async () => {
    setNavigatorConnection({ saveData: true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 on 2g effective connection', async () => {
    setNavigatorConnection({ effectiveType: '2g' });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('returns 1 on slow-2g effective connection', async () => {
    setNavigatorConnection({ effectiveType: 'slow-2g' });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('treats reduced-motion as higher priority than mobile', async () => {
    setMatchMediaMock({ '(max-width: 640px)': true, '(prefers-reduced-motion: reduce)': true });
    const { scaledDuration } = await import('./motion');
    expect(scaledDuration(200)).toBe(1);
  });

  it('survives navigator.connection access throwing (legacy/quirky UAs)', async () => {
    // Some older WebKit builds throw on bare `navigator.connection` access
    // rather than returning undefined. Defensive code path: must not crash,
    // must return an unscaled duration so animations still run.
    Object.defineProperty(globalThis, 'navigator', {
      value: new Proxy(
        {},
        {
          get(_t, prop) {
            if (prop === 'connection') throw new Error('connection blocked');
            return undefined;
          },
        },
      ),
      configurable: true,
      writable: true,
    });
    const { scaledDuration } = await import('./motion');
    expect(() => scaledDuration(200)).not.toThrow();
    // No reduce signal + nav.connection throws → desktop fallback (200).
    expect(scaledDuration(200)).toBe(200);
  });
});

describe('withWillChange', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMediaMock({});
  });

  it('applies will-change before fn and clears after', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    let snapshotDuringFn = '';
    await withWillChange(el, ['transform', 'opacity'], async () => {
      snapshotDuringFn = el.style.willChange;
    });
    expect(snapshotDuringFn).toBe('transform, opacity');
    expect(el.style.willChange).toBe('');
  });

  it('clears will-change even if fn throws', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    await expect(
      withWillChange(el, ['transform'], async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(el.style.willChange).toBe('');
  });

  it('restores previous will-change value rather than empty', async () => {
    const { withWillChange } = await import('./motion');
    const el = document.createElement('div');
    el.style.willChange = 'opacity';
    await withWillChange(el, ['transform'], async () => {});
    expect(el.style.willChange).toBe('opacity');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
