import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue"

export type Dimensions = { width: number; height: number }

/**
 * Tracks an element's CSS pixel size via {@link ResizeObserver}. Uses the
 * observer's `contentRect` rather than `getBoundingClientRect()` so a parent
 * transform morph cannot trick the chart into measuring a scaled size and
 * locking its canvas to it. Vue port of the original React hook — returns a
 * template ref to bind and a reactive size.
 */
export function useChartDimensions<T extends HTMLElement>() {
  const el = ref<T | null>(null)
  const size = shallowRef<Dimensions>({ width: 0, height: 0 })
  let ro: ResizeObserver | null = null
  let fallback = 0

  const update = (width: number, height: number) => {
    const nextWidth = Math.max(0, Math.round(width))
    const nextHeight = Math.max(0, Math.round(height))
    const prev = size.value
    if (prev.width === nextWidth && prev.height === nextHeight) return
    size.value = { width: nextWidth, height: nextHeight }
  }

  const measure = (entry: ResizeObserverEntry) => update(entry.contentRect.width, entry.contentRect.height)
  const measureNode = () => {
    const node = el.value
    if (!node) return
    update(node.clientWidth, node.clientHeight)
  }

  onMounted(() => {
    const node = el.value
    if (!node) return
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) measure(entry)
      else measureNode()
    })
    ro.observe(node)
    fallback = window.setTimeout(() => {
      if (!size.value.width && !size.value.height) measureNode()
    }, 0)
  })
  onBeforeUnmount(() => {
    if (fallback) clearTimeout(fallback)
    ro?.disconnect()
  })

  return { el, size }
}
