<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"
  import { inView } from "./in-view"

  type Props = {
    duration?: number
    delay?: number
    blur?: boolean
    class?: string
    children?: Snippet
  }

  let {
    duration = 1000,
    delay = 0,
    blur = false,
    class: className,
    children,
  }: Props = $props()

  let shown = $state(false)
</script>

<div
  use:inView={() => (shown = true)}
  class={cn("dither-fade-content", className)}
  style:opacity={shown ? 1 : 0}
  style:filter={blur && !shown ? "blur(10px)" : "blur(0)"}
  style:transition-duration="{duration}ms"
  style:transition-delay="{delay}ms"
>
  {@render children?.()}
</div>

<style>
  .dither-fade-content {
    transition-property: opacity, filter;
    transition-timing-function: ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-fade-content {
      transition: none;
    }
  }
</style>
