import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintDarkVeil, type DarkVeilParams } from "../engine/dark-veil"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { DarkVeilParams }
export { paintDarkVeil }

export type DarkVeilProps = {
  /** @docs string[] (≤ 8 hex)
   * @default ['#0A0A12', '#3A2A6A', '#5227FF'] */
  colors?: string[]
  scale?: number
  speed?: number
  /** @docs number (wisp strength) */
  intensity?: number
  /** @docs number 0…1 (edge dark) */
  vignette?: number
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
const MAX_COLS = 240
const MAX_ROWS = 150

export default function DarkVeil(raw: DarkVeilProps) {
  const props = mergeProps(
    {
      colors: ["#0A0A12", "#3A2A6A", "#5227FF"],
      scale: 3,
      speed: 0.4,
      intensity: 2.5,
      vignette: 0.7,
      opacity: 1,
      dither: 1 as number | boolean,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<DarkVeilParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    scale: props.scale,
    speed: props.speed,
    intensity: props.intensity,
    vignette: props.vignette,
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
    render: (buffer, clock) => paintDarkVeil(buffer, params(), clock, matrix()),
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
