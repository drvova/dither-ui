// Run a self-scheduling animation loop only while its host element is near
// the viewport (the docs page mounts dozens of demo loops, and an offscreen
// loop still costs a frame per tick).
//
// Contract: `start` must be idempotent (the observer keeps firing while the
// element stays visible) and must not be called optimistically at mount:
// the first intersection observation decides. Reduced-motion gating stays in
// the caller's `start`. Without IntersectionObserver the loop starts at
// once. Under a cover (`engine/cover.ts`: a full-screen sheet) the loop
// stops as if out of view, and starts again as the cover lifts if it is
// still in view.

import { onCleanup, onMount } from "solid-js"
import { isCovered, onCoverChange } from "../../engine/cover"

export function createInviewLoop(
  el: () => HTMLElement | SVGElement | null | undefined,
  start: () => void,
  stop: () => void,
): void {
  onMount(() => {
    let io: IntersectionObserver | null = null
    let inView = false
    const settle = () => (inView && !isCovered(el()) ? start() : stop())
    const unCover = onCoverChange(settle)
    const node = el()
    if (!node || typeof IntersectionObserver === "undefined") {
      inView = true
      settle()
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            inView = e.isIntersecting
            settle()
          }
        },
        { rootMargin: "300px" },
      )
      io.observe(node)
    }
    onCleanup(() => {
      unCover()
      io?.disconnect()
      io = null
      stop()
    })
  })
}
