import { describe, expect, it } from "rstack/test"
import { GROUPS, SECTIONS } from "@/pages/docs/groups"
import { FAMILIES, SECTION_COUNT, SHELVES } from "@/pages/landing/hub"

const family = (title: string) => GROUPS.find((g) => g.title === title)

describe("component hub", () => {
  it("lists every docs family in sidebar order with its true size", () => {
    expect(FAMILIES.map((f) => f.title)).toEqual(GROUPS.map((g) => g.title))
    FAMILIES.forEach((f) => expect(f.count, f.title).toBe(family(f.title)?.items.length))
    expect(SECTION_COUNT).toBe(SECTIONS.length)
  })

  it("deep-links every card to a docs section of the family it names", () => {
    for (const shelf of SHELVES) {
      for (const card of shelf.cards) {
        const ids = family(card.family)?.items.map((i) => i.id) ?? []
        expect(ids, `${shelf.value}: ${card.id}`).toContain(card.id)
      }
    }
  })

  it("counts each family shelf as its family", () => {
    for (const shelf of SHELVES.filter((s) => s.value !== "explore")) {
      expect(shelf.count).toBe(family(shelf.label)?.items.length)
      expect(shelf.cards.every((c) => c.family === shelf.label)).toBe(true)
    }
    const explore = SHELVES.find((s) => s.value === "explore")
    expect(explore?.count).toBe(explore?.cards.length)
    expect(explore?.cards.every((c) => c.note)).toBe(true)
  })
})
