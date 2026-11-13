// The bar chart's paint loop: framework-free, it reads the live chart
// through `state.current`. A binding's canvas (`solid/runtime/bar-canvas.tsx`)
// mounts the canvases and starts it.

import type { Box, ChartContextValue } from "./chart-types"
import { clearRasterBuffer, createRasterBuffer, putRasterBuffer } from "./raster"
import { clamp01, resolveEasing, paintColumn, prefersReducedMotion } from "./dither-paint"
import { directedTime, isDirected, onSeek } from "./clock"

export type Bars = { top: number[]; base: number[] } // per data index, in backing rows

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
  width: number
  state: Box<ChartContextValue>
  targets: Box<Record<string, Bars>>
}

/** RAF paint loop for bar charts — framework-agnostic, reads `state.current`. */
export function startBarLoop({
  canvas,
  bloomCanvas,
  visible,
  cols,
  rows,
  width,
  state,
  targets,
}: LoopArgs): { stop: () => void; wake: () => void } | undefined {
  const c = canvas.getContext("2d", { willReadFrequently: true })
  if (!c || cols <= 0 || rows <= 0) return undefined
  canvas.width = cols
  canvas.height = rows

  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
  }

  const reduce = prefersReducedMotion()
  const fx = cols / Math.max(width, 1)

  const barProgress = (i: number, len: number, prog: number) => {
    if (!state.current.animate || reduce) return 1
    const st = Math.min(0.9, Math.max(0, state.current.stagger))
    const start = len > 1 ? (i / (len - 1)) * st : 0
    return resolveEasing(state.current.easing)(clamp01((prog - start) / (1 - st)))
  }

  let intensity = 0
  const frame = createRasterBuffer(cols, rows)
  let imageData: ImageData | undefined
  const paint = (prog: number) => {
    const s = state.current
    clearRasterBuffer(frame)
    const stacked = s.stackType === "stacked" || s.stackType === "percent"
    const keys = s.configKeys
    keys.forEach((key, si) => {
      const t = targets.current[key]
      if (!t) return
      const seed = s.seedOf(key)
      const variant = s.seriesSpecs[key]?.variant ?? "gradient"
      const matrix = s.matrixOf(variant)
      const emphasis = s.selectedDataKey ?? s.focusDataKey
      const selDim = (emphasis !== null && emphasis !== key ? s.dimOpacity : 1) * (s.seriesSpecs[key]?.opacity ?? 1)
      for (let i = 0; i < s.dataLength; i++) {
        const bp = barProgress(i, s.dataLength, prog)
        const base = t.base[i] ?? rows - 1
        const top = base + ((t.top[i] ?? base) - base) * bp
        const active = s.hoverIndex === i
        const hoverDim = s.hoverIndex != null && !active && s.isMouseInChart ? 0.5 : 1
        const slot = s.barSlot(i, si, keys.length)
        const c0 = Math.round(slot.x * fx)
        const c1 = Math.round((slot.x + slot.width) * fx)
        for (let x = c0; x < c1; x++) {
          paintColumn(frame, x, top, base, seed, {
            variant,
            matrix,
            intensity: intensity + (active ? 0.4 : 0),
            dim: selDim * hoverDim,
            stacked,
          })
        }
      }
    })
  }

  let raf = 0
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let lastAnimate = state.current.animate && !reduce
  let lastDuration = state.current.animationDuration
  let lastDelay = state.current.animationDelay
  let needsFill = true
  let lastPaintSig = ""
  let lastBloomSig = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never
  // Directed (clock.ts): no frames are requested; `draw(ms)` paints the
  // moment and the entrance runs from composition time 0.
  const schedule = () => {
    if (!raf && visible() && !isDirected()) raf = requestAnimationFrame(draw)
  }

  const draw = (now: number) => {
    raf = 0
    if (!visible() && !isDirected()) return // off-screen: pause until useCanvasVisibility wakes it
    const s = state.current
    if (!s.ready) return
    const animate = s.animate && !reduce
    const duration = Math.max(1, s.animationDuration)
    if (
      s.revision !== lastRevision ||
      animate !== lastAnimate ||
      duration !== lastDuration ||
      s.animationDelay !== lastDelay
    ) {
      lastRevision = s.revision
      lastAnimate = animate
      lastDuration = duration
      lastDelay = s.animationDelay
      animStart = 0
      lastProg = -1
      needsFill = true
    }
    if (!animStart) animStart = now
    const origin = isDirected() ? 0 : animStart
    const prog = animate ? Math.min(1, Math.max(0, (now - origin - s.animationDelay) / duration)) : 1

    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }
    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }
    if (s.hoverIndex !== lastHover) {
      lastHover = s.hoverIndex
      needsFill = true
    }
    const itTarget = s.hoverLift && (s.isMouseInChart || s.hovered) ? s.hoverStrength : 0
    let settling = false
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      settling = true
      needsFill = true
    } else intensity = itTarget

    const paintSig = `${s.stackType}|${s.dimOpacity}|${JSON.stringify(s.configKeys.map((k) => [k, s.config[k]?.color, s.seriesSpecs[k]]))}`
    const bloomSig = `${s.bloom}|${s.bloomOnHover}|${s.isMouseInChart}|${s.hovered}`
    if (paintSig !== lastPaintSig) {
      lastPaintSig = paintSig
      needsFill = true
    }
    if (bloomSig !== lastBloomSig) {
      lastBloomSig = bloomSig
      needsFill = true
    }

    if (!(needsFill || settling || (animate && prog < 1))) return
    paint(prog)
    c.clearRect(0, 0, cols, rows)
    imageData = putRasterBuffer(c, frame, imageData)
    if (bloomCtx && s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart || s.hovered)) {
      bloomCtx.clearRect(0, 0, cols, rows)
      bloomCtx.drawImage(canvas, 0, 0)
    }
    needsFill = false
    if (settling || (animate && prog < 1)) schedule()
  }

  const paintDirected = (ms: number) => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    draw(ms)
  }
  const unseek = onSeek((ms) => (ms === null ? schedule() : paintDirected(ms)))
  if (isDirected()) paintDirected(directedTime() ?? 0)
  else if (visible()) schedule()
  return {
    stop: () => {
      cancelAnimationFrame(raf)
      unseek()
    },
    // A wake under direction (ready flipped, data changed) repaints the moment.
    wake: () => (isDirected() ? paintDirected(directedTime() ?? 0) : schedule()),
  }
}
