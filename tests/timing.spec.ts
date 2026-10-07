// Step-timing parity suite. The four position outputs are spec-locked
// (css-easing-1) and pinned here against MDN's documented step graphs — if a
// refactor moves a boundary or an endpoint, this table fails first.
import { describe, expect, it } from "vitest"
import { cssSteps, frameIndex, frameSteps, linear, steps } from "../dither-kit/timing"

describe("steps() — MDN step-graph parity", () => {
  // steps(4, jump-end): segments (0,0) (0.25,0.25) (0.5,0.5) (0.75,0.75),
  // open circles at the jumps, solid at (1,1).
  it("jump-end holds start values and lands the end only at p=1", () => {
    const f = steps(4)
    const table: Array<[number, number]> = [
      [0, 0],
      [0.24, 0],
      [0.25, 0.25],
      [0.49, 0.25],
      [0.5, 0.5],
      [0.74, 0.5],
      [0.75, 0.75],
      [0.99, 0.75],
      [1, 1],
    ]
    for (const [p, want] of table) expect(f(p), `p=${p}`).toBeCloseTo(want, 10)
  })

  // steps(2, jump-start): segments (0,0.5) and (0.5,1) — the graph starts off
  // the origin, first jump happens when the animation begins.
  it("jump-start jumps immediately and ends on the end value", () => {
    const f = steps(2, "jump-start")
    const table: Array<[number, number]> = [
      [0, 0.5],
      [0.49, 0.5],
      [0.5, 1],
      [0.99, 1],
      [1, 1],
    ]
    for (const [p, want] of table) expect(f(p), `p=${p}`).toBeCloseTo(want, 10)
  })

  // steps(5, jump-none): segments (0,0) (0.2,0.25) (0.4,0.5) (0.6,0.75)
  // (0.8,1) — both endpoints get a full interval, so 1 is displayed.
  it("jump-none displays both 0 and 1 for a full interval", () => {
    const f = steps(5, "jump-none")
    const table: Array<[number, number]> = [
      [0, 0],
      [0.19, 0],
      [0.2, 0.25],
      [0.39, 0.25],
      [0.4, 0.5],
      [0.6, 0.75],
      [0.79, 0.75],
      [0.8, 1],
      [0.99, 1],
      [1, 1],
    ]
    for (const [p, want] of table) expect(f(p), `p=${p}`).toBeCloseTo(want, 10)
  })

  // steps(3, jump-both): segments (0,0.25) (1/3,0.5) (2/3,0.75), solid at (1,1),
  // open circles at the origin and every jump.
  it("jump-both plateaus both ends across n+1 intervals", () => {
    const f = steps(3, "jump-both")
    const table: Array<[number, number]> = [
      [0, 0.25],
      [1 / 3 - 1e-9, 0.25],
      [1 / 3, 0.5],
      [2 / 3, 0.75],
      [0.99, 0.75],
      [1, 1],
    ]
    for (const [p, want] of table) expect(f(p), `p=${p}`).toBeCloseTo(want, 6)
  })

  it("rejects the inputs CSS invalidates", () => {
    expect(() => steps(0)).toThrow(RangeError)
    expect(() => steps(-3)).toThrow(RangeError)
    expect(() => steps(1, "jump-none")).toThrow(RangeError) // CSS: integer > 1
    expect(() => frameSteps(0, 1000)).toThrow(RangeError)
  })

  it("clamps out-of-range progress instead of extrapolating", () => {
    const f = steps(4)
    expect(f(-0.5)).toBe(0)
    expect(f(1.5)).toBe(1)
  })

  it("is monotonically non-decreasing across every position", () => {
    for (const position of ["jump-end", "jump-start", "jump-none", "jump-both"] as const) {
      const f = steps(7, position)
      let prev = -1
      for (let i = 0; i <= 70; i++) {
        const v = f(i / 70)
        expect(v, `${position} at ${i / 70}`).toBeGreaterThanOrEqual(prev)
        prev = v
      }
    }
  })
})

describe("frameSteps() — duration-aware cadence", () => {
  it("derives the step count from fps × duration", () => {
    // compare sampled outputs (closures never toEqual), at a point where the
    // step counts disagree so the assertion can actually fail
    const at = (f: (p: number) => number) => [0.1, 0.3, 0.7, 1].map(f)
    expect(at(frameSteps(24, 1000))).toEqual(at(steps(24)))
    expect(at(frameSteps(24, 500))).toEqual(at(steps(12)))
    expect(at(frameSteps(12, 250))).toEqual(at(steps(3)))
    expect(at(frameSteps(24, 500))).not.toEqual(at(steps(24))) // duration halves → cadence doubles
    expect(frameSteps(30, 41.7)(0.9)).toEqual(steps(1)(0.9)) // sub-second durations still ≥ 1
  })
})

describe("frameIndex() — the wall-clock frame gate", () => {
  it("advances exactly fps times per second", () => {
    expect(frameIndex(0, 12)).toBe(0)
    expect(frameIndex(83, 12)).toBe(0) // 99.6ms… floor(0.996) = 0
    expect(frameIndex(84, 12)).toBe(1)
    expect(frameIndex(500, 12)).toBe(6)
    expect(frameIndex(1000, 12)).toBe(12)
    expect(frameIndex(999, 12)).toBe(11)
  })

  it("is step-shaped: one index change per boundary, stable between", () => {
    const idx = (ms: number) => frameIndex(ms, 24) // 41.666ms per frame
    expect(idx(0)).toBe(0)
    expect(idx(41)).toBe(0)
    expect(idx(42)).toBe(1)
    expect(idx(83)).toBe(1)
    expect(idx(84)).toBe(2)
  })

  it("holds at 0 for negative time and rejects non-positive fps", () => {
    expect(frameIndex(-500, 12)).toBe(0)
    expect(() => frameIndex(0, 0)).toThrow(RangeError)
    expect(() => frameIndex(0, -12)).toThrow(RangeError)
  })
})

describe("cssSteps() — one config, both surfaces", () => {
  it("serializes through the same validation as the JS compiler", () => {
    expect(cssSteps(8)).toBe("steps(8, jump-end)")
    expect(cssSteps(8, "jump-none")).toBe("steps(8, jump-none)")
    expect(cssSteps(2, "jump-start")).toBe("steps(2, jump-start)")
    expect(() => cssSteps(1, "jump-none")).toThrow(RangeError)
    expect(() => cssSteps(0)).toThrow(RangeError)
  })

  it("the compiled JS and the serialized CSS land on the same outputs", () => {
    // what the string promises for steps(6, jump-none) at each boundary
    const viaJs = steps(6, "jump-none")
    expect(viaJs(0)).toBe(0)
    expect(viaJs(1 / 6)).toBeCloseTo(0.2, 10) // floor(6·1/6)/(6−1)
    expect(viaJs(5 / 6)).toBe(1)
    expect(cssSteps(6, "jump-none")).toBe("steps(6, jump-none)")
  })
})

describe("linear()", () => {
  it("is the identity baseline", () => {
    for (const p of [0, 0.3, 0.5, 1]) expect(linear(p)).toBe(p)
  })
})
