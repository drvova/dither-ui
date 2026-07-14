import { onBeforeUnmount, onMounted, type Ref, ref } from "vue"

/**
 * Tracks whether an element is on screen, so canvas paint loops can skip all
 * work while scrolled/panned out of view. The rAF keeps ticking (a boolean
 * check per frame — negligible) which means no entrance replays and no state
 * loss when the element scrolls back in; it just resumes painting.
 */
export function useCanvasVisibility(el: Ref<HTMLElement | null>): () => boolean {
  const visible = ref(true)
  let io: IntersectionObserver | null = null
  onMounted(() => {
    if (typeof IntersectionObserver === "undefined" || !el.value) return
    io = new IntersectionObserver(([entry]) => {
      visible.value = entry?.isIntersecting ?? true
    })
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  return () => visible.value
}
