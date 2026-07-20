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

  let { color = "#5227FF", speed = 1, thickness = 2, class: className, children }: Props = $props()

  const uid = `dither-electric-${Math.floor(Math.random() * 1e9)}`
  const dur = $derived(`${2 / Math.max(0.1, speed)}s`)
</script>

<div class={cn("relative inline-block rounded-[12px] px-4 py-2", className)}>
  <!-- 0x0 filter host: turbulence displaces the overlay border into an arc -->
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <defs>
      <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="3" result="n">
          <animate attributeName="seed" from="0" to="12" {dur} repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale={thickness * 3} />
      </filter>
    </defs>
  </svg>
  <div
    class="pointer-events-none absolute inset-0 rounded-[12px]"
    style:border="{thickness}px solid {color}"
    style:filter="url(#{uid})"
    aria-hidden="true"
  ></div>
  <div class="relative">
    {@render children?.()}
  </div>
</div>

<style>
  @media (prefers-reduced-motion: reduce) {
    div[aria-hidden] {
      filter: none !important;
    }
  }
</style>
