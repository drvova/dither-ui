import { createEffect, createSignal, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { Dynamic } from "solid-js/web"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { staggerDelay, type StaggerFrom } from "../engine/sequence"
import { cssEasing, cssSteps, type Easing } from "../engine/timing"
import { latestEntry } from "../engine/visibility"
import { cn } from "../tailwind/lib"
import "./Sequence.css"

export type SequenceProps = {
  /** Seconds between neighbouring children's starts.
   * @docs number: seconds between neighbouring children */
  stagger?: number
  /** Which end of the group starts first.
   * @docs "start" | "center" | "end" | "edges" | literal index */
  from?: StaggerFrom
  /** One child's cycle, seconds.
   * @docs number (s per cycle) */
  duration?: number
  /** Progress easing per cycle: a CSS timing function, or one of timing.ts
   * (`linear`, `steps(4)` quantizes) — another function plays linear.
   * @docs CSS timing function | linear / steps(n) from timing.ts
   * @default linear */
  easing?: Easing | string
  /** Whole cycles per child. */
  loop?: number
  /** Odd cycles play in reverse (an even loop settles back at 0). */
  yoyo?: boolean
  /** Seconds before the timeline starts (children sit at 0 until then).
   * @docs seconds before the timeline */
  delay?: number
  paused?: boolean
  /** Replay whenever the group scrolls back into view. */
  restartOnView?: boolean
  /** Stop-motion cadence in fps (0 = smooth) — the kit-wide knob: a cycle
   * steps at it, in place of the easing.
   * @docs fps cadence (steps a cycle, in place of easing) */
  frameRate?: number
  /** Bump to rebuild (children changed) and replay from the start.
   * @docs string | number (bump rebuilds and replays) */
  restartKey?: string | number
  onComplete?: () => void
  as?: string
  class?: string
  /** @docs content */
  children?: JSX.Element
}

/** A stagger of its children, in CSS: each child plays `dk-seq`
 * (`Sequence.css`), writing its eased progress to `--seq-p`, its start put
 * off by its place in the stagger, and reports where it stands in
 * `data-seq` (before, active, done) from its animation's events. It starts
 * as it comes into view and holds while out of it; the kit clock holds it
 * when directed. Reduced motion shows every child settled. */
export default function Sequence(raw: SequenceProps) {
  const props = mergeProps(
    {
      stagger: 0.06,
      from: "start" as StaggerFrom,
      duration: 0.5,
      loop: 1,
      yoyo: false,
      delay: 0,
      paused: false,
      restartOnView: false,
      frameRate: 0,
      as: "div",
    },
    raw,
  )

  let root: HTMLElement | undefined
  const [started, setStarted] = createSignal(false)
  const [hidden, setHidden] = createSignal(false)
  let count = 0
  /** The children whose run is done, and whether the group said so. */
  let ended = new Set<Element>()
  let told = false

  const loops = () => Math.max(1, Math.floor(props.loop))
  const ease = () => {
    if (props.frameRate > 0) return cssSteps(Math.max(1, Math.round(props.duration * props.frameRate)))
    const e = props.easing
    return typeof e === "string" ? e : ((e && cssEasing(e)) ?? "linear")
  }
  /** Where a child settles: an even yoyo lands back at 0. */
  const end = () => (props.yoyo && loops() % 2 === 0 ? 0 : 1)

  function children(): HTMLElement[] {
    return root ? (Array.from(root.children) as HTMLElement[]) : []
  }

  function complete(): void {
    for (const child of children()) child.setAttribute("data-seq", "done")
    props.onComplete?.()
  }

  /** Lay the stagger on the children as they stand, and play from 0. */
  function start(): void {
    const node = root
    if (!node) return
    const kids = children()
    count = kids.length
    ended = new Set()
    told = false
    kids.forEach((child, i) => {
      child.style.setProperty("--seq-delay", `${props.delay + staggerDelay(i, count, props.stagger, props.from)}s`)
      child.setAttribute("data-seq", "before")
    })
    // A replay: the run is dropped and set again on a fresh style, so every
    // child's animation starts over.
    node.removeAttribute("data-seq-run")
    void node.offsetWidth
    setStarted(true)
    node.setAttribute("data-seq-run", "")
    if (count === 0 || pixelPrefersReducedMotion()) complete()
  }

  /** Where a child stands, read off its animation (a seek back turns it
   * too), or off the event where the browser keeps no animation list. */
  function stateOf(child: Element, e: AnimationEvent): string {
    const run = child.getAnimations?.().find((a) => (a as CSSAnimation).animationName === "dk-seq")
    if (!run?.effect) return child === e.target ? (e.type === "animationstart" ? "active" : "done") : ""
    const timing = run.effect.getComputedTiming()
    const local = Number(timing.localTime)
    const delay = Number(run.effect.getTiming().delay) || 0
    return local < delay ? "before" : local >= Number(timing.endTime) ? "done" : "active"
  }

  /** As any child's phase turns, every child says where it stands now:
   * events come with the frame after the change, so one may arrive after
   * the moment has moved on. */
  function place(e: AnimationEvent): void {
    if (e.animationName !== "dk-seq" || (e.target as Element).parentElement !== root) return
    for (const child of children()) {
      const state = stateOf(child, e)
      if (!state) continue
      child.setAttribute("data-seq", state)
      if (state === "done") ended.add(child)
      else ended.delete(child)
    }
    if (!told && ended.size === count) {
      told = true
      props.onComplete?.()
    }
  }

  onMount(() => {
    createEffect(on(() => props.restartKey, start, { defer: true }))
    if (typeof IntersectionObserver === "undefined") {
      start() // no gate available: play on mount
      return
    }
    // The observer starts the run and gates it: out of view it holds where
    // it stands, back in view it goes on (or replays, with restartOnView).
    const io = new IntersectionObserver((entries) => {
      const visible = latestEntry(entries)?.isIntersecting ?? true
      setHidden(!visible)
      if (visible && (!started() || props.restartOnView)) start()
    })
    if (root) io.observe(root)
    onCleanup(() => io.disconnect())
  })

  return (
    <Dynamic
      component={props.as}
      ref={(el: HTMLElement) => (root = el)}
      class={cn("dither-sequence", props.class)}
      style={{
        "--seq-dur": `${Math.max(0.001, props.duration)}s`,
        "--seq-ease": ease(),
        "--seq-loops": String(loops()),
        "--seq-dir": props.yoyo ? "alternate" : "normal",
        "--seq-end": String(end()),
      }}
      data-paused={props.paused || hidden() ? "" : undefined}
      on:animationstart={place}
      on:animationend={place}
    >
      {props.children}
    </Dynamic>
  )
}
