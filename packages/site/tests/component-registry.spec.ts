import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { createComponent } from "../src/entities/widget/model/factory"
import { COMPONENT_REGISTRY, componentEntry, defaultComponentProps } from "../src/entities/widget/model/registry"

describe("component registry", () => {
  it("every entry has a unique export name and sane frame", () => {
    const names = COMPONENT_REGISTRY.map((e) => e.is)
    expect(new Set(names).size).toBe(names.length)
    for (const e of COMPONENT_REGISTRY) {
      expect(e.is).toMatch(/^Dither[A-Z]/)
      expect(e.frame.w).toBeGreaterThan(0)
      expect(e.frame.h).toBeGreaterThan(0)
    }
  })
  it("covers every public Dither component exactly once", () => {
    // The kit's index, read as written: every component it exports by name.
    const index = readFileSync(new URL("../../../packages/dither-kit/src/solid/index.ts", import.meta.url), "utf8")
    const bespoke = new Set(["DitherAvatar", "DitherButton", "DitherGradient", "DitherImage"])
    const publicComponents = [...new Set([...index.matchAll(/default as (Dither[A-Z]\w*)/g)].map((m) => m[1]))]
      .filter((name) => !bespoke.has(name))
      .sort()
    expect(COMPONENT_REGISTRY.map((entry) => entry.is).sort()).toEqual(publicComponents)
  })
  it("defaults come straight from the specs", () => {
    const entry = componentEntry("DitherSlider")!
    const props = defaultComponentProps(entry)
    expect(props.min).toBe(0)
    expect(props.max).toBe(100)
    expect(props.color).toBe("blue")
  })
  it("createComponent seeds slot + v-model from the entry", () => {
    const sw = createComponent(componentEntry("DitherSwitch")!)
    expect(sw.model).toBe(true)
    expect(sw.slotText).toBeNull()
    const badge = createComponent(componentEntry("DitherBadge")!)
    expect(badge.slotText).toBe("beta")
    expect(badge.model).toBeUndefined()
  })
  it("mapProps turns string lists into option/item shapes", () => {
    const sel = componentEntry("DitherSelect")!
    const mapped = sel.mapProps!({ options: ["Aa", "Bb"] })
    expect(mapped.options).toEqual([
      { value: "aa", label: "Aa" },
      { value: "bb", label: "Bb" },
    ])
  })
  it("gives child-only exports a valid composed demo", () => {
    for (const name of [
      "DitherTabPanel",
      "DitherSidebarItem",
      "DitherSidebarGroup",
      "DitherSidebarSub",
      "DitherDrawerIndent",
    ]) {
      expect(componentEntry(name)?.demo).toBeTruthy()
    }
  })
})
