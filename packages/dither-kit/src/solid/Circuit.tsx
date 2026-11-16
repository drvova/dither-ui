import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintCircuit, type CircuitParams } from "../engine/circuit"
import { fillOf, type PixelColor } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { CircuitParams }
export { paintCircuit }

export type CircuitProps = {
  /** The traces, chips and vias.
   * @docs PixelColor (the traces, chips and vias)
   * @default '#a6abb1' */
  ink?: PixelColor
  /** The signals.
   * @docs PixelColor (the signals)
   * @default '#ff9632' */
  pulse?: PixelColor
  /** How much of the board carries traces, 0-1.
   * @docs number 0…1 (how much of the board carries traces) */
  density?: number
  /** Cells a second a signal travels.
   * @docs number (cells a second a signal travels) */
  speed?: number
  /** Cells between lattice nodes.
   * @docs number (cells between lattice nodes) */
  pitch?: number
  paused?: boolean
  /** Stop-motion cadence in fps (0 = smooth). Steps the field like film and
   * skips paints between boundaries (see timing.ts).
   * @docs number (fps, stop-motion)
   * @default 0 (smooth) */
  frameRate?: number
  /** @default devicePixelRatio */
  dpr?: number
  /** @docs string
   * @default undefined */
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  /** @docs number (lays out the board)
   * @default undefined */
  seed?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number } */
  precompiled?: PrecompiledDither
  /** @default undefined */
  class?: string
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
    <div
      ref={(el) => (wrap = el)}
      aria-hidden="true"
      class={cn("relative block h-full w-full overflow-hidden", props.class)}
    >
      <Show
        when={precompiled()}
        fallback={<canvas ref={(el) => (canvas = el)} class="absolute inset-0 h-full w-full" style={style()} />}
      >
        {(src) => <img src={src()} alt="" class="absolute inset-0 h-full w-full object-fill" style={style()} />}
      </Show>
    </div>
  )
}
