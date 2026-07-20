<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"

  type Props = {
    items?: string[]
    radius?: number
    duration?: number
    size?: number
    class?: string
    children?: Snippet
  }

  let {
    items = ["A", "B", "C", "D", "E"],
    radius = 80,
    duration = 16,
    size = 200,
    class: className,
    children,
  }: Props = $props()

  const placed = $derived.by(() => {
    const n = items.length || 1
    return items.map((it, i) => {
      const a = (i / n) * Math.PI * 2
      return { it, x: Math.sin(a) * radius, y: -Math.cos(a) * radius }
    })
  })
</script>

<div
  class={cn("relative grid place-items-center", className)}
  style:width={`${size}px`}
  style:height={`${size}px`}
  aria-hidden="true"
>
  <div class="dither-orbit absolute inset-0" style:animation-duration={`${duration}s`}>
    {#each placed as p, i (i)}
      <span
        class="absolute left-1/2 top-1/2 grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-xs"
        style:transform={`translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`}
      >
        <span class="dither-orbit-label" style:animation-duration={`${duration}s`}>{p.it}</span>
      </span>
    {/each}
  </div>
  {@render children?.()}
</div>

<style>
  .dither-orbit {
    animation: dither-orbit-spin linear infinite;
  }
  @keyframes dither-orbit-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .dither-orbit-label {
    display: block;
    animation: dither-orbit-counter linear infinite;
  }
  @keyframes dither-orbit-counter {
    to {
      transform: rotate(-360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-orbit,
    .dither-orbit-label {
      animation: none;
    }
  }
</style>
