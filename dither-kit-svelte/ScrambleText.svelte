<script lang="ts">
  import { onDestroy, untrack } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    text?: string
    speed?: number
    class?: string
  }

  let { text = "Hover to scramble", speed = 1, class: className }: Props = $props()

  const CHARS = "!<>-_\\/[]{}=+*^?#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let display = $state(untrack(() => text))
  let raf = 0
  let running = false
  const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

  // A hover burst: every char randomises, then settles left-to-right.
  function scramble() {
    if (pixelPrefersReducedMotion() || running) return
    running = true
    const t = text
    const settleEvery = Math.max(1, Math.round(2 / Math.max(0.1, speed)))
    const total = t.length * settleEvery + 6
    let frame = 0
    const tick = () => {
      frame++
      const settled = Math.floor(frame / settleEvery)
      let out = ""
      for (let i = 0; i < t.length; i++) out += i < settled ? t[i] : t[i] === " " ? " " : rand()
      display = out
      if (frame < total) raf = requestAnimationFrame(tick)
      else {
        display = t
        running = false
      }
    }
    raf = requestAnimationFrame(tick)
  }

  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (hover scramble is cosmetic, not a required interaction) -->
<span
  class={cn("inline-block cursor-default whitespace-pre font-mono", className)}
  aria-label={text}
  onmouseenter={scramble}>{display}</span>
