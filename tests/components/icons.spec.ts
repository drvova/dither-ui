// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Icon from "../../dither-kit/Icon.vue"
import IconSet from "../../dither-kit/IconSet.vue"
import { ICONS, ICON_NAMES } from "../../dither-kit/icons"

describe("icon set data", () => {
  it("every glyph is a non-empty list of path strings", () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(50)
    for (const name of ICON_NAMES) {
      const glyph = ICONS[name]
      expect(glyph.length, name).toBeGreaterThan(0)
      for (const d of glyph) expect(d, name).toMatch(/^[Mm]/)
    }
  })
})

describe("Icon", () => {
  it("renders one path per glyph entry at the requested size", () => {
    const w = mount(Icon, { props: { name: "Close", size: 24 } })
    expect(w.findAll("path").length).toBe(ICONS.Close.length)
    expect(w.attributes("width")).toBe("24")
    expect(w.attributes("viewBox")).toBe("0 0 24 24")
    expect(w.attributes("stroke")).toBe("currentColor")
  })

  it("is decorative by default and labeled when given a name", () => {
    const deco = mount(Icon, { props: { name: "Star" } })
    expect(deco.attributes("aria-hidden")).toBe("true")
    const named = mount(Icon, { props: { name: "Star", label: "Favorite" } })
    expect(named.attributes("role")).toBe("img")
    expect(named.attributes("aria-label")).toBe("Favorite")
  })

  it("throws loudly on an unknown name", () => {
    expect(() => mount(Icon, { props: { name: "Nope" as never } })).toThrow(/unknown icon/)
  })

  it("mounts every glyph in the set without error", () => {
    for (const name of ICON_NAMES) {
      const w = mount(Icon, { props: { name } })
      expect(w.findAll("path").length, name).toBeGreaterThan(0)
      w.unmount()
    }
  })
})

describe("IconSet", () => {
  it("stamps one symbol per glyph with the di-icon id prefix", () => {
    const w = mount(IconSet)
    const symbols = w.findAll("symbol")
    expect(symbols.length).toBe(ICON_NAMES.length)
    expect(symbols[0].attributes("id")).toMatch(/^di-icon-/)
    const star = w.find("#di-icon-Star")
    expect(star.exists()).toBe(true)
    expect(star.findAll("path").length).toBe(ICONS.Star.length)
    expect(star.findAll("path")[0].attributes("stroke")).toBe("currentColor")
  })

  it("renders hidden and away from the accessibility tree", () => {
    const w = mount(IconSet)
    expect(w.attributes("aria-hidden")).toBe("true")
    expect(w.attributes("style")).toContain("display: none")
  })
})
