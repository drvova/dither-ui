// @rstest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { release, seek } from "../src/engine/clock"
import { createSurfaceLoop, surfaceOf, type SurfaceLoop } from "../src/engine/surface-loop"

/** What a binding waits for before it reads a changed prop. */
const nextTick = () => Promise.resolve()

/** jsdom has no canvas: a 2D context that can take an upload. */
const fakeContext = {
  createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  putImageData() {},
}
const realGetContext = HTMLCanvasElement.prototype.getContext

/** A surface as a binding drives it (`solid/runtime/surface.ts`): the loop
 * mounted on its elements, restarted and paused by hand. */
function surfaceOn(render: (clock: number) => void, paused = () => false) {
  const wrap = document.createElement("div")
  const canvas = wrap.appendChild(document.createElement("canvas"))
  const loop: SurfaceLoop = createSurfaceLoop({
    wrap: () => wrap,
    canvas: () => canvas,
    cell: 4,
    maxCols: 8,
    maxRows: 8,
    dpr: () => 1,
    paused,
    renderMode: () => "live",
    precompiled: () => undefined,
    render: (buffer, clock) => {
      buffer.data.fill(Math.round(clock * 10))
      render(clock)
    },
  })
  loop.mount()
  return { loop, canvas, handle: () => loop.surface, unmount: () => loop.dispose() }
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
    const w = surfaceOn((c) => painted.push(c))
    await nextTick()
    const s = w.handle()
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
    expect(surfaceOf(w.canvas)).toBe(s)
    expect(s.canvas()).toBe(w.canvas)
    expect(surfaceOf(document.createElement("canvas"))).toBeNull()
    w.unmount()
  })
  it("free-running, pull returns the latest raster without painting", async () => {
    const painted: number[] = []
    const w = surfaceOn((c) => painted.push(c))
    await nextTick()
    expect(w.handle().pull(null)).toBeNull()
    expect(w.handle().pull(3000)).toBeNull()
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
    let paused = false
    const w = surfaceOn(
      (c) => painted.push(c),
      () => paused,
    )
    await nextTick()
    run(100)
    expect(painted).toEqual([])
    // Into view, then paused before the frame it asked for: that frame paints.
    show()
    paused = true
    w.loop.pausedChanged(true)
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

describe("a surface driven every frame", () => {
  it("paints while it is restarted every frame, never starved by its own restarts", async () => {
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    let paints = 0
    const w = surfaceOn(() => paints++)
    await nextTick()
    // each frame the page's own callback moves a restart prop first (the
    // binding restarts the loop), then the surface's runs as a browser does:
    // the frame's callbacks in order, a cancelled one skipped, microtasks
    // run between them
    for (let f = 1; f <= 10; f++) {
      const due = [...frames.keys()]
      w.loop.start()
      await nextTick()
      await nextTick()
      for (const n of due) {
        const cb = frames.get(n)
        frames.delete(n)
        cb?.(f * 40)
        await nextTick()
      }
    }
    expect(paints).toBeGreaterThanOrEqual(8)
    w.unmount()
  })
})

describe("a surface reads the page once, not once a frame", () => {
  /** Ten painted frames of a surface in view; what it read from the page. */
  async function tenFrames(start: (wrap: HTMLElement, canvas: HTMLCanvasElement) => () => void) {
    let observed: (() => void) | null = null
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    rs.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          observed = () => this.callback([], this as never)
        }
        disconnect() {}
      },
    )
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    let contexts = 0
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      contexts++
      return { ...fakeContext, canvas: this }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    let boxes = 0
    const wrap = document.createElement("div")
    wrap.getBoundingClientRect = () => (boxes++, { width: 32, height: 32 }) as DOMRect
    const canvas = document.createElement("canvas")
    const stop = start(wrap, canvas)
    await nextTick()
    for (let f = 1; f <= 10; f++) {
      const due = [...frames.values()]
      frames.clear()
      for (const cb of due) cb(f * 40)
      await nextTick()
    }
    const before = boxes
    // A resize is the one thing that reads the box again.
    ;(observed as (() => void) | null)?.()
    const resized = boxes - before
    stop()
    return { contexts, boxes: before, resized }
  }

  it("the engine's loop measures its box and asks for its context once", async () => {
    let paints = 0
    const read = await tenFrames((wrap, canvas) => {
      const loop = createSurfaceLoop({
        wrap: () => wrap,
        canvas: () => canvas,
        cell: 4,
        maxCols: 8,
        maxRows: 8,
        dpr: () => 1,
        paused: () => false,
        renderMode: () => "live",
        precompiled: () => undefined,
        render: () => void paints++,
      })
      loop.mount()
      return () => loop.dispose()
    })
    expect(paints).toBeGreaterThanOrEqual(8)
    expect(read).toEqual({ contexts: 1, boxes: 1, resized: 1 })
  })
})

describe("a held surface out of view", () => {
  it("never paints when the resize observer first reports", async () => {
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
    rs.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this as never)
        }
        disconnect() {}
      },
    )
    let paints = 0
    const w = surfaceOn(
      () => paints++,
      () => true,
    )
    await nextTick()
    await nextTick()
    expect(paints).toBe(0)
    w.unmount()
  })
})
