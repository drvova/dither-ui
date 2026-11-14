// Scroll scenes (the user's call, after product pages whose sections hold
// while their art scales, fades and slides in step with the scroll): an
// element is given its place in the scroll as `--scene`, 0 to 1 on the
// glide, and its stylesheet turns that into a transform or an opacity
// (compositor work only). The progress runs between two moments of its
// passage (`from`, `to`: an edge of it on a line of the viewport; read
// where it is laid out, so a scene may move the element itself) or, for a
// scene that holds (`pin`), through the span its first child (sticky, never
// moved itself) is pinned. One driver for every scene: an IntersectionObserver keeps the
// ones near the viewport, and only while any is near does the scroll read
// their boxes, in the frame, then write. Under reduced motion it does
// nothing: the stylesheet shows the end state, its own rules held under
// `prefers-reduced-motion: no-preference`. Framework-free: it touches the
// DOM only when a scene is made. Works without scroll timelines (Safari
// 16.4 has none).
import { glide } from "@dither-ui/kit/engine/dither-paint.ts"

/** An edge of the element and a line of the viewport (a share of its
 * height from the top): the moment that edge crosses that line. */
type SceneMoment = readonly ["top" | "bottom", number]

/** A scene runs between two moments of its passage, or through the span
 * its sticky first child is pinned. */
export type SceneRange = { from: SceneMoment; to: SceneMoment } | { pin: true }

/** A box as the frame reads it. */
type Box = { top: number; height: number }

/** How far through its range a scene is, 0 to 1 (linear in the scroll):
 * `box` is the element's, `viewport` the window's height, `pinned` the
 * sticky child's box for a pinned scene. */
export function sceneProgress(range: SceneRange, box: Box, viewport: number, pinned?: Box): number {
  let p: number
  if ("pin" in range) {
    const span = box.height - (pinned?.height ?? box.height)
    p = span > 0 && pinned ? (pinned.top - box.top) / span : box.top < 0 ? 1 : 0
  } else {
    // The scroll at which an edge crosses a line, from the element's own
    // top: it grows by one for every pixel the page scrolls.
    const at = ([edge, line]: SceneMoment) => (edge === "top" ? 0 : box.height) - line * viewport
    const from = at(range.from)
    const to = at(range.to)
    p = to === from ? (-box.top >= to ? 1 : 0) : (-box.top - from) / (to - from)
  }
  return Math.min(1, Math.max(0, p))
}

/** What the stylesheet reads: the progress on the glide, four decimals. */
export const sceneValue = (p: number) => glide(p).toFixed(4)

/** How far beyond the viewport a scene starts being read, so it stands at
 * its start before it shows. */
const SCENE_NEAR = "50% 0px 50% 0px"

const scenes = new Map<HTMLElement, SceneRange>()
const near = new Set<HTMLElement>()
const written = new WeakMap<HTMLElement, string>()
let io: IntersectionObserver | null = null
let frame = 0

function write(el: HTMLElement, value: string) {
  if (written.get(el) === value) return
  written.set(el, value)
  el.style.setProperty("--scene", value)
}

/** Where `el` is laid out in the viewport, its own transform left out (a
 * scene may move the element it is read from): its offset in its offset
 * parent, whose box is read once a frame (`parents`). */
function laidOut(el: HTMLElement, parents: Map<Element, DOMRect>): Box {
  const parent = el.offsetParent as HTMLElement | null
  if (!parent) return el.getBoundingClientRect()
  let box = parents.get(parent)
  if (!box) parents.set(parent, (box = parent.getBoundingClientRect()))
  return { top: box.top + parent.clientTop + el.offsetTop, height: el.offsetHeight }
}

/** One frame: every near scene's box first, then every write. A pinned
 * scene's sticky child is read as it stands (it never moves itself: what
 * it holds does). */
function update() {
  frame = 0
  const viewport = innerHeight
  const parents = new Map<Element, DOMRect>()
  const read = [...near].map((el) => {
    const range = scenes.get(el)!
    const pin = "pin" in range ? el.firstElementChild?.getBoundingClientRect() : undefined
    return [el, sceneProgress(range, pin ? el.getBoundingClientRect() : laidOut(el, parents), viewport, pin)] as const
  })
  for (const [el, p] of read) write(el, sceneValue(p))
}

function schedule() {
  if (!frame && near.size) frame = requestAnimationFrame(update)
}

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        if (e.isIntersecting) {
          near.add(el)
          el.dataset.scene = "live"
        } else {
          near.delete(el)
          delete el.dataset.scene
          // Gone past: it stands at its end above the view, its start below.
          write(el, sceneValue(e.boundingClientRect.top < 0 ? 1 : 0))
        }
      }
      schedule()
    },
    { rootMargin: SCENE_NEAR },
  )
  return io
}

const still = () => typeof matchMedia !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches

/** Give `el` its scene: `--scene` follows the scroll through `range` while
 * it is near the viewport. */
export function scrollScene(el: HTMLElement, range: SceneRange): { destroy(): void } {
  if (still() || typeof IntersectionObserver === "undefined") return { destroy() {} }
  if (!scenes.size) {
    addEventListener("scroll", schedule, { passive: true })
    addEventListener("resize", schedule, { passive: true })
  }
  scenes.set(el, range)
  observer().observe(el)
  return {
    destroy() {
      io?.unobserve(el)
      scenes.delete(el)
      near.delete(el)
      delete el.dataset.scene
      if (scenes.size) return
      removeEventListener("scroll", schedule)
      removeEventListener("resize", schedule)
      cancelAnimationFrame(frame)
      frame = 0
      io?.disconnect()
      io = null
    },
  }
}
