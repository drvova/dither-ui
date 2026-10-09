import { describe, expect, it } from "vitest"
import { FIGURE_N, figureCells, OFF, STAGE_CAPTIONS, STAGE_COUNT, stageFills } from "@/pages/landing/essay-figure"

describe("essay figure", () => {
  it("lays out a row-major lattice with Bayer ranks", () => {
    const cells = figureCells()
    expect(cells).toHaveLength(FIGURE_N * FIGURE_N)
    expect(cells[1]).toEqual({ x: 1, y: 0, rank: cells[1].rank })
    const ranks = new Set(cells.map((c) => c.rank))
    expect(ranks.size).toBe(16)
  })

  it("paints every stage deterministically with a readable lit share", () => {
    expect(STAGE_CAPTIONS).toHaveLength(STAGE_COUNT)
    const seen = new Set<string>()
    for (let s = 0; s < STAGE_COUNT; s++) {
      const a = stageFills(s)
      expect(a).toEqual(stageFills(s))
      expect(a).toHaveLength(FIGURE_N * FIGURE_N)
      const lit = a.filter((f) => f !== OFF).length / a.length
      expect(lit, `stage ${s} lit share`).toBeGreaterThan(0.05)
      expect(lit, `stage ${s} lit share`).toBeLessThan(0.97)
      const key = a.join()
      expect(seen.has(key), `stage ${s} duplicates another`).toBe(false)
      seen.add(key)
    }
    // Out-of-range stages wrap instead of throwing.
    expect(stageFills(STAGE_COUNT)).toEqual(stageFills(0))
    expect(stageFills(-1)).toEqual(stageFills(STAGE_COUNT - 1))
  })
})
