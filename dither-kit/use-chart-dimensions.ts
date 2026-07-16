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

  const measure = (entry: ResizeObserverEntry) => {
    const node = el.value
    if (!node) return
    const width = Math.max(0, Math.round(entry.contentRect.width))
    const height = Math.max(0, Math.round(entry.contentRect.height))
    const prev = size.value
    if (prev.width === width && prev.height === height) return
    size.value = { width, height }
  }

  onMounted(() => {
    if (!el.value) return
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) measure(entry)
    })
    ro.observe(el.value)
  })
  onBeforeUnmount(() => ro?.disconnect())

  return { el, size }
}
