// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { h, nextTick } from "vue"
import { mount, type VueWrapper } from "@vue/test-utils"
import DitherReveal from "../dither-kit/DitherReveal.vue"
import { release, seek } from "../dither-kit/clock"

let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
function flush(t: number): void {
  const batch = [...queue.entries()]
  queue.clear()
  for (const [, cb] of batch) cb(t)
}
let now = 1000
const matchMedia = (matches: boolean) => {
  window.matchMedia = (() => ({ matches, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
}
const realMatchMedia = window.matchMedia
const content = () => ({ default: () => h("div", { id: "c" }, "hi") })
const state = (w: VueWrapper) => w.element.getAttribute("data-reveal")
const mask = (w: VueWrapper) => (w.element as HTMLElement).style.maskImage || ""

beforeEach(() => {
  queue = new Map()
  nextId = 1
  now = 1000
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id)
  })
  vi.stubGlobal("IntersectionObserver", undefined) // mount path plays immediately
  vi.spyOn(performance, "now").mockImplementation(() => now)
  matchMedia(false)
})
afterEach(() => {
  release()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.matchMedia = realMatchMedia
})

describe("DitherReveal", () => {
  it("follows a manual progress and runs no clock of its own", async () => {
    const w = mount(DitherReveal, { props: { progress: 0 }, slots: content() })
    await nextTick()
    expect(state(w)).toBe("hidden")
    expect(queue.size).toBe(0)
    expect(mask(w)).toContain("svg")
    await w.setProps({ progress: 0.5 })
    expect(state(w)).toBe("playing")
    expect(mask(w)).toContain("rect")
    await w.setProps({ progress: 1 })
    expect(state(w)).toBe("shown")
    expect(mask(w)).toBe("")
    expect(w.find("#c").exists()).toBe(true)
  })

  it("plays its duration on mount and lands shown", async () => {
    const w = mount(DitherReveal, { props: { duration: 1, easing: "linear" }, slots: content() })
    await nextTick()
    expect(queue.size).toBe(1)
    flush(1000)
    await nextTick()
    expect(state(w)).toBe("hidden")
    flush(1500)
    await nextTick()
    expect(state(w)).toBe("playing")
    flush(2000)
    await nextTick()
    expect(state(w)).toBe("shown")
    expect(queue.size).toBe(0)
    // A new restart key plays it again, from now.
    now = 2000
    await w.setProps({ restartKey: 1 })
    expect(queue.size).toBe(1)
    flush(2000)
    await nextTick()
    expect(state(w)).toBe("hidden")
  })

  it("reverses, and shows at once under reduced motion", async () => {
    const r = mount(DitherReveal, { props: { progress: 0, reverse: true }, slots: content() })
    await nextTick()
    expect(state(r)).toBe("shown")
    matchMedia(true)
    const w = mount(DitherReveal, { props: { duration: 1 }, slots: content() })
    await nextTick()
    expect(state(w)).toBe("shown")
    expect(queue.size).toBe(0)
  })

  it("is the kit clock's when directed", async () => {
    const w = mount(DitherReveal, { props: { duration: 2, delay: 1, easing: "linear" }, slots: content() })
    await nextTick()
    seek(2000)
    await nextTick()
    expect(queue.size).toBe(0)
    expect(state(w)).toBe("playing")
    const at2 = mask(w)
    seek(3000)
    await nextTick()
    expect(state(w)).toBe("shown")
    seek(0)
    await nextTick()
    expect(state(w)).toBe("hidden")
    seek(2000)
    await nextTick()
    expect(mask(w)).toBe(at2)
  })
})
