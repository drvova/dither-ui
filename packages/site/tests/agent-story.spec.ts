import { describe, expect, it } from "rstack/test"
import { DAYS, DEPLOYS, DOES, lineState, PARTS, RENDER, STEPS } from "../src/pages/landing/story"

// The ask's story: a line is said, worked on, then done, one step each; the
// last step is the still the stage ends on and an unpinned stage shows, so
// on it every line is done and the screen is whole.
describe("agent story", () => {
  it("walks each line from ahead to working to done", () => {
    DOES.forEach((_, i) => {
      expect(lineState(i, i - 1)).toBe("ahead")
      expect(lineState(i, i)).toBe("working")
      expect(lineState(i, i + 1)).toBe("done")
    })
  })

  it("ends on a still with every line done and the screen whole", () => {
    const last = STEPS - 1
    expect(DOES.every((_, i) => lineState(i, last) === "done")).toBe(true)
    expect(Object.values(PARTS).every((at) => at < last)).toBe(true)
  })

  it("counts the week's deploys from the chart it draws", () => {
    expect(DEPLOYS).toBe(DAYS.reduce((n, d) => n + d, 0))
    expect(DAYS).toHaveLength(7)
    // A working week: no day without a deploy, so no dip reads as zero.
    expect(Math.min(...DAYS)).toBeGreaterThan(0)
  })

  it("shows the render's result on the screen: absent, rendering, then ready on the last step", () => {
    expect(DOES[RENDER]).toMatch(/MP4/)
    expect(lineState(RENDER, RENDER - 1)).toBe("ahead")
    expect(lineState(RENDER, RENDER)).toBe("working")
    expect(lineState(RENDER, STEPS - 1)).toBe("done")
  })
})
