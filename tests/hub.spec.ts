import { describe, expect, it } from "rstack/test"
import { GROUPS, SECTIONS } from "@/pages/docs/groups"
import { BENTO, DOCS_FAMILIES, FAMILIES, SECTION_COUNT } from "@/pages/landing/hub"

const family = (title: string) => GROUPS.find((g) => g.title === title)

describe("component hub", () => {
  it("lists every docs family in sidebar order with its true size", () => {
    expect(FAMILIES.map((f) => f.title)).toEqual(GROUPS.map((g) => g.title))
    FAMILIES.forEach((f) => expect(f.count, f.title).toBe(family(f.title)?.items.length))
    expect(SECTION_COUNT).toBe(SECTIONS.length)
  })

  it("leads every bento tile and family link into a docs section of the family it names", () => {
    for (const tile of BENTO) {
      const ids = family(tile.family)?.items.map((i) => i.id) ?? []
      expect(ids, tile.id).toContain(tile.id)
    }
    for (const f of DOCS_FAMILIES) {
      expect(
        family(f.label)?.items.map((i) => i.id),
        f.label,
      ).toContain(f.first)
      expect(f.count, f.label).toBe(family(f.label)?.items.length)
    }
  })
})
