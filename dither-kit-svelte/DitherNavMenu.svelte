<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf, type PixelColor } from "./pixel"

  export type NavMenuItem = { label: string; href?: string }

  const CELL = 2

  /** Paint the 2px underline — the same horizontal dither ramp as DitherTabs. */
  function paintUnderline(
    canvas: HTMLCanvasElement,
    width: number,
    color: PixelColor,
    matrix: number[][] = BAYER4
  ): void {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || width <= 0) return
    const cols = Math.max(4, Math.round(width / CELL))
    canvas.width = cols
    canvas.height = 1
    const fill = fillOf(color)
    ctx.clearRect(0, 0, cols, 1)
    for (let x = 0; x < cols; x++) {
      const density = (x + 0.5) / cols
      const lit = density > matrix[0][x & 3]
      const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
      if (alpha <= 0.004) continue
      ctx.fillStyle = rgb(fill, 1, alpha)
      ctx.fillRect(x, 0, 1, 1)
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"

  type Props = {
    items: NavMenuItem[]
    value: string
    color?: PixelColor
  }
  let { items, value = $bindable(), color = "blue" }: Props = $props()

  let listEl = $state<HTMLDivElement | null>(null)
  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let underline = $state({ left: 0, width: 0 })

  function anchors(): HTMLAnchorElement[] {
    return listEl ? [...listEl.querySelectorAll<HTMLAnchorElement>("a")] : []
  }
  function measure() {
    const active = anchors()[items.findIndex((it) => it.label === value)]
    if (!active) return
    underline = { left: active.offsetLeft, width: active.offsetWidth }
    if (canvasEl) paintUnderline(canvasEl, active.offsetWidth, color)
  }

  const measureKey = $derived(JSON.stringify([value, items.map((i) => i.label), color]))
  function navMarker(list: HTMLElement, _key: string) {
    let ro: ResizeObserver | null = null
    const run = () => requestAnimationFrame(measure)
    run()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure)
      ro.observe(list)
    }
    return {
      update() {
        run()
      },
      destroy() {
        ro?.disconnect()
      },
    }
  }
</script>

<nav class="relative">
  <div bind:this={listEl} use:navMarker={measureKey} class="flex gap-4">
    {#each items as item (item.label)}
      <a
        href={item.href ?? "#"}
        aria-current={item.label === value ? "page" : undefined}
        class={cn(
          "pb-2 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none",
          item.label === value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        onclick={(e) => {
          e.preventDefault()
          value = item.label
        }}
      >
        {item.label}
      </a>
    {/each}
  </div>
  <canvas
    bind:this={canvasEl}
    aria-hidden="true"
    class="absolute bottom-0 h-[2px] transition-[left,width] duration-200 motion-reduce:transition-none"
    style={`left:${underline.left}px;width:${underline.width}px;image-rendering:pixelated`}
  ></canvas>
</nav>
