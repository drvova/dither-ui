// The transition engine: a view transition whose two snapshots meet through
// the wipe engine. The browser holds the outgoing state as an image and the
// incoming one live; every frame sets a wipe mask on them, so one page turns
// into the next cell by cell in the kit's own pattern. With an `ink`, the
// outgoing side breaks up into that colour ahead of the incoming side, so
// the front carries a dithered band of it between the two. A change on this
// page goes through `ditherTransition(update)`; a transition the browser
// started (a cross-document navigation's, from `pagereveal`) through
// `ditherViewTransition(transition)`.

import { isDirected } from "./clock"
import { resolveEasing, type EasingInput } from "./dither-paint"
import { pixelPrefersReducedMotion } from "./pixel"
import { wipeStyle, type WipeDirection, type WipeOptions, type WipeStyle } from "./wipe"

export type DitherTransitionOptions = {
  /** Where the front travels (the wipe's directions); "none" dissolves. */
  direction?: WipeDirection
  /** The iris's centre in viewport px; default the changing box's centre. */
  origin?: { x: number; y: number }
  /** Cell size in CSS px. */
  cell?: number
  /** The dithered band's width in cells. */
  band?: number
  /** A seeded 4x4 matrix instead of the 8x8 Bayer. */
  seed?: number
  /** A CSS colour the front carries between the two states. */
  ink?: string
  /** In ms. */
  duration?: number
  easing?: EasingInput
  /** The element that changes; default the whole page. */
  target?: HTMLElement
}

/** The part of a `ViewTransition` the engine drives. */
export type ViewTransitionLike = Pick<ViewTransition, "ready" | "finished" | "skipTransition">

/** How far the outgoing front leads the incoming one under an ink, as a
 * share of the run: the band of ink between them. */
const INK_LEAD = 0.2
/** How long a transition may wait for its first frame, and outlive its run
 * if no frame comes to end it (a hidden tab runs none): then the browser
 * ends it. */
const FIRST_FRAME_MS = 3000
const SLACK_MS = 500

let names = 0

const reduced = () => pixelPrefersReducedMotion()

/** Run `update` (a DOM change) as a dithered view transition. Without the
 * View Transitions API, under reduced motion, or while the kit clock is
 * directed, `update` just runs. Resolves when the transition has finished;
 * rejects with `update`'s error. */
export async function ditherTransition(
  update: () => void | Promise<void>,
  opts: DitherTransitionOptions = {},
): Promise<void> {
  if (!("startViewTransition" in document) || reduced() || isDirected()) {
    await update()
    return
  }
  const target = opts.target
  const name = target ? `dk-transition-${++names}` : "root"
  const before = target?.style.viewTransitionName ?? ""
  if (target) target.style.viewTransitionName = name
  try {
    const transition = document.startViewTransition(update)
    void drive(transition, name, opts, target)
    await transition.finished
  } finally {
    if (target) target.style.viewTransitionName = before
  }
}

/** Drive a page transition the browser started: the `viewTransition` of a
 * `pagereveal` event on a page that opts in with `@view-transition`. */
export function ditherViewTransition(
  transition: ViewTransitionLike,
  opts: DitherTransitionOptions = {},
): Promise<void> {
  if (reduced()) {
    transition.skipTransition()
    return transition.finished
  }
  return drive(transition, "root", opts)
}

function setMask(rule: CSSStyleRule, mask: WipeStyle | null) {
  const set = (prop: string, value: string) => {
    rule.style.setProperty(`mask-${prop}`, value)
    rule.style.setProperty(`-webkit-mask-${prop}`, value)
  }
  if (!mask) {
    set("image", "none")
    return
  }
  set("image", mask.image)
  set("size", mask.size)
  set("repeat", mask.repeat)
  set("position", mask.position)
}

/** Mask the snapshots of the transition group `name` (the element
 * `target`'s, or the page's) frame by frame. */
