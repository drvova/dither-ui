// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, nextTick } from "vue"
import { mount } from "@vue/test-utils"
import DitherLayer from "../dither-kit/DitherLayer.vue"
import DitherStage from "../dither-kit/DitherStage.vue"
import { release, seek } from "../dither-kit/clock"

let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
function flush(t: number): void {
  const batch = [...queue.entries()]
  queue.clear()
  for (const [, cb] of batch) cb(t)
}
/** The runtime clamps dt to 100ms, so fake time walks in 50ms steps. */
let now = 1000
function advance(to: number): void {
  for (now += 50; now <= to; now += 50) flush(now)
}
let observers: ((entries: { contentRect: { width: number; height: number } }[]) => void)[] = []
class FakeResizeObserver {
  constructor(cb: (entries: { contentRect: { width: number; height: number } }[]) => void) {
    observers.push(cb)
  }
  observe(): void {}
  disconnect(): void {}
}
const resize = (width: number, height: number) => observers.forEach((cb) => cb([{ contentRect: { width, height } }]))
const matchMedia = (matches: boolean) => {
  window.matchMedia = (() => ({ matches, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
}
const realMatchMedia = window.matchMedia

const Scene = (layer: Record<string, unknown> = {}, stage: Record<string, unknown> = {}) =>
  defineComponent({
    render: () =>
      h(DitherStage, { duration: 4, ...stage }, () => [
        h(DitherLayer, { keyframes: [{ x: "-10cqw", opacity: 0 }, { x: "10cqw", opacity: 1 }], duration: 2, yoyo: true, loop: true, ...layer }, (slot: { x: number; progress: number; width: number }) =>
          h("i", { id: "v" }, `${Math.round(slot.x)}|${slot.progress}|${slot.width}`),
        ),
      ]),
  })
const layerOf = (w: ReturnType<typeof mount>) => w.find(".dither-layer").element as HTMLElement

beforeEach(() => {
  queue = new Map()
  nextId = 1
  now = 1000
  observers = []
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id)
  })
  vi.stubGlobal("IntersectionObserver", undefined)
  vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  matchMedia(false)
})
afterEach(() => {
  release()
  vi.unstubAllGlobals()
  window.matchMedia = realMatchMedia
})

describe("DitherStage + DitherLayer", () => {
  it("drives layers from one clock in container units; the slot gets px against the measured box", async () => {
    const w = mount(Scene())
    await nextTick()
    resize(400, 200)
    flush(1000)
    await nextTick()
    const el = layerOf(w)
    expect(w.attributes("data-stage")).toBe("playing")
    expect(el.style.transform).toBe("translate(-10cqw, 0px)")
    expect(el.style.opacity).toBe("0")
    expect(el.getAttribute("data-layer")).toBe("active")
    expect(w.find("#v").text()).toBe("-40|0|400")
    advance(1500)
    await nextTick()
    expect(w.attributes("data-stage-time")).toBe("0.50")
    expect(el.style.transform).toBe("translate(-5cqw, 0px)")
    expect(el.style.opacity).toBe("0.25")
    expect(el.style.getPropertyValue("--layer-x")).toBe("-20px")
    expect(el.style.getPropertyValue("--layer-p")).toBe("0.25")
    expect(w.find("#v").text()).toBe("-20|0.25|400")
    // A narrower box: the same moment, the same units, fewer px.
    resize(200, 100)
    await nextTick()
    expect(el.style.transform).toBe("translate(-5cqw, 0px)")
    expect(w.find("#v").text()).toBe("-10|0.25|200")
    w.unmount()
    expect(queue.size).toBe(0)
  })

  it("holds the composition's moment when directed, looping the stage duration, and requests no frames", async () => {
    const w = mount(Scene())
    await nextTick()
    resize(400, 200)
    seek(500)
    await nextTick()
    expect(w.attributes("data-stage")).toBe("directed")
    expect(layerOf(w).style.transform).toBe("translate(-5cqw, 0px)")
    expect(queue.size).toBe(0)
    seek(1500)
    await nextTick()
    expect(layerOf(w).style.transform).toBe("translate(5cqw, 0px)")
    // yoyo: the second cycle runs back; the stage wraps at 4s
    seek(3500)
    await nextTick()
    expect(layerOf(w).style.transform).toBe("translate(-5cqw, 0px)")
    seek(4500)
    await nextTick()
    expect(w.attributes("data-stage-time")).toBe("0.50")
    expect(layerOf(w).style.transform).toBe("translate(-5cqw, 0px)")
    release()
    await nextTick()
    expect(queue.size).toBe(1)
  })

  it("settles every layer at its end under reduced motion, and a paused stage requests no frames", async () => {
    matchMedia(true)
    const w = mount(Scene({ yoyo: false }))
    await nextTick()
    expect(w.attributes("data-stage")).toBe("still")
    expect(layerOf(w).getAttribute("data-layer")).toBe("done")
    expect(layerOf(w).style.transform).toBe("translate(10cqw, 0px)")
    expect(queue.size).toBe(0)
    matchMedia(false)
    const p = mount(Scene({}, { paused: true }))
    await nextTick()
    expect(p.attributes("data-stage")).toBe("paused")
    expect(queue.size).toBe(0)
    await p.setProps({})
  })

  it("stands alone at its first keyframe without a stage", async () => {
    const w = mount(DitherLayer, { props: { keyframes: [{ x: "10cqw" }, { x: "20cqw" }] } })
    await nextTick()
    expect((w.element as HTMLElement).style.transform).toBe("translate(10cqw, 0px)")
    expect(w.attributes("data-layer")).toBe("active")
  })
})
