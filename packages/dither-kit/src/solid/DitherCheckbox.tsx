import { createEffect, createMemo, type JSX, mergeProps, on, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"

// Chunky pixel checkmark on the 8x8 cell grid (size-4 box at CELL=2).
/** The checkmark's near-white ink. */
const MARK_INK: Rgb = [245, 245, 248]
const MARK: Array<[number, number]> = [
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 5],
  [3, 6],
  [4, 4],
  [4, 5],
  [5, 3],
  [5, 4],
  [6, 2],
  [6, 3],
]

/** Paint the checkbox — a 1px border when unchecked, a dithered fill with a
 * near-white pixel checkmark when checked. */
function paintBox(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, n, n)
  if (!checked) {
    px.rect(0, 0, n, 1, muted, 0.6)
    px.rect(0, n - 1, n, 1, muted, 0.6)
    px.rect(0, 0, 1, n, muted, 0.6)
    px.rect(n - 1, 0, 1, n, muted, 0.6)
    px.flush()
    return
  }
  const density = 0.8
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const lit = density > matrix[y & 3][x & 3]
      const k = 0.3 + density * 0.7
      px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
    }
  }
  for (const [x, y] of MARK) px.cell(x, y, MARK_INK, 0.95)
  px.flush()
}

const CELL = 2

type Own = {
  modelValue: boolean
  onUpdateModelValue?: (value: boolean) => void
  /** @default "blue" */
  color?: PixelColor
  seed?: number
  disabled?: boolean
  class?: string
}
const OWN = [
  "modelValue",
  "onUpdateModelValue",
  "color",
  "seed",
  "disabled",
  "class",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherCheckboxProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherCheckbox(raw: DitherCheckboxProps) {
  const merged = mergeProps({ disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useDitherMatrix(() => props.seed)

  let box: HTMLSpanElement | undefined
  let canvas: HTMLCanvasElement | undefined

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!box || !canvas || !ctx) return
    const n = Math.max(4, Math.round(box.getBoundingClientRect().width / CELL))
    canvas.width = n
    canvas.height = n
    paintBox(ctx, n, fillOf(color()), fillOf("grey"), props.modelValue, matrix())
  }

  onMount(() => {
    requestAnimationFrame(paint)
    createEffect(on([() => props.modelValue, color, matrix], paint, { defer: true }))
  })

  return (
    <button
      {...rest}
      type="button"
      role="checkbox"
      aria-checked={props.modelValue}
      disabled={props.disabled}
      class={cn(CONTROL_BUTTON, "relative inline-flex min-h-10 items-center gap-2 text-left", props.class)}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <span ref={(el) => (box = el)} class="relative size-4 shrink-0">
        <canvas
          ref={(el) => (canvas = el)}
          aria-hidden="true"
          class="absolute inset-0 h-full w-full"
          style={{ "image-rendering": "pixelated" }}
        />
      </span>
      <span class="text-[13px] text-foreground">{props.children}</span>
    </button>
  )
}
