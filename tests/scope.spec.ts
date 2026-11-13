// The scope: its waves, the signal read across the screen, the beam it
// prints (bright on a flat stretch, faint on an edge, a glow beside it, an
// afterglow of earlier phases behind a named wave only, the same moment the
// same bytes) and the component as a named picture.
import { describe, expect, it } from "rstack/test"
import { scopeEnergy, signalAt, waveAt, type ScopeTrace } from "@dither-kit/engine/scope"

const W = 40
const H = 32
const trace = (t: Partial<ScopeTrace>): ScopeTrace => ({
  signal: "sine",
  cycles: 1,
  phase: 0,
  gain: 1,
  afterglow: 0,
  ...t,
})
const at = (e: Float32Array, x: number, y: number) => e[y * W + x]
const column = (e: Float32Array, x: number) => Array.from({ length: H }, (_, y) => at(e, x, y))

describe("the waves", () => {
  it("run one cycle each from their phase", () => {
    expect(waveAt("sine", 0.25)).toBeCloseTo(1)
    expect(waveAt("square", 0.1)).toBe(1)
    expect(waveAt("square", 0.6)).toBe(-1)
    expect(waveAt("triangle", 0.5)).toBe(1)
    expect(waveAt("triangle", 0)).toBe(-1)
    expect(waveAt("saw", 0.75)).toBeCloseTo(0.5)
    expect(waveAt("sine", 1.25)).toBeCloseTo(waveAt("sine", 0.25))
  })
  it("reads samples linearly across the screen, clamped to the screen's range", () => {
    expect(signalAt([0, 1], 0.5, 1, 0)).toBeCloseTo(0.5)
    expect(signalAt([-1, 0, 1], 1, 1, 0)).toBe(1)
    expect(signalAt([3, 3], 0.5, 1, 0)).toBe(1)
    expect(signalAt([], 0.5, 1, 0)).toBe(0)
    expect(signalAt("sine", 0.25, 2, 0)).toBeCloseTo(0)
  })
})

describe("the beam", () => {
  it("lands bright on a flat stretch, with a fainter glow on the rows beside it", () => {
    const e = scopeEnergy(W, H, trace({ signal: [0.5, 0.5] }))
    const col = column(e, 10)
    const row = col.indexOf(Math.max(...col))
    expect(row).toBeLessThan(H / 2) // up the screen: y runs down
    expect(col[row]).toBe(1)
    expect(col[row - 1]).toBeCloseTo(0.3)
    expect(col[row + 1]).toBeCloseTo(0.3)
  })
  it("lands faint where it moves fast: a square wave's edge under its flats", () => {
    const e = scopeEnergy(W, H, trace({ signal: "square" }))
    const edge = Math.max(...column(e, W / 2))
    const flat = Math.max(...column(e, W / 4))
    expect(flat).toBe(1)
    expect(edge).toBeLessThan(0.5)
    expect(edge).toBeGreaterThan(0)
  })
  it("leaves an afterglow of earlier phases behind a named wave, never behind samples", () => {
    const lit = (e: Float32Array) => e.filter((v) => v > 0).length
    expect(lit(scopeEnergy(W, H, trace({ phase: 0.3, afterglow: 1 })))).toBeGreaterThan(
      lit(scopeEnergy(W, H, trace({ phase: 0.3, afterglow: 0 }))),
    )
    const samples = trace({ signal: [-0.5, 0.8, 0.1], afterglow: 1 })
    expect(scopeEnergy(W, H, samples)).toEqual(scopeEnergy(W, H, { ...samples, afterglow: 0 }))
  })
  it("prints the same moment the same, however it was reached", () => {
    expect(scopeEnergy(W, H, trace({ phase: 0.42, afterglow: 0.6 }))).toEqual(
      scopeEnergy(W, H, trace({ phase: 0.42, afterglow: 0.6 })),
    )
  })
})
