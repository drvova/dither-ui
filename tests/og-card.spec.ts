import { describe, expect, it } from "rstack/test"
import {
  OG_CELL,
  OG_FRAMES,
  OG_GROUND,
  OG_H,
  OG_W,
  ogArt,
  ogLevel,
  ogPixel,
  ogSeed,
  ogWrap,
  type OgCard,
} from "@/pages/docs/og-card"

// The share cards' art: what the build draws as og/<id>.png and loops as
// og/<id>.gif. The renderer page carries these same functions inline.

const field: OgCard = {
  id: "avatar",
  art: "field",
  title: "Avatar",
  line: "",
  tag: "",
  seed: ogSeed("avatar"),
  inv: false,
}
const horizon: OgCard = {
  id: "home",
  art: "horizon",
  title: "dither-ui",
  line: "",
  tag: "",
  seed: ogSeed("home"),
  inv: false,
}
const ground = ogPixel(OG_GROUND)
const lit = (art: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number) => {
  const view = new Uint32Array(art.buffer)
  let n = 0
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (view[y * OG_W + x] !== ground) n++
  return n
}

describe("share card art", () => {
  it("loops: the end of the loop is its first frame, and the frames between move", () => {
    for (const card of [field, horizon]) {
      expect(ogArt(card, 1)).toEqual(ogArt(card, 0))
      expect(ogArt(card, 0.5)).not.toEqual(ogArt(card, 0))
      expect(ogArt(card, 1 / OG_FRAMES)).not.toEqual(ogArt(card, 0))
    }
  })

  it("is the same card for the same seed, another for another", () => {
    expect(ogArt(field, 0.25)).toEqual(ogArt({ ...field }, 0.25))
    expect(ogArt({ ...field, seed: ogSeed("slider") }, 0)).not.toEqual(ogArt(field, 0))
  })

  it("keeps the title's corner clear: the field on the right, the stars above the horizon", () => {
    for (let i = 0; i < OG_FRAMES; i += 6) {
      const t = i / OG_FRAMES
      // A section's title and address sit in the bottom left.
      expect(lit(ogArt(field, t), 0, 380, 560, OG_H)).toBe(0)
      expect(lit(ogArt(field, t), 600, 0, OG_W, OG_H)).toBeGreaterThan(0)
      // A route's title band (the left two thirds, under the top strip,
      // above the far horizon's lowest dip) holds no star.
      expect(lit(ogArt(horizon, t), 0, 120, 780, 340)).toBe(0)
    }
  })

  it("draws a lattice: cells of 11px with a seam of ground", () => {
    const view = new Uint32Array(ogArt(horizon, 0).buffer)
    // The bottom row of cells is lit under the near horizon; every seam
    // column between them is ground.
    const y = OG_H - OG_CELL + 2
    for (let x = OG_CELL - 1; x < OG_W; x += OG_CELL) expect(view[y * OG_W + x]).toBe(ground)
    expect(view[y * OG_W + 3]).not.toBe(ground)
  })

  it("orders a tone's cells by the Bayer rank, a level up for its remainder's share", () => {
    const share = (tone: number) => {
      let up = 0
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) up += ogLevel(tone, 6, x, y) > Math.floor(tone * 6) ? 1 : 0
      return up
    }
    expect(share(0)).toBe(0)
    expect(share(2.5 / 6)).toBe(8)
    expect(share(2.25 / 6)).toBe(4)
    expect(ogLevel(1, 6, 0, 0)).toBe(6)
  })
})

describe("share card type", () => {
  const measure = (text: string) => text.length * 10

  it("wraps a title in as few lines as fit, as even as those lines allow", () => {
    expect(ogWrap(["Avatar"], measure, 100)).toEqual(["Avatar"])
    const lines = ogWrap("Admin with a profile panel".split(" "), measure, 200)
    expect(lines).toHaveLength(2)
    expect(lines.every((l) => measure(l) <= 200)).toBe(true)
    // Balanced: the greedy split would leave one word on the last line.
    expect(lines).toEqual(["Admin with a", "profile panel"])
  })
})
