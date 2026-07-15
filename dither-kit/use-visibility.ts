import { onBeforeUnmount, onMounted, type Ref, ref } from "vue"

/**
 * Tracks whether an element is on screen so canvas paint loops can fully stop
 * while scrolled/panned out of view (a chart off-screen costs nothing instead
 * of burning a 60fps rAF loop). `onWake` fires when the element re-enters view;
 * the loop resumes its SAME closure, so preserved timing means no entrance
 * replay and no state loss — any in-progress entrance simply snaps to done.
 */
export function useCanvasVisibility(
  el: Ref<HTMLElement | null>,
  onWake?: () => void
): () => boolean {
  const visible = ref(true)
  let io: IntersectionObserver | null = null
  onMounted(() => {
    if (typeof IntersectionObserver === "undefined" || !el.value) return
    io = new IntersectionObserver(([entry]) => {
      const v = entry?.isIntersecting ?? true
      if (v && !visible.value) onWake?.() // re-entered view — resume the paused loop
      visible.value = v
    })
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  return () => visible.value
}
