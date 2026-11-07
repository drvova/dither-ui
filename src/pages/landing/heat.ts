// The close: the install stands in a clear field inside a print of heat,
// ink in water printed through the footer's ramp (the ground, then the
// print's inks), thick at the band's edges, clear behind the install's
// column, and hot along its flat foot, where the footer's ground rises into
// it through one tab on the page's axis. It drifts as the band arrives,
// then only under the reader's hand, which pulls the heat toward it. One
// painter on the kit's own noise, shared byte for byte with the Svelte
// landing (tests/svelte-site-copies.spec.ts).
import { fbm } from "@dither-kit/engine/noise"
import type { Rgb } from "@dither-kit/engine/palette"
import type { RasterBuffer } from "@dither-kit/engine/raster"

/** The band, in CSS px: a cell's size and the film's cadence it drifts
 * at, the half-width of the clear column the install stands in, how far
 * the heat reaches in from the band's top and its foot, and how long it
 * drifts by itself as the band arrives (under five seconds, so it needs
 * no pause). The page pads the band by `reach` so no ink lands under a
 * word. */
export const CLOSE = { cell: 4, fps: 15, column: 560, reach: 150, drift: 4000 } as const

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Where the heat may print, 0-1, at (`x`, `y`) CSS px from the band's
 * top left: beside the column, and in from the top and the foot; and how
 * near the foot it is. */
export function heatField(x: number, y: number, width: number, height: number): { field: number; foot: number } {
  const side = smooth(CLOSE.column, CLOSE.column + 220, Math.abs(x - width / 2))
  const top = smooth(CLOSE.reach, 0, y)
  const foot = smooth(CLOSE.reach, 0, height - y)
  return { field: Math.max(side, top, foot), foot }
}

/** Print the heat at `time` seconds into `buffer`, `cell` CSS px a cell,
 * through `ramp` (dark to light; the first is the ground, left clear),
 * dithered between its inks by `matrix`. `hand` is the pointer in CSS px
 * from the band's top left, or null. */
export function paintHeat(
  buffer: RasterBuffer,
  time: number,
  hand: readonly [number, number] | null,
  cell: number,
  ramp: readonly Rgb[],
  matrix: number[][],
): void {
  const { width: cols, height: rows, data } = buffer
  data.fill(0)
  const width = cols * cell
  const height = rows * cell
  const t = time * 0.12
  const top = ramp.length - 1
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = c * cell
      const y = r * cell
      const { field, foot } = heatField(x, y, width, height)
      if (field <= 0) continue
      // Ink in water: the noise folded through itself twice.
      const u = x / 540
      const v = y / 540
      const qx = fbm(u, v + t, 0)
      const qy = fbm(u + 5.2, v + 1.3, t)
      let heat = fbm(u + 2.4 * qx + 0.5 * t, v + 2.4 * qy, 0)
      // The hand pulls the heat toward it; the foot is the hot ground.
      if (hand) heat += 0.12 * Math.exp(-Math.hypot(x - hand[0], y - hand[1]) / 160)
      heat += 0.12 * foot * foot
      const lum = smooth(0.42, 0.57, heat) * field
      // The ramp's band for this heat, dithered toward the next one up.
      const level = lum * top
      const band = Math.min(top, Math.floor(level) + (level % 1 > matrix[r & 3][c & 3] ? 1 : 0))
      if (band === 0) continue
      const rgb = ramp[band]
      const o = (r * cols + c) * 4
      data[o] = rgb[0]
      data[o + 1] = rgb[1]
      data[o + 2] = rgb[2]
      data[o + 3] = 255
    }
}
