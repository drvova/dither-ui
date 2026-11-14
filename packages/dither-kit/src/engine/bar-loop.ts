// The bar chart's paint loop: framework-free, it reads the live chart
// through `state.current`. A binding's canvas (`solid/runtime/bar-canvas.tsx`)
// mounts the canvases and starts it; the draw around its paint is the charts'
// one (`chart-loop.ts`).

import { seriesFill } from "./chart-fill"
import { type ChartLoop, startChartLoop } from "./chart-loop"
import type { Box, ChartContextValue } from "./chart-types"
import { resolveEasing, paintColumn } from "./dither-paint"
import { clamp01 } from "./pixel"

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
export function startBarLoop({ width, targets, ...loop }: LoopArgs): ChartLoop | undefined {
  const { cols, rows, state } = loop
  const fx = cols / Math.max(width, 1)

  const barProgress = (i: number, len: number, prog: number, reduce: boolean) => {
    if (!state.current.animate || reduce) return 1
    const st = Math.min(0.9, Math.max(0, state.current.stagger))
    const start = len > 1 ? (i / (len - 1)) * st : 0
    return resolveEasing(state.current.easing)(clamp01((prog - start) / (1 - st)))
  }

  return startChartLoop({
    ...loop,
    hover: (s) => s.isMouseInChart || s.hovered,
    fill: seriesFill,
    paint: (frame, prog, intensity, reduce) => {
      const s = state.current
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
          const bp = barProgress(i, s.dataLength, prog, reduce)
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
    },
  })
}
