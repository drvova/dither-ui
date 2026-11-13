// The shader's first costs, carried from the kit's earlier component specs
// when they went: its program compiles in the background (asking how a
// compile went waited on the GPU driver, the largest main-thread stall left
// on the landing), and its context is made at idle as it nears the screen,
// never as its first frame on screen.
import { cleanup, render } from "@solidjs/testing-library"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DitherShader } from "../../src/solid"
import { fakeGl } from "../support/fake-gl"

const SOURCE = "void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }"
const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  cleanup()
  HTMLCanvasElement.prototype.getContext = realGetContext
  vi.unstubAllGlobals()
})

describe("a running shader whose program is compiling", () => {
  it("holds its raster and asks again each frame, never waiting on the driver", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    vi.stubGlobal("requestIdleCallback", () => 1)
    vi.stubGlobal("cancelIdleCallback", () => {})
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    vi.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    const fake = fakeGl()
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string) {
      if (kind.startsWith("webgl")) return fake.gl
      return {
        canvas: this,
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {},
      }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container } = render(() => <DitherShader source={SOURCE} />)
    await Promise.resolve()
    const run = async (n: number, from: number) => {
      for (let f = 0; f < n; f++) {
        const due = [...frames.values()]
        frames.clear()
        for (const cb of due) cb((from + f) * 100)
        await Promise.resolve()
      }
    }
    await run(6, 1)
    expect(fake.state.polls).toBeGreaterThan(1)
    expect(fake.state.waits).toBe(0)
    expect(container.querySelector("[data-state]")!.getAttribute("data-state")).toBe("ready")
    // the driver finishes: the next frame collects it without a wait
    fake.finish()
    const polled = fake.state.polls
    await run(3, 7)
    expect(fake.state.waits).toBe(0)
    expect(fake.state.polls).toBe(polled + 1)
  })
})

describe("a shader nearing the screen", () => {
  it("makes its GPU context at idle once near, before it paints a frame", async () => {
    // every observer near the screen (the warm-up's and the surface's own)
    const observers: (() => void)[] = []
    const near = () => observers.forEach((show) => show())
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {
          observers.push(() => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never))
        }
        observe() {}
        disconnect() {}
      },
    )
    const idle: (() => void)[] = []
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => idle.push(cb))
    vi.stubGlobal("cancelIdleCallback", () => {})
    // no frame ever runs: whatever is made, is made by the warm-up
    vi.stubGlobal("requestAnimationFrame", () => 1)
    vi.stubGlobal("cancelAnimationFrame", () => {})
    const asked: string[] = []
    HTMLCanvasElement.prototype.getContext = ((kind: string) => {
      asked.push(kind)
      return null
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
    render(() => <DitherShader source={SOURCE} />)
    await Promise.resolve()
    for (const cb of idle.splice(0)) cb()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual([])
    near()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual([])
    for (const cb of idle.splice(0)) cb()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual(["webgl2", "webgl"])
  })
})
