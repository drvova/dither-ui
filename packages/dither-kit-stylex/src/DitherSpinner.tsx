// Generated from @dither-ui/kit/solid/DitherSpinner.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, type JSX, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import { SPINNER_DEFAULT, spinnerFromSeed, type SpinnerParams } from "@dither-ui/kit/engine/dither-paint.ts"
import type { Rgb } from "@dither-ui/kit/engine/palette.ts"
import { BAYER4, fillOf, type PixelColor, pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "@dither-ui/kit/engine/precompile.ts"
import {
  cellCanvas,
  setOrBlendRasterPixel,
  clearRasterBuffer,
  createRasterBuffer,
  putRasterBuffer,
  type RasterBuffer,
} from "@dither-ui/kit/engine/raster.ts"
import { useDitherMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import { createCanvasVisibility } from "@dither-ui/kit/solid/runtime/visibility.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex" },
})

const CELL = 2
const TAU = Math.PI * 2

/** A spinner is a point in a continuous form space, not a preset. Three axes
 * are seeded independently:
 *   • SHAPE  — the silhouette the pattern lives on: a circle ring, a square
 *              box-ring, or a horizontal bar (each pixel gets a path coord t
 *              in 0..1 walking that outline).
 *   • FLOW   — how brightness animates along t: sweep (a comet head chasing
 *              the outline), pulse (the whole shape breathing), or wave (bright
 *              bands travelling the outline).
 *   • DETAIL — arc/taper/segments/spokes/innerRatio carving the lit pattern.
 * So one seed yields a rotating ring, a breathing square, dashes racing a bar,
 * a travelling-wave donut — and everything between. Ranges bounded so no seed
 * is unreadable. ONE render loop draws any point; widen params, never branch
 * per preset. */
/** Perimeter coordinate 0..1 walking a unit-square outline, continuous across
 * corners — the square's answer to a circle's angle. */
function squareT(sx: number, sy: number): number {
  const ax = Math.abs(sx)
  const ay = Math.abs(sy)
  if (sy < 0 && ay >= ax) return (sx + 1) / 8 // top L→R
  if (sx > 0 && ax >= ay) return 0.25 + (sy + 1) / 8 // right T→B
  if (sy > 0 && ay >= ax) return 0.5 + (1 - sx) / 8 // bottom R→L
  return 0.75 + (1 - sy) / 8 // left B→T
}

/** One frame — walk every cell, resolve its outline membership + path coord by
 * SHAPE, its brightness by FLOW, then carve detail and dither. `phase` (0..1)
 * advances over time. */
function paintSpinner(
  ctx: CanvasRenderingContext2D | RasterBuffer,
  cells: number,
  fill: Rgb,
  phase: number,
  matrix: number[][] = BAYER4,
  p: SpinnerParams = SPINNER_DEFAULT,
): void {
  if ("data" in ctx) clearRasterBuffer(ctx)
  const px = "data" in ctx ? null : cellCanvas(ctx, cells, cells)
  const c = cells / 2
  const half = c - 0.5
  const arc = Math.max(0.05, Math.min(1, p.arc))
  const ph = (((phase * p.dir) % 1) + 1) % 1
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const nx = (x + 0.5 - c) / half // -1..1
      const ny = (y + 0.5 - c) / half
      // SHAPE: membership on the outline + path coordinate t (0..1) + angle.
      let lit: boolean
      let t: number
      let ang: number
      if (p.shape === 1) {
        const d = Math.max(Math.abs(nx), Math.abs(ny))
        lit = d >= p.innerRatio && d <= 1
        t = squareT(nx / (d || 1), ny / (d || 1))
        ang = t * TAU
      } else if (p.shape === 2) {
        lit = Math.abs(ny) <= 0.4 && Math.abs(nx) <= 1
        t = (nx + 1) / 2
        ang = t * TAU
      } else {
        const r = Math.hypot(nx, ny)
        lit = r >= p.innerRatio && r <= 1
        ang = (Math.atan2(ny, nx) + TAU) % TAU
        t = ang / TAU
      }
      if (!lit) continue
      // FLOW: brightness along the outline.
      let bright: number
      if (p.flow === 1) {
        bright = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ph * TAU)) // breathe
      } else if (p.flow === 2) {
        bright = (0.5 + 0.5 * Math.sin((t * p.waveCount - ph) * TAU)) ** 1.6 // travelling
      } else {
        const rel = (((t - ph) % 1) + 1) % 1 // sweep head at ph
        bright = rel <= arc ? 1 - p.taper * (rel / arc) : 0
      }
      // DETAIL: dashes along the outline, radial petals on round shapes.
      if (p.segments > 0 && (t * p.segments) % 1 > 0.6) bright = 0
      if (p.spokes > 0 && p.shape !== 2) bright *= 0.35 + 0.65 * Math.abs(Math.cos((ang * p.spokes) / 2)) ** 2
      if (bright <= 0 || bright <= matrix[y & 3][x & 3]) continue
      const alpha = 0.4 + 0.6 * bright
      if (px) px.cell(x, y, fill, alpha)
      else setOrBlendRasterPixel(ctx as RasterBuffer, x, y, fill, alpha)
    }
  }
  px?.flush()
}

