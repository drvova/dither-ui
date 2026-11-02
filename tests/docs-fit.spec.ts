// @rstest-environment jsdom
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { mount } from "@vue/test-utils"
import { defineComponent, h, nextTick, provide } from "vue"
import DemoCard, { DEMO_FIT, type DemoFit } from "@/pages/docs/DemoCard.vue"
import DocsNav, { NAV_PLACE } from "@/pages/docs/DocsNav.vue"
import { GROUPS } from "@/pages/docs/groups"
import { bandFill } from "@/widgets/site-header/menu"

afterEach(() => rs.unstubAllGlobals())

// A demo's fit: a family sets the default, a card's own `fit` wins; bled,
// the well drops its inset padding.
describe("docs demo fit", () => {
  const well = async (family: DemoFit | null, own?: DemoFit) => {
    rs.stubGlobal("IntersectionObserver", undefined)
    const Host = defineComponent(() => {
      if (family) provide(DEMO_FIT, family)
      return () => h(DemoCard, { code: "<div />", fit: own }, () => h("div", { class: "frame" }))
    })
    const w = mount(Host)
    await nextTick()
    const el = w.get(".demo-well").element
    const out = { bleed: el.classList.contains("bleed"), inset: el.classList.contains("sm:p-10") }
    w.unmount()
    return out
  }

  it("is inset by default, bled under a bleeding family, inset again where a card asks", async () => {
    expect(await well(null)).toEqual({ bleed: false, inset: true })
    expect(await well("bleed")).toEqual({ bleed: true, inset: false })
    expect(await well("bleed", "inset")).toEqual({ bleed: false, inset: true })
  })
})

// The section lists keep each group's heading stuck to the top, the list's
// top room on the list itself (never the scroller's padding).
describe("docs section list landmarks", () => {
  it("sticks each group heading on its place's ground", () => {
    // The rail: on the page's ground, unseen.
    const rail = mount(DocsNav, { props: { activeId: "", variant: "rail" } })
    expect(rail.element.className).toContain(NAV_PLACE.rail.top)
    const heads = rail.findAll(".sticky")
    expect(heads.length).toBeGreaterThan(5)
    for (const c of NAV_PLACE.rail.head.split(" ")) expect(heads[0]!.classes()).toContain(c)
    rail.unmount()
    // The sheet: each family a band, its heading sticking on the band's own fill.
    const sheet = mount(DocsNav, { props: { activeId: "", variant: "sheet" } })
    const groups = sheet.findAll(".nav-grp")
    expect(groups).toHaveLength(GROUPS.length)
    groups.forEach((g, i) => {
      expect(g.element.style.background).toBe(bandFill(i, GROUPS.length))
      expect(g.find(".sticky").element.style.background).toBe(bandFill(i, GROUPS.length))
    })
    sheet.unmount()
  })
})
