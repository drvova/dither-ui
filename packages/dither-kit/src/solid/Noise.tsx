import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintNoiseField, type NoiseParams } from "../engine/noise-field"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { NoiseParams }
export { paintNoiseField }

export type NoiseProps = {
  /** @docs string[] (hex)
   * @default ['#3DA5FF', '#7CE0FF', '#FFFFFF'] */
  colors?: string[]
  speed?: number
  /** @docs number (0-1) */
  density?: number
  /** @docs number (0-1) */
  opacity?: number
  paused?: boolean
  /** @docs number (fps, stop-motion)
   * @default 0 (smooth) */
  frameRate?: number
  dpr?: number
  /** @docs string */
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  seed?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number } */
  precompiled?: PrecompiledDither
  class?: string
}

const CELL = 3
const MAX_COLS = 300
const MAX_ROWS = 190

export default function Noise(raw: NoiseProps) {
  const props = mergeProps(
    {
      colors: ["#3DA5FF", "#7CE0FF", "#FFFFFF"],
      speed: 1,
      density: 0.5,
      opacity: 1,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<NoiseParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    speed: props.speed,
    density: clamp01(props.density),
    opacity: clamp01(props.opacity),
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
    frameRate: () => props.frameRate,
    renderMode: () => props.renderMode,
    precompiled,
    restart: () => [props.seed, props.renderMode, precompiled(), props.dpr],
    render: (buffer, clock) => paintNoiseField(buffer, params(), clock, matrix()),
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
