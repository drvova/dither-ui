<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    text?: string
    baseSpeed?: number
    class?: string
  }

  let { text = "DITHER \u00b7 UI \u00b7 TOOLKIT \u00b7 ", baseSpeed = 60, class: className }: Props = $props()

  // Two identical halves so wrapping by half-width is seamless.
  const repeated = $derived(Array.from({ length: 8 }, () => text))
  let track = $state<HTMLElement | null>(null)
  let raf = 0
  let x = 0
  let vel = 0
  let lastScroll = 0
  let lastT = 0
  let half = 0

  function onScroll() {
    const y = window.scrollY
    vel += y - lastScroll
    lastScroll = y
  }
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const el = track
    if (!el) return
    if (!half) half = el.scrollWidth / 2 || 1
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
    lastT = now
    x -= (baseSpeed + vel * 4) * dt
    vel *= 0.9
    while (x <= -half) x += half
    while (x > 0) x -= half
    el.style.transform = `translateX(${x}px)`
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    lastScroll = window.scrollY
    window.addEventListener("scroll", onScroll, { passive: true })
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
    }
  })
</script>

<div class={cn("overflow-hidden whitespace-nowrap", className)} aria-label={text}>
  <div bind:this={track} class="inline-flex will-change-transform" aria-hidden="true">
    {#each repeated as t, i (i)}
      <span class="pr-6">{t}</span>
    {/each}
  </div>
</div>
