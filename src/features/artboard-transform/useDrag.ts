import { editor } from "@/entities/editor"

/** Pointer drag that reports world-space deltas (screen delta ÷ zoom), so
 * moving/resizing an artboard tracks the cursor at any zoom level. */
export function startDrag(
  e: PointerEvent,
  onDelta: (dx: number, dy: number, ev: PointerEvent) => void,
  onEnd?: () => void
) {
  e.preventDefault()
  e.stopPropagation()
  const z = editor.viewport.zoom || 1
  let px = e.clientX
  let py = e.clientY
  const move = (ev: PointerEvent) => {
    onDelta((ev.clientX - px) / z, (ev.clientY - py) / z, ev)
    px = ev.clientX
    py = ev.clientY
  }
  const up = () => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    onEnd?.()
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}
