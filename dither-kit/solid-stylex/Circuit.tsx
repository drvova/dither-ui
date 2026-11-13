// Generated from ../solid/Circuit.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintCircuit, type CircuitParams } from "../engine/circuit"
import { fillOf, type PixelColor } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import { createDitherBackground } from "../solid/runtime/surface"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
})

export type { CircuitParams }
export { paintCircuit }

export type CircuitProps = {
  /** The traces, chips and vias. */
  ink?: PixelColor
  /** The signals. */
  pulse?: PixelColor
  /** How much of the board carries traces, 0-1. */
  density?: number
  /** Cells a second a signal travels. */
  speed?: number
  /** Cells between lattice nodes. */
  pitch?: number
  paused?: boolean
  dpr?: number
  /** Stop-motion cadence in fps (0 = smooth). Steps the field like film and
   * skips paints between boundaries (see timing.ts). */
  frameRate?: number
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  seed?: number
  renderMode?: DitherRenderMode
  precompiled?: PrecompiledDither
  class?: string
  xstyle?: StyleProp
}

const CELL = 3
const MAX_COLS = 320
const MAX_ROWS = 200

/** Circuit: a board printed through the dither. Chips on a lattice, traces
 * leaving their pins in straight runs with 45 degree jogs to a via or a
 * pad, and signals running every trace in the pulse ink, their tails
 * fading through the thresholds. The seed lays the board out; the signals
 * are a pure function of time. */
export default function Circuit(raw: CircuitProps) {
  const props = mergeProps(
    {
      ink: "#a6abb1" as PixelColor,
      pulse: "#ff9632" as PixelColor,
      density: 0.6,
      speed: 14,
      pitch: 4,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<CircuitParams>(() => ({
    ink: fillOf(props.ink),
    pulse: fillOf(props.pulse),
    density: props.density,
    speed: props.speed,
    pitch: props.pitch,
    seed: props.seed ?? 0,
  }))
  const matrix = useDitherMatrix(() => props.seed)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined

  createDitherBackground({
    wrap: () => wrap ?? null,
    canvas: () => canvas ?? null,
    cell: CELL,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr: () => props.dpr,
    paused: () => props.paused,
    renderMode: () => props.renderMode,
    precompiled,
    restart: () => [props.seed, props.renderMode, precompiled(), props.dpr, props.density, props.pitch],
    frameRate: () => props.frameRate,
    render: (buffer, clock) => paintCircuit(buffer, params(), clock, matrix()),
  })

  const style = (): JSX.CSSProperties => ({ "image-rendering": "pixelated", "mix-blend-mode": props.mixBlendMode })
  return (
    <div ref={(el) => (wrap = el)} aria-hidden="true" class={cn(styles.frame, props.xstyle, props.class)}>
      <Show
        when={precompiled()}
        fallback={<canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} style={style()} />}
      >
        {(src) => <img src={src()} alt="" {...stylex.props(styles.img)} style={style()} />}
      </Show>
    </div>
  )
}
