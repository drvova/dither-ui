// Generated from @dither-ui/kit/solid/DitherReveal.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import { type EasingInput, resolveEasing } from "@dither-ui/kit/engine/dither-paint.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import {
  BAYER8,
  bayerMatrix,
  type WipeDirection,
  type WipeOptions,
  type WipeStyle,
  wipeStyle,
} from "@dither-ui/kit/engine/wipe.ts"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
})

export type { WipeDirection, WipeOptions, WipeStyle }
export { BAYER8, bayerMatrix, wipeStyle }

export type DitherRevealProps = {
  /** Manual progress 0-1 (a timeline's); unset, the reveal plays `duration` seconds on the kit clock.
   * @docs number 0–1 (manual; unset plays on the clock) */
  progress?: number
  /** @docs number (s) */
  duration?: number
  /** @docs number (s) */
  delay?: number
  /** Where the front travels; "none" dissolves in place.
   * @docs 'none' | 'right' | 'left' | 'down' | 'up' | 'iris'
   * @default 'none' (dissolve) */
  direction?: WipeDirection
  /** Cell size in CSS px.
   * @docs number (px) */
  cell?: number
  /** Directional wipes: the dithered band's width in cells.
   * @docs number (cells; directional wipes) */
  band?: number
  /** A seeded 4x4 matrix instead of the 8x8 Bayer.
   * @docs number (a seeded 4×4 matrix)
   * @default none (Bayer 8×8) */
  seed?: number
  /** Hide instead of reveal as progress grows.
   * @docs boolean (hide instead) */
  reverse?: boolean
  /** @default 'ease-in-out' */
  easing?: EasingInput
  /** Change to play again.
   * @docs unknown (change to replay) */
  restartKey?: unknown
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
  /** Passed on to the wrapper: a page relies on it. */
  "aria-hidden"?: boolean | "true" | "false"
  "data-phase"?: string
}

export default function DitherReveal(raw: DitherRevealProps) {
  const props = mergeProps(
    {
      duration: 1.2,
      delay: 0,
      direction: "none" as WipeDirection,
      cell: 4,
      band: 12,
      reverse: false,
      easing: "ease-in-out" as EasingInput,
    },
    raw,
  )

  let wrapRef: HTMLDivElement | undefined
  const [size, setSize] = createSignal({ width: 0, height: 0 })
  /** Seconds played so far, the delay included: a paused reveal resumes here
   * (a reveal paused in its delay waits out the rest of it). How far it has
   * played is read off it, so a new duration or delay shows at once. */
  const [elapsed, setElapsed] = createSignal(0)
  const played = createMemo(() => Math.max(0, Math.min(1, (elapsed() - props.delay) / Math.max(0.001, props.duration))))
  let raf = 0
  let start = 0
  let ro: ResizeObserver | null = null

  function tick(now: number) {
    raf = 0
    setElapsed((now - start) / 1000)
    if (played() < 1) raf = requestAnimationFrame(tick)
  }

  /** Start or resume the timed reveal (idempotent; a finished reveal stays;
   * a manual `progress` has no clock of its own to run). */
  function play() {
    if (props.progress !== undefined || raf || played() >= 1) return
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    if (pixelPrefersReducedMotion()) {
      setElapsed(Infinity)
      return
    }
    start = performance.now() - elapsed() * 1000
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function seekTo(ms: number) {
    stop()
    setElapsed(ms / 1000)
  }

  function restart() {
    stop()
    setElapsed(0)
    play()
  }

  createInviewLoop(() => wrapRef, play, stop)

  onMount(() => {
    createEffect(on(() => props.restartKey, restart, { defer: true }))
    // A finished reveal lengthened past where it stands plays on from there.
    createEffect(on([() => props.duration, () => props.delay], () => elapsed() > 0 && play(), { defer: true }))
    const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))
    const el = wrapRef
    if (el) {
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(([entry]) => {
          if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
        })
        ro.observe(el)
      } else requestAnimationFrame(() => setSize({ width: el.clientWidth, height: el.clientHeight }))
    }
    onCleanup(() => {
      unseek()
      stop()
      ro?.disconnect()
    })
  })

  const effective = createMemo(() => {
    const value =
      props.progress === undefined ? resolveEasing(props.easing)(played()) : Math.max(0, Math.min(1, props.progress))
    return props.reverse ? 1 - value : value
  })
  const mask = createMemo(() =>
    wipeStyle(effective(), {
      cell: props.cell,
      seed: props.seed,
      direction: props.direction,
      band: props.band,
      width: size().width,
      height: size().height,
    }),
  )
  const style = createMemo<JSX.CSSProperties | undefined>(() => {
    const m = mask()
    return m
      ? {
          "mask-image": m.image,
          "-webkit-mask-image": m.image,
          "mask-size": m.size,
          "-webkit-mask-size": m.size,
          "mask-repeat": m.repeat,
          "-webkit-mask-repeat": m.repeat,
          "mask-position": m.position,
          "-webkit-mask-position": m.position,
        }
      : undefined
  })
  const state = createMemo(() => (effective() >= 1 ? "shown" : effective() <= 0 ? "hidden" : "playing"))

  return (
    <div
      ref={(el) => (wrapRef = el)}
      class={cn(styles.frame, props.xstyle, props.class)}
      style={style()}
      data-reveal={state()}
      aria-hidden={props["aria-hidden"]}
      data-phase={props["data-phase"]}
    >
      {props.children}
    </div>
  )
}
