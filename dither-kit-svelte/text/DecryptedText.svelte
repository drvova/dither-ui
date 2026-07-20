<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    text?: string
    speed?: number
    trigger?: "view" | "hover"
    class?: string
  }

  let { text = "DECRYPTED", speed = 1, trigger = "view", class: className }: Props = $props()

  const CHARS = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789"
  let display = $state("")
  let el = $state<HTMLElement | null>(null)
  let raf = 0
  let io: IntersectionObserver | null = null
  let running = false

  const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

  function scramble() {
    if (running) return
    running = true
    const t = text
    const revealEvery = Math.max(1, Math.round(3 / Math.max(0.1, speed)))
    const total = t.length * revealEvery + 8
    let frame = 0
    const tick = () => {
      frame++
      const revealed = Math.floor(frame / revealEvery)
      let out = ""
      for (let i = 0; i < t.length; i++) out += i < revealed ? t[i] : t[i] === " " ? " " : rand()
      display = out
      if (frame < total) raf = requestAnimationFrame(tick)
      else {
        display = t
        running = false
      }
    }
    raf = requestAnimationFrame(tick)
  }

  onMount(() => {
    display = text.replace(/[^ ]/g, "?")
    if (pixelPrefersReducedMotion() || trigger === "hover") {
      display = text
      return
    }
    if (typeof IntersectionObserver === "undefined") {
      scramble()
      return
    }
    io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        scramble()
        io?.disconnect()
      }
    })
    if (el) io.observe(el)
  })
  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf)
    io?.disconnect()
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (hover is a cosmetic replay, not a required interaction) -->
<span
  bind:this={el}
  class={cn("inline-block whitespace-pre font-mono", className)}
  aria-label={text}
  onmouseenter={() => trigger === "hover" && scramble()}>{display}</span>
