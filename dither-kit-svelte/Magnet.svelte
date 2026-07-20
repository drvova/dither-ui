<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    strength?: number
    radius?: number
    class?: string
    children?: Snippet
  }

  let { strength = 0.4, radius = 200, class: className, children }: Props = $props()

  let el = $state<HTMLElement | null>(null)
  let inner = $state<HTMLElement | null>(null)

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    const onMove = (e: PointerEvent) => {
      const box = el?.getBoundingClientRect()
      if (!box || !inner) return
      const dx = e.clientX - (box.left + box.width / 2)
      const dy = e.clientY - (box.top + box.height / 2)
      if (Math.hypot(dx, dy) < radius) {
        inner.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
      } else {
        inner.style.transform = "translate(0, 0)"
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  })
</script>

<div bind:this={el} class={cn("inline-block", className)}>
  <div bind:this={inner} class="dither-magnet-inner">
    {@render children?.()}
  </div>
</div>

<style>
  .dither-magnet-inner {
    transition: transform 300ms cubic-bezier(0.2, 0, 0, 1);
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-magnet-inner {
      transition: none;
    }
  }
</style>
