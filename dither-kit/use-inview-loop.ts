import { onBeforeUnmount, onMounted, type Ref } from "vue"

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
 * degraded environments are unaffected.
 */
export function useInviewLoop(
  el: Ref<HTMLElement | SVGElement | null | undefined>,
  start: () => void,
  stop: () => void,
): void {
  let io: IntersectionObserver | null = null
  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === "undefined") {
      start()
      return
    }
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) start()
          else stop()
        }
      },
      { rootMargin: "300px" },
    )
    io.observe(el.value)
  })
  onBeforeUnmount(() => {
    io?.disconnect()
    io = null
    stop()
  })
}
