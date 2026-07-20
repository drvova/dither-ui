export type Dimensions = { width: number; height: number }

/**
 * Reports an element's CSS pixel size via {@link ResizeObserver}. Uses the
 * observer's `contentRect` rather than `getBoundingClientRect()` so a parent
 * transform morph cannot trick the chart into measuring a scaled size and
 * locking its canvas to it. Svelte's DOM-lifecycle seam (an action) replaces the
 * Vue composable's onMounted/onBeforeUnmount observer wiring — no `$effect`
 * needed. The root binds `use:chartDimensions={onSize}` and keeps the size in
 * its own `$state`; `onSize` fires only when the rounded size actually changes.
 */
export function chartDimensions(
  node: HTMLElement,
  onSize: (size: Dimensions) => void
) {
  let prev: Dimensions = { width: 0, height: 0 }
  let fallback = 0

  const update = (width: number, height: number) => {
    const nextWidth = Math.max(0, Math.round(width))
    const nextHeight = Math.max(0, Math.round(height))
    if (prev.width === nextWidth && prev.height === nextHeight) return
    prev = { width: nextWidth, height: nextHeight }
    onSize(prev)
  }

  const measureNode = () => update(node.clientWidth, node.clientHeight)

  const ro = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) update(entry.contentRect.width, entry.contentRect.height)
    else measureNode()
  })
  ro.observe(node)
  fallback = window.setTimeout(() => {
    if (!prev.width && !prev.height) measureNode()
  }, 0)

  return {
    destroy() {
      if (fallback) clearTimeout(fallback)
      ro.disconnect()
    },
  }
}
