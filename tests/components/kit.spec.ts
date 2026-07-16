// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { describe, expect, it, vi } from "vitest"
import DitherBadge from "../../dither-kit/DitherBadge.vue"
import DitherButton from "../../dither-kit/DitherButton.vue"
import DitherDialog from "../../dither-kit/DitherDialog.vue"
import DitherField from "../../dither-kit/DitherField.vue"
import DitherInput from "../../dither-kit/DitherInput.vue"
import DitherSelect from "../../dither-kit/DitherSelect.vue"
import DitherTextarea from "../../dither-kit/DitherTextarea.vue"
import DitherCheckbox from "../../dither-kit/DitherCheckbox.vue"
import DitherSwitch from "../../dither-kit/DitherSwitch.vue"
import DitherTabs from "../../dither-kit/DitherTabs.vue"
import { dismiss, toast, toasts } from "../../dither-kit/toast"

describe("DitherButton", () => {
  it("renders slot content in a native button", () => {
    const w = mount(DitherButton, { slots: { default: "Deploy" } })
    expect(w.find("button").exists()).toBe(true)
    expect(w.text()).toContain("Deploy")
  })
  it("preserves native type and exposes loading state", () => {
    const w = mount(DitherButton, { props: { type: "submit", loading: true }, slots: { default: "Save" } })
    expect(w.get("button").attributes()).toMatchObject({ type: "submit", disabled: "", "aria-busy": "true" })
  })
})

describe("DitherSwitch", () => {
  it("toggles via update:modelValue", async () => {
    const w = mount(DitherSwitch, { props: { modelValue: false } })
    await w.find("button").trigger("click")
    expect(w.emitted("update:modelValue")?.[0]).toEqual([true])
  })
  it("does not emit when disabled", async () => {
    const w = mount(DitherSwitch, { props: { modelValue: false, disabled: true } })
    await w.find("button").trigger("click")
    expect(w.emitted("update:modelValue")).toBeUndefined()
  })
})

describe("DitherCheckbox", () => {
  it("toggles via update:modelValue", async () => {
    const w = mount(DitherCheckbox, { props: { modelValue: true } })
    await w.find("button").trigger("click")
    expect(w.emitted("update:modelValue")?.[0]).toEqual([false])
  })
})

describe("field controls", () => {
  it("connects generated label, description, and invalid state", () => {
    const w = mount(DitherField, {
      props: { label: "Website", error: "Required" },
      slots: { default: DitherInput },
    })
    const input = w.get("input")
    expect(w.get("label").attributes("for")).toBe(input.attributes("id"))
    expect(input.attributes("aria-describedby")).toBe(w.get('[role="alert"]').attributes("id"))
    expect(input.attributes("aria-invalid")).toBe("true")
  })
  it("forwards textarea attributes and emits input", async () => {
    const w = mount(DitherTextarea, { props: { modelValue: "", name: "bio", rows: 5 } })
    await w.get("textarea").setValue("Hello")
    expect(w.get("textarea").attributes()).toMatchObject({ name: "bio", rows: "5" })
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["Hello"])
  })
  it("generates unique field relationships", () => {
    const w = mount({ components: { DitherField, DitherInput }, template: '<div><DitherField label="One"><DitherInput /></DitherField><DitherField label="Two"><DitherInput /></DitherField></div>' })
    const ids = w.findAll("input").map((input) => input.attributes("id"))
    expect(new Set(ids).size).toBe(2)
  })
})

describe("DitherSelect", () => {
  it("links its listbox and skips disabled options with keyboard", async () => {
    const w = mount(DitherSelect, { props: { modelValue: "", options: [{ value: "a", label: "A", disabled: true }, { value: "b", label: "B" }] } })
    const trigger = w.get("button")
    await trigger.trigger("keydown", { key: "ArrowDown" })
    expect(trigger.attributes("aria-controls")).toBe(w.get('[role="listbox"]').attributes("id"))
    await trigger.trigger("keydown", { key: "Enter" })
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["b"])
  })
})

describe("DitherDialog", () => {
  it("labels, traps, closes, and restores focus", async () => {
    const opener = document.createElement("button"); document.body.append(opener); opener.focus()
    const w = mount(DitherDialog, { attachTo: document.body, props: { open: false, title: "Settings", description: "Project options" }, slots: { default: '<button id="last">Apply</button>' } })
    opener.focus()
    await w.setProps({ open: true }); await nextTick()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.getAttribute("aria-labelledby")).toBe(dialog.querySelector("h2")?.id)
    const close = dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]')!; expect(document.activeElement).toBe(close)
    dialog.querySelector<HTMLButtonElement>("#last")!.focus(); dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(close)
    close.click(); expect(w.emitted("close")).toHaveLength(1)
    await w.setProps({ open: false }); await nextTick(); expect(document.activeElement).toBe(opener)
    w.unmount(); opener.remove()
  })
})

describe("DitherTabs", () => {
  it("renders every tab and emits the clicked one", async () => {
    const w = mount(DitherTabs, {
      props: { tabs: ["One", "Two", "Three"], modelValue: "One" },
    })
    const buttons = w.findAll("button")
    expect(buttons.length).toBeGreaterThanOrEqual(3)
    await buttons[1].trigger("click")
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["Two"])
  })
})

describe("DitherBadge", () => {
  it("renders slot content", () => {
    const w = mount(DitherBadge, { slots: { default: "beta" } })
    expect(w.text()).toContain("beta")
  })
})

describe("toast store", () => {
  it("push + manual dismiss", () => {
    toasts.splice(0)
    toast("saved")
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe("saved")
    dismiss(toasts[0].id)
    expect(toasts).toHaveLength(0)
  })
  it("auto-dismisses after its duration", () => {
    vi.useFakeTimers()
    toasts.splice(0)
    toast("bye", { duration: 1000 })
    expect(toasts).toHaveLength(1)
    vi.advanceTimersByTime(1100)
    expect(toasts).toHaveLength(0)
    vi.useRealTimers()
  })
})
