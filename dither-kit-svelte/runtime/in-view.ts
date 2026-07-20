import { pixelPrefersReducedMotion } from "../engine/pixel"

/**
 * Reveal-once action: calls `onShow` the first time the node scrolls into view,
 * then stops observing. Reduced-motion (or a missing IntersectionObserver)
 * shows immediately. Svelte's DOM-lifecycle seam replaces Vue's
 * onMounted/onBeforeUnmount observer wiring — no `$effect` needed.
 */
export function inView(node: HTMLElement, onShow: () => void) {
  if (pixelPrefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    onShow()
    return {}
  }
  const io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      onShow()
      io.disconnect()
    }
  })
  io.observe(node)
  return {
    destroy() {
      io.disconnect()
    },
  }
}
