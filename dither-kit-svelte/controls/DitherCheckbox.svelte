<script lang="ts" module>
  import { rgb, type Rgb } from "../engine/palette"
  import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"

  const CELL = 2

  // Chunky pixel checkmark on the 8x8 cell grid (size-4 box at CELL=2).
  const MARK: Array<[number, number]> = [
    [1, 3], [1, 4],
    [2, 4], [2, 5],
    [3, 5], [3, 6],
    [4, 4], [4, 5],
    [5, 3], [5, 4],
    [6, 2], [6, 3],
  ]

  /** Paint the checkbox — a 1px border when unchecked, a dithered fill with a
   * near-white pixel checkmark when checked. */
  function paintBox(
    ctx: CanvasRenderingContext2D,
    n: number,
    fill: Rgb,
    muted: Rgb,
    checked: boolean,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, n, n)
    if (!checked) {
      ctx.fillStyle = rgb(muted, 1, 0.6)
      ctx.fillRect(0, 0, n, 1)
      ctx.fillRect(0, n - 1, n, 1)
      ctx.fillRect(0, 0, 1, n)
      ctx.fillRect(n - 1, 0, 1, n)
      return
    }
    const density = 0.8
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const lit = density > matrix[y & 3][x & 3]
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        ctx.fillRect(x, y, 1, 1)
      }
    }
    ctx.fillStyle = "rgba(245,245,248,0.95)"
    for (const [x, y] of MARK) ctx.fillRect(x, y, 1, 1)
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelMatrixFromSeed } from "../engine/pixel"
  import { kitFromSeed } from "../engine/dither-paint"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { paintOnResize, type CanvasPaint } from "../runtime/canvas-mount"

  type Props = {
    value?: boolean
    color?: PixelColor
    seed?: number
    disabled?: boolean
    class?: string
    children?: Snippet
  }

  let {
    value = $bindable(false),
    color: colorProp,
    seed,
    disabled = false,
    class: className,
    children,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const n = Math.max(4, Math.round(host.getBoundingClientRect().width / CELL))
    canvas.width = n
    canvas.height = n
    paintBox(ctx, n, fillOf(color), fillOf("grey"), value, matrix)
  })
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={value}
  {disabled}
  class={cn(
    CONTROL_BUTTON,
    "relative inline-flex min-h-10 items-center gap-2 text-left",
    className
  )}
  onclick={() => (value = !value)}
>
  <span class="relative size-4 shrink-0">
    <canvas
      use:paintOnResize={paint}
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    ></canvas>
  </span>
  <span class="text-[13px] text-foreground">{@render children?.()}</span>
</button>
