import { onBeforeUnmount, onMounted, type Ref, ref } from "vue"
import { isCovered, onCoverChange } from "./cover"

/**
 * Tracks whether an element is on screen so canvas paint loops can fully stop
 * while scrolled/panned out of view (a chart off-screen costs nothing instead
 * of burning a 60fps rAF loop). `onWake` fires when the element re-enters view;
 * the loop resumes its SAME closure, so preserved timing means no entrance
 * replay and no state loss — any in-progress entrance simply snaps to done.
 * Under a cover (`cover.ts`: a full-screen sheet) it reads as hidden too,
 * and wakes as the cover lifts.
 */
export function useCanvasVisibility(el: Ref<HTMLElement | null>, onWake?: () => void): () => boolean {
  const visible = ref(typeof IntersectionObserver === "undefined")
  let io: IntersectionObserver | null = null
  // Woken as a cover over it lifts (never by one raised elsewhere).
  let covered = false
  const unCover = onCoverChange(() => {
    const now = isCovered(el.value)
    if (covered && !now && visible.value) onWake?.()
    covered = now
  })
  onMounted(() => {
    if (typeof IntersectionObserver === "undefined" || !el.value) return
    io = new IntersectionObserver(([entry]) => {
      const v = entry?.isIntersecting ?? true
      visible.value = v
      if (v && !isCovered(el.value)) onWake?.() // now visible — resume the paused loop
    })
    io.observe(el.value)
  })
  onBeforeUnmount(() => {
    io?.disconnect()
    unCover()
  })
  return () => visible.value && !isCovered(el.value)
}
