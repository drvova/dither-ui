import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./Magnet.css"

export type MagnetProps = {
  strength?: number
  radius?: number
  class?: string
  children?: JSX.Element
}

export default function Magnet(raw: MagnetProps) {
  const props = mergeProps({ strength: 0.4, radius: 200 }, raw)

  let el: HTMLDivElement | undefined
  let inner: HTMLDivElement | undefined

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    const onMove = (e: PointerEvent) => {
      const box = el?.getBoundingClientRect()
      const it = inner
      if (!box || !it) return
      const dx = e.clientX - (box.left + box.width / 2)
      const dy = e.clientY - (box.top + box.height / 2)
      if (Math.hypot(dx, dy) < props.radius) {
        it.style.transform = `translate(${dx * props.strength}px, ${dy * props.strength}px)`
      } else {
        it.style.transform = "translate(0, 0)"
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    onCleanup(() => window.removeEventListener("pointermove", onMove))
  })

  return (
    <div ref={(node) => (el = node)} class={cn("inline-block", props.class)}>
      <div ref={(node) => (inner = node)} class="dither-magnet-inner">
        {props.children}
      </div>
    </div>
  )
}
