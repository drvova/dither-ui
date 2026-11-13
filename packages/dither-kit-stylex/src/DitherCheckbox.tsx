// Generated from @dither-ui/kit/solid/DitherCheckbox.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, type JSX, mergeProps, on, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { type Rgb } from "@dither-ui/kit/engine/palette.ts"
import { BAYER4, clamp01, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cellCanvas } from "@dither-ui/kit/engine/raster.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", width: "1rem", height: "1rem", flexShrink: "0" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  text: { fontSize: "13px", color: "var(--foreground)" },
  button: {
    position: "relative",
    display: "inline-flex",
    minHeight: "2.5rem",
    alignItems: "center",
    gap: "0.5rem",
    textAlign: "left",
  },
})

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
      class={cn(CONTROL_BUTTON, styles.button, props.xstyle, props.class)}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <span ref={(el) => (box = el)} {...stylex.props(styles.frame)}>
        <canvas
          ref={(el) => (canvas = el)}
          aria-hidden="true"
          {...stylex.props(styles.canvas)}
          style={{ "image-rendering": "pixelated" }}
        />
      </span>
      <span {...stylex.props(styles.text)}>{props.children}</span>
    </button>
  )
}
