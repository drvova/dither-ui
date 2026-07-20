<script lang="ts" module>
  import { rgb } from "../engine/palette"
  import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
  import type { Rgb } from "../engine/palette"

  export type BadgeVariant = "gradient" | "solid" | "dotted" | "hatched"

  const CELL = 2

  /** DitherButton's fill at rest intensity — texture capped by the 1px brighter
   * edge lines, no hover machinery. */
  function paintBadge(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    fill: Rgb,
    variant: BadgeVariant,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    const bias = variant === "dotted" ? 0.12 : 0
    for (let y = 0; y < rows; y++) {
      const density =
        variant === "gradient"
          ? 0.25 + 0.75 * ((y + 0.5) / rows)
          : variant === "dotted"
            ? 0.5
            : 0.75
      for (let x = 0; x < cols; x++) {
        if (variant === "hatched" && ((x + y) & 3) >= 2) continue
        const lit = variant === "solid" || density > matrix[y & 3][x & 3] - bias
        if (variant === "dotted" && !lit) continue
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        ctx.fillRect(x, y, 1, 1)
      }
    }
    ctx.fillStyle = rgb(fill, 1, 0.5)
    ctx.fillRect(0, 0, cols, 1)
    ctx.fillRect(0, rows - 1, cols, 1)
    ctx.fillRect(0, 0, 1, rows)
    ctx.fillRect(cols - 1, 0, 1, rows)
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelMatrixFromSeed } from "../engine/pixel"
  import { kitFromSeed } from "../engine/dither-paint"
  import { paintOnResize, type CanvasPaint } from "../runtime/canvas-mount"

  type Props = {
    color?: PixelColor
    variant?: BadgeVariant
    seed?: number
    class?: string
    children?: Snippet
  }

  let {
    color: colorProp,
    variant: variantProp,
    seed,
    class: className,
    children,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const variant = $derived<BadgeVariant>(variantProp ?? s?.variant ?? "gradient")

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const box = host.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    paintBadge(ctx, cols, rows, fillOf(color), variant, matrix)
  })
</script>

<span
  class={cn(
    "relative isolate inline-flex items-center overflow-hidden rounded px-2 py-0.5 font-mono text-[10px] text-foreground",
    className
  )}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    class="absolute inset-0 -z-10 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
  {@render children?.()}
</span>