async function drive(
  transition: ViewTransitionLike,
  name: string,
  opts: DitherTransitionOptions,
  target?: HTMLElement,
): Promise<void> {
  const duration = Math.max(1, opts.duration ?? 600)
  const pseudo = (part: string) => `::view-transition-${part}(${name})`
  const style = document.createElement("style")
  document.head.append(style)
  const sheet = style.sheet as CSSStyleSheet
  // The snapshots' own animations stop; the incoming one holds the
  // transition open (no change: opacity stays 1) until the first frame, then
  // for the run, which ends it.
  sheet.insertRule("@keyframes dk-transition-hold { from, to { opacity: 1 } }", 0)
  sheet.insertRule("@keyframes dk-transition-run { from, to { opacity: 1 } }", 1)
  sheet.insertRule(`${pseudo("old")}, ${pseudo("new")} { animation: none; mix-blend-mode: normal }`, 2)
  sheet.insertRule(`${pseudo("old")} {}`, 3)
  sheet.insertRule(`${pseudo("new")} { animation: dk-transition-hold ${FIRST_FRAME_MS}ms }`, 4)
  sheet.insertRule(`${pseudo("image-pair")} {}`, 5)
  const outgoing = sheet.cssRules[3] as CSSStyleRule
  const incoming = sheet.cssRules[4] as CSSStyleRule
  const ground = sheet.cssRules[5] as CSSStyleRule
  if (opts.ink) ground.style.setProperty("background", opts.ink)
  // The ink keeps to the target's own shape.
  if (opts.ink && target) ground.style.setProperty("border-radius", getComputedStyle(target).borderRadius)
  if (target) {
    // Only the target changes: the page stays out of the snapshots (in the
    // sheet before the browser captures them), live and clickable under them.
    sheet.insertRule(":root { view-transition-name: none }", 6)
    sheet.insertRule("::view-transition { pointer-events: none }", 7)
  }

  let raf = 0
  let over = false
  void transition.finished
    .catch(() => undefined)
    .then(() => {
      over = true
      cancelAnimationFrame(raf)
      style.remove()
    })
  try {
    await transition.ready
  } catch {
    // Skipped before it began (another transition took over): nothing to drive.
    return transition.finished.catch(() => undefined)
  }
  if (over) return

  const box = target?.getBoundingClientRect() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight }
  const wipe: WipeOptions = {
    direction: opts.direction ?? "none",
    cell: opts.cell ?? 6,
    band: opts.band ?? 10,
    seed: opts.seed,
    width: box.width,
    height: box.height,
    origin: opts.origin && { x: opts.origin.x - box.left, y: opts.origin.y - box.top },
  }
  const ease = resolveEasing(opts.easing ?? "ease-in-out")
  // The run's clock starts on its first animation frame, so a long task
  // before it (a page mounting) holds the first state instead of eating
  // into the run.
  let start = -1
  const frame = (now: number) => {
    if (over) return
    if (start < 0) {
      start = now
      incoming.style.setProperty("animation", `dk-transition-run ${duration + SLACK_MS}ms`)
    }
    const t = Math.min(1, (now - start) / duration)
    const p = ease(t)
    if (opts.ink) {
      const run = p * (1 + INK_LEAD)
      setMask(outgoing, wipeStyle(Math.min(1, run), { ...wipe, invert: true }))
      setMask(incoming, wipeStyle(Math.max(0, run - INK_LEAD), wipe))
    } else setMask(incoming, wipeStyle(p, wipe))
    // The run is over: dropping the hold ends the transition.
    if (t >= 1) incoming.style.setProperty("animation", "none")
    else raf = requestAnimationFrame(frame)
  }
  // The first state is set before the browser paints the transition's first.
  setMask(incoming, wipeStyle(0, wipe))
  if (opts.ink) setMask(outgoing, wipeStyle(0, { ...wipe, invert: true }))
  raf = requestAnimationFrame(frame)
  return transition.finished.catch(() => undefined)
}
