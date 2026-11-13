// The browser a Solid component spec runs in: observers that report when
// the spec says so, frames it steps, and a 2D canvas that records uploads.
import { vi } from "vitest"

// The kit's frame budget is one module-wide tally keyed by the frame's
// stamp, so every world stamps its frames in a range of its own: specs that
// all step "frame 100" would otherwise spend one shared budget and hold
// each other's paints.
let worlds = 0

export function world() {
  const base = ++worlds * 1e7
  const shows: (() => void)[] = []
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() {
        shows.push(() => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never))
      }
      disconnect() {}
    },
  )
  const sizes: (() => void)[] = []
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(el: Element) {
        sizes.push(() =>
          this.callback(
            [{ target: el, borderBoxSize: [{ inlineSize: 96, blockSize: 40 }] } as unknown as ResizeObserverEntry],
            this as never,
          ),
        )
      }
      disconnect() {}
    },
  )
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
  vi.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
  /** Run the frames queued so far, stamped `now` ms. */
  async function frame(now: number) {
    await Promise.resolve()
    const due = [...frames.values()]
    frames.clear()
    for (const cb of due) cb(base + now)
  }
  const uploads: HTMLCanvasElement[] = []
  const real = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    return {
      canvas: this,
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => uploads.push(this),
      clearRect() {},
      drawImage() {},
      beginPath() {},
      arc() {},
      fill() {},
    }
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
  return {
    uploads,
    /** Every observed element comes into view. */
    show: () => shows.forEach((s) => s()),
    /** Every observed element reports its size. */
    size: () => sizes.forEach((s) => s()),
    frame,
    /** How many frames are asked for. */
    queued: () => frames.size,
    /** Run frames every `step` ms from `from` to `to`, each running what the last queued. */
    async run(from: number, to: number, step = 50) {
      for (let t = from; t <= to; t += step) await frame(t)
    },
    restore() {
      HTMLCanvasElement.prototype.getContext = real
      vi.unstubAllGlobals()
    },
  }
}
