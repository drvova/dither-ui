import { type JSX, mergeProps } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createInviewLoop } from "./runtime/in-view"

export type BlobCursorProps = {
  color?: string
  size?: number
  lag?: number
  class?: string
  children?: JSX.Element
}

export default function BlobCursor(raw: BlobCursorProps) {
  const props = mergeProps({ color: "#7CFF67", size: 48, lag: 0.18 }, raw)

  let area: HTMLDivElement | undefined
  let blob: HTMLDivElement | undefined
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
    p.x += (m.x - p.x) * props.lag
    p.y += (m.y - p.y) * props.lag
    b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${m.active ? 1 : 0})`
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

  createInviewLoop(() => area, start, stop)

  return (
    <div
      ref={(el) => (area = el)}
      class={cn("relative overflow-hidden", props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => (m.active = false)}
    >
      {props.children}
      <div
        ref={(el) => (blob = el)}
        class="pointer-events-none absolute left-0 top-0 rounded-full blur-md"
        style={{
          width: `${props.size}px`,
          height: `${props.size}px`,
          background: props.color,
          "mix-blend-mode": "screen",
          transform: "scale(0)",
        }}
        aria-hidden="true"
      />
    </div>
  )
}
