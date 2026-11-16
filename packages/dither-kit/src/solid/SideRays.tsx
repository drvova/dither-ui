import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { paintRays, type RaysParams } from "../engine/rays"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { RaysParams }
export { paintRays }

export type SideRaysProps = {
  /** @docs string[] (≤ 8 hex)
   * @default ['#3DA5FF', '#7CE0FF'] */
  colors?: string[]
  side?: "left" | "right"
  rayCount?: number
  speed?: number
  spread?: number
  falloff?: number
  glow?: number
  /** @docs number 0…1 */
  opacity?: number
  /** @docs number 0…1 | boolean */
  dither?: number | boolean
  paused?: boolean
  /** @docs number (fps, stop-motion)
   * @default 0 (smooth) */
  frameRate?: number
  /** @default devicePixelRatio */
  dpr?: number
  /** @docs string
   * @default undefined */
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  /** @default undefined */
  seed?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number } */
  precompiled?: PrecompiledDither
  /** @default undefined */
  class?: string
}

const CELL = 4
const MAX_COLS = 260
const MAX_ROWS = 160

export default function SideRays(raw: SideRaysProps) {
  const props = mergeProps(
    {
      colors: ["#3DA5FF", "#7CE0FF"],
      side: "left" as "left" | "right",
      rayCount: 12,
      speed: 0.4,
      spread: 1,
      falloff: 0.6,
      glow: 1.5,
      opacity: 1,
      dither: 1 as number | boolean,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<RaysParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    sourceX: props.side === "right" ? 1.05 : -0.05,
    sourceY: 0.5,
    rayCount: props.rayCount,
    speed: props.speed,
    spread: props.spread,
    falloff: props.falloff,
    glow: props.glow,
    opacity: clamp01(props.opacity),
    dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
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
    restart: () => [props.seed, props.side, props.renderMode, precompiled(), props.dpr],
    render: (buffer, clock) => paintRays(buffer, params(), clock, matrix()),
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
