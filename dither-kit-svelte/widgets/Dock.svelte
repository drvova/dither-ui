<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"
  export type DockItem = { value: string; label: string; color?: PixelColor }
</script>

<script lang="ts">
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { cn } from "../runtime/lib"

  /** Hover-magnifying dock — items swell on a gaussian falloff around the
   * pointer and settle when it leaves. Reduced motion keeps the row still and
   * marks hover by color alone. */
  type Props = {
    items: DockItem[]
    /** Peak scale over the pointer. */
    magnify?: number
    /** Falloff radius in px. */
    range?: number
    class?: string
    onselect?: (value: string) => void
  }

  let { items, magnify = 1.7, range = 80, class: className, onselect }: Props = $props()

  let px = $state<number | null>(null)
  let bar = $state<HTMLDivElement | null>(null)
  const still = pixelPrefersReducedMotion()

  function track(e: PointerEvent) {
    if (still) return
    const r = bar?.getBoundingClientRect()
    if (r) px = e.clientX - r.left
  }

  function scaleOf(i: number): number {
    if (px === null || !bar) return 1
    const b = bar.querySelectorAll("button")[i] as HTMLElement | undefined
    if (!b) return 1
    const center = b.offsetLeft + b.offsetWidth / 2
    const d = Math.abs(px - center)
    const g = Math.exp(-(d * d) / (2 * range * range))
    return 1 + (magnify - 1) * g
  }
</script>

<div
  bind:this={bar}
  class={cn("inline-flex items-end gap-1.5 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5", className)}
  role="group"
  aria-label="Dock"
  onpointermove={track}
  onpointerleave={() => (px = null)}
>
  {#each items as it, i (it.value)}
    <button
      type="button"
      aria-label={it.label}
      title={it.label}
      class="grid size-9 origin-bottom place-items-center rounded-lg border border-border/60 bg-card/60 transition-transform duration-150 ease-out will-change-transform hover:bg-card motion-reduce:transition-none"
      style:transform={`scale(${scaleOf(i)})`}
      onclick={() => onselect?.(it.value)}
    >
      <span aria-hidden="true" class="size-2 rounded-[2px]" style:background={cssColor(it.color ?? "blue")}></span>
    </button>
  {/each}
</div>
