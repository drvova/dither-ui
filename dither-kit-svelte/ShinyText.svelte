<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"

  type Props = {
    speed?: number
    disabled?: boolean
    class?: string
    children?: Snippet
  }

  let { speed = 1, disabled = false, class: className, children }: Props = $props()

  const dur = $derived(`${Math.max(0.4, 5 / Math.max(0.01, speed))}s`)
</script>

<span
  class={cn("dither-shiny-text", className)}
  style:animation-duration={dur}
  style:animation-play-state={disabled ? "paused" : "running"}>{@render children?.()}</span>

<style>
  .dither-shiny-text {
    display: inline-block;
    color: transparent;
    background-image: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.35) 40%,
      #ffffff 50%,
      rgba(255, 255, 255, 0.35) 60%
    );
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    animation: dither-shine linear infinite;
  }
  @keyframes dither-shine {
    to {
      background-position: -220% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-shiny-text {
      animation: none;
      color: rgba(255, 255, 255, 0.8);
    }
  }
</style>
