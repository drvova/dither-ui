// @rstest-environment jsdom
// The Studio's tour: where the mascot hovers by each part (inside a tall
// one, under a thin one, whole in the window), that automation never gets
// it on its own, and its keys: Next flies on and opens each part, Done,
// Skip and Escape end it.
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, describe, expect, it } from "rstack/test"
import { firstVisitTour, type GuideStop, placeGuide } from "@/pages/studio/guide"
import StudioGuide from "@/pages/studio/ui/StudioGuide.vue"

const VIEW = { width: 1440, height: 900 }
const GUIDE = { width: 320, height: 120 }

describe("where the guide hovers", () => {
  it("inside a tall part, near its top left", () => {
    expect(placeGuide({ left: 600, top: 48, right: 1100, bottom: 892 }, GUIDE, VIEW)).toEqual({ x: 616, y: 96 })
  })
  it("under a thin part, at its right end for a key on the right", () => {
    expect(placeGuide({ left: 1380, top: 8, right: 1408, bottom: 36 }, GUIDE, VIEW, true)).toEqual({ x: 1088, y: 48 })
  })
  it("over a thin part at the window's foot, where there is no room under it", () => {
    expect(placeGuide({ left: 700, top: 840, right: 1300, bottom: 884 }, GUIDE, VIEW)).toEqual({ x: 716, y: 708 })
  })
  it("always whole in the window", () => {
    const p = placeGuide({ left: 1400, top: 860, right: 1440, bottom: 880 }, GUIDE, VIEW)
    expect(p.x + GUIDE.width).toBeLessThanOrEqual(VIEW.width - 8)
    expect(p.y + GUIDE.height).toBeLessThanOrEqual(VIEW.height - 8)
    expect(placeGuide({ left: -50, top: -50, right: 10, bottom: 600 }, GUIDE, VIEW)).toEqual({ x: 8, y: 8 })
  })
})

describe("the first visit", () => {
  afterEach(() => Reflect.deleteProperty(navigator, "webdriver"))
  it("tours once, and never under automation", () => {
    expect(firstVisitTour(null)).toBe(true)
    expect(firstVisitTour(true)).toBe(false)
    Object.defineProperty(navigator, "webdriver", { value: true, configurable: true })
    expect(firstVisitTour(null)).toBe(false)
  })
})

describe("the tour", () => {
  const parts = [document.createElement("div"), document.createElement("div")]
  const opened: number[] = []
  const stops: GuideStop[] = [
    { target: () => parts[0], line: "First part." },
    { target: () => parts[1], line: "Second part.", show: () => opened.push(1) },
  ]

  it("says each part's line, opens the next part and ends on Done", async () => {
    const w = mount(StudioGuide, { props: { open: true, stops }, attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(w.get('[role="dialog"]').attributes("aria-label")).toBe("Studio tour")
    expect(w.text()).toContain("First part.")
    expect(w.text()).toContain("1 of 2")
    await w.get(".next").trigger("click")
    await nextTick()
    expect(opened).toEqual([1])
    expect(w.text()).toContain("Second part.")
    expect(w.get(".next").text()).toBe("Done")
    expect(w.find(".skip").exists()).toBe(false)
    await w.get(".next").trigger("click")
    expect(w.emitted("close")).toHaveLength(1)
    w.unmount()
  })

  it("ends on Skip and on Escape", async () => {
    const w = mount(StudioGuide, { props: { open: true, stops }, attachTo: document.body })
    await nextTick()
    await w.get(".skip").trigger("click")
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(w.emitted("close")).toHaveLength(2)
    w.unmount()
  })
})
