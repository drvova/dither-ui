import { createMemo, type JSX, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { paintShapeBlur, type ShapeBlurParams } from "../engine/shape-blur"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { ShapeBlurParams }
export { paintShapeBlur }

export type ShapeBlurProps = {
  /** @docs string[] (hex)
   * @default ['#5227FF', '#7CFF67'] */
  colors?: string[]
  size?: number
  speed?: number
  softness?: number
  mouseInteraction?: boolean
  /** @docs number (0-1) */
  opacity?: number
  /** @docs number (0-1) | boolean
   * @default 1 */
  dither?: number | boolean
  mouseStrength?: number
  paused?: boolean
  dpr?: number
  /** @docs string
   * @default undefined */
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  /** @default undefined */
  seed?: number
  /** @docs number (fps, stop-motion)
   * @default 0 (smooth) */
  frameRate?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number } */
  precompiled?: PrecompiledDither
  class?: string
}

const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

export default function ShapeBlur(raw: ShapeBlurProps) {
  const props = mergeProps(
    {
      colors: ["#5227FF", "#7CFF67"],
      size: 0.4,
      speed: 0.6,
      softness: 0.3,
      opacity: 1,
      dither: 0.6 as number | boolean,
      mouseInteraction: true,
      mouseStrength: 0.5,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<ShapeBlurParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    size: props.size,
    speed: props.speed,
    softness: props.softness,
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
    render: (buffer, clock) => paintShapeBlur(buffer, params(), clock, matrix(), props.mouseInteraction ? mouse : null),
  })

  function onPointerMove(e: PointerEvent) {
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
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
