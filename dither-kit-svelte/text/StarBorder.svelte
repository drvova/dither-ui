<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    color?: string
    speed?: number
    thickness?: number
    class?: string
    children?: Snippet
  }

  let {
    color = "#7CFF67",
    speed = 6,
    thickness = 1,
    class: className,
    children,
  }: Props = $props()

  const glint = $derived(`radial-gradient(circle, ${color}, transparent 12%)`)
</script>

<div
  class={cn("dither-star-border relative inline-block overflow-hidden rounded-[14px]", className)}
  style:padding="{thickness}px"
>
  <span class="star-strip star-bottom" style:background={glint} style:animation-duration="{speed}s" aria-hidden="true"></span>
  <span class="star-strip star-top" style:background={glint} style:animation-duration="{speed}s" aria-hidden="true"></span>
  <div class="relative z-[1] rounded-[13px] bg-background px-4 py-2">
    {@render children?.()}
  </div>
</div>

<style>
  .star-strip {
    position: absolute;
    width: 300%;
    height: 50%;
    border-radius: 50%;
    opacity: 0.7;
  }
  .star-bottom {
    bottom: -11px;
    right: -250%;
    animation: dither-star-move linear infinite alternate;
  }
  .star-top {
    top: -11px;
    left: -250%;
    animation: dither-star-move-rev linear infinite alternate;
  }
  @keyframes dither-star-move {
    to {
      transform: translateX(-100%);
    }
  }
  @keyframes dither-star-move-rev {
    to {
      transform: translateX(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .star-strip {
      animation: none;
    }
  }
</style>
