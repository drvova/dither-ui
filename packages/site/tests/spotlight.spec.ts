// The bento's moving surfaces play one at a time: the pointed card, then the
// reader's choice while it shows, then the first card crossing the middle,
// then the last that played.
import { describe, expect, it } from "rstack/test"
import { spotlight, type Spot } from "../src/pages/landing/spotlight"

const ORDER = ["world", "shader", "fluid"] as const
type Id = (typeof ORDER)[number]
const spot = (s: Partial<Spot<Id>>): Spot<Id> => ({
  pointed: null,
  chosen: null,
  visible: new Set(),
  centred: new Set(),
  last: null,
  ...s,
})

describe("spotlight", () => {
  it("plays the card under the pointer or focus first", () => {
    expect(spotlight(ORDER, spot({ pointed: "fluid", chosen: "world", visible: new Set(["world"]) }))).toBe("fluid")
  })

  it("keeps the reader's choice while any of it is on screen", () => {
    const s = spot({ chosen: "fluid", visible: new Set(["fluid", "shader"]), centred: new Set(["shader"]) })
    expect(spotlight(ORDER, s)).toBe("fluid")
    expect(spotlight(ORDER, { ...s, visible: new Set(["shader"]) })).toBe("shader")
  })

  it("takes the first card in page order crossing the middle", () => {
    expect(spotlight(ORDER, spot({ centred: new Set(["fluid", "shader"]) }))).toBe("shader")
  })

  it("falls back to the last that played, else none", () => {
    expect(spotlight(ORDER, spot({ last: "world" }))).toBe("world")
    expect(spotlight(ORDER, spot({}))).toBeNull()
  })
})
