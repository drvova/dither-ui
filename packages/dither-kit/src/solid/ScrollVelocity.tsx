import { createMemo, For, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createInviewLoop } from "./runtime/in-view"

export type ScrollVelocityProps = {
  text?: string
  baseSpeed?: number
  class?: string
}

export default function ScrollVelocity(raw: ScrollVelocityProps) {
  const props = mergeProps({ text: "DITHER · UI · TOOLKIT · ", baseSpeed: 60 }, raw)

  // Two identical halves so wrapping by half-width is seamless.
  const repeated = createMemo(() => Array.from({ length: 8 }, () => props.text))
  let host: HTMLDivElement | undefined
  let track: HTMLDivElement | undefined
  let raf = 0
  let x = 0
  let vel = 0
  let lastScroll = 0
  let lastT = 0
  let half = 0

  function onScroll() {
    const y = window.scrollY
    // While the loop is paused (element offscreen) keep the baseline fresh but
    // never accrue velocity — a resume must not fire a stale scroll impulse.
    if (!raf) {
      lastScroll = y
      return
    }
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
    x -= (props.baseSpeed + vel * 4) * dt
    vel *= 0.9
    while (x <= -half) x += half
    while (x > 0) x -= half
    el.style.transform = `translateX(${x}px)`
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    lastScroll = window.scrollY
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
    vel = 0
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    lastScroll = window.scrollY
    window.addEventListener("scroll", onScroll, { passive: true })
    onCleanup(() => {
      window.removeEventListener("scroll", onScroll)
    })
  })
  createInviewLoop(() => host, start, stop)

  return (
    <div ref={(el) => (host = el)} class={cn("overflow-hidden whitespace-nowrap", props.class)} aria-label={props.text}>
      <div ref={(el) => (track = el)} class="inline-flex will-change-transform" aria-hidden="true">
        <For each={repeated()}>{(t) => <span class="pr-6">{t}</span>}</For>
      </div>
    </div>
  )
}
