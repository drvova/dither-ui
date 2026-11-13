// Generated from ../solid/FaultyTerminal.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { paintFaultyTerminal, type FaultyTerminalParams } from "../engine/faulty-terminal"
import { clamp01, fillOf, type PixelColor } from "../engine/pixel"
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

export type { FaultyTerminalParams }
export { paintFaultyTerminal }

export type FaultyTerminalProps = {
  scale?: number
  gridMul?: [number, number]
  digitSize?: number
  timeScale?: number
  pause?: boolean
  frameRate?: number
  scanlineIntensity?: number
  glitchAmount?: number
  flickerAmount?: number
  noiseAmp?: number
  chromaticAberration?: number
  dither?: number | boolean
  curvature?: number
  tint?: PixelColor
  mouseReact?: boolean
  mouseStrength?: number
  pageLoadAnimation?: boolean
  brightness?: number
  seed?: number
  renderMode?: DitherRenderMode
  precompiled?: PrecompiledDither
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  class?: string
  xstyle?: StyleProp
}

// A background cell of ~3px keeps the fbm affordable; low caps because the
// wall is decorative and the pixelated upscale is part of the look.
const CELL = 3
const MAX_COLS = 220
const MAX_ROWS = 140

export default function FaultyTerminal(raw: FaultyTerminalProps) {
  const props = mergeProps(
    {
      scale: 1.5,
      gridMul: [2, 1] as [number, number],
      digitSize: 1.2,
      timeScale: 1,
      pause: false,
      frameRate: 0,
      scanlineIntensity: 1,
      glitchAmount: 1,
      flickerAmount: 1,
      noiseAmp: 1,
      chromaticAberration: 0,
      dither: 0 as number | boolean,
      curvature: 0,
      tint: "#ffffff" as PixelColor,
      mouseReact: true,
      mouseStrength: 0.5,
      pageLoadAnimation: false,
      brightness: 1,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const params = createMemo<FaultyTerminalParams>(() => ({
    scale: props.scale,
    gridMulX: props.gridMul[0],
    gridMulY: props.gridMul[1],
    digitSize: props.digitSize,
    scanlineIntensity: props.scanlineIntensity,
    glitchAmount: props.glitchAmount,
    flickerAmount: props.flickerAmount,
    noiseAmp: props.noiseAmp,
    chromaticAberration: props.chromaticAberration,
    dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
    curvature: props.curvature,
    tint: fillOf(props.tint),
    brightness: props.brightness,
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
    dpr: () => 1,
    paused: () => props.pause,
    frameRate: () => props.frameRate,
    renderMode: () => props.renderMode,
    precompiled,
    restart: () => [props.seed, props.renderMode, precompiled(), props.pageLoadAnimation],
    timeScale: () => props.timeScale,
    staticClock: 3,
    render: (buffer, clock, _dt, elapsed) => {
      const fade = props.pageLoadAnimation ? clamp01(elapsed / 900) : 1
      paintFaultyTerminal(buffer, params(), clock, matrix(), props.mouseReact ? mouse : null, fade)
    },
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
