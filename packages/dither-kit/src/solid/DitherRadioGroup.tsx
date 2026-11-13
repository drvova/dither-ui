import { createEffect, createMemo, For, mergeProps, on, onMount } from "solid-js"
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "../tailwind/lib"
import type { Option } from "./DitherSelect"

const CELL = 2

/** Paint one radio — a 1px pixel ring when unchecked, the ring in the accent
 * plus a dithered inner dot (distance check against the Bayer matrix) when
 * checked. */
function paintDot(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, n, n)
  const c = (n - 1) / 2
  const edge = n / 2
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - c, y - c)
      if (d > edge) continue
      if (d > edge - 1.2) {
        px.cell(x, y, checked ? fill : muted, 0.6)
      } else if (checked && d <= edge - 2.4) {
        const density = 0.8
        const lit = density > matrix[y & 3][x & 3]
        const k = 0.3 + density * 0.7
        px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
      }
    }
  }
  px.flush()
}

export type DitherRadioGroupProps = {
  options: Option[]
  modelValue: string
  onUpdateModelValue?: (value: string) => void
  color?: PixelColor
  label?: string
  class?: string
}

export default function DitherRadioGroup(raw: DitherRadioGroupProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  const btns: HTMLButtonElement[] = []
  const canvases: HTMLCanvasElement[] = []

  const activeIndex = createMemo(() => {
    const i = props.options.findIndex((o) => o.value === props.modelValue)
    return i >= 0 ? i : 0
  })

  function paintAll() {
    const fill = fillOf(props.color)
    const muted = fillOf("grey")
    props.options.forEach((o, i) => {
      const canvas = canvases[i]
      const ctx = canvas?.getContext("2d", { willReadFrequently: true })
      if (!canvas || !ctx) return
      const n = Math.max(4, Math.round(canvas.getBoundingClientRect().width / CELL))
      canvas.width = n
      canvas.height = n
      paintDot(ctx, n, fill, muted, o.value === props.modelValue)
    })
  }

  function onKeydown(e: KeyboardEvent) {
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const n = props.options.length
    let i = activeIndex()
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!props.options[i].disabled) {
        props.onUpdateModelValue?.(props.options[i].value)
        queueMicrotask(() => btns[i]?.focus())
        return
      }
    }
  }

  onMount(() => {
    requestAnimationFrame(paintAll)
    createEffect(
      on([() => props.modelValue, () => props.color, () => props.options], () => queueMicrotask(paintAll), {
        defer: true,
      }),
    )
  })

  return (
    <div role="radiogroup" aria-label={props.label} class={cn("grid gap-3", props.class)} onKeyDown={onKeydown}>
      <For each={props.options}>
        {(o, i) => (
          <button
            ref={(el) => (btns[i()] = el)}
            type="button"
            role="radio"
            aria-checked={o.value === props.modelValue}
            tabindex={i() === activeIndex() ? 0 : -1}
            disabled={o.disabled}
            class="inline-flex min-h-6 items-center gap-2 text-left focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            onClick={() => props.onUpdateModelValue?.(o.value)}
          >
            <span class="relative size-4 shrink-0">
              <canvas
                ref={(el) => (canvases[i()] = el)}
                aria-hidden="true"
                class="absolute inset-0 h-full w-full"
                style={{ "image-rendering": "pixelated" }}
              />
            </span>
            <span class="text-[13px] text-foreground">{o.label}</span>
          </button>
        )}
      </For>
    </div>
  )
}
