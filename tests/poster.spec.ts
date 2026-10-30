// The poster: a seed lays out bands that tile the height, each band's inks
// differ from the band above, and a frame prints solid fields, line-screened
// fields and the disc's hatch, the same bytes for the same seed and moment.
import { describe, expect, it } from "rstack/test"
import { paintPoster, posterLayout, type PosterParams } from "../dither-kit/engine/poster"
import { createRasterBuffer } from "../dither-kit/engine/raster"

const INKS: PosterParams["inks"] = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
]
const params: PosterParams = { inks: INKS, ground: null, screen: "diagonal", speed: 2 }

describe("posterLayout", () => {
  it("tiles the height with bands whose inks change band to band", () => {
    for (const seed of [0, 7, 1984, 31337]) {
      const { bands, disc } = posterLayout(seed, INKS.length)
      expect(bands.length).toBeGreaterThanOrEqual(5)
      expect(bands[0].from).toBe(0)
      expect(bands[bands.length - 1].to).toBe(1)
      bands.forEach((b, i) => {
        if (i) expect(b.from).toBe(bands[i - 1].to)
        if (i) expect(b.ink).not.toBe(bands[i - 1].ink)
        expect(b.hatch).not.toBe(b.ink)
        if (b.alt >= 0) expect(b.alt).not.toBe(b.ink)
      })
      expect(disc.r).toBeGreaterThan(0.4)
      expect(posterLayout(seed, INKS.length)).toEqual({ bands, disc })
    }
  })
})

describe("paintPoster", () => {
  const frame = (time: number, seed = 7) => {
    const buffer = createRasterBuffer(96, 64)
    paintPoster(buffer, posterLayout(seed, INKS.length), params, time)
    return buffer.data
  }
  const pixel = (data: Uint8ClampedArray, x: number, y: number) =>
    Array.from(data.slice((y * 96 + x) * 4, (y * 96 + x) * 4 + 4))

  it("prints the same bytes for the same seed and moment", () => {
    expect(frame(1.5)).toEqual(frame(1.5))
    expect(frame(1.5, 8)).not.toEqual(frame(1.5))
  })

  it("hatches the disc with two inks and slides the hatch with time", () => {
    const layout = posterLayout(7, INKS.length)
    const cx = Math.floor(layout.disc.x * 96)
    const cy = Math.floor(layout.disc.y * 64)
    const row = (data: Uint8ClampedArray) => Array.from({ length: 8 }, (_, i) => pixel(data, cx - 4 + i, cy).join())
    const at0 = row(frame(0))
    // Inside the disc a row alternates between two inks, two cells each.
    expect(new Set(at0).size).toBe(2)
    expect(at0.slice(0, 4)).toEqual(at0.slice(4))
    // Half a second at two cells a second moves the hatch by one cell.
    expect(row(frame(0.5))).not.toEqual(at0)
  })

  it("leaves a field's open cells clear without a ground", () => {
    const layout = posterLayout(7, INKS.length)
    const data = frame(0)
    const screened = layout.bands.find((b) => b.alt < 0 && b.density < 1)
    if (!screened) return
    // The line screen lights whole rows: read down a column of the band.
    const y = Math.ceil(screened.from * 64)
    const alphas = Array.from({ length: 4 }, (_, i) => pixel(data, 0, y + i)[3])
    expect(alphas).toContain(0)
    expect(alphas).toContain(255)
  })
})
