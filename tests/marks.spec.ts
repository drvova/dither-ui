import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { isMark, MARKS } from "../src/shared/ui/marks"

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8")
// The `{ id, name }` rows of a HARNESSES array, read from its source.
const rows = (src: string, start: string) => {
  const from = src.indexOf(start)
  const block = src.slice(from, src.indexOf("\n]", from))
  return [...block.matchAll(/id: "([\w-]+)",\s*name: "([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2] }))
}
const BRIDGE = rows(read("../bridge/dither-bridge.mjs"), "export const HARNESSES")
const LANDING = rows(read("../src/pages/landing/LandingPage.vue"), "const HARNESSES")

describe("tool marks", () => {
  it("covers every harness the bridge starts, named as the bridge names it", () => {
    expect(BRIDGE.length).toBeGreaterThan(0)
    for (const h of BRIDGE) {
      expect(isMark(h.id), h.id).toBe(true)
      if (isMark(h.id)) expect(MARKS[h.id].name).toBe(h.name)
    }
  })

  it("lists the bridge's harnesses on the landing, in its order", () => {
    expect(LANDING).toEqual(BRIDGE)
  })

  it("draws every mark as path data in a positive box", () => {
    for (const [id, mark] of Object.entries(MARKS)) {
      const box = mark.viewBox.split(" ").map(Number)
      expect(box, id).toHaveLength(4)
      expect(box.every(Number.isFinite) && box[2] > 0 && box[3] > 0, id).toBe(true)
      expect(mark.d.length, id).toBeGreaterThan(0)
      for (const d of mark.d) expect(d, id).toMatch(/^[Mm][\d\s.,+\-MmLlHhVvCcSsQqTtAaZz]*$/)
    }
  })

  it("answers only for its own ids", () => {
    expect(isMark("npm")).toBe(true)
    expect(isMark("folder")).toBe(false)
    expect(isMark("toString")).toBe(false)
  })
})
