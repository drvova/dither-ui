// The poster: flat fields of ink, printed the way a screen print is. Bands
// of the palette run across the surface, each one ink or two inks met
// through the line screen, and a disc crosses them where every band turns
// to a hatch of another ink through a screen (the diagonal one unless told
// otherwise). The hatch slides along its lines with the clock. A seed lays
// out the bands, their inks and densities and the disc, so the same seed at
// the same moment gives the same raster.

import { SCREENS, type ScreenKind, xorshift32 } from "./pixel"
import type { Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type PosterParams = {
  /** The inks the fields are printed in (two or more). */
  inks: Rgb[]
  /** What a field's open screen cells show: a paper colour, or clear. */
  ground: Rgb | null
  /** The disc's screen. */
  screen: ScreenKind
  /** How fast the hatch slides, in cells per second. */
  speed: number
}

/** A band: rows `from`..`to` (fractions of the height), its ink, the second
 * ink its line screen meets (-1: the ground), the line screen's density (1
 * is a solid field) and the ink of its hatch inside the disc. */
export type PosterBand = { from: number; to: number; ink: number; alt: number; density: number; hatch: number }
/** The disc's centre as fractions of the width and height, its radius as
 * a fraction of the height. */
export type PosterLayout = { bands: PosterBand[]; disc: { x: number; y: number; r: number } }

/** Most fields are solid; some meet a second ink (or the ground) through the line screen. */
const DENSITIES = [1, 1, 1, 0.5]

/** The composition a seed prints, for `inkCount` inks. */
export function posterLayout(seed: number, inkCount: number): PosterLayout {
  const rand = xorshift32(Math.round(seed) ^ 0x2545f491)
  const inks = Math.max(1, inkCount)
  const other = (not: number) => (inks < 2 ? not : (not + 1 + Math.floor(rand() * (inks - 1))) % inks)
  // The disc hatches every band in one ink (another where a band is that ink).
  const discInk = Math.floor(rand() * inks)
  const count = 4 + Math.floor(rand() * 3)
  const weights = Array.from({ length: count }, () => 0.5 + rand() * 1.5)
  const total = weights.reduce((a, b) => a + b, 0)
  let at = 0
  let prev = -1
  const bands = weights.map((w) => {
    const from = at
    at += w / total
    const ink = prev < 0 ? Math.floor(rand() * inks) : other(prev)
    prev = ink
    const density = DENSITIES[Math.floor(rand() * DENSITIES.length)]
    const alt = rand() < 0.65 ? -1 : other(ink)
    return { from, to: at, ink, alt, density, hatch: ink === discInk ? other(ink) : discInk }
  })
  bands[bands.length - 1].to = 1
  return { bands, disc: { x: 0.56 + rand() * 0.2, y: 0.45 + rand() * 0.15, r: 0.42 + rand() * 0.16 } }
}

/** One frame of the poster at `time` seconds. */
export function paintPoster(buffer: RasterBuffer, layout: PosterLayout, p: PosterParams, time: number): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const line = SCREENS.line
  const hatch = SCREENS[p.screen] ?? SCREENS.diagonal
  const drift = Math.floor(time * p.speed)
  const cx = layout.disc.x * cols
  const cy = layout.disc.y * rows
  const r = layout.disc.r * rows
  const r2 = r * r
  const ink = (i: number) => p.inks[((i % p.inks.length) + p.inks.length) % p.inks.length]
  let b = 0
  for (let y = 0; y < rows; y++) {
    const fy = (y + 0.5) / rows
    while (b < layout.bands.length - 1 && fy > layout.bands[b].to) b++
    const band = layout.bands[b]
    const fill = ink(band.ink)
    const alt = band.alt < 0 ? p.ground : ink(band.alt)
    const crossing = ink(band.hatch)
    const ly = line[y & 3]
    const hy = hatch[y & 3]
    const dy = y + 0.5 - cy
    for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx
      const c =
        dx * dx + dy * dy < r2 ? (0.5 > hy[(x + drift) & 3] ? crossing : fill) : band.density > ly[x & 3] ? fill : alt
      const i = (y * cols + x) * 4
      if (c) {
        data[i] = c[0]
        data[i + 1] = c[1]
        data[i + 2] = c[2]
        data[i + 3] = 255
      } else data[i + 3] = 0
    }
  }
}
