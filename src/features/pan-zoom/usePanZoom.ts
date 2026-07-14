import type { Ref } from "vue"
import { editor } from "@/entities/editor"

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const MIN = 0.2
const MAX = 3

/** Canvas pan + cursor-anchored zoom over `editor.viewport`. Wheel pans;
 * ctrl/cmd-wheel (or pinch) zooms to the cursor; drag on empty canvas pans. */
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
    let px = e.clientX
    let py = e.clientY
    const move = (ev: PointerEvent) => {
      v.x += ev.clientX - px
      v.y += ev.clientY - py
      px = ev.clientX
      py = ev.clientY
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
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

  /** Frame all artboards in the viewport (never zooms past 100%). */
  const fit = () => {
    const rect = host.value?.getBoundingClientRect()
    if (!rect) return
    const abs = editor.artboards
    if (!abs.length) return resetZoom()
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
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

  return { onWheel, startPan, zoomIn, zoomOut, resetZoom, fit }
}
