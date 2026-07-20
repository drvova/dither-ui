<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    items?: string[]
    speed?: number
    gap?: number
    class?: string
  }

  let {
    items = ["DITHER", "BAYER", "CANVAS", "VUE", "PIXELS"],
    speed = 18,
    gap = 48,
    class: className,
  }: Props = $props()

  // Duplicated once so translateX(-50%) wraps seamlessly.
  const loop = $derived([...items, ...items])
</script>

<div class={cn("overflow-hidden", className)} aria-hidden="true">
  <div class="dither-logoloop flex w-max" style:animation-duration={`${speed}s`}>
    {#each loop as it, i (i)}
      <span class="shrink-0 whitespace-nowrap" style:padding-right={`${gap}px`}>{it}</span>
    {/each}
  </div>
</div>

<style>
  .dither-logoloop {
    animation: dither-loop linear infinite;
    will-change: transform;
  }
  @keyframes dither-loop {
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-logoloop {
      animation: none;
    }
  }
</style>
