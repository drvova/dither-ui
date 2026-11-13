// Generated from ../solid/Ferrofluid.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { paintFerrofluid, type FerrofluidParams } from "../engine/ferrofluid"
import { hexToRgb } from "../engine/palette"
import { clamp01 } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import { createDitherBackground } from "../solid/runtime/surface"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
})

export type { FerrofluidParams }
export { paintFerrofluid }

export type FlowDirection = "up" | "down" | "left" | "right"

// Sampling drift is the negative of the on-screen direction: to make blobs
// travel down the screen, the field is read from the row above.
const FLOW_VEC: Record<FlowDirection, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [1, 0],
  right: [-1, 0],
}

export type FerrofluidProps = {
  colors?: string[]
  speed?: number
  scale?: number
  turbulence?: number
  fluidity?: number
  rimWidth?: number
  sharpness?: number
  shimmer?: number
  glow?: number
  flowDirection?: FlowDirection
  opacity?: number
  dither?: number | boolean
  mouseInteraction?: boolean
  mouseStrength?: number
  mouseRadius?: number
  mouseDampening?: number
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  paused?: boolean
  frameRate?: number
  dpr?: number
  seed?: number
  renderMode?: DitherRenderMode
  precompiled?: PrecompiledDither
  class?: string
  xstyle?: StyleProp
}

// A ~4px backing cell keeps the fbm affordable; dpr scales it for sharpness.
const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

export default function Ferrofluid(raw: FerrofluidProps) {
  const props = mergeProps(
    {
      colors: ["#27FF64", "#7CFF67", "#A8FFB6"],
      speed: 0.5,
      scale: 1.6,
      turbulence: 1,
      fluidity: 0.1,
      rimWidth: 0.2,
      sharpness: 2.5,
      shimmer: 1.5,
      glow: 2,
      flowDirection: "down" as FlowDirection,
      opacity: 1,
      dither: 1 as number | boolean,
      mouseInteraction: true,
      mouseStrength: 1,
      mouseRadius: 0.35,
      mouseDampening: 0.15,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<FerrofluidParams>(() => {
    const flow = FLOW_VEC[props.flowDirection]
    return {
      colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
      speed: props.speed,
      scale: props.scale,
      turbulence: props.turbulence,
      fluidity: props.fluidity,
      rimWidth: props.rimWidth,
      sharpness: props.sharpness,
      shimmer: props.shimmer,
      glow: props.glow,
      flowX: flow[0],
      flowY: flow[1],
      opacity: clamp01(props.opacity),
      dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
      mouseStrength: props.mouseStrength,
      mouseRadius: props.mouseRadius,
    }
  })
  const matrix = useDitherMatrix(() => props.seed)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const target = { x: 0.5, y: 0.5 }
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
    render: (buffer, clock, dt) => {
      // Eased pointer follow: mouseDampening is the time constant in seconds.
      const tau = props.mouseDampening
      if (tau <= 0 || dt <= 0) {
        mouse.x = target.x
        mouse.y = target.y
      } else {
        const k = 1 - Math.exp(-dt / tau)
        mouse.x += (target.x - mouse.x) * k
        mouse.y += (target.y - mouse.y) * k
      }
      paintFerrofluid(buffer, params(), clock, matrix(), props.mouseInteraction ? mouse : null)
    },
  })

  function onPointerMove(e: PointerEvent) {
    const c = canvas
    if (!c) return
    const r = c.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    target.x = (e.clientX - r.left) / r.width
    target.y = (e.clientY - r.top) / r.height
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
