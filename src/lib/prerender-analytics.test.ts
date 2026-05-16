// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { whenActivated } from './prerender-analytics';

afterEach(() => {
  // Reset the prerendering flag between tests; jsdom doesn't reset it.
  Reflect.deleteProperty(document, 'prerendering');
});

describe('whenActivated', () => {
  it('fires synchronously when the document is not prerendering', () => {
    const fn = vi.fn();
    whenActivated(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('defers until the prerenderingchange event when in a prerender', () => {
    (document as { prerendering?: boolean }).prerendering = true;
    const fn = vi.fn();
    whenActivated(fn);
    expect(fn).not.toHaveBeenCalled();

    // Simulate the Speculation Rules activation hand-off.
    document.dispatchEvent(new Event('prerenderingchange'));
    expect(fn).toHaveBeenCalledTimes(1);

    // The listener uses `{ once: true }`, so subsequent activations are
    // no-ops. Asserting this guards the contract — duplicate analytics
    // beacons would otherwise inflate counts on bfcache-style revisits.
    document.dispatchEvent(new Event('prerenderingchange'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