export type DitherSpinnerProps = {
  /** @docs number (px) */
  size?: number
  color?: PixelColor
  /** @docs number (samples a spinner form)
   * @default clean arc */
  seed?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number }
   * @default undefined */
  precompiled?: PrecompiledDither
}

export default function DitherSpinner(raw: DitherSpinnerProps) {
  const props = mergeProps({ size: 20, color: "blue" as PixelColor, renderMode: "live" as DitherRenderMode }, raw)

  const spin = createMemo(() => (props.seed !== undefined ? spinnerFromSeed(props.seed) : SPINNER_DEFAULT))
  const matrix = useDitherMatrix(() => props.seed)

  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  let canvasRef: HTMLCanvasElement | undefined

  let teardown: (() => void) | undefined
  let wake: (() => void) | undefined
  let restartToken = 0
  // Pause the spin loop while scrolled/panned off-screen; resume on re-entry.
  const isVisible = createCanvasVisibility(
    () => canvasRef,
    () => wake?.(),
  )

  function init(): (() => void) | undefined {
    const canvas = canvasRef
    if (precompiled()) return undefined
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!canvas || !ctx) return undefined
    const fill = fillOf(props.color)
    const cells = Math.max(8, Math.round(props.size / CELL))
    canvas.width = cells
    canvas.height = cells

    let raf = 0
    let last = 0
    const buffer = createRasterBuffer(cells, cells)
    let imageData: ImageData | undefined

    const paintAt = (ms: number) => {
      paintSpinner(buffer, cells, fill, (ms * spin().speed) % 1, matrix(), spin())
      imageData = putRasterBuffer(ctx, buffer, imageData)
    }
    paintAt(0)

    wake = undefined
    let unseek: (() => void) | undefined
    if (props.renderMode !== "static" && !pixelPrefersReducedMotion()) {
      const frame = (now: number) => {
        raf = 0
        if (!isVisible() || isDirected()) return // off-screen or directed: no loop
        if (now - last < 33) {
          raf = requestAnimationFrame(frame)
          return
        }
        last = now
        paintAt(now)
        raf = requestAnimationFrame(frame)
      }
      wake = () => {
        if (isDirected()) paintAt(directedTime() ?? 0)
        else if (!raf) raf = requestAnimationFrame(frame)
      }
      // Directed (clock.ts): the phase is the moment's, no frames requested.
      unseek = onSeek((ms) => {
        if (ms === null) {
          wake?.()
          return
        }
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        paintAt(ms)
      })
      wake()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      unseek?.()
    }
  }

  function restartRuntime() {
    const token = ++restartToken
    teardown?.()
    teardown = undefined
    if (precompiled()) return
    queueMicrotask(() => {
      if (token !== restartToken || precompiled()) return
      teardown = init()
    })
  }

  onMount(() => {
    restartRuntime()
    createEffect(
      // `spin` and `matrix` are what a still spinner (static mode, reduced
      // motion) printed its one frame from: the seed's, and the screen's.
      on([() => props.size, () => props.color, spin, matrix, () => props.renderMode, precompiled], restartRuntime, {
        defer: true,
      }),
    )
  })
  onCleanup(() => {
    restartToken += 1
    teardown?.()
  })

  const box = (): JSX.CSSProperties => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    "image-rendering": "pixelated",
  })

  return (
    <span role="status" aria-label="Loading" {...stylex.props(styles.row)}>
      <Show when={precompiled()} fallback={<canvas ref={(el) => (canvasRef = el)} style={box()} />}>
        {(src) => <img src={src()} alt="" style={box()} />}
      </Show>
    </span>
  )
}
