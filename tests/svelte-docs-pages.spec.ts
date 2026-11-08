// The Svelte docs, one section a page as the Vue docs (tests/docs-pages.spec.ts):
// the address names the section, the pager walks the sidebar's order, the
// breadcrumb names the family, and every family carries one of the kit's glyphs.
import { describe, expect, it } from "rstack/test"
import { ICONS } from "@dither-kit/engine/icons"
import { GROUPS, SECTIONS, groupOf, neighbours, sectionOf } from "../svelte-site/src/docs/nav"

describe("the Svelte docs' pages", () => {
  it("reads the section from the address, the front from the bare docs", () => {
    expect(sectionOf("#/docs/avatar")).toBe("avatar")
    expect(sectionOf("#/docs")).toBe("")
    expect(sectionOf("#/docs/")).toBe("")
    expect(sectionOf("#/docs/no-such-section")).toBe("")
  })
  it("lists every section once, in the sidebar's order", () => {
    const ids = SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(GROUPS.flatMap((g) => g.items.map((it) => it.id)))
  })
  it("turns the page to the sections either side, none past the ends", () => {
    const [first, second] = SECTIONS
    const last = SECTIONS[SECTIONS.length - 1]
    expect(neighbours(first.id)).toEqual({ prev: null, next: second })
    expect(neighbours(second.id).prev).toEqual(first)
    expect(neighbours(last.id).next).toBeNull()
  })
  it("names each section's family, under a glyph of the kit's", () => {
    for (const s of SECTIONS) expect(groupOf(s.id)?.title).toBe(s.group)
    for (const g of GROUPS) expect(ICONS[g.icon], g.title).toBeDefined()
  })
})
