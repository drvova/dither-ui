// @rstest-environment jsdom
// Nothing reads layout while the landing mounts: each read forced a layout
// of the whole page in the middle of mounting it (the pointer trail's
// `scrollY`, the bento's boxes), and a counter built a number formatter a
// frame.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { formatFixed } from "../dither-kit/engine/format-number"
import HeatTrail from "../dither-kit/tailwind/HeatTrail.vue"
import { DitherReveal } from "@dither-kit"
import BrandBuild from "../src/pages/landing/BrandBuild.vue"
import BrandGather from "../src/pages/landing/BrandGather.vue"
import Examples from "../src/pages/landing/Examples.vue"
import { STAGGER } from "../src/pages/landing/hub"

afterEach(() => {
  rs.unstubAllGlobals()
  rs.restoreAllMocks()
})

describe("a number with its decimals fixed", () => {
  it("reads as toLocaleString reads it, from one formatter a precision", () => {
    for (const [v, d] of [
      [1234567.891, 2],
      [0.5, 0],
      [42, 1],
      [-9876.5, 3],
    ] as const)
      expect(formatFixed(v, d)).toBe(
        v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }),
      )
    const made = rs.spyOn(Intl, "NumberFormat")
    for (let i = 0; i < 50; i++) formatFixed(i * 1.5, 2)
    expect(made).not.toHaveBeenCalled()
  })
})

describe("mounting reads no layout", () => {
  it("the pointer trail takes its scroll baseline from the first scroll, not at mount", async () => {
    let reads = 0
    const real = Object.getOwnPropertyDescriptor(window, "scrollY")
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => (reads++, 0) })
    const w = mount(HeatTrail, { props: { pinned: true } })
    await nextTick()
    expect(reads).toBe(0)
    w.unmount()
    if (real) Object.defineProperty(window, "scrollY", real)
  })

  it("the brand's lockup reads its field as it builds, not as it mounts", async () => {
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
    rs.stubGlobal("matchMedia", () => ({ matches: false }))
    let reads = 0
    const real = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetParent")!
    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      configurable: true,
      get() {
        reads++
        return real.get?.call(this)
      },
    })
    Element.prototype.animate ??= (() => ({})) as never
    const w = mount(BrandGather, { props: { scene: () => ({}) as never } })
    await nextTick()
    expect(reads).toBe(0)
    w.unmount()
    Object.defineProperty(HTMLElement.prototype, "offsetParent", real)
  })

  it("the build's stage takes its first reading in the frame, not as it mounts", async () => {
    const frames: FrameRequestCallback[] = []
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb))
    rs.stubGlobal("cancelAnimationFrame", () => {})
    const boxes = rs.spyOn(HTMLElement.prototype, "getBoundingClientRect")
    const w = mount(BrandBuild)
    await nextTick()
    expect(boxes).not.toHaveBeenCalled()
    // the frame takes it
    for (const cb of frames.splice(0)) cb(0)
    expect(boxes).toHaveBeenCalled()
    w.unmount()
  })

  it("the bento staggers its cards from an observer's report, never reading a box", async () => {
    const reported: Element[] = []
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(el: Element) {
          reported.push(el)
          this.callback(
            [
              {
                target: el,
                isIntersecting: false,
                // the bento wide; each card its own column in one row
                boundingClientRect: el.parentElement?.classList.contains("bento")
                  ? new DOMRect([...el.parentElement.children].indexOf(el) * 100, 0, 90, 90)
                  : new DOMRect(0, 0, 100_000, 400),
              } as never,
            ],
            this as never,
          )
        }
        unobserve() {}
        disconnect() {}
      },
    )
    const boxes = rs.spyOn(HTMLElement.prototype, "getBoundingClientRect")
    const w = mount(Examples, { attachTo: document.body })
    await nextTick()
    expect(boxes).not.toHaveBeenCalled()
    expect(reported.length).toBeGreaterThan(1)
    // every card reported one by one: each still gets its delay, by column
    const delays = w.findAllComponents(DitherReveal).map((r) => r.props("delay") as number)
    expect(delays.length).toBeGreaterThan(2)
    expect(delays.slice(0, 3)).toEqual([0, STAGGER, 2 * STAGGER])
    w.unmount()
  })
})
