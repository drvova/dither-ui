// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import { h } from "vue"
import { MARK_CELLS as LANDING_MARK } from "@/pages/landing/brand"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { SiteHeader } from "@/widgets/site-header"

// One header for the pages that read: the same links and key on each, the
// page's own link current, a page's tools beside the key.
describe("site header", () => {
  it("marks the docs current on the docs, nothing on the landing, and carries a page's tools", () => {
    const docs = mount(SiteHeader, {
      props: { current: "docs" },
      slots: { tools: () => h("button", { type: "button", "aria-label": "Search docs" }) },
    })
    const links = (w: typeof docs) => w.findAll("nav a").map((a) => a.text().replace(/\s*\(opens.*$/, ""))
    expect(links(docs)).toEqual(["Components", "Docs", "Agents", "GitHub"])
    expect(docs.findAll("[aria-current]").map((a) => a.text())).toEqual(["Docs"])
    expect(docs.find('[aria-label="Search docs"]').exists()).toBe(true)
    const landing = mount(SiteHeader, { props: { current: "landing" } })
    expect(links(landing)).toEqual(links(docs))
    expect(landing.findAll("[aria-current]")).toHaveLength(0)
    expect(landing.findAll("a").at(-1)?.text()).toBe("Open studio")
  })

  it("draws the same diamond the landing's lockup leads with", () => {
    expect(MARK_CELLS).toEqual(LANDING_MARK)
  })
})
