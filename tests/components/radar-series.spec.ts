// @rstest-environment jsdom
// `<Radar>` inside a `<RadarChart>` is the chart's series part, which
// registers its texture with the chart; the sweep background is
// `DitherRadar` and has a file of its own, so the two never collide again.
import { mount } from "@vue/test-utils"
import { defineComponent, h } from "vue"
import { describe, expect, it } from "rstack/test"
import { usePolarPart } from "../../dither-kit/engine/polar-context"
import { DitherRadar, Radar, RadarChart } from "../../dither-kit/tailwind"

// jsdom has no layout: a ResizeObserver that reports a 300x200 box lets the
// chart measure itself and render its parts.
class SizedObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe(target: Element) {
    this.cb([{ target, contentRect: { width: 300, height: 200 } } as ResizeObserverEntry], this as never)
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = SizedObserver as never

describe("Radar", () => {
  it("registers each series' texture with its chart", async () => {
    let seen: ((key: string) => unknown) | null = null
    const Probe = defineComponent({
      setup() {
        const ctx = usePolarPart("Probe", "radar")
        seen = ctx.variantOf
        return () => h("g")
      },
    })
    const w = mount(RadarChart, {
      props: {
        data: [{ axis: "a", now: 1 }],
        config: { now: { label: "Now", color: "blue" } },
        nameKey: "axis",
      },
      slots: { default: () => [h(Radar, { dataKey: "now", variant: "dotted" }), h(Probe)] },
    })
    await w.vm.$nextTick()
    expect(seen!("now")).toBe("dotted")
    // No background runtime is mounted inside the chart.
    expect(w.find("canvas.pointer-events-none.absolute.inset-0").exists()).toBe(false)
    w.unmount()
  })
  it("is not the sweep background", () => {
    expect(Radar).not.toBe(DitherRadar)
  })
})
