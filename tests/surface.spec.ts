// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { release, seek } from "../dither-kit/clock"
import { surfaceOf, useDitherBackground, type DitherSurface } from "../dither-kit/use-dither-background"

/** jsdom has no canvas: a 2D context that can take an upload. */
const fakeContext = {
  createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  putImageData() {},
}
const realGetContext = HTMLCanvasElement.prototype.getContext

function surfaceComponent(render: (clock: number) => void) {
  let handle: DitherSurface | null = null
  const Comp = defineComponent({
    setup() {
      const wrapRef = ref<HTMLElement | null>(null)
      const canvasRef = ref<HTMLCanvasElement | null>(null)
      handle = useDitherBackground({
        wrapRef,
        canvasRef,
        cell: 4,
        maxCols: 8,
        maxRows: 8,
        dpr: () => 1,
        paused: () => false,
        renderMode: () => "live",
        precompiled: () => undefined,
        restart: () => null,
        render: (buffer, clock) => {
          buffer.data.fill(Math.round(clock * 10))
          render(clock)
        },
      })
      return () => h("div", { ref: wrapRef }, [h("canvas", { ref: canvasRef })])
    },
  })
  return { Comp, handle: () => handle! }
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = (() => fakeContext) as unknown as typeof HTMLCanvasElement.prototype.getContext
  vi.stubGlobal("requestAnimationFrame", () => 1)
  vi.stubGlobal("cancelAnimationFrame", () => {})
})
afterEach(() => {
  release()
  HTMLCanvasElement.prototype.getContext = realGetContext
  vi.unstubAllGlobals()
})

describe("DitherSurface: the render graph's edge", () => {
  it("pull paints a directed moment once, whoever asks first, and registers by canvas", async () => {
    const painted: number[] = []
    const { Comp, handle } = surfaceComponent((c) => painted.push(c))
    const w = mount(Comp)
    await nextTick()
    const s = handle()
    expect(s.raster()).toBeNull()
    seek(1000)
    expect(painted).toEqual([1])
    expect(s.raster()?.data[0]).toBe(10)
    expect(s.version()).toBe(1)
    // The clock already painted 1s: a consumer's pull costs nothing.
    expect(s.pull(1000)).toBe(s.raster())
    expect(painted).toEqual([1])
    // A consumer ahead of the clock paints 2s now; the clock's own call then agrees.
    expect(s.pull(2000)?.data[0]).toBe(20)
    expect(painted).toEqual([1, 2])
    seek(2000)
    expect(painted).toEqual([1, 2])
    expect(s.version()).toBe(2)
    // Back in time still paints (a new moment), and the canvas finds its surface.
    seek(500)
    expect(painted).toEqual([1, 2, 0.5])
    expect(surfaceOf(w.find("canvas").element as HTMLCanvasElement)).toBe(s)
    expect(s.canvas()).toBe(w.find("canvas").element)
    expect(surfaceOf(document.createElement("canvas"))).toBeNull()
    w.unmount()
  })
  it("free-running, pull returns the latest raster without painting", async () => {
    const painted: number[] = []
    const { Comp, handle } = surfaceComponent((c) => painted.push(c))
    const w = mount(Comp)
    await nextTick()
    expect(handle().pull(null)).toBeNull()
    expect(handle().pull(3000)).toBeNull()
    expect(painted).toEqual([])
    w.unmount()
  })
})
