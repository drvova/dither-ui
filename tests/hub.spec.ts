import { describe, expect, it } from "rstack/test"
import { GROUPS, SECTIONS } from "@/pages/docs/groups"
import { BENTO, DOCS_FAMILIES, FAMILIES, SECTION_COUNT, STAGGER, staggers } from "@/pages/landing/hub"

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

  it("staggers a row's reveals left to right and leaves a rail's later cards on time", () => {
    // A tall lead card beside two stacked ones, then a row of three.
    const grid = [
      { top: 0, left: 0 },
      { top: 0, left: 800 },
      { top: 272, left: 800 },
      { top: 544, left: 0 },
      { top: 544, left: 400 },
      { top: 544.5, left: 800 },
    ]
    expect(staggers(grid, 1200)).toEqual([0, STAGGER, 0, 0, STAGGER, 2 * STAGGER])
    // A rail: one row, wider than the bento.
    const rail = [0, 300, 600].map((left) => ({ top: 0, left }))
    expect(staggers(rail, 400)).toEqual([0, STAGGER, 0])
  })
})
