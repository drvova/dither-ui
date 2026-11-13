// The Gauge section's live panel reads frames a second and the worst frame
// from a window of rAF stamps.
import { describe, expect, it } from "rstack/test"
import { readFrames } from "@/pages/docs/components/frames"

describe("reading a window of frames", () => {
  it("counts frames a second over the window's span", () => {
    const stamps = Array.from({ length: 31 }, (_, i) => i * (1000 / 60))
    expect(readFrames(stamps).fps).toBe(60)
  })
  it("finds the longest frame, a dropped one included", () => {
    expect(readFrames([0, 16.7, 33.4, 83.4, 100]).worst).toBe(50)
  })
  it("reads nothing from fewer than two stamps", () => {
    expect(readFrames([])).toEqual({ fps: 0, worst: 0 })
    expect(readFrames([12])).toEqual({ fps: 0, worst: 0 })
  })
})
