// The rise (the user's call): as a headline comes into view its words come
// up one after another, a short travel each on the glide, then what stands
// with it (`data-rise` on a block) follows in turn. `rise(node)` goes on the
// element that holds them; the words come from the site's `RiseWords`. Under
// reduced motion everything stands where it is. What the prerendered bytes
// show before the app runs waits in `rise-wait.ts`. Framework-free.
import { GLIDE_BEZIER } from "@dither-ui/kit/engine/dither-paint.ts"
import { RISE_LIVE } from "./rise-wait"

export const RISE = {
  /** How far each one travels up, px. */
  distance: 24,
  /** Its travel, ms. */
  duration: 900,
  /** Between one word and the next, ms. */
  word: 60,
  /** After the last word, before the first block, ms. */
  gap: 120,
  /** Between one block and the next, ms. */
  block: 90,
  easing: `cubic-bezier(${GLIDE_BEZIER.join(", ")})`,
} as const

/** When each of `kinds` (a word, or a block) starts, ms: the words one
 * after another, then the blocks after the last word. */
export function riseDelays(kinds: readonly ("word" | "block")[]): number[] {
  const words = kinds.filter((k) => k === "word").length
  const blocksFrom = words ? (words - 1) * RISE.word + RISE.gap : 0
  let w = 0
  let b = 0
  return kinds.map((k) => (k === "word" ? w++ * RISE.word : blocksFrom + b++ * RISE.block))
}

const still = () => !window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches

/** Rise what `node` holds (`[data-rise]`) once it comes into view. */
export function rise(node: HTMLElement): { destroy(): void } {
  document.documentElement.dataset.rise = RISE_LIVE
  const items = [...node.querySelectorAll<HTMLElement>("[data-rise]")]
  const risen = (el: HTMLElement) => {
    el.dataset.risen = ""
    el.style.opacity = ""
  }
  if (still() || typeof IntersectionObserver === "undefined" || !node.animate) {
    items.forEach(risen)
    return { destroy() {} }
  }
  for (const el of items) el.style.opacity = "0"
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      const delays = riseDelays(items.map((el) => (el.dataset.rise === "word" ? "word" : "block")))
      items.forEach((el, i) => {
        risen(el)
        el.animate(
          [
            { opacity: 0, transform: `translateY(${RISE.distance}px)` },
            { opacity: 1, transform: "none" },
          ],
          { duration: RISE.duration, delay: delays[i], easing: RISE.easing, fill: "backwards" },
        )
      })
    },
    { rootMargin: "0px 0px -8% 0px" },
  )
  io.observe(node)
  return { destroy: () => io.disconnect() }
}
