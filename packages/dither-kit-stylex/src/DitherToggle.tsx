// Generated from @dither-ui/kit/solid/DitherToggle.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, type JSX, mergeProps, on, onCleanup, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { labelFill, renderLabelFill } from "@dither-ui/kit/engine/label-fill.ts"
import type { Rgb } from "@dither-ui/kit/engine/palette.ts"
import { BAYER4, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { putRasterBuffer } from "@dither-ui/kit/engine/raster.ts"
import { cn, type StyleProp } from "./lib"
import { useLabelMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  frame: { position: "relative" },
  button: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  borderTransparent: { borderColor: "transparent", color: "#000" },
  borderTransparent2: { borderColor: "transparent", color: "var(--foreground)" },
  borderBorder: {
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

const CELL = 2

/** DitherBadge's rest gradient fill behind the pressed label (the engine's
 * `renderLabelFill` at its `labelFill` tone), sized from the host button:
 * the hue laid over the page with the density as alpha (a pastel on light,
 * a glow on dark), so the theme's own ink reads on it. Shared with
 * DitherToggleGroup. */
export function paintToggleCanvas(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  fill: Rgb,
  matrix: number[][] = BAYER4,
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const box = host.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  putRasterBuffer(
    ctx,
    renderLabelFill(cols, rows, fill, "gradient", labelFill(fill, "gradient", "straight", matrix).tone, matrix),
  )
}

type Own = {
  modelValue: boolean
  onUpdateModelValue?: (value: boolean) => void
  /** @default "blue" */
  color?: PixelColor
  seed?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}
const OWN = [
  "modelValue",
  "onUpdateModelValue",
  "color",
  "seed",
  "disabled",
  "class",
  "xstyle",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherToggleProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherToggle(raw: DitherToggleProps) {
  const merged = mergeProps({ disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useLabelMatrix(() => props.seed)
  // A bright fill takes black ink: white on it would sink under AA.
  const darkInk = createMemo(() => labelFill(fillOf(color()), "gradient", "straight", matrix()).darkInk)

  let button: HTMLButtonElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let ro: ResizeObserver | null = null

  function paint() {
    if (!props.modelValue) return
    if (button && canvas) paintToggleCanvas(button, canvas, fillOf(color()), matrix())
  }

  let paintRaf = 0
  function deferredPaint() {
    if (paintRaf) return
    paintRaf = requestAnimationFrame(() => {
      paintRaf = 0
      paint()
    })
  }

  onMount(() => {
    if (typeof ResizeObserver !== "undefined" && button) {
      ro = new ResizeObserver(deferredPaint)
      ro.observe(button)
    } else {
      deferredPaint()
    }
    createEffect(on([() => props.modelValue, color, matrix], deferredPaint, { defer: true }))
    onCleanup(() => {
      ro?.disconnect()
      if (paintRaf) cancelAnimationFrame(paintRaf)
    })
  })

  return (
    <button
      {...rest}
      ref={(el) => (button = el)}
      type="button"
      aria-pressed={props.modelValue}
      disabled={props.disabled}
      class={cn(
        styles.button,
        props.modelValue ? (darkInk() ? styles.borderTransparent : styles.borderTransparent2) : styles.borderBorder,
        props.xstyle,
        props.class,
      )}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated", display: props.modelValue ? undefined : "none" }}
      />
      <span {...stylex.props(styles.frame)}>{props.children}</span>
    </button>
  )
}
