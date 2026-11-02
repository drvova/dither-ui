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
})
