<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    position?: "bottom" | "top"
    height?: number
    strength?: number
    class?: string
    children?: Snippet
  }

  let {
    position = "bottom",
    height = 96,
    strength = 4,
    class: className,
    children,
  }: Props = $props()

  // Progressive edge blur (iOS-style): a masked backdrop-filter strip so content
  // dissolves toward the chosen edge.
  const mask = $derived(
    position === "top"
      ? "linear-gradient(to bottom, black, transparent)"
      : "linear-gradient(to top, black, transparent)"
  )
</script>

<div class={cn("relative", className)}>
  {@render children?.()}
  <div
    class="pointer-events-none absolute inset-x-0 {position === 'top' ? 'top-0' : 'bottom-0'}"
    style:height="{height}px"
    style:backdrop-filter="blur({strength}px)"
    style:-webkit-backdrop-filter="blur({strength}px)"
    style:mask-image={mask}
    style:-webkit-mask-image={mask}
  ></div>
</div>
