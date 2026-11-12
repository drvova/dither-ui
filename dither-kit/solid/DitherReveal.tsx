import { createEffect, createMemo, createSignal, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { type EasingInput, resolveEasing } from "../engine/dither-paint"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { BAYER8, bayerMatrix, type WipeDirection, type WipeOptions, type WipeStyle, wipeStyle } from "../engine/wipe"
import { cn } from "../tailwind/lib"
import { createInviewLoop } from "./runtime/in-view"

export type { WipeDirection, WipeOptions, WipeStyle }
export { BAYER8, bayerMatrix, wipeStyle }

export type DitherRevealProps = {
  /** Manual progress 0-1 (a timeline's); unset, the reveal plays `duration` seconds on the kit clock. */
  progress?: number
  duration?: number
  delay?: number
  /** Where the front travels; "none" dissolves in place. */
  direction?: WipeDirection
  /** Cell size in CSS px. */
  cell?: number
  /** Directional wipes: the dithered band's width in cells. */
  band?: number
  /** A seeded 4x4 matrix instead of the 8x8 Bayer. */
  seed?: number
  /** Hide instead of reveal as progress grows. */
  reverse?: boolean
  easing?: EasingInput
  /** Change to play again. */
  restartKey?: unknown
  class?: string
  children?: JSX.Element
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
  const [played, setPlayed] = createSignal(0)
  let raf = 0
  let start = 0
  /** Seconds played so far, the delay included: a paused reveal resumes here
   * (a reveal paused in its delay waits out the rest of it). */
  let elapsed = 0
  let ro: ResizeObserver | null = null

  const at = (seconds: number) => Math.max(0, Math.min(1, (seconds - props.delay) / Math.max(0.001, props.duration)))

  function tick(now: number) {
    raf = 0
    elapsed = (now - start) / 1000
    setPlayed(at(elapsed))
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
      setPlayed(1)
      return
    }
    start = performance.now() - elapsed * 1000
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function seekTo(ms: number) {
    stop()
    elapsed = ms / 1000
    setPlayed(at(elapsed))
  }

  function restart() {
    stop()
    elapsed = 0
    setPlayed(0)
    play()
  }

  createInviewLoop(() => wrapRef, play, stop)

  onMount(() => {
    createEffect(on(() => props.restartKey, restart, { defer: true }))
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
    <div ref={(el) => (wrapRef = el)} class={cn("relative", props.class)} style={style()} data-reveal={state()}>
      {props.children}
    </div>
  )
}
