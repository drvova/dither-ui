// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import ListBox from "../../dither-kit/ListBox.vue"
import MultiSelect from "../../dither-kit/MultiSelect.vue"
import CascadeSelect from "../../dither-kit/CascadeSelect.vue"
import TransferList from "../../dither-kit/TransferList.vue"
import LanguageSelect from "../../dither-kit/LanguageSelect.vue"
import IconPicker from "../../dither-kit/IconPicker.vue"
import FontPicker from "../../dither-kit/FontPicker.vue"

describe("ListBox", () => {
  it("roves with arrows and commits on Enter", async () => {
    const w = mount(ListBox, {
      props: { options: ["Kyoto", "Seoul", "Taipei"], value: "" },
    })
    const box = w.find('[role="listbox"]')
    expect(box.attributes("tabindex")).toBe("0")
    expect(box.attributes("aria-activedescendant")).toBeUndefined()

    await box.trigger("keydown", { key: "ArrowDown" })
    expect(box.attributes("aria-activedescendant")).toContain("opt-0")
    await box.trigger("keydown", { key: "End" })
    expect(box.attributes("aria-activedescendant")).toContain("opt-2")
    await box.trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["Taipei"])
    expect(w.emitted("select")?.at(-1)).toEqual(["Taipei"])
    // roving follows the commit: the activedescendant stays on the picked row
    expect(box.attributes("aria-activedescendant")).toContain("opt-2")
  })

  it("marks the current value with aria-selected and selects on click", async () => {
    const w = mount(ListBox, {
      props: { options: ["a", "b"], value: "b" },
    })
    const opts = w.findAll('[role="option"]')
    expect(opts[0].attributes("aria-selected")).toBe("false")
    expect(opts[1].attributes("aria-selected")).toBe("true")
    await opts[0].trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["a"])
  })
})

describe("MultiSelect", () => {
  it("filters the pool and toggles/removes the set", async () => {
    const w = mount(MultiSelect, {
      props: { options: ["vue", "dither", "canvas"], value: ["vue"] },
    })
    expect(w.text()).toContain("vue") // chip row
    await w.find("input[type='search']").setValue("dith")
    expect(w.findAll("label")).toHaveLength(1) // only dither left
    await w.find("input[type='checkbox']").setValue(true)
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toEqual(["vue", "dither"])

    await w.find('button[aria-label="Remove vue"]').trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([])
  })
})

describe("CascadeSelect", () => {
  const TREE = [
    {
      value: "Japan",
      children: [
        { value: "Kansai", children: [{ value: "Kyoto" }, { value: "Osaka" }] },
        { value: "Kanto", children: [{ value: "Tokyo" }] },
      ],
    },
    { value: "Korea", children: [{ value: "Seoul Region", children: [{ value: "Seoul" }] }] },
  ]

  it("renders one level deeper than the path and truncates on parent change", async () => {
    const w = mount(CascadeSelect, {
      props: { tree: TREE, value: ["Japan", "Kansai"], placeholders: ["Country", "Region", "City"] },
    })
    expect(w.findAll("select")).toHaveLength(3) // Japan > Kansai > (Kyoto|Osaka)

    await w.findAll("select")[0].setValue("Korea")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toEqual(["Korea"]) // deeper dropped
    await w.setProps({ value: ["Korea"] })
    expect(w.findAll("select")).toHaveLength(2) // Korea > Seoul Region
  })
})

describe("TransferList", () => {
  it("moves selection both ways and flushes", async () => {
    const w = mount(TransferList, {
      props: { source: ["a", "b", "c"], value: [] },
    })
    const srcCheck = () => w.findAll("input[type='checkbox']")[0]
    await srcCheck().setValue(true)
    const addBtn = w.findAll("button").find((b) => b.text() === "Add →")!
    await addBtn.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([["a"]])

    await w.setProps({ value: ["a"] })
    const addAll = w.findAll("button").find((b) => b.text() === "Add all")!
    await addAll.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([["a", "b", "c"]])

    await w.setProps({ value: ["a", "b", "c"] })
    const removeAll = w.findAll("button").find((b) => b.text() === "Remove all")!
    await removeAll.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([[]])
  })
})

describe("LanguageSelect", () => {
  it("offers the language list and emits the tag", async () => {
    const w = mount(LanguageSelect, { props: { modelValue: "en" } })
    const select = w.find("select")
    expect(select.findAll("option").length).toBeGreaterThanOrEqual(35)
    expect(select.element.value).toBe("en")
    await select.setValue("de")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["de"])

    const withDefault = mount(LanguageSelect, { props: { includeDefault: true } })
    const first = withDefault.findAll("option")[0]
    expect(first.text()).toBe("System default")
    expect(first.attributes("value")).toBe("")
  })
})

describe("IconPicker", () => {
  it("filters by name and emits the picked glyph", async () => {
    const w = mount(IconPicker, { props: { modelValue: "Check" } })
    const total = w.findAll('input[type="radio"]').length
    expect(total).toBeGreaterThan(40) // the whole set ships

    await w.find('input[type="search"]').setValue("chev")
    const names = w.findAll('input[type="radio"]').map((r) => r.attributes("value"))
    expect(names.length).toBeLessThan(total)
    expect(names).toContain("ChevronDown")

    await w.find('input[type="search"]').setValue("")
    const pick = w
      .findAll('input[type="radio"]')
      .find((r) => r.attributes("value") === "ChevronUp")!
    await pick.setValue(true)
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["ChevronUp"])
    expect(w.find("svg").exists()).toBe(true) // glyph rendered
  })
})

describe("FontPicker", () => {
  it("previews each stack in its own family and emits the value", async () => {
    const w = mount(FontPicker, { props: { modelValue: "" } })
    const radios = w.findAll('input[type="radio"]')
    expect(radios.length).toBeGreaterThanOrEqual(10)
    const mono = radios.find((r) => (r.attributes("value") ?? "").includes("JetBrains Mono"))!
    await mono.setValue(true)
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toContain("JetBrains Mono")
    const labelSpan = w.findAll("span")[0] // the option's own name, styled with its stack
    expect(labelSpan.attributes("style")).toContain("font-family")
  })
})
