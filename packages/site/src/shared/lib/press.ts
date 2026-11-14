// The press (the user's call): a key or a card the reader presses gives
// under the hand, a short travel down on the glide, and springs back as it
// is let go (`spring.ts`, the one motion allowed past its mark). One
// listener on the document marks what is pressed (`data-pressed`: down,
// then up until its spring has played) and `app/styles.css` moves it, a
// `scale` of its own, so it never touches a key's other transitions or
// layout. Mouse, pen and finger alike; a press that turns into a scroll
// is let go as the browser cancels it. Under reduced motion nothing moves.
// Framework-free: it touches the DOM only when installed.

/** What gives under a press: the site's keys, and what opts in with
 * `data-press`: `"key"` gives as a key does, `"card"` a little less
 * (`--press-scale` in the stylesheet). A disabled key never gives. */
export const PRESSABLE = ".key, .key-chrome, .nav-a, .seg > button, [data-press]"

/** What inside a card takes the press itself (a control, a link, a canvas
 * that drags): the card stays still under it. */
const OWN_PRESS =
  "a, button, input, select, textarea, label, canvas, [tabindex], [role=button], [role=slider], [role=switch], [role=tab]"

/** The travel down, ms: the stylesheet's `--press-time`. A press let go
 * sooner still reaches the bottom before it springs back. */
export const PRESS_DOWN_MS = 90

/** The pressed element a pointer down on `target` gives, if any. */
export function pressedBy(target: Element | null): HTMLElement | null {
  const el = target?.closest?.<HTMLElement>(PRESSABLE) ?? null
  if (!el || el.matches(":disabled, [aria-disabled='true']")) return null
  // A card gives only where nothing inside it takes the press.
  if (el.dataset.press === "card") {
    const own = target?.closest(OWN_PRESS)
    if (own && own !== el && el.contains(own)) return null
  }
  return el
}

const still = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

/** Install the press on `doc`: one pointer listener for the page's life. */
export function installPress(doc: Document = document): () => void {
  let held: HTMLElement | null = null
  let downAt = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const up = (el: HTMLElement) => {
    el.dataset.pressed = "up"
  }
  const onDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button > 0 || still()) return
    const el = pressedBy(e.target as Element | null)
    if (!el) return
    clearTimeout(timer)
    if (held && held !== el) up(held)
    held = el
    downAt = performance.now()
    el.dataset.pressed = "down"
  }
  const onUp = () => {
    const el = held
    if (!el) return
    held = null
    clearTimeout(timer)
    const wait = downAt + PRESS_DOWN_MS - performance.now()
    if (wait > 0) timer = setTimeout(() => up(el), wait)
    else up(el)
  }
  // The spring has played: the key is at rest and unmarked.
  const onEnd = (e: AnimationEvent) => {
    const el = e.target as HTMLElement
    if (e.animationName === "press-up" && el.dataset?.pressed === "up") delete el.dataset.pressed
  }
  doc.addEventListener("pointerdown", onDown, { passive: true })
  doc.addEventListener("pointerup", onUp, { passive: true })
  doc.addEventListener("pointercancel", onUp, { passive: true })
  doc.addEventListener("animationend", onEnd)
  return () => {
    clearTimeout(timer)
    doc.removeEventListener("pointerdown", onDown)
    doc.removeEventListener("pointerup", onUp)
    doc.removeEventListener("pointercancel", onUp)
    doc.removeEventListener("animationend", onEnd)
  }
}
