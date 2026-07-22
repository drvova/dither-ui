<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"
  export type PreviewRailItem = { value: string; label: string; hint?: string; color?: PixelColor }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { POPOVER } from "../runtime/control"
  import { cn } from "../runtime/lib"

  /** Codex-style navigation rail — compact ticks swell into a pyramid around
   * the pointer and float a destination preview beside the hovered or focused
   * tick. Reduced motion keeps the ticks still; the preview remains. */
  type Props = {
    items: PreviewRailItem[]
    /** Active destination value (bindable). */
    value?: string
    /** Pyramid falloff radius in px. */
    range?: number
    /** Screen edge the rail hugs; the preview floats toward the other side. */
    side?: "left" | "right"
    class?: string
    preview?: Snippet<[PreviewRailItem]>
  }
  let {
    items,
    value = $bindable(),
    range = 56,
    side = "left",
    class: className,
    preview,
  }: Props = $props()

  const still = pixelPrefersReducedMotion()

  let rail = $state<HTMLElement | null>(null)
  let py = $state<number | null>(null)
  let focusIndex = $state<number | null>(null)

  function track(e: PointerEvent) {
    const r = rail?.getBoundingClientRect()
    if (r) py = e.clientY - r.top
  }
  function onFocusin(e: FocusEvent) {
    const b = (e.target as HTMLElement).closest("button")
    focusIndex = b ? Number(b.dataset.i) : null
  }

  function centerOf(i: number): number | null {
    const b = rail?.querySelectorAll("button")[i] as HTMLElement | undefined
    return b ? b.offsetTop + b.offsetHeight / 2 : null
  }
  function widthOf(i: number): number {
    const rest = items[i]?.value === value ? 16 : 10
    if (still || py === null) return rest
    const c = centerOf(i)
    const w = c === null ? 0 : Math.max(0, 1 - Math.abs(py - c) / range)
    return rest + 16 * w
  }
  const previewIndex = $derived.by(() => {
    if (focusIndex !== null) return focusIndex
    if (py === null) return null
    let best: number | null = null
    let bd = Infinity
    for (let i = 0; i < items.length; i++) {
      const c = centerOf(i)
      if (c === null) continue
      const d = Math.abs(py - c)
      if (d < bd) {
        bd = d
        best = i
      }
    }
    return best
  })
  const previewItem = $derived(previewIndex === null ? null : (items[previewIndex] ?? null))
  const previewTop = $derived(previewIndex === null ? 0 : (centerOf(previewIndex) ?? 0))
</script>

<nav
  bind:this={rail}
  class={cn("relative inline-flex flex-col gap-1 py-1", className)}
  aria-label="Preview rail"
  onpointermove={track}
  onpointerleave={() => (py = null)}
  onfocusin={onFocusin}
  onfocusout={() => (focusIndex = null)}
>
  {#each items as it, i (it.value)}
    <button
      type="button"
      data-i={i}
      aria-label={it.hint ? `${it.label} — ${it.hint}` : it.label}
      aria-current={it.value === value ? "page" : undefined}
      class={cn(
        "flex h-4 w-9 items-center rounded-md px-1 hover:bg-card/60",
        side === "right" ? "justify-end" : "justify-start"
      )}
      onclick={() => (value = it.value)}
    >
      <span
        aria-hidden="true"
        class="h-0.5 rounded-full bg-foreground/30 transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style:width={`${widthOf(i)}px`}
        style:background={it.value === value ? cssColor(it.color ?? "blue") : undefined}
      ></span>
    </button>
  {/each}
  {#if previewItem}
    <div
      aria-hidden="true"
      class={cn(
        POPOVER,
        "pointer-events-none absolute z-10 whitespace-nowrap px-3 py-2 transition-[top] duration-150 ease-out motion-reduce:transition-none",
        side === "right" ? "right-full mr-2" : "left-full ml-2"
      )}
      style:top={`${previewTop}px`}
      style:transform="translateY(-50%)"
    >
      {#if preview}
        {@render preview(previewItem)}
      {:else}
        <div class="text-[12px] font-medium text-foreground">{previewItem.label}</div>
        {#if previewItem.hint}
          <p class="mt-0.5 text-[11px] text-muted-foreground">{previewItem.hint}</p>
        {/if}
      {/if}
    </div>
  {/if}
</nav>
