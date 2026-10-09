import { afterEach, describe, expect, it, vi } from "vitest"
import { directFromHyperframes, directedTime, isDirected, onSeek, release, seek } from "../dither-kit/clock"

afterEach(() => release())

describe("clock — the director", () => {
  it("broadcasts the directed moment and hands time back on release", () => {
    const seen: (number | null)[] = []
    const off = onSeek((ms) => seen.push(ms))
    expect(isDirected()).toBe(false)
    seek(250)
    expect(isDirected()).toBe(true)
    expect(directedTime()).toBe(250)
    seek(-5) // clamped: the composition has no negative time
    seek(Number.NaN)
    release()
    expect(isDirected()).toBe(false)
    expect(seen).toEqual([250, 0, 0, null])
    release() // idempotent: no second null
    expect(seen).toEqual([250, 0, 0, null])
    off()
    seek(10)
    expect(seen).toEqual([250, 0, 0, null])
  })

  it("takes direction from HyperFrames' hf-seek events (seconds → ms)", () => {
    const target = new EventTarget()
    const paint = vi.fn()
    onSeek(paint)
    const off = directFromHyperframes(target)
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 1.5, waitUntil: () => {} } }))
    expect(paint).toHaveBeenCalledWith(1500)
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: "x" } }))
    expect(paint).toHaveBeenCalledTimes(1)
    off()
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 2 } }))
    expect(paint).toHaveBeenCalledTimes(1)
  })
})
