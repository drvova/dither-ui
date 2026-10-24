import { describe, expect, it } from "rstack/test"
import { scoreCut, wavBytes } from "@dither-kit"

// The kit's score: a film's soundtrack from its cut, the plan and its seed
// the only inputs. Low sample rates keep these quick.

const plan = { seconds: 3, clips: [0, 1.5], marks: [1.6], ticks: [0.8], seed: 7, sampleRate: 8000 }

describe("score", () => {
  it("is the same audio for the same plan, other audio for another seed", () => {
    expect(wavBytes(scoreCut(plan))).toEqual(wavBytes(scoreCut({ ...plan })))
    expect(scoreCut({ ...plan, seed: 8 }).left).not.toEqual(scoreCut(plan).left)
  })

  it("runs the plan's length in two channels, inside a steady peak", () => {
    const a = scoreCut(plan)
    expect(a.sampleRate).toBe(8000)
    expect(a.left).toHaveLength(24000)
    expect(a.right).toHaveLength(24000)
    let peak = 0
    for (const c of [a.left, a.right]) for (const v of c) peak = Math.max(peak, Math.abs(v))
    expect(peak).toBeGreaterThan(0.5)
    expect(peak).toBeLessThanOrEqual(0.89)
    expect(a.left[0]).toBe(0)
  })

  it("hears the cut: a second clip changes what follows it", () => {
    const one = scoreCut({ ...plan, clips: [0] })
    const two = scoreCut(plan)
    const at = (a: Float32Array, t0: number, t1: number) => a.slice(t0 * 8000, t1 * 8000)
    expect(at(two.left, 1.5, 2)).not.toEqual(at(one.left, 1.5, 2))
  })

  it("writes a 16-bit stereo WAV", () => {
    const bytes = wavBytes(scoreCut(plan))
    const text = (at: number, n: number) => String.fromCharCode(...bytes.slice(at, at + n))
    const view = new DataView(bytes.buffer)
    expect(text(0, 4)).toBe("RIFF")
    expect(text(8, 4)).toBe("WAVE")
    expect(view.getUint16(22, true)).toBe(2)
    expect(view.getUint32(24, true)).toBe(8000)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(24000 * 4)
    expect(bytes).toHaveLength(44 + 24000 * 4)
  })
})
