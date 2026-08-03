import { describe, expect, it } from "vitest"
import { SECTIONS } from "@/pages/docs/groups"
import { DOCS_ROOT, docsBreadcrumb, docsMeta, docsSection } from "@/pages/docs/seo"

// The docs section IA is also the search surface: every deep link must yield
// unique, well-formed metadata for title/canonical/description and the
// build-time sitemap. A renamed or duplicated id breaks this contract.
describe("docs SEO metadata", () => {
  it("covers every section with a unique title, url, and description", () => {
    const metas = SECTIONS.map((s) => docsMeta(s.id))
    expect(metas).toHaveLength(SECTIONS.length)
    expect(new Set(metas.map((m) => m.title)).size).toBe(metas.length)
    expect(new Set(metas.map((m) => m.url)).size).toBe(metas.length)
    for (const m of metas) {
      expect(m.title).toMatch(/\| dither-ui$/)
      expect(m.url).toBe(`https://dither-ui.com/docs/${m.id}`)
      expect(m.description.length).toBeGreaterThan(50)
      expect(m.description).toContain(m.label)
    }
  })

  it("falls back to the generic /docs metadata for unknown or empty ids", () => {
    for (const id of ["", "does-not-exist"]) {
      const m = docsMeta(id)
      expect(m).toMatchObject({ url: DOCS_ROOT.url, title: DOCS_ROOT.title })
      expect(m.description).toBe(DOCS_ROOT.description)
    }
    expect(docsSection("does-not-exist")).toBeUndefined()
  })

  it("emits a breadcrumb matching the section", () => {
    const crumb = JSON.parse(docsBreadcrumb("avatar"))
    expect(crumb["@type"]).toBe("BreadcrumbList")
    expect(crumb.itemListElement).toHaveLength(3)
    expect(crumb.itemListElement[2]).toMatchObject({
      name: "Avatar",
      item: "https://dither-ui.com/docs/avatar",
    })
  })
})
