// Whether an element is on screen, for any framework's runtime: canvas paint
// loops stop while scrolled or panned out of view (a chart off screen costs
// nothing instead of burning a 60fps rAF loop) and wake as it comes back.
// Framework-free: a runtime calls `mount` once the element exists and
// `dispose` as it goes; making one touches nothing, so it is safe to make
// while rendering on a server.

import { isCovered, onCoverChange } from "./cover"

export type Visibility = {
  /** On screen and under no cover (`cover.ts`: a full-screen sheet). */
  visible: () => boolean
  /** Start watching: the element is in the document. */
  mount: () => void
  dispose: () => void
}

/** Watch `el`; `onWake` fires as it comes into view or a cover over it
 * lifts. The loop it wakes resumes its SAME closure, so preserved timing
 * means no entrance replay and no state loss. */
export function watchVisibility(el: () => Element | null | undefined, onWake?: () => void): Visibility {
  let visible = typeof IntersectionObserver === "undefined"
  let io: IntersectionObserver | null = null
  // Woken as a cover over it lifts (never by one raised elsewhere).
  let covered = false
  let unCover: (() => void) | null = null
  return {
    visible: () => visible && !isCovered(el()),
    mount() {
      unCover ??= onCoverChange(() => {
        const now = isCovered(el())
        if (covered && !now && visible) onWake?.()
        covered = now
      })
      const node = el()
      if (typeof IntersectionObserver === "undefined" || !node || io) return
      io = new IntersectionObserver(([entry]) => {
        const v = entry?.isIntersecting ?? true
        visible = v
        if (v && !isCovered(el())) onWake?.() // now visible: resume the paused loop
      })
      io.observe(node)
    },
    dispose() {
      io?.disconnect()
      io = null
      unCover?.()
      unCover = null
    },
  }
}
