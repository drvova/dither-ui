<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    text?: string
    speed?: number
    class?: string
  }

  let { text = "DITHER UI \u00b7 CANVAS + BAYER \u00b7 ", speed = 60, class: className }: Props = $props()

  const uid = `dither-curve-${Math.floor(Math.random() * 1e9)}`
  const d = "M -100 58 Q 25 18 150 58 T 400 58 T 650 58 T 900 58"
  // Repeated enough to always cover the visible path plus one wrap unit.
  const content = untrack(() => text.repeat(10))

  let measure = $state<SVGTextElement | null>(null)
  let textPathEl = $state<SVGTextPathElement | null>(null)
  let raf = 0
  let offset = 0
  let copyLen = 0
  let lastT = 0

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const el = textPathEl
    if (!el || !copyLen) return
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
    lastT = now
    offset -= speed * dt
    while (offset <= -copyLen) offset += copyLen
    el.setAttribute("startOffset", String(offset))
  }

  onMount(() => {
    copyLen = measure?.getComputedTextLength?.() || 0
    if (pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  })
</script>

<svg viewBox="0 0 600 100" class={cn("w-full", className)} aria-label={text}>
  <defs>
    <path id={uid} {d} fill="none" />
  </defs>
  <!-- hidden single copy, measured once to wrap the scroll seamlessly -->
  <text bind:this={measure} class="dither-curve-text" x="-9999" y="-9999">{text}</text>
  <text class="dither-curve-text" aria-hidden="true">
    <textPath bind:this={textPathEl} href={`#${uid}`} startOffset="0">{content}</textPath>
  </text>
</svg>

<style>
  .dither-curve-text {
    fill: currentColor;
    font-size: 15px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
</style>
