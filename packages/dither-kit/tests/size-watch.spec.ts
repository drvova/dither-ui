// @rstest-environment jsdom
// A size report applied on the frame after it, never inside the observer's
// delivery (`size-watch.ts`): a paused poster's surface loop sized its
// canvas inside the report, which resized the box it observed, and WebKit
// reported "ResizeObserver loop completed with undelivered notifications"
// on the Studio's iPhone-width notice.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { watchSize } from "../src/engine/size-watch"
import { createSurfaceLoop } from "../src/engine/surface-loop"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
})

/** A page whose observer reports when the test says and whose frames run by hand. */
function page() {
  const observers: { report: (entries: ResizeObserverEntry[]) => void; stopped: boolean }[] = []
  rs.stubGlobal(
    "ResizeObserver",
    class {
      private me: (typeof observers)[number]
      constructor(callback: ResizeObserverCallback) {
        this.me = { report: (entries) => callback(entries, this as never), stopped: false }
        observers.push(this.me)
      }
      observe() {}
      disconnect() {
        this.me.stopped = true
      }
    },
  )
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
  const frame = (at = 0) => {
    const due = [...frames.values()]
    frames.clear()
    for (const cb of due) cb(at)
  }
  /** The observer's report, as the browser delivers it. */
  const report = (width: number, height = width) =>
    observers.at(-1)!.report([{ contentRect: { width, height } } as ResizeObserverEntry])
  return { frame, report, observers, frames }
}

describe("a size report", () => {
  it("is applied on the next frame, the latest of several winning, never inside the delivery", () => {
    const p = page()
    const applied: number[] = []
    const watch = watchSize(document.createElement("div"), (entry) => applied.push(entry!.contentRect.width))
    expect(watch.reported()).toBe(false)
    p.report(10)
    p.report(20)
    expect(applied).toEqual([])
    expect(watch.reported()).toBe(true)
    p.frame()
    expect(applied).toEqual([20])
    p.frame()
    expect(applied).toEqual([20])
  })

  it("stops with its observer and the frame still due", () => {
    const p = page()
    const applied: number[] = []
    const watch = watchSize(document.createElement("div"), (entry) => applied.push(entry!.contentRect.width))
    p.report(10)
    watch.stop()
    p.frame()
    expect(applied).toEqual([])
    expect(p.observers.at(-1)!.stopped).toBe(true)
  })

  it("does nothing without a ResizeObserver", () => {
    rs.stubGlobal("ResizeObserver", undefined)
    const watch = watchSize(document.createElement("div"), () => {
      throw new Error("applied")
    })
    expect(watch.reported()).toBe(false)
    watch.stop()
  })
})

describe("a paused surface told of a new size", () => {
  it("sizes its canvas on the frame after the report, never inside it", async () => {
    const p = page()
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      return {
        canvas: this,
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {},
      }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    let box = { width: 32, height: 32 }
    const wrap = document.createElement("div")
    wrap.getBoundingClientRect = () => box as DOMRect
    const canvas = wrap.appendChild(document.createElement("canvas"))
    const loop = createSurfaceLoop({
      wrap: () => wrap,
      canvas: () => canvas,
      cell: 4,
      maxCols: 64,
      maxRows: 64,
      dpr: () => 1,
      paused: () => true,
      renderMode: () => "live",
      precompiled: () => undefined,
      render: () => {},
    })
    loop.mount()
    await Promise.resolve()
    for (let f = 1; f <= 3; f++) p.frame(f * 40)
    expect(canvas.width).toBe(8)
    box = { width: 128, height: 64 }
    p.report(128, 64)
    // inside the delivery: the canvas, and so the box it lays out, as it was
    expect(canvas.width).toBe(8)
    p.frame(160)
    expect([canvas.width, canvas.height]).toEqual([32, 16])
    loop.dispose()
  })
})
