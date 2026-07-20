<script lang="ts" module>
  import { rgb, type Rgb } from "./palette"
  import { BAYER4, clamp01, fillOf } from "./pixel"

  const CELL = 2

  /** Paint the meter track — DitherProgress's determinate recipe, no motion. */
  function paintMeter(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    fill: Rgb,
    muted: Rgb,
    ratio: number,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    const filled = Math.round(cols * clamp01(ratio))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x < filled) {
          const density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
          const lit = density > matrix[y & 3][x & 3]
          const k = 0.3 + density * 0.7
          ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        } else {
          const lit = 0.25 > matrix[y & 3][x & 3]
          ctx.fillStyle = rgb(muted, 1, lit ? 0.2 : 0.06)
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import type { DitherColor } from "./palette"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    value: number
    min?: number
    max?: number
    low?: number
    high?: number
    class?: string
  }

  let {
    value,
    min = 0,
    max = 100,
    low = 0.5,
    high = 0.8,
    class: className,
  }: Props = $props()

  const ratio = $derived(clamp01((value - min) / (max - min || 1)))
  const zone = $derived<DitherColor>(
    ratio < low ? "green" : ratio > high ? "red" : "orange"
  )

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const cols = Math.max(4, Math.round(host.getBoundingClientRect().width / CELL))
    const rows = 3 // h-1.5 track at CELL=2
    canvas.width = cols
    canvas.height = rows
    paintMeter(ctx, cols, rows, fillOf(zone), fillOf("grey"), ratio)
  })
</script>

<div
  role="meter"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  class={cn("relative h-1.5 w-full overflow-hidden rounded-[2px]", className)}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
</div>
