// @rstest-environment jsdom
// One moving layer at a time: while a full-screen sheet covers the page
// (`cover.ts`), the kit's loops under it hold their frame and wake as it
// lifts; a loop inside the sheet runs on. Measured before: on the landing at
// 4x CPU, opening the menu got 10 frames in 900ms (the worst 583ms) while
// the print and the bento painted on under the sheet.
import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { defineComponent, h, ref } from "vue"
import { coverPage, isCovered } from "../dither-kit/engine/cover"
import { useInviewLoop } from "../dither-kit/engine/use-inview-loop"
import { useCanvasVisibility } from "../dither-kit/engine/use-visibility"

// Without an observer the runtimes take their in-view path at once.
beforeEach(() => {
  rs.stubGlobal("IntersectionObserver", undefined)
})
afterEach(() => {
  coverPage(null)
  rs.unstubAllGlobals()
})

/** A component running a loop through the kit's in-view runtime, logging
 * its starts and stops, and reporting its canvas visibility. */
const Loop = (log: string[]) =>
  defineComponent({
    setup(_, { expose }) {
      const el = ref<HTMLElement | null>(null)
      useInviewLoop(
        el,
        () => log.push("start"),
        () => log.push("stop"),
      )
      const visible = useCanvasVisibility(el, () => log.push("wake"))
      expose({ visible })
      return () => h("div", { ref: el })
    },
  })

describe("the cover", () => {
  it("holds the loops under a sheet and wakes them as it lifts", () => {
    const page = document.createElement("main")
    const sheet = document.createElement("dialog")
    document.body.append(page, sheet)
    const log: string[] = []
    const under = mount(Loop(log), { attachTo: page })
    expect(log).toEqual(["start"])
    expect((under.vm as unknown as { visible: () => boolean }).visible()).toBe(true)

    coverPage(sheet)
    expect(isCovered(under.element)).toBe(true)
    expect(log.at(-1)).toBe("stop")
    expect((under.vm as unknown as { visible: () => boolean }).visible()).toBe(false)

    coverPage(null)
    expect(isCovered(under.element)).toBe(false)
    expect(log.slice(-2).sort()).toEqual(["start", "wake"])
    expect((under.vm as unknown as { visible: () => boolean }).visible()).toBe(true)
    under.unmount()
    page.remove()
    sheet.remove()
  })

  it("lets a loop inside the sheet run on", () => {
    const sheet = document.createElement("dialog")
    document.body.append(sheet)
    const log: string[] = []
    const inside = mount(Loop(log), { attachTo: sheet })
    coverPage(sheet)
    expect(isCovered(inside.element)).toBe(false)
    expect(log).toEqual(["start", "start"])
    inside.unmount()
    sheet.remove()
  })
})
