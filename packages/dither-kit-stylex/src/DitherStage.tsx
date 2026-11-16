// Generated from @dither-ui/kit/solid/DitherStage.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
// A stage: one size query container, one clock. Layers inside run keyframes
// in the stage's units — "20cqw" is a fifth of this box whatever its size —
// and read the stage's moment: free-running it is this rAF loop (visibility
// gated, stop-motion capable, looping over `duration`), directed it is the
// kit clock's, so a stage seeks and exports to video like any surface.
import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from "solid-js"
import { Dynamic } from "solid-js/web"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import type { CqBox } from "@dither-ui/kit/engine/keyframes.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { frameIndex } from "@dither-ui/kit/engine/timing.ts"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import "@dither-ui/kit/solid/DitherStage.css"

/** What layers read from their stage: the moment, the measured box, and
 * whether motion is reduced (every layer then sits at its settled end). */
export type StageContext = { time: Accessor<number>; box: Accessor<CqBox>; reduced: Accessor<boolean> }
export const STAGE = createContext<StageContext>()

/** What a function child receives: each member read where it is used, so it
 * follows the stage. */
export type StageSlot = { readonly time: number; readonly width: number; readonly height: number }

export type DitherStageProps = {
  /** Seconds of one cycle of the stage's clock (it loops); unset, time runs on.
   * @docs number (s): the stage clock loops over it; unset, time runs on */
  duration?: number
  /** Clock multiplier.
   * @docs number: clock multiplier */
  speed?: number
  paused?: boolean
  /** Stop-motion cadence in fps (0 = smooth) — see timing.ts.
   * @docs number (fps, 0 = smooth) */
  frameRate?: number
  /** Change to restart from 0.
   * @docs unknown: change to restart from 0 */
  restartKey?: unknown
  /** @docs element tag */
  as?: string
  /** @docs passthrough class. Give the stage a height: it is a size query container */
  class?: string
  xstyle?: StyleProp
  /** @docs function of { time, width, height }: the moment and the measured content box */
  children?: JSX.Element | ((scope: StageSlot) => JSX.Element)
}

export default function DitherStage(raw: DitherStageProps) {
  const props = mergeProps({ speed: 1, paused: false, frameRate: 0, as: "div" }, raw)

  let root: HTMLElement | undefined
  // The stage's own clock, seconds (written at its frames), and the kit
  // clock's moment while it is directed: the time shown is read off them, so
  // a new speed or duration shows at once.
  const [own, setOwn] = createSignal(0)
  const [moment, setMoment] = createSignal<number | null>(null)
  const [box, setBox] = createSignal<CqBox>({ width: 0, height: 0 })
  const [reduced, setReduced] = createSignal(false)

  let raf = 0
  let last = 0
  let elapsed = 0
  let lastFrame = -1
  let ro: ResizeObserver | null = null

  const wrap = (t: number): number =>
    props.duration && props.duration > 0 ? ((t % props.duration) + props.duration) % props.duration : t
  const time = createMemo(() => {
    const ms = moment()
    return wrap(ms === null ? own() : (ms / 1000) * props.speed)
  })

  function frame(now: number): void {
    raf = 0
    if (props.paused || isDirected()) return
    const fps = props.frameRate
    const cap = fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
    const dt = last ? Math.min(cap, (now - last) / 1000) : 0
    last = now
    elapsed += dt * props.speed
    // Stop-motion holds the written moment between boundaries; the clock keeps counting.
    const idx = fps > 0 ? frameIndex(elapsed * 1000, fps) : -1
    if (fps <= 0 || idx !== lastFrame) {
      lastFrame = idx
      setOwn(elapsed)
    }
    raf = requestAnimationFrame(frame)
  }

  function play(): void {
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    setMoment(null)
    if (reduced() || props.paused || raf) return
    last = 0
    lastFrame = -1
    raf = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  /** Directed: the composition's moment (looped over `duration`), no frames. */
  function seekTo(ms: number): void {
    stop()
    setMoment(ms)
  }

  function restart(): void {
    stop()
    elapsed = 0
    setOwn(0)
    play()
  }

  // Read before the loop below can start: a reduced stage never plays.
  onMount(() => setReduced(pixelPrefersReducedMotion()))
  createInviewLoop(() => root, play, stop)

  onMount(() => {
    const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))
    createEffect(on(() => props.restartKey, restart, { defer: true }))
    createEffect(
      on(
        () => props.paused,
        (paused) => (paused ? stop() : play()),
        { defer: true },
      ),
    )
    const node = root
    if (node) {
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(([entry]) => {
          if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
        })
        ro.observe(node)
      } else setBox({ width: node.clientWidth, height: node.clientHeight })
    }
    onCleanup(() => {
      unseek()
      stop()
      ro?.disconnect()
      ro = null
    })
  })

  const state = createMemo(() =>
    reduced() ? "still" : props.paused ? "paused" : moment() !== null ? "directed" : "playing",
  )
  const style = createMemo<JSX.CSSProperties>(() => ({
    "container-type": "size",
    "container-name": "stage",
    "--cq-w": String(Math.round(box().width)),
    "--cq-h": String(Math.round(box().height)),
  }))
  const scope: StageSlot = {
    get time() {
      return time()
    },
    get width() {
      return box().width
    },
    get height() {
      return box().height
    },
  }

  return (
    <STAGE.Provider value={{ time, box, reduced }}>
      <Dynamic
        component={props.as}
        ref={(el: HTMLElement) => (root = el)}
        class={cn("dither-stage", props.xstyle, props.class)}
        style={style()}
        data-stage={state()}
        data-stage-time={time().toFixed(2)}
      >
        {(() => {
          const c = props.children
          return typeof c === "function" ? c(scope) : c
        })()}
      </Dynamic>
    </STAGE.Provider>
  )
}
