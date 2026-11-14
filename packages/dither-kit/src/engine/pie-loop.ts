// The pie and donut chart's paint loop: framework-free, it reads the live chart
// through `state.current`. A binding's canvas (`solid/runtime/polar-canvas.tsx`)
// mounts the canvases and starts it; the draw around its paint is the charts'
// one (`chart-loop.ts`).

import { resolveEasing, resolveTexture } from "./dither-paint"
import { sliceAtAngle } from "./polar"
import { pieFill } from "./chart-fill"
import { type ChartLoop, startChartLoop } from "./chart-loop"
import type { Box, PolarChartContextValue } from "./chart-types"
import { setOrBlendRasterPixel } from "./raster"

const TOP = -Math.PI / 2
const TAU = Math.PI * 2

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

/** RAF paint loop for pie / donut charts — framework-agnostic. */
export function startPieLoop({ width, height, ...loop }: LoopArgs): ChartLoop | undefined {
  const { cols, rows, state } = loop
  // The hovered slice's pop, eased toward the pointer.
  let popEase = 0
  return startChartLoop({
    ...loop,
    drawable: (s) => !!s.pie,
    hover: (s) => s.isMouseInChart,
    fill: pieFill,
    onHover: () => (popEase = 0),
    settle: (reduce) => {
      const popTarget = state.current.hoverIndex != null ? 1 : 0
      if (Math.abs(popEase - popTarget) > 0.001) {
        popEase += (popTarget - popEase) * (reduce ? 1 : 0.22)
        return true
      }
      popEase = popTarget
      return false
    },
    paint: (frame, prog, intensity) => {
      const s = state.current
      const slices = s.pie
      if (!slices) return
      const cx = s.center.x
      const cy = s.center.y
      const outerR = s.outerRadius
      const innerR = s.innerRadius
      const base = slices[0]?.start ?? TOP
      const revealAngle = base + resolveEasing(s.easing)(prog) * TAU

      for (let y = 0; y < rows; y++) {
        const py = ((y + 0.5) * height) / rows
        for (let x = 0; x < cols; x++) {
          const px = ((x + 0.5) * width) / cols
          const dx = px - cx
          const dy = py - cy
          const r = Math.hypot(dx, dy)
          if (r < innerR) continue
          const angle = Math.atan2(dy, dx)
          let na = angle
          while (na < base) na += TAU
          while (na >= base + TAU) na -= TAU
          if (na > revealAngle) continue
          const si = sliceAtAngle(slices, angle)
          if (si < 0) continue
          const slice = slices[si]
          const active = s.hoverIndex === si
          const localOuter = active ? outerR + s.popOut * popEase : outerR
          if (r > localOuter) continue

          const seed = s.seedOf(slice.name)
          const variant = s.variantOf(slice.name)
          const emphasis = s.selectedDataKey ?? s.focusDataKey
          const selDim = emphasis !== null && emphasis !== slice.name ? s.dimOpacity : 1
          const it = intensity + (active ? 0.4 * popEase : 0)

          if (localOuter - r < (active ? s.rimWidth + popEase : s.rimWidth)) {
            setOrBlendRasterPixel(frame, x, y, seed.fill, selDim)
            continue
          }
          const tex = resolveTexture(variant)
          const mat = s.matrixOf(variant)
          const raw = (r - innerR) / Math.max(localOuter - innerR, 1)
          const density = 1 - tex.ramp * (1 - raw)
          if (tex.hatch >= 2 && (x + y) % tex.hatch >= tex.hatch / 2) continue
          const lit = density > mat[y & 3][x & 3] - 0.1 * it - tex.density
          if (tex.gaps && !lit) continue
          const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * it)
          const alpha = Math.min(1, (lit ? k : k * tex.offTier) * selDim)
          setOrBlendRasterPixel(frame, x, y, seed.fill, alpha)
        }
      }
    },
  })
}
