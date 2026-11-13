import { describe, expect, it } from "rstack/test"
import { GROUPS } from "@/pages/docs/groups"
import { groupOf, neighbours, sectionOf, SECTION_IDS } from "@/pages/docs/pages"

// The docs as pages: the URL names one section, the pager walks the
// sidebar's order, the breadcrumb names the section's group.
describe("docs pages", () => {
  it("lists every section once, in the sidebar's order", () => {
    expect(SECTION_IDS).toEqual(GROUPS.flatMap((g) => g.items.map((i) => i.id)))
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length)
  })

  it("reads the section from canonical, directory and legacy URLs, else the front", () => {
    expect(sectionOf("/docs/area", "")).toBe("area")
    expect(sectionOf("/docs/area/", "")).toBe("area")
    expect(sectionOf("/", "#/docs/area")).toBe("area")
    expect(sectionOf("/docs", "")).toBe("")
    expect(sectionOf("/docs/no-such-section", "")).toBe("")
  })

  it("pages through the sidebar's order across groups, with no page before the first or after the last", () => {
    const first = SECTION_IDS[0]!
    const last = SECTION_IDS[SECTION_IDS.length - 1]!
    expect(neighbours(first).prev).toBeNull()
    expect(neighbours(first).next?.id).toBe(SECTION_IDS[1])
    expect(neighbours(last).next).toBeNull()
    // Crossing a group boundary names the next group.
    const g = GROUPS.findIndex((x, i) => i > 0 && x.items.length)
    const boundary = GROUPS[g - 1]!.items.at(-1)!.id
    expect(neighbours(boundary).next).toEqual({
      id: GROUPS[g]!.items[0]!.id,
      label: GROUPS[g]!.items[0]!.label,
      group: GROUPS[g]!.title,
    })
    expect(neighbours("no-such-section")).toEqual({ prev: null, next: null })
  })

  it("finds each section's group for the breadcrumb", () => {
    for (const grp of GROUPS) for (const it of grp.items) expect(groupOf(it.id)?.title).toBe(grp.title)
  })
})
