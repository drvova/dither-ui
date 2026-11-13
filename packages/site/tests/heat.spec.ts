// The heat, the landing's one recurring material. The close: clear behind
// the install's column (no ink under a word), rising off the band's foot up
// its sides (never a lid), densest and hottest along the flat foot the
// footer's tab rises into, which never goes cold. The plates: never in their clear band,
// where the brand forms. Always in the ramp's own inks, the same bytes for
// the same moment.
import { describe, expect, it } from "rstack/test"
import { BAYER4, fillOf } from "dither-kit/engine/pixel.ts"
import { createRasterBuffer } from "dither-kit/engine/raster.ts"
import { fbm } from "dither-kit/engine/noise.ts"
import { CLOSE, CLOSE_GRAIN, closeField, paintHeat, smooth } from "../src/pages/landing/heat"
import { PLATES, plateField, RAMP } from "../src/pages/landing/plate"

const INKS = RAMP.map(fillOf)
const W = 1920
const H = 1200
const print = (time = 0, hand: [number, number] | null = null) => {
  const b = createRasterBuffer(W / CLOSE.cell, H / CLOSE.cell)
  paintHeat(b, time, hand, CLOSE.cell, INKS, BAYER4)
  return b
}
const inked = (b: ReturnType<typeof print>, x0: number, y0: number, x1: number, y1: number) => {
  let n = 0
  // whole cells inside the box
  for (let r = Math.ceil(y0 / CLOSE.cell); r < Math.floor(y1 / CLOSE.cell); r++)
    for (let c = Math.ceil(x0 / CLOSE.cell); c < Math.floor(x1 / CLOSE.cell); c++)
      if (b.data[(r * b.width + c) * 4 + 3]) n++
  return n
}

describe("where the heat may print", () => {
  it("never behind the install's column, away from the band's edges", () => {
    for (const y of [CLOSE.reach, H / 2, H - CLOSE.reach])
      for (const x of [W / 2 - CLOSE.column, W / 2, W / 2 + CLOSE.column])
        expect(closeField(x, y, W, H).field, `${x},${y}`).toBe(0)
  })
  it("rising off its foot up the sides, never a lid across its top", () => {
    for (const x of [0, W / 2, W]) expect(closeField(x, 0, W, H).field, `top at ${x}`).toBe(0)
    expect(closeField(0, 0.1 * H, 3000, H).field).toBe(0)
    expect(closeField(0, 0.8 * H, 3000, H).field).toBe(1)
    expect(closeField(W / 2, H, W, H).field).toBe(1)
    expect(closeField(W / 2, H, W, H).boost).toBeCloseTo(0.12)
  })
  it("keeps the foot alone where the screen leaves the sides no room", () => {
    // a laptop's band: what lies beside the column would print a sliver at its edge
    for (const y of [0.5 * H, 0.8 * H]) expect(closeField(0, y, 1440, H).field, `${y}`).toBe(0)
    expect(closeField(0, H, 1440, H).field).toBe(1)
  })
})

describe("the print", () => {
  it("leaves the column clear and prints the sides", () => {
    const b = print()
    expect(inked(b, W / 2 - CLOSE.column, CLOSE.reach, W / 2 + CLOSE.column, H - CLOSE.reach)).toBe(0)
    expect(inked(b, 0, 0, 40 * CLOSE.cell, H - CLOSE.reach)).toBeGreaterThan(0)
  })
  it("runs hot and dense along the foot", () => {
    const b = print()
    const foot = inked(b, 0, H - 40, W, H) / ((W / CLOSE.cell) * (40 / CLOSE.cell))
    expect(foot).toBeGreaterThan(0.6)
    const bone = INKS[INKS.length - 1]
    let hot = 0
    for (let c = 0; c < b.width; c++) {
      const o = ((b.height - 1) * b.width + c) * 4
      if (b.data[o] === bone[0] && b.data[o + 1] === bone[1] && b.data[o + 2] === bone[2]) hot++
    }
    expect(hot / b.width).toBeGreaterThan(0.25)
  })
  it("never goes cold under the tab, whatever the band's height or the moment", () => {
    // the noise alone left stretches of the foot bare, so it stopped dead mid-page
    for (const h of [1012, 1112, 1212, 1412])
      for (const t of [0, 2, 4, 6, 8]) {
        const b = createRasterBuffer(W / CLOSE.cell, Math.floor(h / CLOSE.cell))
        paintHeat(b, t, null, CLOSE.cell, INKS, BAYER4)
        const r = b.height - 1
        for (let c = 0; c < b.width; c += 4) {
          const lit = [0, 1, 2, 3].some((k) => b.data[(r * b.width + c + k) * 4 + 3])
          expect(lit, `${h}px at ${t}s, column ${c}`).toBe(true)
        }
      }
  })
  it("prints only the ramp's inks, never its ground", () => {
    const b = print(2)
    const inks = new Set(INKS.slice(1).map((c) => c.join(",")))
    for (let i = 0; i < b.data.length; i += 4)
      if (b.data[i + 3]) expect(inks.has(`${b.data[i]},${b.data[i + 1]},${b.data[i + 2]}`)).toBe(true)
  })
  it("is the same for the same moment, and drifts with time and the hand", () => {
    expect(print(1.5).data).toEqual(print(1.5).data)
    expect(print(1.5).data).not.toEqual(print(3).data)
    expect(print(1.5, [60, H / 2]).data).not.toEqual(print(1.5).data)
  })
})

