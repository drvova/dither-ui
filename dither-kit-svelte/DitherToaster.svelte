<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf, type PixelColor } from "./pixel"

  const CELL = 2

  /** Paint the 3px left rail — DitherCollapsible's vertical dither ramp. */
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
  import { flip } from "svelte/animate"
  import { fly } from "svelte/transition"
  import { portal } from "./portal"
  import { pixelPrefersReducedMotion } from "./pixel"
  import { dismiss, toasts } from "./toast.svelte"

  const rm = pixelPrefersReducedMotion()

  function rail(canvas: HTMLCanvasElement, color: PixelColor) {
    requestAnimationFrame(() => paintRail(canvas, color))
    return {}
  }
</script>

<div
  use:portal
  role="status"
  aria-live="polite"
  class="pointer-events-none fixed right-4 bottom-4 z-[60] grid justify-items-end gap-2"
>
  {#each toasts as t (t.id)}
    <div
      class="pointer-events-auto flex gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px]"
      animate:flip={{ duration: rm ? 0 : 160 }}
      transition:fly={{ y: 8, duration: rm ? 0 : 160 }}
    >
      <canvas
        use:rail={t.color}
        aria-hidden="true"
        class="w-[3px] self-stretch"
        style:image-rendering="pixelated"
      ></canvas>
      <span class="min-w-0 flex-1 self-center">{t.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        class="self-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        onclick={() => dismiss(t.id)}
      >
        ×
      </button>
    </div>
  {/each}
</div>
