/**
 * Static-canvas action shared by the dithered form controls (switch, checkbox,
 * badge, meter, separator, rating, slider, toggle, radio dots). It paints once
 * after layout — deferred through `requestAnimationFrame` to avoid a forced
 * reflow, exactly as the Vue components did in `onMounted` — then repaints on
 * element resize and whenever the reactive `paint` closure changes.
 *
 * Svelte's action seam replaces the Vue `onMounted` + `ResizeObserver` + `watch`
 * wiring, so no `$effect` is needed. The host component supplies `paint` as a
 * `$derived` closure, so it always captures current props; Svelte re-invokes
 * the action's `update` with a fresh closure when any dependency changes, which
 * repaints. The action attaches to the `<canvas>` and measures its parent — the
 * element the Vue version sized against.
 */
export type CanvasPaint = (canvas: HTMLCanvasElement, host: HTMLElement) => void

export function paintOnResize(canvas: HTMLCanvasElement, paint: CanvasPaint) {
  const host = canvas.parentElement ?? canvas
  let ro: ResizeObserver | null = null
  const run = () => paint(canvas, host)
  requestAnimationFrame(() => {
    run()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(run)
      ro.observe(host)
    }
  })
  return {
    update(next: CanvasPaint) {
      paint = next
      run()
    },
    destroy() {
      ro?.disconnect()
    },
  }
}
