import { createEffect, createMemo, createSignal, type JSX, mergeProps, on, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor, pixelPrefersReducedMotion } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"

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
      class={cn(
        CONTROL_BUTTON,
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-md",
        props.class,
      )}
      onClick={(e) => {
        props.onUpdateModelValue?.(!props.modelValue)
        props.onClick?.(e)
      }}
    >
      <span
        ref={(el) => (trackRef = el)}
        class="relative inline-flex h-5 w-9 items-center overflow-hidden rounded-[3px]"
      >
        <canvas
          ref={(el) => (canvasRef = el)}
          aria-hidden="true"
          class="absolute inset-0 h-full w-full"
          style={{ "image-rendering": "pixelated" }}
        />
        <span
          class={[
            "relative size-3.5 rounded-[2px] bg-foreground",
            props.modelValue ? "translate-x-[19px]" : "translate-x-[3px]",
            reduce() ? "" : "transition-transform duration-150",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </span>
    </button>
  )
}
