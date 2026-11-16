import { createMemo, type JSX, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { paintDotField, type DotFieldParams } from "../engine/dot-field"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { DotFieldParams }
export { paintDotField }

export type DotFieldProps = {
  /** @docs string[] (≤ 8 hex)
   * @default ['#5227FF', '#7CFF67'] */
  colors?: string[]
  /** @docs number (dots across) */
  gap?: number
  speed?: number
  /** @docs number (radius breathe) */
  sizeVariation?: number
  glow?: number
  mouseInteraction?: boolean
  mouseStrength?: number
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

const CELL = 3
const MAX_COLS = 260
const MAX_ROWS = 170

export default function DotField(raw: DotFieldProps) {
  const props = mergeProps(
    {
      colors: ["#5227FF", "#7CFF67"],
      gap: 26,
      speed: 0.5,
      sizeVariation: 1,
      glow: 1.5,
      opacity: 1,
      dither: 1 as number | boolean,
      mouseInteraction: true,
      mouseStrength: 1,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<DotFieldParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    gap: props.gap,
    speed: props.speed,
    sizeVariation: props.sizeVariation,
    glow: props.glow,
    opacity: clamp01(props.opacity),
    dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
    mouseStrength: props.mouseStrength,
  }))
  const matrix = useDitherMatrix(() => props.seed)
  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const mouse = { x: 0.5, y: 0.5 }

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
    render: (buffer, clock) => paintDotField(buffer, params(), clock, matrix(), props.mouseInteraction ? mouse : null),
  })

  function onPointerMove(e: PointerEvent) {
    const c = canvas
    if (!c) return
    const r = c.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    mouse.x = (e.clientX - r.left) / r.width
    mouse.y = (e.clientY - r.top) / r.height
  }
  onMount(() => {
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    onCleanup(() => window.removeEventListener("pointermove", onPointerMove))
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
