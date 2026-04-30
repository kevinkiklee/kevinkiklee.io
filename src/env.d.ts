/// <reference path="../.astro/types.d.ts" />

declare module 'subset-font';

/**
 * Astro 5 view transition events. The framework dispatches these on
 * `document` but doesn't currently export the event types from
 * `astro:transitions/client`. Defined here as a global interface so we can
 * type the listeners without `as any`.
 */
interface ViewTransitionPreparationEvent extends Event {
  navigationType?: 'traverse' | 'push' | 'replace' | 'reload';
  from?: URL;
  to?: URL;
  viewTransition?: { skipTransition?: () => void };
}

/**
 * NetworkInformation is still in the WICG Network Information draft and
 * not in lib.dom.d.ts. We only touch `effectiveType` and `saveData`.
 */
interface NetworkInformation {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly saveData?: boolean;
}

interface Navigator {
  readonly connection?: NetworkInformation;
}

interface Window {
  /** PostCard view-transition init guard. Set once per page. */
  __postCardVTInit?: boolean;
}
