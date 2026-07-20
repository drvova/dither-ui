<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    class?: string
    children?: Snippet
  }

  let { class: className, children }: Props = $props()
</script>

<div class={cn("dither-glare relative inline-block overflow-hidden rounded-[12px]", className)}>
  {@render children?.()}
  <div class="glare pointer-events-none absolute inset-0" aria-hidden="true"></div>
</div>

<style>
  /* A full-cover diagonal shine that sweeps across on hover; the parent's
     overflow-hidden clips it, so the stripe reads as a single glare pass. */
  .glare {
    background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.5) 50%, transparent 65%);
    transform: translateX(-100%);
    transition: transform 700ms ease;
    will-change: transform;
  }
  .dither-glare:hover .glare {
    transform: translateX(100%);
  }
  @media (prefers-reduced-motion: reduce) {
    .glare {
      transition: none;
    }
  }
</style>
