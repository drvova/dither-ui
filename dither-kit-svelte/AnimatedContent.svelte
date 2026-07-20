<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"
  import { inView } from "./in-view"

  type Props = {
    distance?: number
    direction?: "vertical" | "horizontal"
    reverse?: boolean
    duration?: number
    delay?: number
    class?: string
    children?: Snippet
  }

  let {
    distance = 40,
    direction = "vertical",
    reverse = false,
    duration = 800,
    delay = 0,
    class: className,
    children,
  }: Props = $props()

  let shown = $state(false)

  const hidden = $derived.by(() => {
    const d = distance * (reverse ? -1 : 1)
    return direction === "horizontal" ? `translateX(${d}px)` : `translateY(${d}px)`
  })
</script>

<div
  use:inView={() => (shown = true)}
  class={cn("dither-animated-content", className)}
  style:opacity={shown ? 1 : 0}
  style:transform={shown ? "none" : hidden}
  style:transition-duration="{duration}ms"
  style:transition-delay="{delay}ms"
>
  {@render children?.()}
</div>

<style>
  .dither-animated-content {
    transition-property: opacity, transform;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-animated-content {
      transition: none;
    }
  }
</style>
