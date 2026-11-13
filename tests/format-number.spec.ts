// A counter built a number formatter a frame: `formatFixed` keeps one a
// precision.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { formatFixed } from "../dither-kit/engine/format-number"

afterEach(() => void rs.restoreAllMocks())

describe("a number with its decimals fixed", () => {
  it("reads as toLocaleString reads it, from one formatter a precision", () => {
    for (const [v, d] of [
      [1234567.891, 2],
      [0.5, 0],
      [42, 1],
      [-9876.5, 3],
    ] as const)
      expect(formatFixed(v, d)).toBe(
        v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }),
      )
    const made = rs.spyOn(Intl, "NumberFormat")
    for (let i = 0; i < 50; i++) formatFixed(i * 1.5, 2)
    expect(made).not.toHaveBeenCalled()
  })
})
