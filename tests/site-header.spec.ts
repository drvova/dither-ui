// @rstest-environment jsdom
import { describe, expect, it, rs } from "rstack/test"
import { mount } from "@vue/test-utils"
import { h, nextTick } from "vue"
import { MARK_CELLS as LANDING_MARK } from "@/pages/landing/brand"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { SiteHeader } from "@/widgets/site-header"
import {
  BAND_INK,
  MENU_LINKS,
  SEAM_HEIGHT,
  SEAM_MASK,
  SHEET_WIPE,
  STUDIO_LINK,
  bandFill,
} from "@/widgets/site-header/menu"

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

  it("opens every link as a band of the ink's steps, the studio at the foot", async () => {
    const w = mount(SiteHeader, { props: { current: "docs" }, attachTo: document.body })
    const key = w.find(".menu-key")
    expect(key.attributes("aria-expanded")).toBe("false")
    expect(key.attributes("aria-controls")).toBe(w.find("dialog").attributes("id"))
    expect(w.findAll(".menu-chip > span")).toHaveLength(BAND_INK.length + 1)
    await key.trigger("click")
    await nextTick()
    expect(key.attributes("aria-expanded")).toBe("true")
    expect(document.documentElement.style.overflow).toBe("hidden")
    const bands = w.findAll(".menu-band")
    const say = (sel: string) =>
      bands.map((b) =>
        b
          .find(sel)
          .text()
          .replace(/\s*\(opens.*$/, ""),
      )
    expect(say(".menu-name")).toEqual([...MENU_LINKS.map((l) => l.label), STUDIO_LINK.label])
    expect(say(".menu-note")).toEqual([...MENU_LINKS.map((l) => l.note), STUDIO_LINK.note])
    expect(bands.slice(0, -1).map((b) => b.attributes("style"))).toEqual(
      MENU_LINKS.map((_, i) => `background: ${bandFill(i)};`),
    )
    expect(w.findAll(".menu-band[aria-current] .menu-name").map((b) => b.text())).toEqual(["Docs"])
    // A link taken shuts the sheet at once and frees the page.
    await bands[0].trigger("click")
    expect(key.attributes("aria-expanded")).toBe("false")
    expect(document.documentElement.style.overflow).toBe("")
    expect(w.find(".menu-band").exists()).toBe(false)
    w.unmount()
  })

  it("rolls the sheet back up before it shuts, from the close key and from Escape", async () => {
    rs.useFakeTimers()
    try {
      const w = mount(SiteHeader, { props: { current: "landing" }, attachTo: document.body })
      for (const close of [
        () => w.find('[aria-label="Close menu"]').trigger("click"),
        () => w.find("dialog").trigger("cancel"),
      ]) {
        await w.find(".menu-key").trigger("click")
        await nextTick()
        await close()
        // Leaving: the sheet still up, playing its wipe back; the key says shut.
        expect(w.find("[data-phase]").attributes("data-phase")).toBe("leaving")
        expect(w.find(".menu-key").attributes("aria-expanded")).toBe("false")
        expect(document.documentElement.style.overflow).toBe("hidden")
        rs.advanceTimersByTime(SHEET_WIPE.duration * 1000)
        await nextTick()
        expect(w.find("[data-phase]").exists()).toBe(false)
        expect(document.documentElement.style.overflow).toBe("")
      }
      w.unmount()
    } finally {
      rs.useRealTimers()
    }
  })

  it("seams the bands with the kit's dither: a mask exactly the seam's height", () => {
    expect(SEAM_MASK.image).toMatch(/^url\("data:image\/svg\+xml/)
    expect(SEAM_MASK.size).toMatch(new RegExp(` ${SEAM_HEIGHT}px$`))
  })

  it("draws the same diamond the landing's lockup leads with", () => {
    expect(MARK_CELLS).toEqual(LANDING_MARK)
  })
})
