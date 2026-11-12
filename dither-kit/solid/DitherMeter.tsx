import { createEffect, createMemo, mergeProps, on, onCleanup, onMount } from "solid-js"
import type { DitherColor } from "../engine/palette"
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "../tailwind/lib"

/** Paint the meter track — DitherProgress's determinate recipe, no motion. */
function paintMeter(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  ratio: number,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  const filled = Math.round(cols * clamp01(ratio))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x < filled) {
        const density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
        const lit = density > matrix[y & 3][x & 3]
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

export type DitherMeterProps = {
  value: number
  min?: number
  max?: number
  low?: number
  high?: number
  class?: string
}

export default function DitherMeter(raw: DitherMeterProps) {
  const props = mergeProps({ min: 0, max: 100, low: 0.5, high: 0.8 }, raw)

  const ratio = createMemo(() => clamp01((props.value - props.min) / (props.max - props.min || 1)))
  const zone = createMemo<DitherColor>(() => (ratio() < props.low ? "green" : ratio() > props.high ? "red" : "orange"))

  let root: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined

  let cols = 0
  const rows = 3 // h-1.5 track at CELL=2

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!ctx || cols <= 0) return
    paintMeter(ctx, cols, rows, fillOf(zone()), fillOf("grey"), ratio())
  }

  function resize() {
    if (!root || !canvas) return
    cols = Math.max(4, Math.round(root.getBoundingClientRect().width / CELL))
    canvas.width = cols
    canvas.height = rows
    paint()
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      resize()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        if (root) ro.observe(root)
      }
    })
    createEffect(
      on([() => props.value, () => props.min, () => props.max, () => props.low, () => props.high], paint, {
        defer: true,
      }),
    )
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div
      ref={(el) => (root = el)}
      role="meter"
      aria-valuemin={props.min}
      aria-valuemax={props.max}
      aria-valuenow={props.value}
      class={cn("relative h-1.5 w-full overflow-hidden rounded-[2px]", props.class)}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        class="absolute inset-0 h-full w-full"
        style={{ "image-rendering": "pixelated" }}
      />
    </div>
  )
}
