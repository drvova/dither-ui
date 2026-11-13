import { createEffect, createUniqueId, For, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "../tailwind/lib"

export type AccordionItem = { value: string; title: string }

const CELL = 2

/** Paint the 2px left rail — a vertical dither ramp fading downward,
 * the same recipe as DitherCollapsible. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const height = canvas.offsetHeight
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

export type DitherAccordionProps = {
  items: AccordionItem[]
  modelValue: string | string[]
  type?: "single" | "multiple"
  color?: PixelColor
  onUpdateModelValue?: (value: string | string[]) => void
  /** Each panel's content, by its item's `value` (a slot per item). */
  slots?: Record<string, JSX.Element>
}

export default function DitherAccordion(raw: DitherAccordionProps) {
  const props = mergeProps({ type: "single" as const, color: "blue" as PixelColor }, raw)

  const id = `dither-accordion-${createUniqueId()}`
  const rails: HTMLCanvasElement[] = []

  function isOpen(value: string): boolean {
    return Array.isArray(props.modelValue) ? props.modelValue.includes(value) : props.modelValue === value
  }

  function toggle(value: string) {
    if (props.type === "single") {
      props.onUpdateModelValue?.(isOpen(value) ? "" : value)
      return
    }
    const open = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []
    props.onUpdateModelValue?.(isOpen(value) ? open.filter((v) => v !== value) : [...open, value])
  }

  function paintAll() {
    for (const canvas of rails) if (canvas) paintRail(canvas, props.color)
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      paintAll()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver((entries) => {
          for (const entry of entries) paintRail(entry.target as HTMLCanvasElement, props.color)
        })
        for (const canvas of rails) if (canvas) ro.observe(canvas)
      }
    })
    createEffect(on(() => props.color, paintAll, { defer: true }))
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div>
      <For each={props.items}>
        {(item, i) => (
          <div class="border-t border-border/40 first:border-t-0">
            <button
              type="button"
              aria-expanded={isOpen(item.value)}
              aria-controls={`${id}-${i()}`}
              class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => toggle(item.value)}
            >
              <span>{item.title}</span>
              <span
                aria-hidden="true"
                class={cn(
                  "text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                  isOpen(item.value) ? "rotate-90" : "",
                )}
              >
                ›
              </span>
            </button>
            <div
              id={`${id}-${i()}`}
              inert={!isOpen(item.value)}
              class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
              style={{ "grid-template-rows": isOpen(item.value) ? "1fr" : "0fr" }}
            >
              <div class="overflow-hidden">
                <div class="flex gap-3 pt-1 pb-2">
                  <div class="relative w-[2px] self-stretch">
                    <canvas
                      ref={(el) => (rails[i()] = el)}
                      aria-hidden="true"
                      class="absolute inset-0 h-full w-full"
                      style={{ "image-rendering": "pixelated" }}
                    />
                  </div>
                  <div class="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                    {props.slots?.[item.value]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
