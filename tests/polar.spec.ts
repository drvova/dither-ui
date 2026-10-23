import { describe, expect, it } from "rstack/test"
import { pieSlices, radarAxes, sliceAtAngle } from "../dither-kit/polar"

const TAU = Math.PI * 2
const TOP = -Math.PI / 2
const data = [
  { name: "a", value: 50 },
  { name: "b", value: 30 },
  { name: "c", value: 20 },
]

describe("pieSlices", () => {
  it("spans sum to a full circle", () => {
    const s = pieSlices(data, "value", "name")
    const total = s.reduce((acc, x) => acc + (x.end - x.start), 0)
    expect(total).toBeCloseTo(TAU, 6)
  })
  it("starts at 12 o'clock by default", () => {
    expect(pieSlices(data, "value", "name")[0].start).toBeCloseTo(TOP, 6)
  })
  it("startAngle rotates the layout (degrees clockwise)", () => {
    const s = pieSlices(data, "value", "name", 90)
    expect(s[0].start).toBeCloseTo(TOP + Math.PI / 2, 6)
  })
  it("proportions follow the values", () => {
    const s = pieSlices(data, "value", "name")
    expect(s[0].end - s[0].start).toBeCloseTo(TAU * 0.5, 6)
    expect(s[2].end - s[2].start).toBeCloseTo(TAU * 0.2, 6)
  })
})

describe("sliceAtAngle", () => {
  it("hit-tests the default layout", () => {
    const s = pieSlices(data, "value", "name")
    // just past the top, clockwise -> first slice
    expect(sliceAtAngle(s, TOP + 0.1)).toBe(0)
    // three quarters around -> last slice (a covers first half)
    expect(sliceAtAngle(s, TOP + TAU * 0.95)).toBe(2)
  })
  it("hit-tests a rotated layout (angle below the base wraps up)", () => {
    const s = pieSlices(data, "value", "name", 180)
    expect(sliceAtAngle(s, s[0].start + 0.1)).toBe(0)
    // an angle numerically below the base normalises into the layout
    expect(sliceAtAngle(s, s[0].start - 0.1)).toBe(2)
  })
})

describe("radarAxes", () => {
  it("one evenly-spaced spoke per row", () => {
    const axes = radarAxes(data, "name")
    expect(axes).toHaveLength(3)
    expect(axes[0].angle).toBeCloseTo(TOP, 6)
    expect(axes[1].angle - axes[0].angle).toBeCloseTo(TAU / 3, 6)
    expect(axes.map((a) => a.label)).toEqual(["a", "b", "c"])
  })
})
