// Generated from dither-kit/solid/DitherCollapsible.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createUniqueId, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { BAYER4, fillOf, type PixelColor } from "dither-kit/engine/pixel.ts"
import { cellCanvas } from "dither-kit/engine/raster.ts"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  rotate90: { rotate: "90deg" },
  text: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box: { overflow: "hidden" },
  row: { display: "flex", gap: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.5rem" },
  frame: { position: "relative", width: "2px", alignSelf: "stretch" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  box2: {
    minWidth: "0px",
    flex: "1",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
})

const CELL = 2

/** Paint the 2px left rail — a vertical dither ramp fading downward. */
function paintRail(canvas: HTMLCanvasElement, height: number, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(0, y, fill, alpha)
  }
  px.flush()
}

export type DitherCollapsibleProps = {
  title: string
  modelValue?: boolean
  color?: PixelColor
  onUpdateModelValue?: (value: boolean) => void
  children?: JSX.Element
}

export default function DitherCollapsible(raw: DitherCollapsibleProps) {
  const props = mergeProps({ modelValue: false, color: "blue" as PixelColor }, raw)

  const id = `dither-collapsible-${createUniqueId()}`
  let rail: HTMLCanvasElement | undefined

  function paint() {
    const canvas = rail
    if (canvas) paintRail(canvas, canvas.offsetHeight, props.color)
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      paint()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        if (rail) ro.observe(rail)
      }
    })
    createEffect(on(() => props.color, paint, { defer: true }))
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div>
      <button
        type="button"
        aria-expanded={props.modelValue}
        aria-controls={id}
        {...stylex.props(styles.button)}
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span>{props.title}</span>
        <span aria-hidden="true" class={cn(styles.text, props.modelValue && styles.rotate90)}>
          ›
        </span>
      </button>
      <div
        id={id}
        inert={!props.modelValue}
        {...stylex.props(styles.grid)}
        style={{ "grid-template-rows": props.modelValue ? "1fr" : "0fr" }}
      >
        <div {...stylex.props(styles.box)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.frame)}>
              <canvas
                ref={(el) => (rail = el)}
                aria-hidden="true"
                {...stylex.props(styles.canvas)}
                style={{ "image-rendering": "pixelated" }}
              />
            </div>
            <div {...stylex.props(styles.box2)}>{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
