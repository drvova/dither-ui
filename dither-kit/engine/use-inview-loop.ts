import { onBeforeUnmount, onMounted, type Ref } from "vue"
import { isCovered, onCoverChange } from "./cover"

/**
 * Run a self-scheduling animation loop only while its host element is near
 * the viewport. The docs page mounts dozens of demo loops and an offscreen
 * loop still costs a frame per tick — measured at ~440 rAF/s from the idle
 * text/animation demos alone, pure main-thread and battery waste.
 *
 * Contract: `start` must be idempotent (the observer keeps firing while the
 * element stays visible) and must not be called optimistically at mount —
 * the first intersection observation decides, matching the chart-root rule in
 * the kit contracts. Reduced-motion gating stays in the caller's `start`.
 * Without IntersectionObserver (jsdom, ancient engines) the loop starts
 * immediately, which is the old always-on behaviour — so existing tests and
 * degraded environments are unaffected. Under a cover (`cover.ts`: a
 * full-screen sheet) the loop stops as if out of view, and starts again as
 * the cover lifts if it is still in view.
 */
export function useInviewLoop(
  el: Ref<HTMLElement | SVGElement | null | undefined>,
  start: () => void,
  stop: () => void,
): void {
  let io: IntersectionObserver | null = null
  let inView = false
  const settle = () => (inView && !isCovered(el.value) ? start() : stop())
  const unCover = onCoverChange(settle)
  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === "undefined") {
      inView = true
      settle()
      return
    }
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inView = e.isIntersecting
          settle()
        }
      },
      { rootMargin: "300px" },
    )
    io.observe(el.value)
  })
  onBeforeUnmount(() => {
    unCover()
    io?.disconnect()
    io = null
    stop()
  })
}
