<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    color?: string
    count?: number
    duration?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", count = 4, duration = 3, class: className, children }: Props = $props()

  const rings = $derived(Math.max(1, Math.round(count)))
</script>

<div class={cn("relative grid place-items-center overflow-hidden", className)}>
  {@render children?.()}
  {#each Array.from({ length: rings }, (_, i) => i) as i (i)}
    <span
      class="dither-ring pointer-events-none absolute rounded-full"
      style:border-color={color}
      style:animation-duration={`${duration}s`}
      style:animation-delay={`${-(i * duration) / rings}s`}
      aria-hidden="true"
    ></span>
  {/each}
</div>

<style>
  .dither-ring {
    width: 40px;
    height: 40px;
    border: 2px solid;
    animation: dither-ring-expand ease-out infinite;
  }
  @keyframes dither-ring-expand {
    0% {
      transform: scale(0.2);
      opacity: 0.9;
    }
    100% {
      transform: scale(6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-ring {
      animation: none;
      opacity: 0.3;
    }
  }
</style>
