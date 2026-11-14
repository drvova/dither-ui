// The scroll scenes' driver (`shared/lib/scroll-scene.ts`): it reads only
// the scenes the observer holds near, in the frame, and writes `--scene`;
// a scene gone past stands at its end above the view, its start below;
// under reduced motion it does nothing at all.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { scrollScene } from "@/shared/lib/scroll-scene"

type Report = { target: Element; isIntersecting: boolean; boundingClientRect: { top: number } }
let report: (entries: Report[]) => void = () => {}
let observed: Element[] = []
let reduced = false
let frames: FrameRequestCallback[] = []

beforeEach(() => {
  reduced = false
  observed = []
  frames = []
  window.matchMedia = ((q: string) => ({ matches: reduced && q.includes("reduce") })) as unknown as typeof matchMedia
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: Report[]) => void) {
        report = cb
      }
      observe(el: Element) {
        observed.push(el)
      }
      unobserve(el: Element) {
        observed = observed.filter((o) => o !== el)
      }
      disconnect() {
        observed = []
      }
    },
  )
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal("cancelAnimationFrame", () => {})
  vi.stubGlobal("innerHeight", 900)
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

const box = (top: number, height: number) => {
  const el = document.createElement("div")
  el.getBoundingClientRect = () => ({ top, height }) as DOMRect
  document.body.append(el)
  return el
}
const flush = () => frames.splice(0).forEach((f) => f(0))

describe("the scroll scenes' driver", () => {
  it("reads a scene only while it is near, in the frame, and writes it on the glide", () => {
    const el = box(675, 300)
    const reads = vi.spyOn(el, "getBoundingClientRect")
    const s = scrollScene(el, { from: ["top", 1], to: ["top", 0.5] })
    expect(observed).toEqual([el])
    dispatchEvent(new Event("scroll"))
    flush()
    expect(reads).not.toHaveBeenCalled()
    report([{ target: el, isIntersecting: true, boundingClientRect: { top: 675 } }])
    expect(el.dataset.scene).toBe("live")
    expect(reads).not.toHaveBeenCalled()
    flush()
    expect(reads).toHaveBeenCalledTimes(1)
    const v = Number(el.style.getPropertyValue("--scene"))
    expect(v).toBeGreaterThan(0.5)
    expect(v).toBeLessThan(1)
    s.destroy()
    expect(observed).toEqual([])
    expect(el.dataset.scene).toBeUndefined()
  })

  it("stands a scene gone past at its end above the view and at its start below", () => {
    const above = box(-2000, 300)
    const below = box(3000, 300)
    const range = { from: ["top", 1], to: ["top", 0.5] } as const
    scrollScene(above, range)
    scrollScene(below, range)
    report([
      { target: above, isIntersecting: false, boundingClientRect: { top: -2000 } },
      { target: below, isIntersecting: false, boundingClientRect: { top: 3000 } },
    ])
    expect(above.style.getPropertyValue("--scene")).toBe("1.0000")
    expect(below.style.getPropertyValue("--scene")).toBe("0.0000")
  })

  it("does nothing under reduced motion: the stylesheet's end state stands", () => {
    reduced = true
    const el = box(675, 300)
    scrollScene(el, { pin: true })
    expect(observed).toEqual([])
    dispatchEvent(new Event("scroll"))
    expect(frames).toHaveLength(0)
    expect(el.style.getPropertyValue("--scene")).toBe("")
  })
})
