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

export type LightRaysProps = {
  colors?: string[]
  rayCount?: number
  speed?: number
  spread?: number
  falloff?: number
  glow?: number
  opacity?: number
  dither?: number | boolean
  paused?: boolean
  frameRate?: number
  dpr?: number
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  seed?: number
  renderMode?: DitherRenderMode
  precompiled?: PrecompiledDither
  class?: string
}

const CELL = 4
const MAX_COLS = 260
const MAX_ROWS = 160

export default function LightRays(raw: LightRaysProps) {
  const props = mergeProps(
    {
      colors: ["#FFD23D", "#FF8A3D"],
      rayCount: 16,
      speed: 0.4,
      spread: 1.2,
      falloff: 0.7,
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
    sourceX: 0.5,
    sourceY: -0.05,
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
    restart: () => [props.seed, props.renderMode, precompiled(), props.dpr],
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
