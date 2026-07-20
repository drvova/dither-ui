<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    text?: string
    radius?: number
    class?: string
  }

  let {
    text = "Move the cursor across this line to feel the weight shift",
    radius = 120,
    class: className,
  }: Props = $props()

  // Per-character weight ramps with pointer distance — no scale, so nothing
  // reflows; good for a whole sentence.
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
      el.style.fontWeight = String(Math.round(300 + t * 600))
      el.style.opacity = String(0.55 + t * 0.45)
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

<span bind:this={root} class={cn("inline", className)} aria-label={text}>
  {#each chars as ch, i (i)}
    <span aria-hidden="true" class="dither-proximity-char" style="opacity: 0.55">{ch === " " ? "\u00a0" : ch}</span>
  {/each}
</span>

<style>
  .dither-proximity-char {
    white-space: pre;
    transition: font-weight 120ms linear, opacity 120ms linear;
  }
</style>