describe("a plate's heat", () => {
  for (const [id, plate] of Object.entries(PLATES))
    it(`${id} prints clouds that dissolve at every edge, never in its band`, () => {
      const field = plateField(plate)
      const h = 400
      const mid = 640
      expect(field(mid, (plate.band[0] / 2) * h, 1280, h).field).toBe(1)
      expect(field(mid, ((plate.band[1] + 1) / 2) * h, 1280, h).field).toBe(1)
      // no edge of a box: nothing at the sheet's top, foot or ends
      for (const [x, y] of [
        [mid, 0],
        [mid, h],
        [0, (plate.band[0] / 2) * h],
        [1280, (plate.band[0] / 2) * h],
      ])
        expect(field(x, y, 1280, h).field, `${x},${y}`).toBe(0)
      for (let v = plate.band[0]; v <= plate.band[1]; v += 0.02) expect(field(0, v * h, 1280, h).field).toBe(0)
      const b = createRasterBuffer(1280 / CLOSE.cell, h / CLOSE.cell)
      paintHeat(b, 0, null, CLOSE.cell, INKS, BAYER4, field, plate.grain)
      const rows = (r0: number, r1: number) => {
        let n = 0
        for (let r = Math.ceil(r0); r < Math.floor(r1); r++)
          for (let c = 0; c < b.width; c++) if (b.data[(r * b.width + c) * 4 + 3]) n++
        return n
      }
      expect(rows((plate.band[0] * h) / CLOSE.cell, (plate.band[1] * h) / CLOSE.cell)).toBe(0)
      expect(rows(0, (plate.band[0] * h) / CLOSE.cell)).toBeGreaterThan(0)
    })

  for (const [id, plate] of Object.entries(PLATES))
    it(`${id} prints the same picture smaller on a phone, never a cold corner of it`, () => {
      // read in fixed px, a phone's sheet sampled a cold strip: scraps
      const share = (w: number) => {
        const h = Math.round(w / plate.aspect / CLOSE.cell) * CLOSE.cell
        const b = createRasterBuffer(w / CLOSE.cell, h / CLOSE.cell)
        paintHeat(b, 0, null, CLOSE.cell, INKS, BAYER4, plateField(plate), plate.grain)
        let n = 0
        for (let i = 3; i < b.data.length; i += 4) if (b.data[i]) n++
        return n / (b.width * b.height)
      }
      const wide = share(plate.grain.span)
      const phone = share(360)
      expect(phone).toBeGreaterThan(wide * 0.6)
      expect(phone).toBeLessThan(wide * 1.6)
    })
})

describe("the fold on a grid", () => {
  // The reference: the fold (the two warp fields) taken at every cell, as
  // the print once did (two of its three noise calls a cell, the band's
  // whole paint). The print now samples it on a grid and blends between.
  const exact = (b: ReturnType<typeof print>, time: number, field = closeField, grain = CLOSE_GRAIN) => {
    const cell = CLOSE.cell
    const { width: cols, height: rows, data } = b
    data.fill(0)
    const width = cols * cell
    const height = rows * cell
    const t = time * 0.12
    const top = INKS.length - 1
    const scale = grain.scale * Math.min(1, width / (grain.span ?? width))
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const here = field(c * cell, r * cell, width, height)
        if (here.field <= 0) continue
        const u = (c * cell) / scale + grain.at[0]
        const v = (r * cell) / scale + grain.at[1]
        const qx = fbm(u, v + t, 0)
        const qy = fbm(u + 5.2, v + 1.3, t)
        const heat = fbm(u + 2.4 * qx + 0.5 * t, v + 2.4 * qy, 0) + here.boost
        const floor = (here.floor ?? 0) * (0.5 + 0.5 * smooth(0.2, 0.45, heat))
        const lum = Math.max(floor, smooth(0.42, 0.57, heat - (1 - here.field) * 0.22))
        const level = lum * top
        const band = Math.min(top, Math.floor(level) + (level % 1 > BAYER4[r & 3][c & 3] ? 1 : 0))
        if (band === 0) continue
        const o = (r * cols + c) * 4
        data.set([...INKS[band], 255], o)
      }
  }
  const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
    let n = 0
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) n++
    return n / (a.length / 4)
  }
  it("prints the close as the exact fold does, a cell in a hundred at most", () => {
    for (const time of [0, 3]) {
      const ref = createRasterBuffer(W / CLOSE.cell, H / CLOSE.cell)
      exact(ref, time)
      expect(differ(print(time).data, ref.data), `${time}s`).toBeLessThan(0.01)
    }
  })
  for (const [id, plate] of Object.entries(PLATES))
    it(`prints ${id} as the exact fold does, wide and on a phone`, () => {
      for (const w of [plate.grain.span ?? 1280, 360]) {
        const h = Math.round(w / plate.aspect / CLOSE.cell) * CLOSE.cell
        const ref = createRasterBuffer(w / CLOSE.cell, h / CLOSE.cell)
        exact(ref, 0, plateField(plate), plate.grain)
        const b = createRasterBuffer(w / CLOSE.cell, h / CLOSE.cell)
        paintHeat(b, 0, null, CLOSE.cell, INKS, BAYER4, plateField(plate), plate.grain)
        // a phone's fold is finer: it samples every cell, the same bytes
        if (w === 360) expect(b.data).toEqual(ref.data)
        else expect(differ(b.data, ref.data), `${w}px`).toBeLessThan(0.02)
      }
    })
})
