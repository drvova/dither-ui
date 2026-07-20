<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    text?: string
    radius?: number
    strength?: number
    class?: string
  }

  let { text = "Pressure", radius = 140, strength = 1, class: className }: Props = $props()

  const chars = $derived([...text])
  let root = $state<HTMLElement | null>(null)
  let raf = 0
  let mx = -1e9
  let my = -1e9

  function onMove(e: PointerEvent) {
    mx = e.clientX
    my = e.clientY
  }
  function onLeave() {
    mx = -1e9
    my = -1e9
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const kids = root?.children
    if (!kids) return
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i] as HTMLElement
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / radius)
      const k = t * strength
      el.style.transform = `scale(${1 + k * 0.6})`
      el.style.fontWeight = String(Math.round(400 + k * 500))
    }
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
    }
  })
</script>

<span bind:this={root} class={cn("inline-flex", className)} aria-label={text}>
  {#each chars as ch, i (i)}
    <span aria-hidden="true" class="dither-pressure-char inline-block">{ch === " " ? "\u00a0" : ch}</span>
  {/each}
</span>

<style>
  .dither-pressure-char {
    white-space: pre;
    transform-origin: center bottom;
    transition: transform 90ms linear, font-weight 90ms linear;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-pressure-char {
      transition: none;
    }
  }
</style>
