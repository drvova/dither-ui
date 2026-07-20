<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    rows?: number
    cols?: number
    color?: string
    class?: string
    children?: Snippet
  }

  let { rows = 6, cols = 10, color = "#111318", class: className, children }: Props = $props()

  // Deterministic per-cell delay so the dissolve order is stable.
  function seeded(i: number) {
    const s = Math.sin(i * 43.21) * 1000
    return s - Math.floor(s)
  }
  const cells = $derived(
    Array.from({ length: Math.max(1, rows * cols) }, (_, i) => seeded(i) * 300)
  )
</script>

<div class={cn("dither-pixeltrans group relative overflow-hidden", className)}>
  {@render children?.()}
  <div
    class="pointer-events-none absolute inset-0 grid"
    style:grid-template-columns={`repeat(${cols}, 1fr)`}
    style:grid-template-rows={`repeat(${rows}, 1fr)`}
    aria-hidden="true"
  >
    {#each cells as delay, i (i)}
      <span class="dither-cell" style:background={color} style:transition-delay={`${delay}ms`}></span>
    {/each}
  </div>
</div>

<style>
  .dither-cell {
    transition: opacity 260ms ease;
  }
  .group:hover .dither-cell {
    opacity: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-cell {
      transition: none;
    }
  }
</style>
