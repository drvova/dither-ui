// The heat: the landing's one recurring material, ink in water printed
// through the footer's ramp (the ground, then the print's inks), so the
// plates between the sections, the close and the footer's road read as one
// print. A field says where on a sheet it may print and how much hotter it
// runs there: the plates keep their clear band for the brand (`plateField`
// in `plate.ts`), and the close keeps the install's column clear and runs
// hot along its flat foot, where the footer rises into it through one tab
// (`closeField`). One painter on the kit's own noise, shared byte for byte
// with the Svelte landing (tests/svelte-site-copies.spec.ts).
import { fbm } from "@dither-kit/engine/noise"
import type { Rgb } from "@dither-kit/engine/palette"
import type { RasterBuffer } from "@dither-kit/engine/raster"

/** Where the heat may print at (`x`, `y`) CSS px from a sheet's top left,
 * 0-1, and how much heat to add there (a hot edge). */
export type HeatField = (x: number, y: number, width: number, height: number) => { field: number; boost: number }

/** The close's band, in CSS px: a cell's size and the film's cadence it
 * drifts at, the half-width of the clear column the install stands in, how
 * far the heat reaches in from the band's top and its foot, and how long it
 * drifts by itself as the band arrives (under five seconds, so it needs no
 * pause). The page pads the band by `reach` so no ink lands under a word. */
export const CLOSE = { cell: 4, fps: 15, column: 560, reach: 150, drift: 4000 } as const

/** Hermite between `a` and `b` (either way round), clamped. */
export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** The close: beside the column, and in from the top and the foot, the
 * foot the hot ground. */
export const closeField: HeatField = (x, y, width, height) => {
  const side = smooth(CLOSE.column, CLOSE.column + 220, Math.abs(x - width / 2))
  const top = smooth(CLOSE.reach, 0, y)
  const foot = smooth(CLOSE.reach, 0, height - y)
  return { field: Math.max(side, top, foot), boost: 0.12 * foot * foot }
}

/** Print the heat at `time` seconds into `buffer`, `cell` CSS px a cell,
 * through `ramp` (dark to light; the first is the ground, left clear),
 * dithered between its inks by `matrix`, where `field` lets it. `hand` is
 * the pointer in CSS px from the sheet's top left, or null. */
export function paintHeat(
  buffer: RasterBuffer,
  time: number,
  hand: readonly [number, number] | null,
  cell: number,
  ramp: readonly Rgb[],
  matrix: number[][],
  field: HeatField = closeField,
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
      const here = field(x, y, width, height)
      if (here.field <= 0) continue
      // Ink in water: the noise folded through itself twice.
      const u = x / 540
      const v = y / 540
      const qx = fbm(u, v + t, 0)
      const qy = fbm(u + 5.2, v + 1.3, t)
      let heat = fbm(u + 2.4 * qx + 0.5 * t, v + 2.4 * qy, 0) + here.boost
      // The hand pulls the heat toward it.
      if (hand) heat += 0.12 * Math.exp(-Math.hypot(x - hand[0], y - hand[1]) / 160)
      const lum = smooth(0.42, 0.57, heat) * here.field
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
