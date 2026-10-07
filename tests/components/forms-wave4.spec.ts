// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Calendar from "../../dither-kit/Calendar.vue"
import DatePicker from "../../dither-kit/DatePicker.vue"
import MonthPicker from "../../dither-kit/MonthPicker.vue"
import ColorSwatch from "../../dither-kit/ColorSwatch.vue"
import ColorPicker from "../../dither-kit/ColorPicker.vue"
import Knob from "../../dither-kit/Knob.vue"
import SignaturePad from "../../dither-kit/SignaturePad.vue"

describe("Calendar", () => {
  it("renders a Monday-first 6x7 grid with the value selected", () => {
    const w = mount(Calendar, { props: { modelValue: "2026-10-07" } })
    const cells = w.findAll('[role="gridcell"]')
    expect(cells).toHaveLength(42)
    const selected = cells.filter((c) => c.attributes("aria-selected") === "true")
    expect(selected).toHaveLength(1)
    expect(selected[0].text()).toBe("7")
    expect(w.find('[aria-label="October 2026"]').exists()).toBe(true) // grid label = month
  })

  it("moves months from the header and emits on day click", async () => {
    const w = mount(Calendar, { props: { modelValue: "2026-10-07" } })
    await w.find('button[aria-label="Previous month"]').trigger("click")
    expect(w.find('[aria-label="September 2026"]').exists()).toBe(true)
    await w.find('button[aria-label="Next month"]').trigger("click")
    await w.find('button[aria-label="Next month"]').trigger("click") // November
    expect(w.find('[aria-label="November 2026"]').exists()).toBe(true)

    const target = w.findAll('[role="gridcell"]').find((c) => c.text() === "15")!
    await target.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-11-15")
    expect(w.emitted("select")?.at(-1)?.[0]).toBe("2026-11-15")
  })

  it("steps days with arrows and respects min", async () => {
    const w = mount(Calendar, { props: { modelValue: "2026-10-07" } })
    const grid = w.find('[role="grid"]')
    await grid.trigger("keydown", { key: "ArrowRight" })
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-10-08")
    await grid.trigger("keydown", { key: "ArrowLeft" })
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-10-06")

    const bounded = mount(Calendar, { props: { modelValue: "2026-10-07", min: "2026-10-07" } })
    await bounded.find('[role="grid"]').trigger("keydown", { key: "ArrowLeft" })
    expect(bounded.emitted("update:modelValue")).toBeUndefined() // clamped at min
  })

  it("re-centers when the value moves to another month", async () => {
    const w = mount(Calendar, { props: { modelValue: "2026-10-07" } })
    await w.setProps({ modelValue: "2027-03-01" })
    expect(w.find('[aria-label="March 2027"]').exists()).toBe(true)
  })
})

describe("DatePicker", () => {
  it("opens the calendar, selects, and closes", async () => {
    const w = mount(DatePicker, { props: { modelValue: "2026-10-07" }, attachTo: document.body })
    const trigger = w.find('button[aria-haspopup="dialog"]')
    expect(trigger.attributes("aria-expanded")).toBe("false")
    expect(trigger.text()).toContain("Oct") // human format, not raw ISO
    await trigger.trigger("click")
    expect(trigger.attributes("aria-expanded")).toBe("true")
    expect(w.find('[role="dialog"]').exists()).toBe(true)

    const day = w.findAll('[role="gridcell"]').find((c) => c.text() === "20")!
    await day.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-10-20")
    expect(w.find('[role="dialog"]').exists()).toBe(false) // select closes
    w.unmount()
  })
})

describe("MonthPicker", () => {
  it("emits YYYY-MM on pick and shifts the year with PageUp", async () => {
    const w = mount(MonthPicker, { props: { modelValue: "2026-10" } })
    const months = w.findAll("button").filter((b) => b.text().length === 3)
    expect(months).toHaveLength(12)
    await months[0].trigger("click") // Jan
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2026-01")

    const group = w.find('[role="group"]')
    await group.trigger("keydown", { key: "PageUp" })
    expect(w.text()).toContain("2025") // year stepped back
    await group.trigger("keydown", { key: "ArrowLeft" }) // active=Jan -> wraps to Dec of stepped year
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("2025-12")
  })
})

describe("ColorSwatch", () => {
  it("names itself, reports selection, emits the color", async () => {
    const w = mount(ColorSwatch, { props: { color: "#7CFF67", label: "Mint", selected: true } })
    const btn = w.find("button")
    expect(btn.attributes("aria-label")).toBe("Select Mint")
    expect(btn.attributes("aria-pressed")).toBe("true")
    expect(btn.attributes("style")).toContain("rgb(124, 255, 103)") // jsdom normalizes #7CFF67
    await btn.trigger("click")
    expect(w.emitted("select")?.at(-1)).toEqual(["#7CFF67"])
  })
})

describe("ColorPicker", () => {
  it("accepts hex input and nudges the plane with arrows", async () => {
    const w = mount(ColorPicker, { props: { modelValue: "#5227ff" } })
    const hex = w.find("label input")
    await hex.setValue("#aabbcc")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("#aabbcc")

    const plane = w.find('[aria-label="Saturation and brightness"]')
    await plane.trigger("keydown", { key: "ArrowRight" })
    const nudged = w.emitted("update:modelValue")?.at(-1)?.[0] as string
    expect(nudged).toMatch(/^#[0-9a-f]{6}$/)
    expect(nudged).not.toBe("#5227ff") // saturation changed -> different hex

    const hue = w.find('[aria-label="Hue"]')
    expect(hue.attributes("aria-valuenow")).toBeTruthy()
    await hue.trigger("keydown", { key: "ArrowRight" })
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe("Knob", () => {
  it("steps with keys and scrubs by vertical drag", async () => {
    const w = mount(Knob, { props: { modelValue: 64, min: 0, max: 100, step: 1 } })
    const knob = w.find('[role="slider"]')
    expect(knob.attributes("aria-valuenow")).toBe("64")
    await knob.trigger("keydown", { key: "ArrowRight" })
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe(65)
    await knob.trigger("keydown", { key: "Home" })
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe(0)

    knob.element.dispatchEvent(new MouseEvent("pointerdown", { clientY: 100, button: 0, bubbles: true }))
    window.dispatchEvent(new MouseEvent("pointermove", { clientY: 84 })) // drag up 16px
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe(74) // 16 * (100/160)
    window.dispatchEvent(new MouseEvent("pointerup", {}))
    window.dispatchEvent(new MouseEvent("pointermove", { clientY: 0 }))
    expect(w.emitted("update:modelValue")).toHaveLength(3) // released: no drift
  })
})

describe("SignaturePad", () => {
  it("exposes the canvas and clears to an empty value", async () => {
    const w = mount(SignaturePad, { props: { height: 120 } })
    const canvas = w.find("canvas")
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes("aria-label")).toBe("Sign here")
    expect(canvas.attributes("height")).toBe("120")

    // jsdom has no 2D context: strokes must be refused, not thrown
    canvas.element.dispatchEvent(new MouseEvent("pointerdown", { button: 0, bubbles: true }))
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 10, clientY: 10 }))
    expect(w.emitted("update:modelValue")).toBeUndefined()
    window.dispatchEvent(new MouseEvent("pointerup", {}))

    const clear = w.findAll("button").find((b) => b.text().includes("Clear"))!
    await clear.trigger("click")
    expect(w.emitted("update:modelValue")?.at(-1)?.[0]).toBe("")
    expect(w.emitted("change")?.at(-1)?.[0]).toBe("")
  })
})
