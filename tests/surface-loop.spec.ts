// @rstest-environment jsdom
// The surface loop is one framework-free core (`engine/surface-loop.ts`)
// that Vue's and Solid's runtimes both drive, so the two kits cannot drift
// while the Solid one grows. Making a loop must touch nothing (a server
// render makes one for every surface on the page); everything that listens
// starts at `mount` and ends at `dispose`.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { release, seek } from "../dither-kit/engine/clock"
import { createSurfaceLoop, surfaceOf } from "../dither-kit/engine/surface-loop"
import { watchVisibility } from "../dither-kit/engine/visibility"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
  release()
})

function world() {
  const made = { observers: 0, frames: 0 }
  const shows: (() => void)[] = []
  rs.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {
        made.observers++
      }
      observe() {
        shows.push(() => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never))
      }
      disconnect() {}
    },
  )
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (made.frames++, frames.set(++id, cb), id))
  rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    return {
      canvas: this,
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
    }
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
  const run = async (now: number) => {
    await Promise.resolve()
    const due = [...frames.values()]
    frames.clear()
    for (const cb of due) cb(now)
  }
  return { made, show: () => shows.forEach((s) => s()), run }
}

function loopOn(opts: { paused?: () => boolean } = {}) {
  const wrap = document.createElement("div")
  const canvas = document.createElement("canvas")
  const painted: number[] = []
  const loop = createSurfaceLoop({
    wrap: () => wrap,
    canvas: () => canvas,
    cell: 4,
    maxCols: 8,
    maxRows: 8,
    dpr: () => 1,
    paused: opts.paused ?? (() => false),
    renderMode: () => "live",
    precompiled: () => undefined,
    render: (_buffer, clock) => painted.push(clock),
  })
  return { loop, canvas, painted }
}

describe("a surface loop", () => {
  it("touches nothing until it is mounted, and may be disposed unmounted", () => {
    const w = world()
    const { loop, painted } = loopOn()
    expect(w.made).toEqual({ observers: 0, frames: 0 })
    expect(loop.surface.raster()).toBeNull()
    loop.dispose()
    expect(w.made).toEqual({ observers: 0, frames: 0 })
    expect(painted).toEqual([])
  })

  it("paints from mount while in view, registers its canvas, and stops at dispose", async () => {
    const w = world()
    const { loop, canvas, painted } = loopOn()
    loop.mount()
    w.show()
    await w.run(100)
    expect(painted.length).toBe(1)
    expect(surfaceOf(canvas)).toBe(loop.surface)
    await w.run(200)
    expect(painted.length).toBe(2)
    loop.dispose()
    await w.run(300)
    expect(painted.length).toBe(2)
  })

  it("paused still paints its first frame, then holds until it is told the pause lifted", async () => {
    const w = world()
    let paused = true
    const { loop, painted } = loopOn({ paused: () => paused })
    loop.mount()
    w.show()
    await w.run(100)
    await w.run(200)
    expect(painted.length).toBe(1)
    paused = false
    loop.pausedChanged(false)
    await w.run(300)
    expect(painted.length).toBe(2)
    loop.dispose()
  })

  it("paints a directed moment once, whoever asks first", async () => {
    const w = world()
    const { loop, painted } = loopOn()
    loop.mount()
    w.show()
    await w.run(100)
    const free = painted.length
    // the clock's own call and two consumers' pulls agree on one paint
    seek(2000)
    loop.surface.pull(2000)
    loop.surface.pull(2000)
    expect(painted.length).toBe(free + 1)
    expect(painted.at(-1)).toBe(2)
    loop.dispose()
  })
})

describe("watching an element's visibility", () => {
  it("watches only between mount and dispose", () => {
    const w = world()
    const el = document.createElement("div")
    let woke = 0
    const v = watchVisibility(
      () => el,
      () => woke++,
    )
    expect(w.made.observers).toBe(0)
    expect(v.visible()).toBe(false)
    v.mount()
    v.mount()
    expect(w.made.observers).toBe(1)
    w.show()
    expect(v.visible()).toBe(true)
    expect(woke).toBe(1)
    v.dispose()
  })
})
