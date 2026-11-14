import { createSignal, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./TargetCursor.css"

export type TargetCursorProps = {
  /** @docs string (hex) */
  color?: string
  /** @docs number (px) */
  size?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function TargetCursor(raw: TargetCursorProps) {
  const props = mergeProps({ color: "#7CFF67", size: 36 }, raw)

  let area: HTMLDivElement | undefined
  const [x, setX] = createSignal(-99)
  const [y, setY] = createSignal(-99)
  const [on, setOn] = createSignal(false)

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    setX(e.clientX - r.left)
    setY(e.clientY - r.top)
    setOn(true)
  }

  return (
    <div
      ref={(el) => (area = el)}
      class={cn("dk-target-cursor relative overflow-hidden", props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => setOn(false)}
    >
      {props.children}
      <div
        class="dither-target pointer-events-none absolute left-0 top-0"
        style={{
          width: `${props.size}px`,
          height: `${props.size}px`,
          transform: `translate(${x()}px, ${y()}px) translate(-50%, -50%)`,
          opacity: on() ? 1 : 0,
          color: props.color,
        }}
        aria-hidden="true"
      >
        <span class="corner tl" />
        <span class="corner tr" />
        <span class="corner bl" />
        <span class="corner br" />
      </div>
    </div>
  )
}
