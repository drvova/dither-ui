// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import Sparkline from "../dither-kit/tailwind/Sparkline.vue"
import { AreaChart } from "../dither-kit/tailwind/area-chart"

// A sparkline scrubs only when asked: interactive, the pointer reports the
// point under it and leaving reports null; by default it reports nothing.
describe("Sparkline scrub", () => {
  const data = [1, 3, 2, 5, 4]
  const hover = async (interactive: boolean) => {
    const w = mount(Sparkline, { props: { data, color: "blue", interactive }, attachTo: document.body })
    await nextTick()
    const root = w.element as HTMLElement
    root.dispatchEvent(new PointerEvent("pointerenter"))
    root.dispatchEvent(new PointerEvent("pointermove", { clientX: 0 }))
    root.dispatchEvent(new PointerEvent("pointerleave"))
    const events = w.emitted("hoverChange") ?? []
    w.unmount()
    return events.map((e) => e[0])
  }

  it("reports the point under the pointer, then null on leave", async () => {
    const seen = await hover(true)
    expect(seen.length).toBe(2)
    expect(typeof seen[0]).toBe("number")
    expect(seen[1]).toBeNull()
  })

  it("stays still by default", async () => {
    // Leaving reports null whatever the mode; no point is ever reported.
    expect((await hover(false)).filter((i) => i !== null)).toEqual([])
  })

  it("hands its sparkle and hover-lift switches to the chart", () => {
    const w = mount(Sparkline, { props: { data, color: "blue", sparkles: false, hoverLift: false } })
    const chart = w.findComponent(AreaChart)
    expect(chart.props("sparkles")).toBe(false)
    expect(chart.props("hoverLift")).toBe(false)
    w.unmount()
  })

  it("is a slider for the keyboard when interactive: arrows step, Home and End jump, Escape clears", async () => {
    const w = mount(Sparkline, { props: { data, color: "blue", interactive: true, label: "Revenue" } })
    const root = w.element as HTMLElement
    expect(root.getAttribute("role")).toBe("slider")
    expect(root.getAttribute("tabindex")).toBe("0")
    expect(root.getAttribute("aria-label")).toBe("Revenue")
    expect(root.className).toContain("focus-visible:ring-ring")
    const key = async (k: string) => {
      root.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))
      await nextTick()
    }
    await key("ArrowLeft")
    await key("ArrowLeft")
    await key("Home")
    await key("End")
    await key("Escape")
    expect((w.emitted("hoverChange") ?? []).map((e) => e[0])).toEqual([3, 2, 0, 4, null])
    expect(root.getAttribute("aria-valuenow")).toBe("4")
    w.unmount()
  })

  it("takes no focus and no role when still", () => {
    const w = mount(Sparkline, { props: { data, color: "blue" } })
    expect(w.element.getAttribute("role")).toBeNull()
    expect(w.element.getAttribute("tabindex")).toBeNull()
    w.unmount()
  })
})
