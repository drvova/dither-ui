// The circuit: a board drawn from its seed and size (the same both times, a
// new seed a new board), traces that run straight or at 45 degrees cell to
// cell and never share a cell, chips with traces leaving their pins, and
// signals that are a pure function of time: a head in the pulse ink that
// moves along its trace as time does, the same moment the same bytes.
import { describe, expect, it } from "rstack/test"
import { circuitBoard, paintCircuit, signalHead, type CircuitParams } from "@dither-kit/engine/circuit"
import { BAYER4 } from "@dither-kit/engine/pixel"
import { createRasterBuffer } from "@dither-kit/engine/raster"

const P: CircuitParams = { ink: [166, 171, 177], pulse: [255, 150, 50], density: 0.7, speed: 14, pitch: 4, seed: 7 }
const paint = (t: number, p = P) => {
  const b = createRasterBuffer(160, 100)
  paintCircuit(b, p, t, BAYER4)
  return b.data
}

describe("the board", () => {
  const board = circuitBoard(160, 100, P)
  it("is drawn from its seed and size", () => {
    expect(circuitBoard(160, 100, P)).toEqual(board)
    expect(circuitBoard(160, 100, { ...P, seed: 8 })).not.toEqual(board)
    expect(board.traces.length).toBeGreaterThan(8)
    expect(board.chips.length).toBeGreaterThan(0)
  })
  it("runs its traces straight or at 45 degrees, cell to cell, never over each other", () => {
    const seen = new Map<string, number>()
    board.traces.forEach((t, n) => {
      for (let i = 1; i < t.cells.length; i++) {
        const dx = Math.abs(t.cells[i][0] - t.cells[i - 1][0])
        const dy = Math.abs(t.cells[i][1] - t.cells[i - 1][1])
        expect(Math.max(dx, dy)).toBe(1)
      }
      // a pin's first cell sits under its package, held by no other trace's run
      for (const [x, y] of t.cells.slice(1)) {
        const k = `${x},${y}`
        expect(seen.has(k) && seen.get(k) !== n).toBe(false)
        seen.set(k, n)
      }
    })
  })
})

describe("the signals", () => {
  it("move along their trace as time does, and loop", () => {
    const [t] = circuitBoard(160, 100, P).traces
    const a = signalHead(t, 1, 14)
    const b = signalHead(t, 1.5, 14)
    expect((b - a + t.cells.length + t.gap) % (t.cells.length + t.gap)).toBeCloseTo(7)
    expect(signalHead(t, 1 + (t.cells.length + t.gap) / 14, 14)).toBeCloseTo(a)
  })
  it("print the same moment the same, a later moment otherwise, in the pulse ink", () => {
    expect(paint(2.4)).toEqual(paint(2.4))
    expect(paint(2.4)).not.toEqual(paint(3.1))
    const data = paint(2.4)
    let pulse = 0
    for (let i = 0; i < data.length; i += 4) if (data[i] === 255 && data[i + 1] === 150 && data[i + 2] === 50) pulse++
    expect(pulse).toBeGreaterThan(5)
  })
})
