import { type Accessor, createSignal, onCleanup, onMount } from "solid-js"
import type { Dimensions } from "../../engine/chart-types"

export type { Dimensions } from "../../engine/chart-types"

/**
 * Tracks an element's CSS pixel size via {@link ResizeObserver}. Uses the
 * observer's `contentRect` rather than `getBoundingClientRect()` so a parent
 * transform morph cannot trick the chart into measuring a scaled size and
 * locking its canvas to it. Takes the element as an accessor and returns a
 * reactive size.
 */
export function useChartDimensions<T extends HTMLElement>(
  el: () => T | null | undefined,
): {
  size: Accessor<Dimensions>
} {
  const [size, setSize] = createSignal<Dimensions>({ width: 0, height: 0 })
  let ro: ResizeObserver | null = null
  let fallback = 0

  const update = (width: number, height: number) => {
    const nextWidth = Math.max(0, Math.round(width))
    const nextHeight = Math.max(0, Math.round(height))
    const prev = size()
    if (prev.width === nextWidth && prev.height === nextHeight) return
    setSize({ width: nextWidth, height: nextHeight })
  }

  const measure = (entry: ResizeObserverEntry) => update(entry.contentRect.width, entry.contentRect.height)
  const measureNode = () => {
    const node = el()
    if (!node) return
    update(node.clientWidth, node.clientHeight)
  }

  onMount(() => {
    const node = el()
    if (!node) return
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) measure(entry)
      else measureNode()
    })
    ro.observe(node)
    fallback = window.setTimeout(() => {
      if (!size().width && !size().height) measureNode()
    }, 0)
    onCleanup(() => {
      if (fallback) clearTimeout(fallback)
      ro?.disconnect()
    })
  })

  return { size }
}
