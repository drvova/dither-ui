// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import TagInput from "../../dither-kit/TagInput.vue"
import ChoiceChips from "../../dither-kit/ChoiceChips.vue"
import CheckboxCard from "../../dither-kit/CheckboxCard.vue"
import KeyValueInput from "../../dither-kit/KeyValueInput.vue"
import MentionInput from "../../dither-kit/MentionInput.vue"
import FileInput from "../../dither-kit/FileInput.vue"

describe("TagInput", () => {
  it("commits on Enter and comma, dedupes, backspace pulls the last chip", async () => {
    const w = mount(TagInput, { props: { modelValue: ["vue"] } })
    const input = w.find("input")
    await input.setValue("dither")
    await input.trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([["vue", "dither"]])

    await input.setValue("VUE")
    await input.trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")).toHaveLength(1) // case-deduped, no emit

    await input.setValue("")
    await input.trigger("keydown", { key: "Backspace" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([[]]) // last chip pulled

    const w2 = mount(TagInput, { props: { modelValue: ["a"], max: 1 } })
    await w2.find("input").setValue("b")
    await w2.find("input").trigger("keydown", { key: "Enter" })
    expect(w2.emitted("update:modelValue")).toBeUndefined() // max cap

    await w2.find('button[aria-label="Remove a"]').trigger("click")
    expect(w2.emitted("update:modelValue")?.at(-1)).toEqual([[]])
  })
})

describe("ChoiceChips", () => {
  it("single select emits the string through native radios", async () => {
    const w = mount(ChoiceChips, {
      props: { options: ["S", "M", "L"], value: "M" },
    })
    const inputs = w.findAll("input")
    expect(inputs).toHaveLength(3)
    expect(inputs[1].element.checked).toBe(true)
    await inputs[2].setValue(true) // user checks L -> radio change
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["L"])
    expect(inputs[1].attributes("type")).toBe("radio")
  })

  it("multiple emits an array and toggles membership", async () => {
    const w = mount(ChoiceChips, {
      props: { options: ["bug", "feat"], value: ["bug"], multiple: true },
    })
    expect(w.findAll("input")[0].element.checked).toBe(true)
    await w.findAll("input")[1].setValue(true)
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([["bug", "feat"]])
    await w.setProps({ value: ["bug", "feat"] }) // parent applied the emit
    await w.findAll("input")[0].setValue(false)
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([["feat"]])
  })
})

describe("CheckboxCard", () => {
  it("toggles through the card click and shows label + description", async () => {
    const w = mount(CheckboxCard, {
      props: { modelValue: false, label: "Telemetry", description: "Stats" },
    })
    expect(w.text()).toContain("Telemetry")
    expect(w.text()).toContain("Stats")
    await w.find("label").trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([true])
  })
})

describe("KeyValueInput", () => {
  it("edits rows, adds and removes", async () => {
    const rows = [
      { key: "Accept", value: "*/*" },
      { key: "X-Id", value: "1" },
    ]
    const w = mount(KeyValueInput, { props: { modelValue: rows } })
    const keyInputs = w.findAll("input")
    expect(keyInputs).toHaveLength(4) // 2 keys + 2 values
    await keyInputs[0].setValue("Content-Type")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]?.[0]).toEqual({
      key: "Content-Type",
      value: "*/*",
    })
    await w
      .findAll("button")
      .find((b) => b.attributes("aria-label") === "Remove row 2")!
      .trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toHaveLength(1)
    const addBtn = w.findAll("button").find((b) => b.text().includes("Add row"))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toHaveLength(3) // clone + new empty row
  })
})

describe("MentionInput", () => {
  it("opens on @word, filters, and inserts on Enter", async () => {
    const w = mount(MentionInput, {
      props: { modelValue: "hey @da", options: ["dana", "darius", "sam"] },
      attachTo: document.body,
    })
    const ta = w.find("textarea")
    ta.element.setSelectionRange(7, 7)
    await ta.trigger("keyup", { key: "a" })
    expect(w.find('[role="listbox"]').exists()).toBe(true)
    expect(w.findAll('[role="option"]')).toHaveLength(2) // dana, darius

    await ta.trigger("keydown", { key: "ArrowDown" })
    await ta.trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["hey @darius "])
    expect(w.emitted("mention")?.at(-1)).toEqual(["darius"])
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    w.unmount()
  })

  it("closes on Escape without changing the value", async () => {
    const w = mount(MentionInput, {
      props: { modelValue: "@da", options: ["dana"] },
      attachTo: document.body,
    })
    const ta = w.find("textarea")
    ta.element.setSelectionRange(3, 3)
    await ta.trigger("keyup", { key: "a" })
    expect(w.find('[role="listbox"]').exists()).toBe(true)
    await ta.trigger("keydown", { key: "Escape" })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.emitted("update:modelValue")).toBeUndefined()
    w.unmount()
  })
})

describe("FileInput", () => {
  it("lists picked files with sizes and removes them", async () => {
    const w = mount(FileInput, { props: { modelValue: [] } })
    const input = w.find('input[type="file"]')
    expect(input.exists()).toBe(true)

    const file = new File(["x".repeat(1500)], "notes.txt", { type: "text/plain" })
    Object.defineProperty(input.element, "files", { value: [file], configurable: true })
    await input.trigger("change")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toHaveLength(1)
    expect(w.emitted("change")).toHaveLength(1)

    // second render WITH the file present (parent applied the model)
    await w.setProps({ modelValue: [file] })
    expect(w.text()).toContain("notes.txt")
    expect(w.text()).toContain("1.5 KB") // FileSizeText through the list
    await w.find('button[aria-label="Remove notes.txt"]').trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([[]])
    await w.setProps({ modelValue: [file] })
    const clearAll = w.findAll("button").find((b) => b.text().includes("Clear all"))
    expect(clearAll).toBeDefined()
    await clearAll!.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([[]])
  })
})
