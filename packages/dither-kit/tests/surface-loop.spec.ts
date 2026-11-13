// @rstest-environment jsdom
// The surface loop is one framework-free core (`engine/surface-loop.ts`)
// that a kit's runtime drives (`solid/runtime/surface.ts`). Making a loop
// must touch nothing (a server render makes one for every surface on the
// page); everything that listens starts at `mount` and ends at `dispose`.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { release, seek } from "../src/engine/clock"
import { coverPage } from "../src/engine/cover"
import { createSurfaceLoop, surfaceOf } from "../src/engine/surface-loop"
import { watchVisibility } from "../src/engine/visibility"

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

function loopOn(
  opts: { paused?: () => boolean; frameRate?: number; renderMode?: "live" | "static"; precompiled?: string } = {},
) {
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
    renderMode: () => opts.renderMode ?? "live",
    precompiled: () => opts.precompiled,
    frameRate: () => opts.frameRate,
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

  it("a stop-motion surface restarted every frame still paints every frame", async () => {
    // each restart begins the cadence again at frame 0: holding "frame 0, as
    // painted" starved a surface for as long as its source was driven
    const w = world()
    const { loop, painted } = loopOn({ frameRate: 8 })
    loop.mount()
    w.show()
    for (let f = 1; f <= 4; f++) {
      loop.start()
      await w.run(performance.now() + f)
    }
    expect(painted.length).toBe(4)
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

describe("a held frame whose inputs changed", () => {
  it("paints a still surface's frame again, once, at the same moment", async () => {
    const w = world()
    const { loop, painted } = loopOn({ renderMode: "static" })
    loop.mount()
    await w.run(100)
    expect(painted).toEqual([4])
    expect(loop.holds()).toBe(true)
    // two inputs changing together are one print
    loop.repaint()
    loop.repaint()
    await w.run(200)
    expect(painted).toEqual([4, 4])
    await w.run(300)
    expect(painted).toEqual([4, 4])
    loop.dispose()
    loop.repaint()
    await w.run(400)
    expect(painted).toEqual([4, 4])
  })

  it("leaves the print to a restart the same change caused", async () => {
    const w = world()
    const { loop, painted } = loopOn({ renderMode: "static" })
    loop.mount()
    await w.run(100)
    loop.repaint()
    loop.start()
    await w.run(200)
    expect(painted.length).toBe(2)
    loop.start()
    loop.repaint()
    await w.run(300)
    expect(painted.length).toBe(3)
    loop.dispose()
  })

  it("paints nothing before the mount, nor for a precompiled surface", async () => {
    const w = world()
    const unmounted = loopOn({ renderMode: "static" })
    unmounted.loop.repaint()
    await w.run(100)
    expect(unmounted.painted).toEqual([])
    expect(w.made).toEqual({ observers: 0, frames: 0 })
    const image = loopOn({ renderMode: "static", precompiled: "data:image/png;base64,AAAA" })
    image.loop.mount()
    image.loop.repaint()
    await w.run(200)
    expect(image.painted).toEqual([])
    image.loop.dispose()
  })

  it("prints a still frame again under the kit clock's direction, at its own moment", async () => {
    const w = world()
    const { loop, painted } = loopOn({ renderMode: "static" })
    loop.mount()
    await w.run(100)
    seek(2000)
    expect(painted).toEqual([4])
    loop.repaint()
    await w.run(200)
    expect(painted).toEqual([4, 4])
    release()
    await w.run(300)
    expect(painted).toEqual([4, 4])
    loop.dispose()
  })

  it("holds a directed moment, and prints that moment again when its inputs change", async () => {
    const w = world()
    const { loop, painted } = loopOn()
    seek(2000)
    loop.mount()
    w.show()
    await w.run(100)
    expect(painted.at(-1)).toBe(2)
    expect(loop.holds()).toBe(true)
    painted.splice(0)
    loop.repaint()
    loop.repaint()
    await w.run(200)
    expect(painted).toEqual([2])
    release()
    expect(loop.holds()).toBe(false)
    loop.dispose()
  })

  it("prints a paused surface's first frame under direction, whatever the moment", async () => {
    const w = world()
    let paused = false
    const { loop, painted } = loopOn({ paused: () => paused })
    seek(2000)
    loop.mount()
    w.show()
    await w.run(100)
    painted.splice(0)
    paused = true
    loop.pausedChanged(true)
    seek(3000)
    expect(painted).toEqual([0])
    paused = false
    loop.pausedChanged(false)
    expect(painted).toEqual([0, 3])
    loop.dispose()
  })

  it("prints a moment that is not the next in capture order on a clean raster", async () => {
    const w = world()
    const { loop } = loopOn()
    seek(2000)
    loop.mount()
    w.show()
    await w.run(100)
    const first = loop.surface.raster()
    seek(2016)
    expect(loop.surface.raster()).toBe(first)
    seek(1000)
    expect(loop.surface.raster()).not.toBe(first)
    loop.dispose()
  })

  it("is nothing to a running loop, which reads its inputs every frame", async () => {
    const w = world()
    const { loop, painted } = loopOn()
    loop.mount()
    w.show()
    await w.run(100)
    expect(loop.holds()).toBe(false)
    loop.repaint()
    await Promise.resolve()
    expect(painted.length).toBe(1)
    await w.run(200)
    expect(painted.length).toBe(2)
    expect(painted[1]).toBeCloseTo(0.1)
    loop.dispose()
  })

  it("paints a paused surface's frame again through the loop, the clock kept, and stands down", async () => {
    const w = world()
    const { loop, painted } = loopOn({ paused: () => true })
    loop.mount()
    w.show()
    await w.run(100)
    expect(painted).toEqual([0])
    loop.repaint()
    loop.repaint()
    await w.run(200)
    expect(painted).toEqual([0, 0])
    await w.run(300)
    expect(painted).toEqual([0, 0])
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

  it("wakes as a cover lifts, one it was mounted under included", () => {
    const w = world()
    const el = document.createElement("div")
    const sheet = document.createElement("div")
    let woke = 0
    const v = watchVisibility(
      () => el,
      () => woke++,
    )
    coverPage(sheet)
    v.mount()
    w.show()
    expect(v.visible()).toBe(false)
    expect(woke).toBe(0)
    coverPage(null)
    expect(v.visible()).toBe(true)
    expect(woke).toBe(1)
    v.dispose()
  })
})
