// Print screens: each is a permutation of the 16 ranks that grows its own
// shape (a line, a hatch, a dot, a cross) as density rises; the Bayer one
// seeded is the old seeded matrix, bit for bit; and a `DitherScreen`
// reaches every surface and chart series below it through one function.
import { describe, expect, it } from "rstack/test"
import { matrixFromSeed } from "../dither-kit/engine/dither-paint"
import { BAYER4, pixelMatrixFromSeed, SCREEN_KINDS, SCREENS, screenMatrix } from "../dither-kit/engine/pixel"

/** The cells a density lights, as "x,y". */
const lit = (m: number[][], density: number) =>
  m.flatMap((row, y) => row.flatMap((t, x) => (density > t ? [`${x},${y}`] : []))).sort()

describe("print screens", () => {
  it("are each a 4x4 permutation of the 16 ranks", () => {
    for (const kind of SCREEN_KINDS) {
      const ranks = SCREENS[kind].flat().map((t) => t * 16 - 0.5)
      expect(
        ranks.sort((a, b) => a - b),
        kind,
      ).toEqual([...Array(16).keys()])
    }
    expect(SCREENS.bayer).toBe(BAYER4)
  })

  it("grow their own shapes", () => {
    // A quarter of the ranks: one line, one falling hatch line, the centre dot.
    expect(lit(SCREENS.line, 4 / 16)).toEqual(["0,1", "1,1", "2,1", "3,1"])
    expect(lit(SCREENS.diagonal, 4 / 16)).toEqual(["0,0", "1,1", "2,2", "3,3"])
    expect(lit(SCREENS.dot, 4 / 16)).toEqual(["1,1", "1,2", "2,1", "2,2"])
    // Half: the line doubled to two rows; the cross has both hatch lines.
    expect(lit(SCREENS.line, 8 / 16)).toEqual(["0,1", "0,2", "1,1", "1,2", "2,1", "2,2", "3,1", "3,2"])
    expect(lit(SCREENS.cross, 8 / 16)).toEqual(["0,0", "0,3", "1,1", "1,2", "2,1", "2,2", "3,0", "3,3"])
  })

  it("seed the way the Bayer matrix always was", () => {
    for (const seed of [0, 7, 1984, -3, 123456]) {
      expect(screenMatrix("bayer", seed)).toEqual(pixelMatrixFromSeed(seed))
      expect(pixelMatrixFromSeed(seed)).toEqual(matrixFromSeed(seed))
      expect(screenMatrix("line", seed)).toEqual(screenMatrix("line", seed))
      expect(screenMatrix("line", seed)).not.toEqual(SCREENS.line)
    }
    expect(screenMatrix("dot")).toBe(SCREENS.dot)
  })
})
