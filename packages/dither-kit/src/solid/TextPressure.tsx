import { createMemo, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createInviewLoop } from "./runtime/in-view"
import "./TextPressure.css"

export type TextPressureProps = {
  text?: string
  /** @docs number (px) */
  radius?: number
  strength?: number
  class?: string
}

export default function TextPressure(raw: TextPressureProps) {
  const props = mergeProps({ text: "Pressure", radius: 140, strength: 1 }, raw)

  const chars = createMemo(() => [...props.text])
  let root: HTMLSpanElement | undefined
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
      const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / props.radius)
      const k = t * props.strength
      el.style.transform = `scale(${1 + k * 0.6})`
      el.style.fontWeight = String(Math.round(400 + k * 500))
    }
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
  }

  onMount(() => {
    onCleanup(() => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
    })
    if (pixelPrefersReducedMotion()) return
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
  })
  createInviewLoop(() => root, start, stop)

  return (
    <span ref={(el) => (root = el)} class={cn("inline-flex", props.class)} aria-label={props.text}>
      <Index each={chars()}>
        {(ch) => (
          <span aria-hidden="true" class="dither-pressure-char inline-block">
            {ch() === " " ? " " : ch()}
          </span>
        )}
      </Index>
    </span>
  )
}
