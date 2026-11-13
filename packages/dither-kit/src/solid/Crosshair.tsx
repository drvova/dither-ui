import { createSignal, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type CrosshairProps = {
  color?: string
  thickness?: number
  class?: string
  children?: JSX.Element
}

export default function Crosshair(raw: CrosshairProps) {
  const props = mergeProps({ color: "#7CFF67", thickness: 1 }, raw)

  let area: HTMLDivElement | undefined
  const [x, setX] = createSignal(-99)
  const [y, setY] = createSignal(-99)
  const [shown, setShown] = createSignal(false)

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    setX(e.clientX - r.left)
    setY(e.clientY - r.top)
    setShown(true)
  }

  return (
    <div
      ref={(el) => (area = el)}
      class={cn("relative overflow-hidden", props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => setShown(false)}
    >
      {props.children}
      <div
        class="pointer-events-none absolute inset-y-0"
        style={{
          left: `${x()}px`,
          width: `${props.thickness}px`,
          background: props.color,
          opacity: shown() ? 0.8 : 0,
        }}
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-x-0"
        style={{
          top: `${y()}px`,
          height: `${props.thickness}px`,
          background: props.color,
          opacity: shown() ? 0.8 : 0,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
