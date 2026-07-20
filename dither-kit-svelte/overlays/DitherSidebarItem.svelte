<script lang="ts" module>
  import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
  import { cssColor, rgb } from "../engine/palette"

  /** 2px dithered rail marking the active item — same recipe as the tabs underline. */
  function paintRail(
    canvas: HTMLCanvasElement,
    color: PixelColor,
    cssHeight: number,
    matrix: number[][] = BAYER4
  ) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const rows = Math.max(4, Math.round(cssHeight / 2))
    canvas.width = 1
    canvas.height = rows
    const fill = fillOf(color)
    for (let y = 0; y < rows; y++) {
      const k = 0.55 + 0.45 * (1 - Math.abs(y / rows - 0.5) * 2)
      if (k > matrix[y & 3][0] * 0.9) {
        ctx.fillStyle = rgb(fill, 1, k)
        ctx.fillRect(0, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { useSidebar } from "./DitherSidebar.svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    label: string
    active?: boolean
    color?: PixelColor
    /** Right-aligned count — folds to a colored dot on the icon rail. */
    badge?: string | number
    icon?: Snippet
    onselect?: () => void
  }
  let { label, active = false, color = "blue", badge, icon, onselect }: Props = $props()

  const sidebar = useSidebar()

  // The rail canvas only mounts while active, so painting on mount + on color
  // change (Vue's watch) is all it needs — no ResizeObserver, fixed 24px height.
  function rail(canvas: HTMLCanvasElement, params: { color: PixelColor }) {
    let p = params
    const run = () => requestAnimationFrame(() => paintRail(canvas, p.color, 24))
    run()
    return {
      update(next: { color: PixelColor }) {
        p = next
        run()
      },
    }
  }
</script>

<button
  type="button"
  aria-current={active ? "true" : undefined}
  title={sidebar.collapsed ? label : undefined}
  class={cn(
    "relative flex items-center rounded-md text-left font-mono transition-colors",
    sidebar.compact ? "h-7 gap-2 px-2 text-[11px]" : "h-8 gap-2.5 px-2.5 text-[12px]",
    active
      ? "bg-card text-foreground"
      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
  )}
  onclick={() => onselect?.()}
>
  {#if active}
    <canvas
      use:rail={{ color }}
      aria-hidden="true"
      class="absolute inset-y-1.5 left-0 w-[2px]"
      style:image-rendering="pixelated"
    ></canvas>
  {/if}
  <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
    {#if icon}{@render icon()}{:else}<span class="size-1.5 rounded-[1px] bg-current opacity-70"></span>{/if}
  </span>
  {#if !sidebar.collapsed}<span class="min-w-0 flex-1 truncate">{label}</span>{/if}
  {#if badge !== undefined && !sidebar.collapsed}
    <span
      class="shrink-0 rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums"
      >{badge}</span
    >
  {:else if badge !== undefined && sidebar.collapsed}
    <span
      aria-hidden="true"
      class="absolute top-1.5 right-1.5 size-1.5 rounded-full"
      style:background-color={cssColor(color)}
    ></span>
  {/if}
</button>
