<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf, type PixelColor } from "./pixel"

  const CELL = 2
  let uid = 0

  /** Paint the 2px left rail — a vertical dither ramp fading downward. */
  function paintRail(
    canvas: HTMLCanvasElement,
    height: number,
    color: PixelColor,
    matrix: number[][] = BAYER4
  ): void {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
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
    title: string
    value?: boolean
    color?: PixelColor
    children?: Snippet
  }

  let { title, value = $bindable(false), color = "blue", children }: Props = $props()

  const id = `dither-collapsible-${++uid}`

  type RailParams = { color: PixelColor; key: string }

  /** Local action painting the rail canvas: rAF-deferred first paint, a
   * ResizeObserver keeping it sized as the panel expands, repaint when the key
   * (colour) changes — Vue's onMounted + ResizeObserver + color watch, no
   * `$effect`. */
  function railCanvas(canvas: HTMLCanvasElement, initial: RailParams) {
    let p = initial
    let ro: ResizeObserver | null = null
    let raf = 0
    const paint = () => paintRail(canvas, canvas.offsetHeight, p.color)
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
  <button
    type="button"
    aria-expanded={value}
    aria-controls={id}
    class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
    onclick={() => (value = !value)}
  >
    <span>{title}</span>
    <span
      aria-hidden="true"
      class="text-muted-foreground transition-transform duration-200 motion-reduce:transition-none {value
        ? 'rotate-90'
        : ''}"
    >
      ›
    </span>
  </button>
  <div
    {id}
    inert={!value}
    class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
    style:grid-template-rows={value ? "1fr" : "0fr"}
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
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
</div>
