// @rstest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, describe, expect, it, rs } from "rstack/test"
import DitherButton from "../../dither-kit/DitherButton.vue"
import DitherGradient from "../../dither-kit/DitherGradient.vue"
import DitherImage from "../../dither-kit/DitherImage.vue"
import DitherSpinner from "../../dither-kit/DitherSpinner.vue"

function mockCanvasRuntime() {
  const ctx = {
    clearRect: rs.fn(),
    drawImage: rs.fn(),
    fillRect: rs.fn(),
    putImageData: rs.fn(),
    createImageData: rs.fn((width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    })),
  }
  const getContext = rs
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  return { getContext }
}

class MockResizeObserver {
  static observed = 0
  observe = rs.fn(() => {
    MockResizeObserver.observed += 1
  })
  disconnect = rs.fn()
}

afterEach(() => {
  rs.useRealTimers()
  rs.unstubAllGlobals()
  rs.restoreAllMocks()
  MockResizeObserver.observed = 0
})

describe("precompiled runtime transitions", () => {
  it("starts button runtime after switching from packaged image", async () => {
    const { getContext } = mockCanvasRuntime()
    const w = mount(DitherButton, {
      props: { precompiled: "/assets/button.webp" },
      slots: { default: "Deploy" },
    })

    expect(w.find("img").exists()).toBe(true)
    await w.setProps({ precompiled: undefined })
    await nextTick()
    await nextTick()

    expect(w.find("canvas").exists()).toBe(true)
    // DitherButton defers init to requestAnimationFrame to avoid forced
    // reflow; flush it so getContext is called in jsdom.
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    expect(getContext).toHaveBeenCalled()
    w.unmount()
  })

  it("starts gradient runtime after switching from packaged image", async () => {
    rs.useFakeTimers()
    const { getContext } = mockCanvasRuntime()
    rs.stubGlobal("ResizeObserver", MockResizeObserver)
    const w = mount(DitherGradient, { props: { precompiled: "/assets/gradient.webp" } })

    await w.setProps({ precompiled: undefined })
    await nextTick()
    await nextTick()
    rs.runOnlyPendingTimers()

    expect(w.find("canvas").exists()).toBe(true)
    expect(getContext).toHaveBeenCalled()
    expect(MockResizeObserver.observed).toBeGreaterThan(0)
    w.unmount()
  })

  it("starts image observer after switching from packaged image", async () => {
    rs.stubGlobal("ResizeObserver", MockResizeObserver)
    const w = mount(DitherImage, {
      props: { src: "/sprites.webp", precompiled: "/assets/image.webp" },
    })

    await w.setProps({ precompiled: undefined })
    await nextTick()
    await nextTick()

    expect(w.find("canvas").exists()).toBe(true)
    expect(MockResizeObserver.observed).toBeGreaterThan(0)
    w.unmount()
  })

  it("starts spinner runtime after switching from packaged image", async () => {
    const { getContext } = mockCanvasRuntime()
    const w = mount(DitherSpinner, { props: { precompiled: "/assets/spinner.webp" } })

    await w.setProps({ precompiled: undefined })
    await nextTick()
    await nextTick()

    expect(w.find("canvas").exists()).toBe(true)
    expect(getContext).toHaveBeenCalled()
    w.unmount()
  })
})
