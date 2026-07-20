<script lang="ts" module>
  import { rgb, type Rgb } from "./palette"
  import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

  const CELL = 2

  /** Paint the switch track — dithered gradient in the accent when on, a
   * near-invisible muted wash when off. */
  function paintTrack(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    fill: Rgb,
    muted: Rgb,
    on: boolean,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    for (let y = 0; y < rows; y++) {
      const density = on ? 0.25 + 0.75 * ((y + 0.5) / rows) : 0.2
      for (let x = 0; x < cols; x++) {
        const lit = density > matrix[y & 3][x & 3]
        if (on) {
          const k = 0.3 + density * 0.7
          ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        } else {
          ctx.fillStyle = rgb(muted, 1, lit ? 0.18 : 0.06)
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion, pixelMatrixFromSeed } from "./pixel"
  import { kitFromSeed } from "./dither-paint"
  import { CONTROL_BUTTON } from "./control"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    value?: boolean
    /** Accessible name — required for screen readers, the control has no text. */
    label?: string
    color?: PixelColor
    seed?: number
    disabled?: boolean
    class?: string
  }

  let {
    value = $bindable(false),
    label,
    color: colorProp,
    seed,
    disabled = false,
    class: className,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let reduce = $state(false)
  onMount(() => {
    reduce = pixelPrefersReducedMotion()
  })

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const box = host.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    paintTrack(ctx, cols, rows, fillOf(color), fillOf("grey"), value, matrix)
  })
</script>

<button
  type="button"
  role="switch"
  aria-label={label}
  aria-checked={value}
  {disabled}
  class={cn(
    CONTROL_BUTTON,
    "relative inline-flex size-10 shrink-0 items-center justify-center rounded-md",
    className
  )}
  onclick={() => (value = !value)}
>
  <span
    class="relative inline-flex h-5 w-9 items-center overflow-hidden rounded-[3px]"
  >
    <canvas
      use:paintOnResize={paint}
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    ></canvas>
    <span
      class="relative size-3.5 rounded-[2px] bg-foreground {value
        ? 'translate-x-[19px]'
        : 'translate-x-[3px]'} {reduce ? '' : 'transition-transform duration-150'}"
    ></span>
  </span>
</button>
