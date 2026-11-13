// Generated from ../solid/DitherProgress.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, mergeProps, on, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { kitFromSeed } from "../engine/dither-paint"
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor, pixelPrefersReducedMotion } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import { createCanvasVisibility } from "../solid/runtime/visibility"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: {
    position: "relative",
    height: "0.375rem",
    width: "100%",
    overflow: "hidden",
    borderRadius: "2px",
  },
})

const BAND_RATIO = 0.4

/** Paint the progress track. `band` null → determinate fill up to `ratio`;
 * otherwise a 40%-wide dithered band starting at cell `band` (wrapping),
 * with the Bayer sampling shifted so the texture itself scrolls. */
function paintProgress(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  ratio: number,
  band: number | null,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  const bandW = Math.max(2, Math.round(cols * BAND_RATIO))
  const span = cols + bandW
  const filled = Math.round(cols * clamp01(ratio))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let density: number | null = null
      let bx = x
      if (band === null) {
        if (x < filled) density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
      } else {
        const p = (((x - band) % span) + span) % span
        if (p < bandW) {
          density = 0.35 + 0.65 * ((p + 0.5) / bandW)
          bx = x - band
        }
      }
      if (density !== null) {
        const lit = density > matrix[y & 3][((bx % 4) + 4) & 3]
        const k = 0.3 + density * 0.7
        px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
      } else {
        const lit = 0.25 > matrix[y & 3][x & 3]
        px.cell(x, y, muted, lit ? 0.2 : 0.06)
      }
    }
  }
  px.flush()
}

const CELL = 2

export type DitherProgressProps = {
  value?: number
  color?: PixelColor
  seed?: number
  indeterminate?: boolean
  class?: string
  xstyle?: StyleProp
  /** The bar's accessible name (Vue let these fall through to the bar). */
  "aria-label"?: string
  "aria-labelledby"?: string
}

export default function DitherProgress(raw: DitherProgressProps) {
  const props = mergeProps({ value: 0, indeterminate: false }, raw)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useDitherMatrix(() => props.seed)

  let rootRef: HTMLDivElement | undefined
  let canvasRef: HTMLCanvasElement | undefined
  // Pause the indeterminate loop while off-screen; syncLoop resumes it on re-entry.
  const isVisible = createCanvasVisibility(
    () => canvasRef,
    () => syncLoop(),
  )

  let raf = 0
  let cols = 0
  const rows = 3 // h-1.5 track at CELL=2
  // The band the canvas holds: it moves one cell per 50ms while the loop runs
  // every frame, so a frame whose band has not moved is not painted again.
  let shown: number | null | undefined

  function paint(band: number | null) {
    const canvas = canvasRef
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!canvas || !ctx || cols <= 0) return
    paintProgress(ctx, cols, rows, fillOf(color()), fillOf("grey"), clamp01(props.value / 100), band, matrix())
    shown = band
  }

  function repaint() {
    shown = undefined
    if (props.indeterminate && !raf) {
      // Reduced motion: a static 40% band, no animation loop.
      const bandW = Math.max(2, Math.round(cols * 0.4))
      paint(Math.round((cols - bandW) / 2))
    } else if (!props.indeterminate) {
      paint(null)
    }
  }

  /** The indeterminate band's column at a moment (one step per 50ms). */
  function bandAt(ms: number): number {
    const bandW = Math.max(2, Math.round(cols * 0.4))
    return (Math.floor(ms / 50) % (cols + bandW)) - bandW
  }

  function tick() {
    if (!isVisible() || isDirected()) {
      raf = 0
      return // off-screen or directed: no loop
    }
    const band = bandAt(performance.now())
    if (band !== shown) paint(band)
    raf = requestAnimationFrame(tick)
  }

  function syncLoop() {
    const animate = props.indeterminate && !pixelPrefersReducedMotion()
    if (animate && isDirected()) {
      paint(bandAt(directedTime() ?? 0))
      return
    }
    if (animate && !raf) raf = requestAnimationFrame(tick)
    if (!animate && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    repaint()
  }

  function resize() {
    const root = rootRef
    const canvas = canvasRef
    if (!root || !canvas) return
    cols = Math.max(4, Math.round(root.getBoundingClientRect().width / CELL))
    canvas.width = cols
    canvas.height = rows
    repaint()
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    // Directed (clock.ts): the band sits where the moment puts it.
    const unseek = onSeek((ms) => {
      if (!props.indeterminate || pixelPrefersReducedMotion()) return
      if (ms === null) {
        syncLoop()
        return
      }
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      paint(bandAt(ms))
    })
    requestAnimationFrame(() => {
      resize()
      syncLoop()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        if (rootRef) ro.observe(rootRef)
      }
    })
    createEffect(on([() => props.value, color, () => props.indeterminate, matrix], syncLoop, { defer: true }))
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    })
  })

  return (
    <div
      ref={(el) => (rootRef = el)}
      role="progressbar"
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      aria-valuemin={props.indeterminate ? undefined : 0}
      aria-valuemax={props.indeterminate ? undefined : 100}
      aria-valuenow={props.indeterminate ? undefined : props.value}
      class={cn(styles.frame, props.xstyle, props.class)}
    >
      <canvas
        ref={(el) => (canvasRef = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated" }}
      />
    </div>
  )
}
