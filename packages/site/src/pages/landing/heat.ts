// The heat: the landing's one recurring material, ink in water printed
// through the footer's ramp (the ground, then the print's inks), so the
// plates between the sections, the close and the footer's road read as one
// print. A field says where on a sheet it may print and how much hotter it
// runs there: the plates keep their clear band for the brand (`plateField`
// in `plate.ts`), and the close keeps the install's column clear and runs
// hot along its flat foot, where the footer rises into it through one tab
// (`closeField`). One painter on the kit's own noise.
import { fbm } from "@dither-ui/kit/engine/noise.ts"
import type { Rgb } from "@dither-ui/kit/engine/palette.ts"
import type { RasterBuffer } from "@dither-ui/kit/engine/raster.ts"

/** Where the heat may print at (`x`, `y`) CSS px from a sheet's top left,
 * 0-1, how much heat to add there (a hot edge) and, where the noise must
 * never go cold, the least it may cool to (0-1 of the ramp). */
export type HeatField = (
  x: number,
  y: number,
  width: number,
  height: number,
) => { field: number; boost: number; floor?: number }

/** The heat's grain: how many CSS px one fold of the noise spans, and
 * where in the noise a sheet samples (each sheet its own region, read for
 * a balanced mix of clear ground and each ink). With a `span`, the sheet's
 * width the scale is read at: a narrower sheet folds finer by as much, so
 * it prints the same picture smaller rather than a cold corner of it. */
export type HeatGrain = { scale: number; at: readonly [number, number]; span?: number }

/** The close's grain: wide folds for a tall band. */
export const CLOSE_GRAIN: HeatGrain = { scale: 540, at: [0, 0] }

/** The close's band, in CSS px: a cell's size and the film's cadence it
 * drifts at, the half-width of the clear column the install stands in, how
 * far the hot ground at the band's foot reaches up, and how long it
 * drifts by itself as the band arrives (under five seconds, so it needs no
 * pause). The page pads the band by `reach` so no ink lands under a word. */
export const CLOSE = { cell: 4, fps: 15, column: 520, reach: 150, drift: 4000 } as const

/** Hermite between `a` and `b` (either way round), clamped. */
export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Whole from `edge` of the way in from `a` to the same from `b`, rising
 * out of nothing at `a` and sinking back to nothing at `b`: a stretch of
 * heat whose own texture shows across its middle and whose edges dissolve. */
export const plateau = (a: number, b: number, x: number, edge = 0.35) =>
  Math.min(smooth(a, a + (b - a) * edge, x), smooth(b, b - (b - a) * edge, x))

/** The close: heat off the hot ground. It runs along the band's foot (its
 * one hard edge, where the footer's tab rises into it, never cold under
 * it: a floor of the coolest inks its last rows always print) and climbs the
 * sides beside the column, thinning out before the top: never a lid, so
 * never a frame round the install. The sides climb only where the screen
 * leaves them room to read as heat; a narrower one keeps the foot alone,
 * never a sliver at its edge. */
export const closeField: HeatField = (x, y, width, height) => {
  const rise = smooth(0.1 * height, 0.6 * height, y)
  const room = smooth(340, 400, width / 2 - CLOSE.column)
  const side = smooth(CLOSE.column, CLOSE.column + 280, Math.abs(x - width / 2)) * rise * room
  const foot = smooth(CLOSE.reach, 0, height - y)
  return { field: Math.max(side, foot), boost: 0.12 * foot * foot, floor: 0.33 * smooth(40, 0, height - y) }
}

let foldBuffer = new Float32Array(0)
/** The fold's grid, reused from frame to frame. */
const foldGrid = (n: number) => (foldBuffer.length >= n ? foldBuffer : (foldBuffer = new Float32Array(n)))

/** Print the heat at `time` seconds into `buffer`, `cell` CSS px a cell,
 * through `ramp` (dark to light; the first is the ground, left clear),
 * dithered between its inks by `matrix`, where `field` lets it, at its
 * `grain`. `hand` is the pointer in CSS px from the sheet's top left, or
 * null. */
export function paintHeat(
  buffer: RasterBuffer,
  time: number,
  hand: readonly [number, number] | null,
  cell: number,
  ramp: readonly Rgb[],
  matrix: number[][],
  field: HeatField = closeField,
  grain: HeatGrain = CLOSE_GRAIN,
): void {
  const { width: cols, height: rows, data } = buffer
  data.fill(0)
  const width = cols * cell
  const height = rows * cell
  const t = time * 0.12
  const top = ramp.length - 1
  const scale = grain.scale * Math.min(1, width / (grain.span ?? width))
  // The fold (the two warp fields) is as smooth as the noise's finest
  // octave, a quarter of the scale: sampled on a grid at a sixteenth of
  // the scale (whole cells, at most every fourth) and blended between, it
  // is the same fold at a fraction of the cost (it was two of the three
  // noise calls a cell, the band's whole paint). A phone's finer fold
  // samples every cell, exactly as before.
  const step = Math.max(1, Math.min(4, Math.floor(scale / 16 / cell)))
  const gw = Math.ceil(cols / step) + 1
  const gh = Math.ceil(rows / step) + 1
  const fold = foldGrid(gw * gh * 2)
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const u = (i * step * cell) / scale + grain.at[0]
      const v = (j * step * cell) / scale + grain.at[1]
      const g = (j * gw + i) * 2
      fold[g] = fbm(u, v + t, 0)
      fold[g + 1] = fbm(u + 5.2, v + 1.3, t)
    }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = c * cell
      const y = r * cell
      const here = field(x, y, width, height)
      if (here.field <= 0) continue
      // Ink in water: the noise folded through itself twice.
      const u = x / scale + grain.at[0]
      const v = y / scale + grain.at[1]
      const gi = Math.floor(c / step)
      const gj = Math.floor(r / step)
      const fx = (c - gi * step) / step
      const fy = (r - gj * step) / step
      const g00 = (gj * gw + gi) * 2
      const g10 = g00 + 2
      const g01 = g00 + gw * 2
      const g11 = g01 + 2
      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy
      const qx = fold[g00] * w00 + fold[g10] * w10 + fold[g01] * w01 + fold[g11] * w11
      const qy = fold[g00 + 1] * w00 + fold[g10 + 1] * w10 + fold[g01 + 1] * w01 + fold[g11 + 1] * w11
      let heat = fbm(u + 2.4 * qx + 0.5 * t, v + 2.4 * qy, 0) + here.boost
      // The hand pulls the heat toward it.
      if (hand) heat += 0.12 * Math.exp(-Math.hypot(x - hand[0], y - hand[1]) / 160)
      // Where the field thins, the heat cools rather than fading in rows,
      // so every edge follows the ink's own contours, never a ruled line;
      // a floor holds it from going cold, its density still the noise's.
      const floor = (here.floor ?? 0) * (0.5 + 0.5 * smooth(0.2, 0.45, heat))
      const lum = Math.max(floor, smooth(0.42, 0.57, heat - (1 - here.field) * 0.22))
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
