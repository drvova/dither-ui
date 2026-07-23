<script lang="ts">
  import type { Snippet } from "svelte"
  import { cssColor } from "../engine/palette"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** An accent tile that expands into a dotted-arrow trail on hover or focus —
   * the trail is stamped by a repeating radial gradient in the accent hue and
   * the head tile nudges forward. Reduced motion reveals the trail instantly. */
  type Props = {
    color?: PixelColor
    disabled?: boolean
    class?: string
    onclick?: () => void
    children?: Snippet
  }
  let { color = "blue", disabled = false, class: className, onclick, children }: Props = $props()
</script>

<button
  type="button"
  {disabled}
  class={cn(
    "group inline-flex items-center gap-3 rounded-md border border-border/60 bg-card/60 py-1.5 pr-1.5 pl-3.5 font-mono text-[12px] text-muted-foreground transition-colors select-none hover:text-foreground focus-visible:text-foreground",
    CONTROL_BUTTON,
    className
  )}
  onclick={() => onclick?.()}
>
  {#if children}
    {@render children()}
  {:else}
    Explore the kit
  {/if}
  <span aria-hidden="true" class="flex items-center">
    <span
      class="h-[3px] w-0 opacity-0 transition-[width,opacity] duration-300 ease-out group-hover:w-9 group-hover:opacity-100 group-focus-visible:w-9 group-focus-visible:opacity-100 motion-reduce:transition-none"
      style:background-image={`radial-gradient(circle, ${cssColor(color)} 1.5px, transparent 1.5px)`}
      style:background-size="6px 3px"
      style:background-position="center"
    ></span>
    <span
      class="grid size-8 shrink-0 place-items-center rounded-md text-[14px] text-background transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
      style:background={cssColor(color)}
    >
      →
    </span>
  </span>
</button>
