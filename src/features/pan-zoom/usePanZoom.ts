import type { Ref } from "vue"
import { editor, zoomTo } from "@/entities/editor"

/** The canvas's gestures over `editor.viewport` (the keys and the bar zoom
 * through the editor's view functions). Wheel pans; ctrl/cmd-wheel (or a
 * trackpad pinch) zooms to the cursor; a middle drag, a Space drag or one
 * finger on empty canvas pans; two fingers pinch. The viewport is read at
 * each use, never kept: the editor replaces it when a document loads or a
 * project switches, and a copy would steer an orphan. */
export function usePanZoom(host: Ref<HTMLElement | null>) {
  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = host.value?.getBoundingClientRect()
    if (e.ctrlKey || e.metaKey) {
      const cx = e.clientX - (rect?.left ?? 0)
      const cy = e.clientY - (rect?.top ?? 0)
      zoomTo(editor.viewport.zoom * (1 - e.deltaY * 0.0015), cx, cy)
    } else {
      editor.viewport.x -= e.deltaX
      editor.viewport.y -= e.deltaY
    }
  }

  function startPan(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 1) return
    const id = e.pointerId
    let px = e.clientX
    let py = e.clientY
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      editor.viewport.x += ev.clientX - px
      editor.viewport.y += ev.clientY - py
      px = ev.clientX
      py = ev.clientY
    }
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // Two fingers pinch: zoom about their midpoint by the change in their
  // spread, and pan with the midpoint. Seen in the capture phase, so a
  // second finger on an artboard starts no drag of its own; the first
  // finger's drag (a move, a marquee, a pan) is ended the platform's way, a
  // pointercancel, which every drag already tears down on.
  const fingers = new Map<number, { x: number; y: number }>()
  // The fingers whose drags the pinch ended: their cancel is ours, not the
  // finger lifting.
  const ending = new Set<number>()
  let pinch: { spread: number; zoom: number; mid: { x: number; y: number } } | null = null
  const spreadOf = () => {
    const [a, b] = [...fingers.values()]
    return { spread: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }
  const local = (ev: PointerEvent) => {
    const rect = host.value?.getBoundingClientRect()
    return { x: ev.clientX - (rect?.left ?? 0), y: ev.clientY - (rect?.top ?? 0) }
  }
  function onFingerMove(ev: PointerEvent) {
    if (!fingers.has(ev.pointerId)) return
    fingers.set(ev.pointerId, local(ev))
    if (!pinch || fingers.size !== 2) return
    const { spread, mid } = spreadOf()
    editor.viewport.x += mid.x - pinch.mid.x
    editor.viewport.y += mid.y - pinch.mid.y
    zoomTo(pinch.zoom * (spread / pinch.spread), mid.x, mid.y)
    pinch.mid = mid
  }
  function onFingerUp(ev: PointerEvent) {
    if (ending.delete(ev.pointerId) || !fingers.delete(ev.pointerId)) return
    // Down to a pair again (a third finger came and one left): the pinch
    // starts over from the pair that remains, so nothing jumps.
    pinch = fingers.size === 2 ? { ...spreadOf(), zoom: editor.viewport.zoom } : null
    if (fingers.size) return
    window.removeEventListener("pointermove", onFingerMove)
    window.removeEventListener("pointerup", onFingerUp)
    window.removeEventListener("pointercancel", onFingerUp)
  }
  function onTouchDown(e: PointerEvent) {
    if (e.pointerType !== "touch") return
    if (!fingers.size) {
      window.addEventListener("pointermove", onFingerMove)
      window.addEventListener("pointerup", onFingerUp)
      window.addEventListener("pointercancel", onFingerUp)
    }
    fingers.set(e.pointerId, local(e))
    if (fingers.size < 2) return
    // From the second finger on, neither a drag below nor the canvas's own
    // empty-canvas pan starts; a third finger rides along, unused.
    e.preventDefault()
    e.stopImmediatePropagation()
    if (fingers.size > 2) return
    for (const id of fingers.keys()) {
      if (id === e.pointerId) continue
      ending.add(id)
      window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: id, pointerType: "touch" }))
    }
    pinch = { ...spreadOf(), zoom: editor.viewport.zoom }
  }

  return { onWheel, startPan, onTouchDown }
}
