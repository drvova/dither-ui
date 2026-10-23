import { describe, expect, it } from "vitest"
import {
  buildPlate,
  catalogPlate,
  dawnPlate,
  ditherTone,
  rampPlate,
  seedPlate,
  skylinePlate,
  type Cell,
  type Plate,
  GREY,
  SUN,
} from "@/pages/landing/plates"

// Decode a plate's dashed-lattice runs back into "x,y" → colour, the way the
// renderer paints them (dash 1, gap period-1, restarted at each subpath).
function decode(plate: Plate): Map<string, string> {
  const cells = new Map<string, string>()
  for (const g of plate.groups) {
    for (const l of g.layers) {
      for (const [, x0, y, len] of l.d.matchAll(/M(\d+) (\d+)\.5h(\d+)/g)) {
        for (let k = 0; k < Number(len) / plate.period; k++) {
          const key = `${Number(x0) + k * plate.period},${y}`
          expect(cells.has(key), `cell ${key} painted twice`).toBe(false)
          cells.set(key, l.color)
        }
      }
    }
  }
  return cells
}

function expected(w: number, h: number, paint: (x: number, y: number) => Cell | null) {
  const cells = new Map<string, string>()
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = paint(x, y)
    if (c) cells.set(`${x},${y}`, c.color)
  }
  return cells
}

describe("pixel plates", () => {
  it("round-trips every painted cell through the lattice encoding", () => {
    // Interleaved phases inside one group + gaps + a solid run.
    const paint = (x: number, y: number): Cell | null =>
      (x + y) % 3 === 0 ? null : { color: x < 9 ? "#a" : "#b", group: (x * 7 + y) % 4 }
    for (const period of [1, 4]) {
      const plate = buildPlate(23, 6, period, paint)
      expect(decode(plate)).toEqual(expected(23, 6, paint))
    }
  })

  it("encodes a Bayer rank as one subpath per run, not per cell", () => {
    const plate = rampPlate(144, 8)
    const cells = decode(plate).size
    const subpaths = plate.groups.flatMap((g) => g.layers).reduce((n, l) => n + l.d.split("M").length - 1, 0)
    expect(subpaths).toBeLessThan(cells / 4)
  })

  it("is deterministic and ranks the hero by the Bayer matrix", () => {
    expect(dawnPlate()).toEqual(dawnPlate())
    const ranks = dawnPlate().groups.filter((g) => !g.twinkle).map((g) => g.index)
    expect(ranks).toEqual([...Array(16).keys()])
  })

  it("ordered-dithers tone onto the ramp with an empty floor", () => {
    expect(ditherTone(0, 0, 0, ["#a", "#b"])).toBeNull()
    expect(ditherTone(1, 3, 3, ["#a", "#b"])).toBe("#b")
    // Half tone on a one-colour ramp lights exactly half of every 4×4 tile.
    let lit = 0
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (ditherTone(0.5, x, y, ["#a"])) lit++
    expect(lit).toBe(8)
  })

  it("rises the skyline one group per value, cap at the value's height", () => {
    const plate = skylinePlate([50, 100], 20, 10)
    expect(plate.groups.map((g) => [g.index, g.top])).toEqual([[0, 5], [1, 0]])
  })

  it("moves the seeded strip's fill edge and scatter with the seed", () => {
    const a = decode(seedPlate(200))
    const b = decode(seedPlate(800))
    expect(b.size).toBeGreaterThan(a.size)
    expect(decode(seedPlate(201))).not.toEqual(a)
  })

  it("draws the catalog as one lit cell per section, a tower per family", () => {
    const counts = [1, 19, 25, 5, 32, 100, 46, 24, 49, 1]
    const plate = catalogPlate(counts)
    const cells = decode(plate)
    expect(cells.size).toBe(counts.reduce((a, b) => a + b, 0))
    expect(plate.groups.map((g) => g.index)).toEqual(counts.map((_, i) => i))
    // One ember cap — on the tallest family — and every other colour grey.
    const colours = [...cells.values()]
    expect(colours.every((c) => c === SUN[0] || (GREY as readonly string[]).includes(c))).toBe(true)
    expect(plate.groups[5].layers.some((l) => l.color === SUN[0])).toBe(true)
    expect(plate.groups.filter((g) => g.layers.some((l) => l.color === SUN[0]))).toHaveLength(1)
    expect(catalogPlate(counts)).toEqual(plate)
  })
})
