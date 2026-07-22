<script lang="ts">
  import type { Snippet } from "svelte"
  import { cssColor } from "../engine/palette"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Morphing status pill — a compact row that stays visible while the detail
   * panel unfolds beneath it through the house 0fr -> 1fr grid trick. Escape
   * collapses; reduced motion snaps. */
  type Props = {
    /** Expanded state (bindable). */
    open?: boolean
    label?: string
    color?: PixelColor
    /** Pulse the status dot while collapsed. */
    live?: boolean
    class?: string
    compact?: Snippet
    children?: Snippet
  }

  let {
    open = $bindable(false),
    label = "Status",
    color = "green",
    live = true,
    class: className,
    compact,
    children,
  }: Props = $props()
</script>

<div
  class={cn("inline-block overflow-hidden rounded-2xl border border-border/60 bg-background/80 font-mono", className)}
  onkeydown={(e) => {
    if (e.key === "Escape") open = false
  }}
  role="presentation"
>
  <button
    type="button"
    class="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-card/40"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <span
      aria-hidden="true"
      class={cn("size-1.5 shrink-0 rounded-full motion-reduce:animate-none", live && !open && "animate-pulse")}
      style:background={cssColor(color)}
    ></span>
    {#if compact}{@render compact()}{:else}{label}{/if}
    <span
      aria-hidden="true"
      class={cn(
        "ml-auto pl-3 text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
        open && "rotate-180"
      )}>▾</span
    >
  </button>
  <div
    class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
    style:grid-template-rows={open ? "1fr" : "0fr"}
  >
    <div class="min-h-0 overflow-hidden" inert={!open}>
      <div class="border-t border-border/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {@render children?.()}
      </div>
    </div>
  </div>
</div>
