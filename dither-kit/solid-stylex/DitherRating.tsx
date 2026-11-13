// Generated from ../solid/DitherRating.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, mergeProps, on, onMount } from "solid-js"
import type { Rgb } from "../engine/palette"
import { fillOf, type PixelColor, xorshift32 } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", borderRadius: "calc(var(--radius) - 2px)", outlineStyle: "none" },
  cursorPointer: {
    cursor: "pointer",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
  },
})

const CELL = 2

type Pt = [number, number]

/** 10 alternating outer/inner vertices of a 5-point star centred in a cell box,
 * `rot` tilts it (seeded for a little per-rating character). */
function starPoly(c: number, rot: number): Pt[] {
  const outer = c - 0.5
  const inner = outer * 0.42
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5
    pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r])
  }
  return pts
}

function inPoly(px: number, py: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Paint `max` dithered stars. Each star fills left-to-right up to its fraction
 * of `value` (so 3.5 lights three-and-a-half); the lit body is dense, the empty
 * remainder a faint dithered ghost, the boundary dissolving through the matrix. */
function paintRating(
  ctx: CanvasRenderingContext2D,
  cells: number,
  max: number,
  value: number,
  fill: Rgb,
  matrix: number[][],
  rot: number,
): void {
  const px = cellCanvas(ctx, cells * max, cells)
  const poly = starPoly(cells / 2, rot)
  for (let s = 0; s < max; s++) {
    const level = Math.min(Math.max(value - s, 0), 1)
    const ox = s * cells
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        if (!inPoly(x + 0.5, y + 0.5, poly)) continue
        const frac = x / cells
        const on = frac <= level
        const density = on ? 0.92 : 0.16
        if (density <= matrix[y & 3][x & 3]) continue
        if (on) px.cell(ox + x, y, fill, 1)
        else px.cell(ox + x, y, fill, 0.5, 0.55)
      }
    }
  }
  px.flush()
}

export type DitherRatingProps = {
  modelValue?: number
  onUpdateModelValue?: (value: number) => void
  max?: number
  color?: PixelColor
  size?: number
  readonly?: boolean
  label?: string
  seed?: number
}

export default function DitherRating(raw: DitherRatingProps) {
  const props = mergeProps(
    { modelValue: 0, max: 5, color: "orange" as PixelColor, size: 22, readonly: false, label: "Rating" },
    raw,
  )

  const matrix = useDitherMatrix(() => props.seed)
  const rot = createMemo(() =>
    props.seed !== undefined ? (xorshift32(Math.round(props.seed) ^ 0x51ed)() - 0.5) * 0.5 : 0,
  )

  let canvas: HTMLCanvasElement | undefined
  const [hover, setHover] = createSignal<number | null>(null)
  const display = createMemo(() => hover() ?? props.modelValue)

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!canvas || !ctx) return
    const cells = Math.max(6, Math.round(props.size / CELL))
    canvas.width = cells * props.max
    canvas.height = cells
    paintRating(ctx, cells, props.max, display(), fillOf(props.color), matrix(), rot())
  }

  onMount(() => {
    paint()
    createEffect(
      on([() => props.modelValue, () => props.max, () => props.color, () => props.size, hover, matrix], paint, {
        defer: true,
      }),
    )
  })

  function starAt(e: PointerEvent): number {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const f = (e.clientX - rect.left) / rect.width
    return Math.min(Math.max(Math.ceil(f * props.max), 1), props.max)
  }
  const onMove = (e: PointerEvent) => {
    if (!props.readonly) setHover(starAt(e))
  }
  const onLeave = () => setHover(null)
  const commit = (e: PointerEvent) => {
    if (props.readonly) return
    const v = starAt(e)
    props.onUpdateModelValue?.(props.modelValue === v ? v - 1 : v) // click same star to clear one
  }
  function onKey(e: KeyboardEvent) {
    if (props.readonly) return
    let v = props.modelValue
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v = Math.min(v + 1, props.max)
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = Math.max(v - 1, 0)
    else if (e.key === "Home") v = 0
    else if (e.key === "End") v = props.max
    else return
    e.preventDefault()
    if (v !== props.modelValue) props.onUpdateModelValue?.(v)
  }

  return (
    <span
      role={props.readonly ? "img" : "slider"}
      tabindex={props.readonly ? undefined : 0}
      aria-label={props.label}
      aria-readonly={props.readonly || undefined}
      aria-valuemin={props.readonly ? undefined : 0}
      aria-valuemax={props.readonly ? undefined : props.max}
      aria-valuenow={props.readonly ? undefined : props.modelValue}
      aria-valuetext={`${props.modelValue} out of ${props.max}`}
      class={cn(styles.row, !props.readonly && styles.cursorPointer)}
      on:pointermove={onMove}
      on:pointerleave={onLeave}
      on:pointerdown={commit}
      onKeyDown={onKey}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        style={{
          width: `${props.size * props.max}px`,
          height: `${props.size}px`,
          "image-rendering": "pixelated",
        }}
      />
    </span>
  )
}
