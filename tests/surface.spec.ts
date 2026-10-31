// @rstest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { release, seek } from "../dither-kit/engine/clock"
import { surfaceOf, useDitherBackground, type DitherSurface } from "../dither-kit/engine/use-dither-background"

/** jsdom has no canvas: a 2D context that can take an upload. */
const fakeContext = {
  createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  putImageData() {},
}
const realGetContext = HTMLCanvasElement.prototype.getContext

function surfaceComponent(render: (clock: number) => void, paused = () => false) {
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
        paused,
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
  HTMLCanvasElement.prototype.getContext = (() =>
    fakeContext) as unknown as typeof HTMLCanvasElement.prototype.getContext
  rs.stubGlobal("requestAnimationFrame", () => 1)
  rs.stubGlobal("cancelAnimationFrame", () => {})
})
afterEach(() => {
  release()
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
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

describe("a paused surface", () => {
  it("out of view at first paints its first frame as it comes into view, then holds", async () => {
    let show = () => {}
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          show = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        observe() {}
        disconnect() {}
      },
    )
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    const run = (now: number) => {
      const due = [...frames.values()]
      frames.clear()
      for (const cb of due) cb(now)
    }
    const painted: number[] = []
    const paused = ref(false)
    const { Comp } = surfaceComponent(
      (c) => painted.push(c),
      () => paused.value,
    )
    const w = mount(Comp)
    await nextTick()
    run(100)
    expect(painted).toEqual([])
    // Into view, then paused before the frame it asked for: that frame paints.
    show()
    paused.value = true
    await nextTick()
    run(200)
    expect(painted).toHaveLength(1)
    show()
    run(300)
    expect(painted).toHaveLength(1)
    expect(frames.size).toBe(0)
    w.unmount()
  })
})
