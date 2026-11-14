// @rstest-environment jsdom
// Every drag in the Studio follows one pointer: a colour square's drag once
// ignored a cancelled touch (iOS takes a finger for a scroll with a
// pointercancel) and kept steering the colour with whatever moved next.
import { describe, expect, it, rs } from "rstack/test"
import { followPointer } from "../src/shared/lib/follow"

const pointer = (type: string, pointerId: number, clientX = 0) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, clientX })

describe("following a pointer", () => {
  it("hears only the pressing pointer's moves, and ends on its release", () => {
    const moves: number[] = []
    const end = rs.fn()
    followPointer(pointer("pointerdown", 1), (ev) => moves.push(ev.clientX), end)
    window.dispatchEvent(pointer("pointermove", 1, 10))
    window.dispatchEvent(pointer("pointermove", 2, 99))
    window.dispatchEvent(pointer("pointerup", 2))
    expect(end).not.toHaveBeenCalled()
    window.dispatchEvent(pointer("pointerup", 1, 20))
    window.dispatchEvent(pointer("pointermove", 1, 30))
    expect(moves).toEqual([10])
    expect(end).toHaveBeenCalledTimes(1)
    expect(end.mock.calls[0][1]).toBe(false)
  })

  it("ends on a cancel, saying so, and hears nothing after", () => {
    const moves: number[] = []
    const end = rs.fn()
    followPointer(pointer("pointerdown", 1), (ev) => moves.push(ev.clientX), end)
    window.dispatchEvent(pointer("pointercancel", 1))
    window.dispatchEvent(pointer("pointermove", 1, 30))
    expect(moves).toEqual([])
    expect(end.mock.calls).toHaveLength(1)
    expect(end.mock.calls[0][1]).toBe(true)
  })

  it("ends once when stopped by its caller", () => {
    const end = rs.fn()
    const stop = followPointer(pointer("pointerdown", 1), () => {}, end)
    stop()
    stop()
    window.dispatchEvent(pointer("pointerup", 1))
    expect(end.mock.calls).toEqual([[null, false]])
  })
})
