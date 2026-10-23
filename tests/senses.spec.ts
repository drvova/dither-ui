import { describe, expect, it } from "rstack/test"
import { createSenses } from "@/pages/landing/senses"

describe("heartbeat", () => {
  it("ticks its organisms on one frame clock and stops when the last one leaves", () => {
    const frames: FrameRequestCallback[] = []
    const cancelled: number[] = []
    const raf = globalThis.requestAnimationFrame
    const caf = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = (cb) => frames.push(cb)
    globalThis.cancelAnimationFrame = (id) => void cancelled.push(id)
    try {
      const s = createSenses()
      const a: number[] = []
      const b: number[] = []
      const offA = s.subscribe({ tick: (dt) => a.push(dt) })
      const offB = s.subscribe({ tick: (dt) => b.push(dt) })
      // Two organisms, one frame request.
      expect(frames).toHaveLength(1)
      frames.shift()!(100)
      frames.shift()!(116)
      expect(a).toEqual([0, 16])
      expect(b).toEqual([0, 16])
      // A tab-switch jump is clamped.
      frames.shift()!(5000)
      expect(a.at(-1)).toBe(250)
      offA()
      expect(frames).toHaveLength(1)
      offB()
      expect(cancelled).toHaveLength(1)
      s.destroy()
    } finally {
      globalThis.requestAnimationFrame = raf
      globalThis.cancelAnimationFrame = caf
    }
  })
})
