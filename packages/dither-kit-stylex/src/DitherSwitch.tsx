// Generated from @dither-ui/kit/solid/DitherSwitch.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, type JSX, mergeProps, on, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { type Rgb } from "@dither-ui/kit/engine/palette.ts"
import { BAYER4, clamp01, fillOf, type PixelColor, pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cellCanvas } from "@dither-ui/kit/engine/raster.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    position: "relative",
    display: "inline-flex",
    height: "1.25rem",
    width: "2.25rem",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "3px",
  },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  button: {
    position: "relative",
    display: "inline-flex",
    width: "2.5rem",
    height: "2.5rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
  },
  frame: {
    position: "relative",
    width: "0.875rem",
    height: "0.875rem",
    borderRadius: "2px",
    backgroundColor: "var(--foreground)",
  },
  translateX19px: { translate: "19px 0" },
  translateX3px: { translate: "3px 0" },
  transitionTransform: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

/** Paint the switch track — dithered gradient in the accent when on, a
 * near-invisible muted wash when off. */
function paintTrack(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  on: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = on ? 0.25 + 0.75 * ((y + 0.5) / rows) : 0.2
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      if (on) {
        const k = 0.3 + density * 0.7
        px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
      } else {
        px.cell(x, y, muted, lit ? 0.18 : 0.06)
      }
    }
  }
  px.flush()
}

const CELL = 2

type Own = {
  modelValue: boolean
  /** Accessible name — required for screen readers, the control has no text. */
  label?: string
  color?: PixelColor
  seed?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: boolean) => void
  onClick?: (event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void
}
const OWN = [
  "modelValue",
  "label",
  "color",
  "seed",
  "disabled",
  "class",
  "xstyle",
  "onUpdateModelValue",
  "onClick",
] as const satisfies readonly (keyof Own)[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherSwitchProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own | "children">

export default function DitherSwitch(raw: DitherSwitchProps) {
  const merged = mergeProps({ disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useDitherMatrix(() => props.seed)

  let trackRef: HTMLSpanElement | undefined
  let canvasRef: HTMLCanvasElement | undefined
  const [reduce, setReduce] = createSignal(false)

  function paint() {
    const track = trackRef
    const canvas = canvasRef
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!track || !canvas || !ctx) return
    const box = track.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    paintTrack(ctx, cols, rows, fillOf(color()), fillOf("grey"), props.modelValue, matrix())
  }

  onMount(() => {
    setReduce(pixelPrefersReducedMotion())
    requestAnimationFrame(paint)
    createEffect(on([() => props.modelValue, color, matrix], paint, { defer: true }))
  })

  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-label={props.label}
      aria-checked={props.modelValue}
      disabled={props.disabled}
      class={cn(CONTROL_BUTTON, styles.button, props.xstyle, props.class)}
      onClick={(e) => {
        props.onUpdateModelValue?.(!props.modelValue)
        props.onClick?.(e)
      }}
    >
      <span ref={(el) => (trackRef = el)} {...stylex.props(styles.row)}>
        <canvas
          ref={(el) => (canvasRef = el)}
          aria-hidden="true"
          {...stylex.props(styles.canvas)}
          style={{ "image-rendering": "pixelated" }}
        />
        <span
          class={cn([
            styles.frame,
            props.modelValue ? styles.translateX19px : styles.translateX3px,
            reduce() ? null : styles.transitionTransform,
          ])}
        />
      </span>
    </button>
  )
}
