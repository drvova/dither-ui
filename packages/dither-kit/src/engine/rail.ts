// The dithered side rail the disclosure surfaces wear (DitherAccordion's
// panels, DitherCollapsible, DitherToaster's toasts): one cell wide, a
// vertical ramp fading downward. Framework-free.

import { BAYER4, fillOf, type PixelColor } from "./pixel"
import { cellCanvas } from "./raster"

const CELL = 2

/** Paint the rail at the canvas's own height: a cell per 2px, the ramp lit
 * through `matrix` and its unlit cells left faint. */
export function paintRail(canvas: HTMLCanvasElement, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const height = canvas.offsetHeight
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(0, y, fill, alpha)
  }
  px.flush()
}
