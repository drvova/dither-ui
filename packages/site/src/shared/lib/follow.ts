// Follow one pointer from its press until it lets go: every drag in the
// Studio (a frame moved or resized, a pan, a marquee, a colour picked, a
// curve's handle) is this loop. Only the pressing pointer's moves count (a
// second finger, or a mouse beside a pen, steers nothing), and the drag ends
// on its release or on its cancel: a touch the browser took for a scroll or
// a pinch, or a drag the pinch ended (`features/pan-zoom`), never leaves a
// listener behind to steer the next pointer that moves.

type FollowEnd = (ev: PointerEvent | null, cancelled: boolean) => void

/** Calls `onMove` with each move of `down`'s pointer and `onEnd` once, when it
 * is up (`cancelled` false), cancelled (true) or stopped by the returned
 * function (no event). */
export function followPointer(down: PointerEvent, onMove: (ev: PointerEvent) => void, onEnd?: FollowEnd): () => void {
  const id = down.pointerId
  let active = true
  const move = (ev: PointerEvent) => {
    if (ev.pointerId === id) onMove(ev)
  }
  const finish = (ev: PointerEvent | null) => {
    if (!active) return
    active = false
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", end)
    window.removeEventListener("pointercancel", end)
    onEnd?.(ev, ev?.type === "pointercancel")
  }
  const end = (ev: PointerEvent) => {
    if (ev.pointerId === id) finish(ev)
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", end)
  window.addEventListener("pointercancel", end)
  return () => finish(null)
}
