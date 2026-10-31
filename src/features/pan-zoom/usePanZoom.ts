import type { Ref } from "vue"
import { editor } from "@/entities/editor"

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const MIN = 0.2
const MAX = 3

/** Canvas pan + cursor-anchored zoom over `editor.viewport`. Wheel pans;
 * ctrl/cmd-wheel (or a trackpad pinch) zooms to the cursor; a middle drag,
 * a Space drag or one finger on empty canvas pans; two fingers pinch. */
export function usePanZoom(host: Ref<HTMLElement | null>) {
  const v = editor.viewport

  function zoomTo(next: number, cx: number, cy: number) {
    const clamped = clamp(next, MIN, MAX)
    const k = clamped / v.zoom
    v.x = cx - (cx - v.x) * k
    v.y = cy - (cy - v.y) * k
    v.zoom = clamped
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = host.value?.getBoundingClientRect()
    if (e.ctrlKey || e.metaKey) {
      const cx = e.clientX - (rect?.left ?? 0)
      const cy = e.clientY - (rect?.top ?? 0)
      zoomTo(v.zoom * (1 - e.deltaY * 0.0015), cx, cy)
    } else {
      v.x -= e.deltaX
      v.y -= e.deltaY
    }
  }

  function startPan(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 1) return
    const id = e.pointerId
    let px = e.clientX
    let py = e.clientY
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      v.x += ev.clientX - px
      v.y += ev.clientY - py
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
    v.x += mid.x - pinch.mid.x
    v.y += mid.y - pinch.mid.y
    zoomTo(pinch.zoom * (spread / pinch.spread), mid.x, mid.y)
    pinch.mid = mid
  }
  function onFingerUp(ev: PointerEvent) {
    if (ending.delete(ev.pointerId) || !fingers.delete(ev.pointerId)) return
    // Down to a pair again (a third finger came and one left): the pinch
    // starts over from the pair that remains, so nothing jumps.
    pinch = fingers.size === 2 ? { ...spreadOf(), zoom: v.zoom } : null
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
    pinch = { ...spreadOf(), zoom: v.zoom }
  }

  const center = () => {
    const rect = host.value?.getBoundingClientRect()
    return { cx: (rect?.width ?? 0) / 2, cy: (rect?.height ?? 0) / 2 }
  }
  const zoomIn = () => {
    const { cx, cy } = center()
    zoomTo(v.zoom * 1.2, cx, cy)
  }
  const zoomOut = () => {
    const { cx, cy } = center()
    zoomTo(v.zoom / 1.2, cx, cy)
  }
  const resetZoom = () => {
    v.zoom = 1
    v.x = 96
    v.y = 88
  }

  /** Frame the given artboards in the viewport (never zooms past 100%). */
  const frame = (abs: { x: number; y: number; w: number; h: number }[]) => {
    const rect = host.value?.getBoundingClientRect()
    if (!rect) return
    if (!abs.length) return resetZoom()
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const a of abs) {
      minX = Math.min(minX, a.x)
      minY = Math.min(minY, a.y - 28) // room for the title label
      maxX = Math.max(maxX, a.x + a.w)
      maxY = Math.max(maxY, a.y + a.h)
    }
    const pad = 96
    const cw = maxX - minX || 1
    const ch = maxY - minY || 1
    const z = clamp(Math.min((rect.width - pad) / cw, (rect.height - pad) / ch), MIN, 1)
    v.zoom = z
    v.x = (rect.width - cw * z) / 2 - minX * z
    v.y = (rect.height - ch * z) / 2 - minY * z
  }

  const fit = () => frame(editor.artboards)
  /** Frame only the selection (falls back to everything). */
  const fitSelection = () => {
    const sel = editor.artboards.filter((a) => editor.selectedIds.includes(a.id))
    frame(sel.length ? sel : editor.artboards)
  }

  return { onWheel, startPan, onTouchDown, zoomIn, zoomOut, resetZoom, fit, fitSelection }
}
