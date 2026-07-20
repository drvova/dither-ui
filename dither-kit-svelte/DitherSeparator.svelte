<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf } from "./pixel"

  export type SeparatorOrientation = "horizontal" | "vertical"

  const CELL = 2
  const GREY = fillOf("grey")

  /** A one-cell line whose pixels drop out toward both ends through the Bayer
   * matrix — DitherImage's edge-dissolve recipe applied to a rule. */
  function paintSeparator(
    ctx: CanvasRenderingContext2D,
    cells: number,
    vertical: boolean,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, vertical ? 1 : cells, vertical ? cells : 1)
    const half = cells / 2
    for (let i = 0; i < cells; i++) {
      const e = 1 - Math.abs(i + 0.5 - half) / half // 1 at center, 0 at ends
      const x = vertical ? 0 : i
      const y = vertical ? i : 0
      if (e < 1 && e * e <= matrix[y & 3][x & 3]) continue
      ctx.fillStyle = rgb(GREY, 1, 0.35 + 0.45 * e)
      ctx.fillRect(x, y, 1, 1)
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    orientation?: SeparatorOrientation
    class?: string
  }

  let { orientation = "horizontal", class: className }: Props = $props()

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const box = host.getBoundingClientRect()
    const vertical = orientation === "vertical"
    const cells = Math.max(4, Math.round((vertical ? box.height : box.width) / CELL))
    canvas.width = vertical ? 1 : cells
    canvas.height = vertical ? cells : 1
    paintSeparator(ctx, cells, vertical)
  })
</script>

<div
  role="separator"
  aria-orientation={orientation}
  class={cn(
    "relative",
    orientation === "vertical" ? "h-full w-[2px]" : "h-[2px] w-full",
    className
  )}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
</div>
