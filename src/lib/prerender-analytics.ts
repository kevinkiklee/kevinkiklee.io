export function whenActivated(fn: () => void) {
  if ((document as { prerendering?: boolean }).prerendering) {
    document.addEventListener('prerenderingchange', fn, { once: true });
  } else {
    fn();
  }
}
