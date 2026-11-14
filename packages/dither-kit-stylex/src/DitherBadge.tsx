// Generated from @dither-ui/kit/solid/DitherBadge.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, type JSX, on, onCleanup, onMount } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { labelFill, renderLabelFill, type LabelVariant } from "@dither-ui/kit/engine/label-fill.ts"
import { fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { putRasterBuffer, type RasterBuffer } from "@dither-ui/kit/engine/raster.ts"
import { cn, type StyleProp } from "./lib"
import { useLabelMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  row: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--foreground)",
  },
  textBlack: { color: "#000" },
})

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
  xstyle?: StyleProp
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
      class={cn(styles.row, label().darkInk && styles.textBlack, props.xstyle, props.class)}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated" }}
      />
      {props.children}
    </span>
  )
}
