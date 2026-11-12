import { createEffect, createMemo, type JSX, on, onCleanup, onMount } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { darkInkOnDark, LABEL_COVERAGE, type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "../tailwind/lib"
import { useLabelMatrix } from "./runtime/screen"

export type BadgeVariant = "gradient" | "solid" | "dotted" | "hatched"

const CELL = 2

/** DitherButton's fill at rest intensity — texture capped by the 1px brighter
 * edge lines, no hover machinery. */
function paintBadge(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  variant: BadgeVariant,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  const bias = variant === "dotted" ? 0.12 : 0
  for (let y = 0; y < rows; y++) {
    const density = variant === "gradient" ? 0.25 + 0.75 * ((y + 0.5) / rows) : variant === "dotted" ? 0.5 : 0.75
    for (let x = 0; x < cols; x++) {
      if (variant === "hatched" && ((x + y) & 3) >= 2) continue
      const lit = variant === "solid" || density > matrix[y & 3][x & 3] - bias
      if (variant === "dotted" && !lit) continue
      const k = 0.3 + density * 0.7
      px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
    }
  }
  px.rect(0, 0, cols, 1, fill, 0.5)
  px.rect(0, rows - 1, cols, 1, fill, 0.5)
  px.rect(0, 0, 1, rows, fill, 0.5)
  px.rect(cols - 1, 0, 1, rows, fill, 0.5)
  px.flush()
}

export type DitherBadgeProps = {
  color?: PixelColor
  variant?: BadgeVariant
  seed?: number
  class?: string
  children?: JSX.Element
}

export default function DitherBadge(props: DitherBadgeProps) {
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const matrix = useLabelMatrix(() => props.seed)
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const variant = createMemo<BadgeVariant>(() => props.variant ?? s()?.variant ?? "gradient")
  // A bright fill takes black ink: white on it would sink under AA.
  const darkInk = createMemo(() => darkInkOnDark(fillOf(color()), LABEL_COVERAGE[variant()]))

  let wrap: HTMLSpanElement | undefined
  let canvas: HTMLCanvasElement | undefined

  let ro: ResizeObserver | null = null

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!wrap || !canvas || !ctx) return
    const box = wrap.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    paintBadge(ctx, cols, rows, fillOf(color()), variant(), matrix())
  }

  onMount(() => {
    requestAnimationFrame(() => {
      paint()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        if (wrap) ro.observe(wrap)
      }
    })
    createEffect(on([color, variant, matrix], paint, { defer: true }))
  })
  onCleanup(() => ro?.disconnect())

  return (
    <span
      ref={(el) => (wrap = el)}
      class={cn(
        "relative isolate inline-flex items-center overflow-hidden rounded px-2 py-0.5 font-mono text-[10px] text-foreground",
        darkInk() && "text-black",
        props.class,
      )}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        class="absolute inset-0 -z-10 h-full w-full"
        style={{ "image-rendering": "pixelated" }}
      />
      {props.children}
    </span>
  )
}
