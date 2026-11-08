// @rstest-environment jsdom
// A dithered button sizes its canvas from its ResizeObserver's report, never
// a layout read: a page's buttons starting together read each one's box
// after the last one's canvas write, a forced layout a button.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import DitherButton from "../dither-kit/tailwind/DitherButton.vue"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
  rs.restoreAllMocks()
})

describe("a dithered button", () => {
  it("takes its size from the observer's report, never reading layout", async () => {
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 1))
    rs.stubGlobal("cancelAnimationFrame", () => {})
    rs.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback(
            [{ borderBoxSize: [{ inlineSize: 120, blockSize: 40 }] } as unknown as ResizeObserverEntry],
            this as never,
          )
        }
        disconnect() {}
      },
    )
    HTMLCanvasElement.prototype.getContext = (() => ({
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
      clearRect() {},
      drawImage() {},
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const read = rs.spyOn(HTMLElement.prototype, "getBoundingClientRect")
    const w = mount(DitherButton, { props: { cell: 4 }, slots: { default: () => "Go" } })
    await nextTick()
    await nextTick()
    const canvas = w.find("canvas").element as HTMLCanvasElement
    expect([canvas.width, canvas.height]).toEqual([30, 10])
    expect(read).not.toHaveBeenCalled()
    w.unmount()
  })
})
