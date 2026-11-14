import { editor } from "../../entities/editor"
import { followPointer } from "@/shared/lib/follow"

/** Pointer drag that reports world-space deltas and always tears down cleanly
 * (released, cancelled, or stopped by the returned function). */
export function startDrag(
  e: PointerEvent,
  onDelta: (dx: number, dy: number, ev: PointerEvent) => void,
  onEnd?: () => void,
): () => void {
  e.preventDefault()
  e.stopPropagation()
  const z = editor.viewport.zoom || 1
  const pointerId = e.pointerId
  const target = e.currentTarget instanceof Element ? e.currentTarget : null
  let px = e.clientX
  let py = e.clientY

  try {
    target?.setPointerCapture?.(pointerId)
  } catch {
    /* detached/synthetic pointers use window listeners */
  }
  return followPointer(
    e,
    (ev) => {
      onDelta((ev.clientX - px) / z, (ev.clientY - py) / z, ev)
      px = ev.clientX
      py = ev.clientY
    },
    () => {
      try {
        if (target?.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId)
      } catch {
        /* capture already gone */
      }
      onEnd?.()
    },
  )
}
