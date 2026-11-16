// Generated from @dither-ui/kit/solid/FlowField.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintFlowField, fadeRasterAlpha, type FlowFieldParams } from "@dither-ui/kit/engine/flow-field.ts"
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

export type { FlowFieldParams }
export { paintFlowField, fadeRasterAlpha }

export type FlowFieldProps = {
  /** @docs string[] (≤ 8 hex)
   * @default ['#f4f8ff', '#c9dbff', '#7ba3ee'] */
  colors?: string[]
  count?: number
  speed?: number
  /** @docs number (noise frequency) */
  scale?: number
  /** @docs number 0…1 (trail length) */
  fade?: number
  glow?: number
  /** @docs number 0…1 */
  opacity?: number
  /** @docs number 0…1 | boolean */
  dither?: number | boolean
  /** edge fade mask on the wrapper: soft radial pool, horizontal sweep, or none. */
  mask?: "radial" | "linear" | "none"
  paused?: boolean
  /** the brief's lock: 60 keeps every vsync; 0 = the smooth ~30fps throttle.
   * @docs number (fps, stop-motion) */
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
const MAX_COLS = 320
const MAX_ROWS = 200

const MASKS: Record<string, string | undefined> = {
  radial: "radial-gradient(120% 120% at 50% 40%, black 45%, transparent 100%)",
  linear: "linear-gradient(to bottom, black 60%, transparent 100%)",
}

export default function FlowField(raw: FlowFieldProps) {
  const props = mergeProps(
    {
      colors: ["#f4f8ff", "#c9dbff", "#7ba3ee"],
      count: 2400,
      speed: 0.7,
      scale: 1.4,
      fade: 0.96,
      glow: 1,
      opacity: 1,
      dither: 1 as number | boolean,
      mask: "radial" as "radial" | "linear" | "none",
      paused: false,
      frameRate: 60,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<FlowFieldParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#f4f8ff"]).slice(0, 8).map(hexToRgb),
    count: props.count,
    speed: props.speed,
    scale: props.scale,
    fade: clamp01(props.fade),
    glow: props.glow,
    opacity: clamp01(props.opacity),
    dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
    seed: props.seed ?? 1,
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
    restart: () => [props.seed, props.renderMode, precompiled(), props.dpr, props.count],
    render: (buffer, clock, dt, elapsed) => paintFlowField(buffer, params(), clock, dt, matrix(), elapsed),
  })

  return (
    <div
      ref={(el) => (wrap = el)}
      aria-hidden="true"
      class={cn(styles.frame, props.xstyle, props.class)}
      style={{
        "mask-image": MASKS[props.mask],
        "-webkit-mask-image": MASKS[props.mask],
        "mix-blend-mode": props.mixBlendMode,
      }}
    >
      <Show
        when={precompiled()}
        fallback={
          <canvas
            ref={(el) => (canvas = el)}
            {...stylex.props(styles.canvas)}
            style={{ "image-rendering": "pixelated" }}
          />
        }
      >
        {(src) => <img src={src()} alt="" {...stylex.props(styles.img)} style={{ "image-rendering": "pixelated" }} />}
      </Show>
    </div>
  )
}
