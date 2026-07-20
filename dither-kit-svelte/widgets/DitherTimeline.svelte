<script lang="ts" module>
  import { rgb } from "../engine/palette"
  import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"

  export type TimelineItem = {
    title: string
    time?: string
    body?: string
    color?: PixelColor
  }

  const CELL = 2

  /** A small dithered filled dot — dense core fading at the rim through Bayer. */
  function paintDot(ctx: CanvasRenderingContext2D, cells: number, color: PixelColor): void {
    ctx.clearRect(0, 0, cells, cells)
    const c = cells / 2
    const fill = fillOf(color)
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c // 0 center → 1 rim
        const density = 1 - r
        if (density <= 0 || density <= BAYER4[y & 3][x & 3]) continue
        ctx.fillStyle = rgb(fill, 1, 0.5 + 0.5 * density)
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    items: TimelineItem[]
    dotSize?: number
    class?: string
  }

  let { items, dotSize = 12, class: className }: Props = $props()

  type DotParams = { color: PixelColor; dotSize: number }

  /** Local action painting one timeline dot. Vue paints every dot once in
   * onMounted; here each canvas owns its action, rAF-deferred for first paint
   * and repainting if its colour or size changes — no `$effect`. */
  function dotCanvas(canvas: HTMLCanvasElement, initial: DotParams) {
    let p = initial
    let raf = 0
    const paint = () => {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      const cells = Math.max(4, Math.round(p.dotSize / CELL))
      canvas.width = cells
      canvas.height = cells
      paintDot(ctx, cells, p.color)
    }
    raf = requestAnimationFrame(() => {
      raf = 0
      paint()
    })
    return {
      update(next: DotParams) {
        p = next
        paint()
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf)
      },
    }
  }
</script>

<ol class={cn("relative flex flex-col", className)}>
  {#each items as it, i (i)}
    <li class="relative flex gap-3 pb-5 last:pb-0">
      <!-- rail: dot + connecting line down to the next item -->
      <div class="relative flex flex-col items-center">
        <canvas
          use:dotCanvas={{ color: it.color ?? "blue", dotSize }}
          aria-hidden="true"
          style:width={`${dotSize}px`}
          style:height={`${dotSize}px`}
          style:image-rendering="pixelated"
        ></canvas>
        {#if i < items.length - 1}
          <span aria-hidden="true" class="mt-1 w-px flex-1 bg-border"></span>
        {/if}
      </div>
      <div class="flex-1 pt-px">
        <div class="flex items-baseline justify-between gap-2">
          <p class="text-[13px] text-foreground">{it.title}</p>
          {#if it.time}
            <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">{it.time}</span>
          {/if}
        </div>
        {#if it.body}
          <p class="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{it.body}</p>
        {/if}
      </div>
    </li>
  {/each}
</ol>
