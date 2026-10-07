// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import PasswordInput from "../../dither-kit/PasswordInput.vue"
import SearchInput from "../../dither-kit/SearchInput.vue"
import PhoneInput from "../../dither-kit/PhoneInput.vue"
import CurrencyInput from "../../dither-kit/CurrencyInput.vue"
import ScrubInput from "../../dither-kit/ScrubInput.vue"
import HotkeyInput from "../../dither-kit/HotkeyInput.vue"
import CodeInput from "../../dither-kit/CodeInput.vue"
import InputGroup from "../../dither-kit/InputGroup.vue"
import InlineEdit from "../../dither-kit/InlineEdit.vue"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("PasswordInput", () => {
  it("flips the type through an accessible toggle and passes the model", async () => {
    const w = mount(PasswordInput, { props: { modelValue: "hunter2" } })
    const input = w.find("input")
    expect(input.attributes("type")).toBe("password")
    const btn = w.find('button[type="button"]')
    expect(btn.attributes("aria-label")).toBe("Show password")
    await btn.trigger("click")
    expect(input.attributes("type")).toBe("text")
    expect(btn.attributes("aria-pressed")).toBe("true")
    expect(btn.attributes("aria-label")).toBe("Hide password")
    await input.setValue("hunter3")
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["hunter3"])
  })
})

describe("SearchInput", () => {
  it("clears through the button and Escape, emitting the clear event", async () => {
    const w = mount(SearchInput, { props: { modelValue: "query" } })
    expect(w.find('button[aria-label="Clear search"]').exists()).toBe(true)
    await w.find('button[aria-label="Clear search"]').trigger("click")
    expect(w.emitted("update:modelValue")?.[0]).toEqual([""])
    expect(w.emitted("clear")).toHaveLength(1)

    const empty = mount(SearchInput, { props: { modelValue: "" } })
    expect(empty.find('button[aria-label="Clear search"]').exists()).toBe(false)
    await empty.find("input").trigger("keydown", { key: "Escape" })
    expect(empty.emitted("update:modelValue")?.[0]).toEqual([""])
  })
})

describe("PhoneInput", () => {
  it("normalizes to the NANP shape as you type", async () => {
    const w = mount(PhoneInput)
    const input = w.find("input")
    await input.setValue("4155552671")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["(415) 555-2671"])
    await input.setValue("41")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["(41"])
    await input.setValue("abc")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([""])
    expect(input.attributes("type")).toBe("tel")
    expect(input.attributes("inputmode")).toBe("tel")
  })
})

describe("CurrencyInput", () => {
  it("sanitizes input and groups the blurred display", async () => {
    const w = mount(CurrencyInput, { props: { modelValue: "1234567.5" } })
    const input = w.find("input")
    expect(input.element.value).toBe("1,234,567.5") // blurred: grouped
    await input.trigger("focus")
    expect(input.element.value).toBe("1234567.5") // focused: raw digits
    await input.setValue("1a2.3x")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["12.3"])
    await input.setValue("1.2.3")
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["1.23"])
    expect(w.find("span").text()).toBe("$") // prefix rendered
  })
})

describe("ScrubInput", () => {
  it("moves by step on arrow keys, clamped to min/max", async () => {
    const w = mount(ScrubInput, { props: { modelValue: 50, min: 0, max: 100, step: 1 } })
    const grip = w.find('[role="slider"]')
    expect(grip.attributes("aria-valuenow")).toBe("50")
    await grip.trigger("keydown", { key: "ArrowRight" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([51])
    await w.setProps({ modelValue: 50 })
    await grip.trigger("keydown", { key: "Home" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([0])
    await w.setProps({ modelValue: 0 })
    await grip.trigger("keydown", { key: "ArrowLeft" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([0]) // clamped at min
    await grip.trigger("keydown", { key: "End" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([100])
  })

  it("scrubs by pointer delta on the grip", async () => {
    const w = mount(ScrubInput, { props: { modelValue: 50, min: 0, max: 100, step: 1 } })
    const grip = w.find('[role="slider"]').element
    grip.dispatchEvent(new MouseEvent("pointerdown", { clientX: 100, button: 0, bubbles: true }))
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 110 }))
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([60]) // 10px * step 1
    window.dispatchEvent(new MouseEvent("pointerup", {}))
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 500 }))
    expect(w.emitted("update:modelValue")).toHaveLength(1) // released: no more moves
  })
})

describe("HotkeyInput", () => {
  it("captures a combo, ignores lone modifiers and repeats, Escape clears", async () => {
    const w = mount(HotkeyInput)
    const input = w.find("input")
    await input.trigger("keydown", { key: "Control" })
    await input.trigger("keydown", { key: "Shift" })
    expect(w.emitted("update:modelValue")).toBeUndefined() // modifiers hold
    await input.trigger("keydown", { key: "k", ctrlKey: true, shiftKey: true })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["Ctrl+Shift+K"])
    await input.trigger("keydown", { key: " ", metaKey: true })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["Meta+Space"])
    await input.trigger("keydown", { key: "Escape" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual([""])
  })
})

describe("CodeInput", () => {
  it("indents with Tab and submits on Ctrl+Enter", async () => {
    const w = mount(CodeInput, { props: { modelValue: "x" } })
    const ta = w.find("textarea")
    await ta.trigger("keydown", { key: "Tab" })
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["x  "])
    await ta.trigger("keydown", { key: "Enter", ctrlKey: true })
    expect(w.emitted("submit")).toHaveLength(1)
  })
})

describe("InputGroup", () => {
  it("renders prefix, default and suffix slots in one group", () => {
    const w = mount(InputGroup, {
      slots: { prefix: "https://", default: "<span>host</span>", suffix: "/docs" },
    })
    expect(w.text()).toBe("https://host/docs")
    expect(w.classes().some((c) => c.includes("border"))).toBe(true)
    expect(w.attributes("class")).toContain("focus-within")
  })
})

describe("InlineEdit", () => {
  it("edits on click, commits on Enter, reverts on Escape", async () => {
    const w = mount(InlineEdit, { props: { modelValue: "old" } })
    const view = w.find("button")
    expect(view.text()).toBe("old")
    await view.trigger("click")
    const input = w.find("input")
    expect(input.exists()).toBe(true)
    await input.setValue("new")
    await input.trigger("keydown", { key: "Enter" })
    expect(w.find("button").exists()).toBe(true) // back to view
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["new"])
    expect(w.emitted("save")?.at(-1)).toEqual(["new"])

    await w.find("button").trigger("click")
    const input2 = w.find("input")
    await input2.setValue("noise")
    await input2.trigger("keydown", { key: "Escape" })
    expect(w.find("button").exists()).toBe(true)
    expect(w.emitted("update:modelValue")).toHaveLength(1) // no commit on cancel
    expect(w.emitted("cancel")).toHaveLength(1)
  })

  it("does not emit when the value is unchanged", async () => {
    const w = mount(InlineEdit, { props: { modelValue: "same" } })
    await w.find("button").trigger("click")
    await w.find("input").trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")).toBeUndefined()
    expect(w.emitted("save")).toBeUndefined()
  })
})
