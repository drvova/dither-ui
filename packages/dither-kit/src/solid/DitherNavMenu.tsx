import { createEffect, createSignal, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"

export type NavMenuItem = { label: string; href?: string }

const CELL = 2

/** Paint the 2px underline — the same horizontal dither ramp as DitherTabs. */
function paintUnderline(
  canvas: HTMLCanvasElement,
  width: number,
  color: PixelColor,
  matrix: number[][] = BAYER4,
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || width <= 0) return
  const cols = Math.max(4, Math.round(width / CELL))
  canvas.width = cols
  canvas.height = 1
  const fill = fillOf(color)
  const px = cellCanvas(ctx, cols, 1)
  for (let x = 0; x < cols; x++) {
    const density = (x + 0.5) / cols
    const lit = density > matrix[0][x & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(x, 0, fill, alpha)
  }
  px.flush()
}

export type DitherNavMenuProps = {
  /** @docs { label: string; href?: string }[] */
  items: NavMenuItem[]
  modelValue: string
  color?: PixelColor
  /** Its name as a landmark, apart from the page's other navigation. */
  label?: string
  onUpdateModelValue?: (value: string) => void
}

export default function DitherNavMenu(raw: DitherNavMenuProps) {
  const props = mergeProps({ color: "blue" as PixelColor, label: "Sections" }, raw)

  let list: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const itemRefs: HTMLAnchorElement[] = []
  const [underline, setUnderline] = createSignal({ left: 0, width: 0 })

  function measure() {
    const active = itemRefs[props.items.findIndex((it) => it.label === props.modelValue)]
    if (!active) return
    setUnderline({ left: active.offsetLeft, width: active.offsetWidth })
    if (canvas) paintUnderline(canvas, active.offsetWidth, props.color)
  }

  let ro: ResizeObserver | null = null
  onMount(() => {
    requestAnimationFrame(() => {
      measure()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure)
        if (list) ro.observe(list)
      }
    })
    createEffect(
      on(
        () => [props.modelValue, props.items, props.color],
        () => queueMicrotask(measure),
        { defer: true },
      ),
    )
  })
  onCleanup(() => ro?.disconnect())

  return (
    <nav class="relative" aria-label={props.label}>
      <div ref={(el) => (list = el)} class="flex gap-4">
        <For each={props.items}>
          {(item, i) => (
            <a
              ref={(el) => (itemRefs[i()] = el)}
              href={item.href ?? "#"}
              aria-current={item.label === props.modelValue ? "page" : undefined}
              class={`pb-2 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                item.label === props.modelValue ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={(e) => {
                e.preventDefault()
                props.onUpdateModelValue?.(item.label)
              }}
            >
              {item.label}
            </a>
          )}
        </For>
      </div>
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        class="absolute bottom-0 h-[2px] transition-[left,width] duration-200 motion-reduce:transition-none"
        style={{
          left: underline().left + "px",
          width: underline().width + "px",
          "image-rendering": "pixelated",
        }}
      />
    </nav>
  )
}
