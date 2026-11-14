import { createEffect, createMemo, type JSX, on, onCleanup, onMount } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill, renderLabelFill, type LabelVariant } from "../engine/label-fill"
import { fillOf, type PixelColor } from "../engine/pixel"
import { putRasterBuffer, type RasterBuffer } from "../engine/raster"
import { cn } from "../tailwind/lib"
import { useLabelMatrix } from "./runtime/screen"

export type BadgeVariant = LabelVariant

const CELL = 2

export type DitherBadgeProps = {
  /** @default "blue" */
  color?: PixelColor
  /** @docs "gradient" | "solid" | "dotted" | "hatched"
   * @default "gradient" */
  variant?: BadgeVariant
  seed?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function DitherBadge(props: DitherBadgeProps) {
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const matrix = useLabelMatrix(() => props.seed)
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const variant = createMemo<BadgeVariant>(() => props.variant ?? s()?.variant ?? "gradient")
  // The fill's tone and its label's ink, together at AA (a bright fill
  // takes black ink: the theme's would sink under AA).
  const label = createMemo(() => labelFill(fillOf(color()), variant(), "straight", matrix()))

  let wrap: HTMLSpanElement | undefined
  let canvas: HTMLCanvasElement | undefined

  let ro: ResizeObserver | null = null
  let raster: RasterBuffer | undefined
  let image: ImageData | undefined

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!wrap || !canvas || !ctx) return
    const box = wrap.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    raster = renderLabelFill(cols, rows, fillOf(color()), variant(), label().tone, matrix(), raster)
    image = putRasterBuffer(ctx, raster, image)
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
        label().darkInk && "text-black",
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
