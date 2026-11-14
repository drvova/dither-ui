// Generated from @dither-ui/kit/solid/Sequence.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { Dynamic } from "solid-js/web"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { planSequence, sampleSequence, type SequencePlan, type StaggerFrom } from "@dither-ui/kit/engine/sequence.ts"
import { frameIndex, linear, type Easing } from "@dither-ui/kit/engine/timing.ts"
import { cn, type StyleProp } from "./lib"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"

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
  /** Progress easing per cycle — timing.ts (`steps(4)` quantizes).
   * @docs (p) => number from timing.ts
   * @default linear */
  easing?: Easing
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
  /** Stop-motion cadence in fps (0 = smooth) — the kit-wide knob.
   * @docs fps cadence */
  frameRate?: number
  /** Bump to rebuild (children changed) and replay from the start.
   * @docs string | number (bump rebuilds and replays) */
  restartKey?: string | number
  onComplete?: () => void
  as?: string
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

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
  let children: HTMLElement[] = []
  let plan: SequencePlan = { tracks: [], duration: 0 }
  let raf = 0
  let elapsed = 0
  let lastDt = -1 // -1 sentinel: fake clocks legitimately start at 0
  let lastPaint = 0
  let lastFrame = -1
  let started = false
  let finished = false
  /** Last values written per child — skip style work when nothing changed. */
  let written: { p: string; s: string }[] = []

  function write(progress: number, state: string, i: number): void {
    const child = children[i]
    if (!child) return
    const p = progress.toFixed(4)
    const prev = written[i]
    if (prev && prev.p === p && prev.s === state) return
    written[i] = { p, s: state }
    child.style.setProperty("--seq-p", p)
    child.setAttribute("data-seq", state)
  }

  function paint(t: number): void {
    for (const s of sampleSequence(plan, t)) write(s.progress, s.state, s.index)
  }

  function complete(): void {
    if (finished) return
    finished = true
    stop()
    paint(plan.duration) // settle every child at its terminal value
    props.onComplete?.()
  }

  function frame(now: number): void {
    raf = 0
    if (props.paused || isDirected()) return
    // The clock ticks EVERY frame; the gates below only decide whether to write.
    // (Gating the clock itself would freeze the gate's own input.)
    const fps = props.frameRate
    const cap = fps && fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
    const dt = lastDt >= 0 ? Math.min(cap, (now - lastDt) / 1000) : 0
    lastDt = now
    elapsed += dt
    const t = elapsed - props.delay
    if (t >= plan.duration) {
      complete()
      return
    }
    const gate = fps && fps > 0 ? frameIndex(elapsed * 1000, fps) : -1
    if (fps && fps > 0 ? gate === lastFrame : now - lastPaint < 33) {
      raf = requestAnimationFrame(frame)
      return
    }
    lastFrame = gate
    lastPaint = now
    paint(t)
    raf = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  /** Directed (clock.ts): the group sits at the given moment, no frames. */
  function seekTo(ms: number): void {
    stop()
    if (!started) return
    elapsed = ms / 1000
    const t = elapsed - props.delay
    paint(Math.min(t, plan.duration))
  }

  function start(): void {
    stop()
    children = root ? Array.from(root.children).map((el) => el as HTMLElement) : []
    written = children.map(() => ({ p: "", s: "" }))
    plan = planSequence({
      kind: "stagger",
      count: children.length,
      stagger: props.stagger,
      from: props.from,
      node: (i) => ({
        kind: "track",
        id: String(i),
        duration: props.duration,
        easing: props.easing ?? linear,
        loop: props.loop,
        yoyo: props.yoyo,
      }),
    })
    elapsed = 0
    lastDt = -1
    lastPaint = 0
    lastFrame = -1
    started = true
    finished = false
    if (children.length === 0) {
      finished = true
      props.onComplete?.()
      return
    }
    if (pixelPrefersReducedMotion()) {
      complete() // reduced motion: settled end state, no frames requested
      return
    }
    if (props.paused) {
      paint(0 - props.delay) // hold at the start state until released
      return
    }
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    raf = requestAnimationFrame(frame)
  }

  function wake(): void {
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    if (!raf && started && !finished && !props.paused) {
      lastDt = -1 // resume: the first frame back contributes dt 0 (no jump)
      raf = requestAnimationFrame(frame)
    }
  }

  onMount(() => {
    const unseek = onSeek((ms) => (ms === null ? wake() : seekTo(ms)))
    createEffect(
      on(
        () => props.restartKey,
        () => start(),
        { defer: true },
      ),
    )
    createEffect(
      on(
        () => props.paused,
        (paused) => {
          if (paused) stop()
          else if (started && !finished && !pixelPrefersReducedMotion()) wake()
        },
        { defer: true },
      ),
    )
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver === "undefined") {
      start() // no gate available — play on mount (AnimatedContent's floor)
    } else {
      // The observer doubles as start trigger AND visibility gate (loop-visibility
      // contract: no offscreen rAF). Leaving mid-play pauses the clock; re-entry
      // wakes with lastDt=-1, so no time jumps across the pause.
      io = new IntersectionObserver((entries) => {
        const entry = latestEntry(entries)
        const visible = entry?.isIntersecting ?? true
        if (visible) {
          if (!started || props.restartOnView) start()
          else wake()
        } else if (started && !finished) {
          stop()
        }
      })
      if (root) io.observe(root)
    }
    onCleanup(() => {
      unseek()
      stop()
      io?.disconnect()
    })
  })

  return (
    <Dynamic
      component={props.as}
      ref={(el: HTMLElement) => (root = el)}
      class={cn("dither-sequence", props.xstyle, props.class)}
    >
      {props.children}
    </Dynamic>
  )
}
