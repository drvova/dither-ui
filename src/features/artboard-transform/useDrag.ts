import { editor } from "@/entities/editor"

/** Pointer drag that reports world-space deltas and always tears down cleanly. */
export function startDrag(
  e: PointerEvent,
  onDelta: (dx: number, dy: number, ev: PointerEvent) => void,
  onEnd?: () => void
): () => void {
  e.preventDefault()
  e.stopPropagation()
  const z = editor.viewport.zoom || 1
  const pointerId = e.pointerId
  const target = e.currentTarget instanceof Element ? e.currentTarget : null
  let px = e.clientX
  let py = e.clientY
  let active = true

  try { target?.setPointerCapture?.(pointerId) } catch { /* detached/synthetic pointers use window listeners */ }
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return
    onDelta((ev.clientX - px) / z, (ev.clientY - py) / z, ev)
    px = ev.clientX
    py = ev.clientY
  }
  const end = (ev: PointerEvent) => {
    if (ev.pointerId === pointerId) cleanup()
  }
  const cleanup = () => {
    if (!active) return
    active = false
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", end)
    window.removeEventListener("pointercancel", end)
    try { if (target?.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId) } catch { /* capture already gone */ }
    onEnd?.()
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", end)
  window.addEventListener("pointercancel", end)
  return cleanup
}
