// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import DitherBadge from "../../dither-kit/DitherBadge.vue"
import DitherButton from "../../dither-kit/DitherButton.vue"
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
