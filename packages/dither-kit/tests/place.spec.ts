// A menu opened at a point near the view's edge (a long press on the last
// layer row of an iPad's right column) stood half off the glass: `inView`
// moves it in, by no more than it must.
import { describe, expect, it } from "rstack/test"
import { inView } from "../src/engine/place"

const view = { width: 1194, height: 834 }
const menu = { width: 172, height: 252 }

describe("a floating panel kept in view", () => {
  it("stands where it opened when it fits", () => {
    expect(inView({ x: 400, y: 300 }, menu, view)).toEqual({ x: 400, y: 300 })
  })
  it("moves in from the right and the foot, a margin inside", () => {
    expect(inView({ x: 1100, y: 800 }, menu, view)).toEqual({ x: 1194 - 172 - 8, y: 834 - 252 - 8 })
  })
  it("moves in from the left and the top", () => {
    expect(inView({ x: -20, y: 2 }, menu, view, 12)).toEqual({ x: 12, y: 12 })
  })
  it("keeps its top-left edge in when it is larger than the view", () => {
    expect(inView({ x: 50, y: 50 }, { width: 2000, height: 2000 }, view)).toEqual({ x: 8, y: 8 })
  })
})
