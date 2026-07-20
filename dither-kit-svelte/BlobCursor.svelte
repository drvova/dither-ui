<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    color?: string
    size?: number
    lag?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", size = 48, lag = 0.18, class: className, children }: Props = $props()

  let area = $state<HTMLElement | null>(null)
  let blob = $state<HTMLElement | null>(null)
  let raf = 0
  const m = { x: 0, y: 0, active: false }
  const p = { x: 0, y: 0 }

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    m.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const b = blob
    if (!b) return
    p.x += (m.x - p.x) * lag
    p.y += (m.y - p.y) * lag
    b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${m.active ? 1 : 0})`
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (pointer follow is cosmetic, not a required interaction) -->
<div
  bind:this={area}
  class={cn("relative overflow-hidden", className)}
  onpointermove={onMove}
  onpointerleave={() => (m.active = false)}
>
  {@render children?.()}
  <div
    bind:this={blob}
    class="pointer-events-none absolute left-0 top-0 rounded-full blur-md"
    style:width={`${size}px`}
    style:height={`${size}px`}
    style:background={color}
    style:mix-blend-mode="screen"
    style:transform="scale(0)"
    aria-hidden="true"
  ></div>
</div>
