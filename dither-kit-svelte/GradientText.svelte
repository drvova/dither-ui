<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"

  type Props = {
    colors?: string[]
    speed?: number
    class?: string
    children?: Snippet
  }

  let {
    colors = ["#358ff3", "#7CFF67", "#358ff3"],
    speed = 1,
    class: className,
    children,
  }: Props = $props()

  const bg = $derived(
    `linear-gradient(90deg, ${(colors.length ? colors : ["#ffffff"]).join(", ")})`
  )
  const dur = $derived(`${Math.max(0.2, 6 / Math.max(0.01, speed))}s`)
</script>

<span
  class={cn("dither-gradient-text", className)}
  style:background-image={bg}
  style:animation-duration={dur}>{@render children?.()}</span>

<style>
  .dither-gradient-text {
    display: inline-block;
    background-size: 300% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: dither-gt linear infinite;
  }
  @keyframes dither-gt {
    to {
      background-position: 300% center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-gradient-text {
      animation: none;
    }
  }
</style>
