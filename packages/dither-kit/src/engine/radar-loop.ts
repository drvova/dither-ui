// The radar chart's paint loop: framework-free, it reads the live chart
// through `state.current`. A binding's canvas (`solid/runtime/polar-canvas.tsx`)
// mounts the canvases and starts it; the draw around its paint is the charts'
// one (`chart-loop.ts`).

import { resolveEasing, resolveTexture } from "./dither-paint"
import { distToPolygonEdge, pointInPolygon, polarX, polarY } from "./polar"
import { radarFill } from "./chart-fill"
import { type ChartLoop, startChartLoop } from "./chart-loop"
import type { Box, PolarChartContextValue } from "./chart-types"
import { setOrBlendRasterPixel } from "./raster"

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
  width: number
  height: number
  state: Box<PolarChartContextValue>
}

/** RAF paint loop for radar charts — framework-agnostic. */
export function startRadarLoop({ width, height, ...loop }: LoopArgs): ChartLoop | undefined {
  const { cols, rows, state } = loop
  const fx = cols / Math.max(width, 1)
  const fy = rows / Math.max(height, 1)

  const buildPolys = (prog: number) => {
    const s = state.current
    const radar = s.radar
    if (!radar) return []
    return s.configKeys.map((key) => {
      const poly: number[] = []
      const pts: { x: number; y: number }[] = []
      radar.axes.forEach((ax, i) => {
        const v = Number(s.data[i]?.[key]) || 0
        const r = (v / radar.max) * s.outerRadius * prog
        const x = polarX(s.center.x, r, ax.angle)
        const y = polarY(s.center.y, r, ax.angle)
        poly.push(x, y)
        pts.push({ x, y })
      })
      return { key, poly, pts }
    })
  }

  return startChartLoop({
    ...loop,
    drawable: (s) => !!s.radar,
    hover: (s) => s.isMouseInChart,
    fill: radarFill,
    paint: (frame, prog, intensity) => {
      const s = state.current
      if (!s.radar) return
      const polys = buildPolys(resolveEasing(state.current.easing)(prog))
      const band = Math.max(s.outerRadius * s.falloff, 1)

      for (let y = 0; y < rows; y++) {
        const py = ((y + 0.5) * height) / rows
        for (let x = 0; x < cols; x++) {
          const px = ((x + 0.5) * width) / cols
          let covered = false
          for (let pi = 0; pi < polys.length; pi++) {
            const { key, poly } = polys[pi]
            if (!pointInPolygon(px, py, poly)) continue
            const seed = s.seedOf(key)
            const variant = s.variantOf(key)
            const emphasis = s.selectedDataKey ?? s.focusDataKey
            const selDim = emphasis !== null && emphasis !== key ? s.dimOpacity : 1
            const dist = distToPolygonEdge(px, py, poly)
            if (dist < 1.4) {
              setOrBlendRasterPixel(frame, x, y, seed.fill, selDim)
              covered = true
              continue
            }
            const tex = resolveTexture(variant)
            const mat = s.matrixOf(variant)
            const raw = 1 - Math.min(1, dist / band)
            const density = 1 - tex.ramp * (1 - raw)
            const sparse = pi * 0.2
            if (tex.hatch >= 2 && (x + y) % tex.hatch >= tex.hatch / 2) continue
            const lit = density > mat[y & 3][x & 3] - 0.1 * intensity - tex.density + sparse
            if (!lit && (tex.gaps || covered)) continue
            const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * intensity)
            const alpha = Math.min(1, (lit ? k : k * tex.offTier) * selDim)
            setOrBlendRasterPixel(frame, x, y, seed.fill, alpha)
            covered = true
          }
        }
      }

      for (const { key, pts } of polys) {
        const seed = s.seedOf(key)
        const emphasis = s.selectedDataKey ?? s.focusDataKey
        const selDim = emphasis !== null && emphasis !== key ? s.dimOpacity : 1
        pts.forEach((p, i) => {
          const bx = Math.round(p.x * fx)
          const by = Math.round(p.y * fy)
          const big = s.hoverIndex === i
          const sz = big ? 2 : 1
          const side = sz * 2 - 1
          for (let yy = 0; yy < side; yy++) {
            for (let xx = 0; xx < side; xx++) {
              setOrBlendRasterPixel(frame, bx - (sz - 1) + xx, by - (sz - 1) + yy, seed.fill, selDim)
            }
          }
        })
      }
    },
  })
}
