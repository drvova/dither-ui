/**
 * The director: external ownership of kit time.
 *
 * Free-running, every animated surface (the background runtime, the chart
 * canvases, Sequence, the spinner, the text effects) owns a
 * requestAnimationFrame loop fed by wall time. Under direction those loops
 * stand down and each surface paints exactly the moment it is given — the
 * contract a frame-by-frame renderer needs (HyperFrames seeks a page with
 * `hf-seek` events) and a test can drive: same seed + same time → same
 * pixels, in any order.
 *
 * An SVG's SMIL timeline follows it through `directSmil`.
 *
 * Surfaces subscribe with `onSeek`. A listener receives the directed moment
 * in ms, or null when direction is released and loops may resume.
 *
 * The kit's UI motion is CSS (its stylesheets' `dk-*` keyframes and the
 * components' transitions), which no rAF loop owns, so the director holds it
 * here, in one place: on every seek each `dk-*` animation in the document is
 * paused at the moment (its `currentTime`, delay included, so a stagger lands
 * where a free run would put it at that time) and every running transition
 * is finished (a fresh mount has none running); an animation or transition
 * that starts while directed is caught as it starts. Release plays the held
 * animations on from the moment. Scroll-driven animations have no time and
 * are left alone. HyperFrames seeks a page's animations through the same
 * Web Animations API, to the same moment.
 */
export type SeekListener = (ms: number | null) => void

const listeners = new Set<SeekListener>()
let directedMs: number | null = null

/** True while an external director owns time. */
export const isDirected = (): boolean => directedMs !== null

/** The directed moment in ms, or null when free-running. */
export const directedTime = (): number | null => directedMs

/** Subscribe a surface; returns the unsubscribe. */
export function onSeek(listener: SeekListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** A kit animation is one its stylesheets name: keyframes called `dk-*`. */
export const KIT_KEYFRAMES = /^dk-/

/** The kit animations the director paused, played on at release. */
const held = new Set<Animation>()

/** Hold one CSS animation or transition at the moment `ms`: a kit animation
 * paused there, a transition finished; anything else is left alone. */
export function directAnimation(a: Animation, ms: number): void {
  // A scroll-driven animation's time is the scroll, not the composition's.
  if (typeof document !== "undefined" && a.timeline && a.timeline !== document.timeline) return
  if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation && KIT_KEYFRAMES.test(a.animationName)) {
    a.pause()
    a.currentTime = ms
    held.add(a)
  } else if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) a.finish()
}

/** What starts while directed is held as it starts. */
function onStart(e: Event): void {
  const target = e.target
  if (directedMs === null || !(target instanceof Element) || typeof target.getAnimations !== "function") return
  for (const a of target.getAnimations({ subtree: true })) directAnimation(a, directedMs)
}
const STARTS = ["animationstart", "transitionrun"] as const

function directCss(ms: number | null): void {
  if (typeof document === "undefined" || typeof document.getAnimations !== "function") return
  if (ms === null) {
    for (const a of held) a.play()
    held.clear()
    for (const type of STARTS) document.removeEventListener(type, onStart, true)
    return
  }
  for (const type of STARTS) document.addEventListener(type, onStart, true)
  for (const a of document.getAnimations()) directAnimation(a, ms)
}

/** Direct every surface to `ms` of composition time. */
export function seek(ms: number): void {
  directedMs = Number.isFinite(ms) ? Math.max(0, ms) : 0
  directCss(directedMs)
  for (const l of listeners) l(directedMs)
}

/** Hand time back to the surfaces' own loops. */
export function release(): void {
  if (directedMs === null) return
  directedMs = null
  directCss(null)
  for (const l of listeners) l(null)
}

/** The part of an outermost `<svg>` that holds its SMIL timeline. */
export type SmilTimeline = Pick<SVGSVGElement, "pauseAnimations" | "unpauseAnimations" | "setCurrentTime">

/**
 * Put an SVG's SMIL animations (its `<animate>`, `<set>` and
 * `<animateTransform>`) on kit time: directed, its timeline is paused at
 * the moment, so a moment prints the same frame however it was reached;
 * released, it plays on from there. Each outermost `<svg>` keeps its own
 * timeline, so each one a part animates in is directed. Returns the
 * unsubscribe; a DOM without the SMIL API is left alone.
 */
export function directSmil(svg: SmilTimeline): () => void {
  if (typeof svg.setCurrentTime !== "function") return () => {}
  const at = (ms: number | null) => {
    if (ms === null) {
      svg.unpauseAnimations()
      return
    }
    svg.pauseAnimations()
    svg.setCurrentTime(ms / 1000)
  }
  if (directedMs !== null) at(directedMs)
  return onSeek(at)
}

/**
 * Take direction from HyperFrames: its runtime dispatches `hf-seek` on
 * `window` (`detail.time` in seconds) for every frame it captures, so a page
 * that installs this renders the kit deterministically under
 * `npx hyperframes render`. Returns the uninstaller.
 */
export function directFromHyperframes(target: EventTarget = window): () => void {
  const on = (e: Event) => {
    const time = (e as CustomEvent<{ time?: unknown }>).detail?.time
    if (typeof time === "number") seek(time * 1000)
  }
  target.addEventListener("hf-seek", on)
  return () => target.removeEventListener("hf-seek", on)
}
