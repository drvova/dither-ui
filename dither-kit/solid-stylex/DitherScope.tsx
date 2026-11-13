// Generated from ../solid/DitherScope.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, For, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { fillOf, pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
import { paintScope, SCOPE_DIVISIONS, type ScopeSignal } from "../engine/scope"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import { createCanvasVisibility } from "../solid/runtime/visibility"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  svg: {
    position: "absolute",
    inset: "0px",
    height: "100%",
    width: "100%",
    fontFamily: "var(--font-mono)",
  },
  frame: {
    position: "relative",
    aspectRatio: "5/4",
    width: "100%",
    overflow: "hidden",
    color: "var(--foreground)",
  },
})

export type DitherScopeProps = {
  signal?: ScopeSignal
  /** Cycles of a named wave across the screen. */
  cycles?: number
  /** Cycles a second a named wave drifts; 0 holds it. */
  speed?: number
  /** The trace's height, 1 filling the screen. */
  gain?: number
  /** The trail of earlier phases, 0 (none) to 1. */
  afterglow?: number
  /** What it traces (also its accessible name). */
  label?: string
  color?: PixelColor
  seed?: number
  class?: string
  xstyle?: StyleProp
}

const CELL = 2
const FRAME_MS = 33
const [ACROSS, UP] = SCOPE_DIVISIONS

/** Scope: an oscilloscope screen tracing a signal (`role="img"`). A named
 * wave (`sine`, `square`, `triangle`, `saw`) drifts at `speed` cycles a
 * second with an afterglow of its earlier phases; samples (-1..1 across the
 * screen) trace as given, repainted when they change. The beam prints
 * through the threshold matrix, bright where it moves slowly and faint on
 * its edges, over a graticule of 10 by 8 divisions. Under reduced motion,
 * or off screen, the wave holds still; a director's clock sets its phase.
 * 5:4, as wide as its box. */
export default function DitherScope(raw: DitherScopeProps) {
  const props = mergeProps(
    {
      signal: "sine" as ScopeSignal,
      cycles: 2,
      speed: 0.5,
      gain: 0.8,
      afterglow: 0.6,
      color: "green" as PixelColor,
    },
    raw,
  )

  const matrix = useDitherMatrix(() => props.seed)
  let root: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let w = 0
  let h = 0
  let phase = 0

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!ctx || w <= 0) return
    paintScope(
      ctx,
      w,
      h,
      fillOf(props.color),
      { signal: props.signal, cycles: props.cycles, phase, gain: props.gain, afterglow: props.afterglow },
      matrix(),
    )
  }

  function resize() {
    if (!root || !canvas) return
    w = Math.max(20, Math.round(root.getBoundingClientRect().width / CELL))
    h = Math.round((w * UP) / ACROSS)
    canvas.width = w
    canvas.height = h
    paint()
  }

  // The drift: a frame every FRAME_MS while it is seen, a moving wave and motion allowed.
  const drifts = () => typeof props.signal === "string" && props.speed !== 0 && !pixelPrefersReducedMotion()
  let raf = 0
  let last = 0
  const frame = (now: number) => {
    raf = 0
    if (!visible() || isDirected() || !drifts()) return
    if (now - last >= FRAME_MS) {
      last = now
      phase = (now / 1000) * props.speed
      paint()
    }
    raf = requestAnimationFrame(frame)
  }
  const wake = () => {
    if (isDirected()) {
      phase = ((directedTime() ?? 0) / 1000) * props.speed
      paint()
    } else if (!raf && drifts()) raf = requestAnimationFrame(frame)
  }
  const visible = createCanvasVisibility(() => root, wake)

  onMount(() => {
    const unseek = onSeek((ms) => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      if (ms === null) return wake()
      phase = drifts() ? (ms / 1000) * props.speed : 0
      paint()
    })

    createEffect(
      on(
        [matrix, () => props.signal, () => props.cycles, () => props.gain, () => props.afterglow, () => props.color],
        paint,
        { defer: true },
      ),
    )
    createEffect(on([() => props.speed, () => props.signal], wake, { defer: true }))

    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      resize()
      wake()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        if (root) ro.observe(root)
      }
    })
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    })
  })

  /** The graticule: a line on each division, the centre axes ticked in fifths. */
  const lines = {
    across: Array.from({ length: ACROSS - 1 }, (_, i) => (i + 1) * 10).filter((x) => x !== 50),
    up: Array.from({ length: UP - 1 }, (_, i) => (i + 1) * 10).filter((y) => y !== 40),
    ticksX: Array.from({ length: ACROSS * 5 - 1 }, (_, i) => (i + 1) * 2),
    ticksY: Array.from({ length: UP * 5 - 1 }, (_, i) => (i + 1) * 2),
  }
  const name = createMemo(() => props.label ?? (typeof props.signal === "string" ? `${props.signal} wave` : "Signal"))

  return (
    <div ref={(el) => (root = el)} role="img" aria-label={name()} class={cn(styles.frame, props.xstyle, props.class)}>
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated" }}
      />
      <svg viewBox="0 0 100 80" aria-hidden="true" {...stylex.props(styles.svg)}>
        <g stroke="currentColor" stroke-width="0.25" opacity="0.18">
          <For each={lines.across}>{(x) => <line x1={x} y1="0" x2={x} y2="80" />}</For>
          <For each={lines.up}>{(y) => <line x1="0" y1={y} x2="100" y2={y} />}</For>
        </g>
        <g stroke="currentColor" stroke-width="0.3" opacity="0.4">
          <line x1="50" y1="0" x2="50" y2="80" />
          <line x1="0" y1="40" x2="100" y2="40" />
          <For each={lines.ticksX}>{(x) => <line x1={x} y1="39.2" x2={x} y2="40.8" />}</For>
          <For each={lines.ticksY}>{(y) => <line x1="49.2" y1={y} x2="50.8" y2={y} />}</For>
        </g>
        <Show when={props.label}>
          <text x="3" y="6" font-size="4" fill="currentColor" opacity="0.65">
            {props.label}
          </text>
        </Show>
      </svg>
    </div>
  )
}
