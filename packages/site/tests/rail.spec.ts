// The bento's rail (`pages/landing/rail.ts`): the dot that is lit names the
// card standing at the rail's start, and the last card at the rail's end.
import { describe, expect, it } from "rstack/test"
import { railIndex } from "@/pages/landing/rail"

const STARTS = [0, 352, 704, 1056]

describe("the rail's card", () => {
  it("is the card whose start is nearest the scroll", () => {
    expect(railIndex(0, STARTS)).toBe(0)
    expect(railIndex(170, STARTS)).toBe(0)
    expect(railIndex(190, STARTS)).toBe(1)
    expect(railIndex(700, STARTS)).toBe(2)
  })

  it("is the last card at the rail's end, which never reaches the start", () => {
    expect(railIndex(900, STARTS, true)).toBe(3)
  })

  it("is the first of an empty rail", () => {
    expect(railIndex(40, [])).toBe(0)
  })
})
