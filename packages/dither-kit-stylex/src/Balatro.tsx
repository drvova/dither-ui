// Generated from @dither-ui/kit/solid/Balatro.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, Show } from "solid-js"
import { paintBalatro, type BalatroParams } from "@dither-ui/kit/engine/balatro.ts"
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

export type { BalatroParams }
export { paintBalatro }

export type BalatroProps = {
  colors?: string[]
  scale?: number
  speed?: number
  spin?: number
  contrast?: number
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
  xstyle?: StyleProp
}

const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

export default function Balatro(raw: BalatroProps) {
  const props = mergeProps(
    {
      colors: ["#5227FF", "#FF3D2E", "#FFD23D", "#27FF64"],
      scale: 2,
      speed: 0.5,
      spin: 3,
      contrast: 1,
      opacity: 1,
      dither: 1 as number | boolean,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<BalatroParams>(() => ({
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    scale: props.scale,
    speed: props.speed,
    spin: props.spin,
    contrast: props.contrast,
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
    render: (buffer, clock) => paintBalatro(buffer, params(), clock, matrix()),
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
