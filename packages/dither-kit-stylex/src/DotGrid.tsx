// Generated from @dither-ui/kit/solid/DotGrid.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { paintDotGrid, type DotGridParams } from "@dither-ui/kit/engine/dot-grid.ts"
import { hexToRgb } from "@dither-ui/kit/engine/palette.ts"
import { clamp01 } from "@dither-ui/kit/engine/pixel.ts"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "@dither-ui/kit/engine/precompile.ts"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import { createDitherBackground } from "@dither-ui/kit/solid/runtime/surface.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
})

export type { DotGridParams }
export { paintDotGrid }

export type DotGridProps = {
  /** @docs string[] (≤ 8 hex)
   * @default ['#5227FF', '#7CFF67'] */
  colors?: string[]
  /** @docs number (dots across) */
  gap?: number
  /** @docs number 0…1 (of cell) */
  dotSize?: number
  speed?: number
  glow?: number
  /** @docs number 0…1 */
  opacity?: number
  /** @docs number 0…1 | boolean */
  dither?: number | boolean
  mouseInteraction?: boolean
  mouseStrength?: number
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
  xstyle?: StyleProp
}

const CELL = 3
const MAX_COLS = 260
const MAX_ROWS = 170

export default function DotGrid(raw: DotGridProps) {
  const props = mergeProps(
    {
      colors: ["#5227FF", "#7CFF67"],
      gap: 26,
      dotSize: 0.5,
      speed: 0.5,
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
  const params = createMemo<DotGridParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    gap: props.gap,
    dotSize: props.dotSize,
    speed: props.speed,
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
    render: (buffer, clock) => paintDotGrid(buffer, params(), clock, matrix(), props.mouseInteraction ? mouse : null),
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
