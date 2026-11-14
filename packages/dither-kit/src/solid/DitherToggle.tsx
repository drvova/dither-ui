import { createEffect, createMemo, type JSX, mergeProps, on, onCleanup, onMount, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill, renderLabelFill } from "../engine/label-fill"
import type { Rgb } from "../engine/palette"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { putRasterBuffer } from "../engine/raster"
import { cn } from "../tailwind/lib"
import { useLabelMatrix } from "./runtime/screen"

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
        "relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        props.modelValue
          ? darkInk()
            ? "border-transparent text-black"
            : "border-transparent text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
        props.class,
      )}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        class="absolute inset-0 -z-10 h-full w-full"
        style={{ "image-rendering": "pixelated", display: props.modelValue ? undefined : "none" }}
      />
      <span class="relative">{props.children}</span>
    </button>
  )
}
