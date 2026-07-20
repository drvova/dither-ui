<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf, type PixelColor } from "./pixel"

  export type AccordionItem = { value: string; title: string }

  const CELL = 2
  let uid = 0

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
    ctx.clearRect(0, 0, 1, rows)
    for (let y = 0; y < rows; y++) {
      const density = 1 - (y + 0.5) / rows
      const lit = density > matrix[y & 3][0]
      const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
      if (alpha <= 0.004) continue
      ctx.fillStyle = rgb(fill, 1, alpha)
      ctx.fillRect(0, y, 1, 1)
    }
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"

  type Props = {
    items: AccordionItem[]
    value: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
    // Per-item panel content arrives as named snippet props keyed by item value
    // (Vue's `<slot :name="item.value" />`).
    [slot: string]: unknown
  }

  let {
    items,
    value = $bindable(),
    type = "single",
    color = "blue",
    ...slots
  }: Props = $props()

  const id = `dither-accordion-${++uid}`

  const slotFor = (itemValue: string) => slots[itemValue] as Snippet | undefined

  function isOpen(itemValue: string): boolean {
    return Array.isArray(value) ? value.includes(itemValue) : value === itemValue
  }

  function toggle(itemValue: string) {
    if (type === "single") {
      value = isOpen(itemValue) ? "" : itemValue
      return
    }
    const open = Array.isArray(value) ? value : value ? [value] : []
    value = isOpen(itemValue) ? open.filter((v) => v !== itemValue) : [...open, itemValue]
  }

  type RailParams = { color: PixelColor; key: string }

  /** Local action painting one item's rail canvas: rAF-deferred first paint, a
   * ResizeObserver keeping it sized, repaint when the colour key changes. Each
   * canvas owns its own action instance, replacing Vue's `rails[]` array. */
  function railCanvas(canvas: HTMLCanvasElement, initial: RailParams) {
    let p = initial
    let ro: ResizeObserver | null = null
    let raf = 0
    const paint = () => paintRail(canvas, p.color)
    raf = requestAnimationFrame(() => {
      raf = 0
      paint()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        ro.observe(canvas)
      }
    })
    return {
      update(next: RailParams) {
        const changed = next.key !== p.key
        p = next
        if (changed) paint()
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf)
        ro?.disconnect()
      },
    }
  }
</script>

<div>
  {#each items as item, i (item.value)}
    <div class="border-t border-border/40 first:border-t-0">
      <button
        type="button"
        aria-expanded={isOpen(item.value)}
        aria-controls={`${id}-${i}`}
        class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        onclick={() => toggle(item.value)}
      >
        <span>{item.title}</span>
        <span
          aria-hidden="true"
          class="text-muted-foreground transition-transform duration-200 motion-reduce:transition-none {isOpen(
            item.value
          )
            ? 'rotate-90'
            : ''}"
        >
          ›
        </span>
      </button>
      <div
        id={`${id}-${i}`}
        inert={!isOpen(item.value)}
        class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
        style:grid-template-rows={isOpen(item.value) ? "1fr" : "0fr"}
      >
        <div class="overflow-hidden">
          <div class="flex gap-3 pt-1 pb-2">
            <div class="relative w-[2px] self-stretch">
              <canvas
                use:railCanvas={{ color, key: String(color) }}
                aria-hidden="true"
                class="absolute inset-0 h-full w-full"
                style="image-rendering: pixelated"
              ></canvas>
            </div>
            <div class="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
              {@render slotFor(item.value)?.()}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
