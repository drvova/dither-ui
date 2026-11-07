// The close's heat: clear behind the install's column (no ink under a
// word), printing only beside it and in from the band's top and foot,
// densest and hottest along the flat foot the footer's tab rises into, in
// the ramp's own inks, the same bytes for the same moment.
import { describe, expect, it } from "rstack/test"
import { BAYER4, fillOf } from "@dither-kit/engine/pixel"
import { createRasterBuffer } from "@dither-kit/engine/raster"
import { CLOSE, heatField, paintHeat } from "../src/pages/landing/close"
import { RAMP } from "../src/pages/landing/plate"

const INKS = RAMP.map(fillOf)
const W = 1440
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
        expect(heatField(x, y, W, H).field, `${x},${y}`).toBe(0)
  })
  it("in full at the band's top, its foot and its far sides", () => {
    expect(heatField(W / 2, 0, W, H).field).toBe(1)
    expect(heatField(W / 2, H, W, H)).toEqual({ field: 1, foot: 1 })
    expect(heatField(0, H / 2, 3000, H).field).toBe(1)
  })
})

describe("the print", () => {
  it("leaves the column clear and prints the sides", () => {
    const b = print()
    expect(inked(b, W / 2 - CLOSE.column, CLOSE.reach, W / 2 + CLOSE.column, H - CLOSE.reach)).toBe(0)
    expect(inked(b, 0, 0, 40 * CLOSE.cell, H)).toBeGreaterThan(0)
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
    expect(hot / b.width).toBeGreaterThan(0.3)
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
