// jsdom shims for the browser APIs the kit touches. Canvas 2D contexts come
// back null in jsdom and every component already guards that — painting is
// simply skipped, which is exactly what a DOM-level smoke test wants.

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  // @ts-expect-error jsdom shim
  globalThis.ResizeObserver = NoopObserver
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  // @ts-expect-error jsdom shim
  globalThis.IntersectionObserver = NoopObserver
}
if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-expect-error jsdom shim
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  })
}
