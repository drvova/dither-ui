// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { h, nextTick } from "vue"
import { mount, type VueWrapper } from "@vue/test-utils"
import Sequence from "../dither-kit/Sequence.vue"
import { release, seek } from "../dither-kit/clock"

/** Manual rAF: each flush runs the currently queued frames at time `t`. */
let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
function flush(t: number): void {
  const batch = [...queue.entries()]
  queue.clear()
  for (const [, cb] of batch) cb(t)
}
/** Advance the fake clock to `to` in 50ms steps — the runtime clamps dt to
 * 100ms (kit stall protection), so honest fake time must respect the cap. */
let now = 0
function tick(to: number): void {
  for (now += 50; now <= to; now += 50) flush(now)
}
const child = (w: VueWrapper, i: number) => w.element.children[i] as HTMLElement
const pOf = (w: VueWrapper, i: number) => child(w, i).style.getPropertyValue("--seq-p")
const stateOf = (w: VueWrapper, i: number) => child(w, i).getAttribute("data-seq")

const three = () => ({
  default: () => [h("div", { id: "a" }), h("div", { id: "b" }), h("div", { id: "c" })],
})

const matchMedia = (matches: boolean) => {
  window.matchMedia = (() => ({ matches, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
}
const realMatchMedia = window.matchMedia

beforeEach(() => {
  queue = new Map()
  nextId = 1
  now = 0
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id)
  })
  vi.stubGlobal("IntersectionObserver", undefined) // mount path plays immediately
  matchMedia(false)
})

afterEach(() => {
  release()
  vi.unstubAllGlobals()
  window.matchMedia = realMatchMedia
})

describe("Sequence — directed by the clock", () => {
  it("paints the given moment, in any order, and requests no frames", async () => {
    seek(0)
    const w = mount(Sequence, { props: { stagger: 0.3, duration: 0.5 }, slots: three() })
    await nextTick()
    expect(queue.size).toBe(0)
    expect(pOf(w, 0)).toBe("0.0000")
    seek(500) // child 0 done, child 1 (starts at 0.3) at 0.2/0.5
    expect(pOf(w, 0)).toBe("1.0000")
    expect(pOf(w, 1)).toBe("0.4000")
    expect(stateOf(w, 0)).toBe("done")
    expect(queue.size).toBe(0)
    seek(100) // backwards: a pure function of the moment
    expect(pOf(w, 0)).toBe("0.2000")
    expect(pOf(w, 1)).toBe("0.0000")
    seek(5000) // past the end: everything settled, nothing requested
    expect(pOf(w, 2)).toBe("1.0000")
    expect(queue.size).toBe(0)
    release() // the loop resumes from the moment
    expect(queue.size).toBe(1)
    w.unmount()
  })
})

describe("Sequence — staggered drive", () => {
  it("waves progress across children and settles all at the end", () => {
    const onComplete = vi.fn()
    const w = mount(Sequence, {
      props: { stagger: 0.3, duration: 0.5, onComplete },
      slots: three(),
    })
    expect(queue.size).toBe(1) // frames requested (not reduced-motion)

    flush(50) // frame 1: dt 0 — paints the timeline head
    expect(stateOf(w, 0)).toBe("active")
    expect(pOf(w, 0)).toBe("0.0000")
    expect(stateOf(w, 1)).toBe("before")
    expect(stateOf(w, 2)).toBe("before")

    tick(600) // elapsed ≈0.55 (past c0's 0.5 end despite dt float drift)
    expect(stateOf(w, 0)).toBe("done")
    expect(pOf(w, 0)).toBe("1.0000")
    expect(stateOf(w, 1)).toBe("active")
    expect(Number(pOf(w, 1))).toBeCloseTo(0.5) // (0.55−0.3)/0.5
    expect(stateOf(w, 2)).toBe("before")

    tick(1250) // elapsed ≈1.15 ≥ plan duration 1.1
    expect([0, 1, 2].map((i) => stateOf(w, i))).toEqual(["done", "done", "done"])
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(queue.size).toBe(0) // no further frames requested

    flush(9999)
    expect(onComplete).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it("delay holds everyone at 0 until the timeline starts", () => {
    const w = mount(Sequence, {
      props: { stagger: 0.3, duration: 0.5, delay: 0.4 },
      slots: three(),
    })
    flush(50) // frame 1: dt 0 → t is still negative
    expect([0, 1, 2].map((i) => stateOf(w, i))).toEqual(["before", "before", "before"])
    tick(550) // elapsed 0.5 → t 0.1: c0 running at 0.2
    expect(stateOf(w, 0)).toBe("active")
    expect(Number(pOf(w, 0))).toBeCloseTo(0.2)
    w.unmount()
  })

  it("paused holds the start state without requesting frames, then releases", async () => {
    const w = mount(Sequence, {
      props: { stagger: 0.3, duration: 0.5, paused: true },
      slots: three(),
    })
    expect(queue.size).toBe(0)
    expect(stateOf(w, 0)).toBe("active") // painted at the timeline head
    expect(pOf(w, 0)).toBe("0.0000")

    await w.setProps({ paused: false })
    await nextTick()
    expect(queue.size).toBe(1)
    flush(50) // resume frame: dt 0 — no time jump across the pause
    expect(pOf(w, 0)).toBe("0.0000")
    tick(150) // dt 0.1 → progress resumes
    expect(Number(pOf(w, 0))).toBeCloseTo(0.2)
    w.unmount()
  })

  it("frameRate holds writes between wall-time boundaries while the clock keeps ticking", () => {
    const w = mount(Sequence, {
      props: { stagger: 0.3, duration: 0.5, frameRate: 1 },
      slots: three(),
    })
    flush(50) // frame 1 (dt 0): boundary 0 crossed → paints the head
    expect(stateOf(w, 0)).toBe("active")
    expect(pOf(w, 0)).toBe("0.0000")

    tick(550) // elapsed 0.5 → still boundary 0 (floor 0.5s × 1fps) → held
    expect(pOf(w, 0)).toBe("0.0000")
    expect(stateOf(w, 1)).toBe("before")

    tick(1250) // clock crossed the whole timeline → completion not gated
    expect([0, 1, 2].map((i) => stateOf(w, i))).toEqual(["done", "done", "done"])
    w.unmount()
  })

  it("pauses when the host leaves and resumes without a time jump", () => {
    let fire: ((visible: boolean) => void) | null = null
    class CaptureIO {
      constructor(cb: (e: Array<{ isIntersecting: boolean }>) => void) {
        fire = (visible: boolean) => cb([{ isIntersecting: visible }])
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", CaptureIO)
    const w = mount(Sequence, { props: { stagger: 0.3, duration: 0.5 }, slots: three() })
    expect(queue.size).toBe(0) // gated: no optimistic start at mount

    fire!(true)
    expect(queue.size).toBe(1) // first intersection starts the play
    flush(50)
    tick(150) // elapsed 0.1 → running
    expect(Number(pOf(w, 0))).toBeCloseTo(0.2)

    fire!(false)
    expect(queue.size).toBe(0) // left mid-play → no offscreen rAF
    const held = pOf(w, 0)
    flush(9999) // no queued frames — the clock cannot advance while hidden

    fire!(true)
    expect(queue.size).toBe(1)
    flush(100) // resume frame: dt 0 — no jump across the visibility pause
    expect(pOf(w, 0)).toBe(held)
    w.unmount()
  })

  it("reduced motion snaps to the settled end state with zero frames", () => {
    matchMedia(true)
    const onComplete = vi.fn()
    const w = mount(Sequence, { props: { stagger: 0.3, duration: 0.5, onComplete }, slots: three() })
    expect(queue.size).toBe(0)
    expect([0, 1, 2].map((i) => stateOf(w, i))).toEqual(["done", "done", "done"])
    expect(pOf(w, 2)).toBe("1.0000")
    expect(onComplete).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it("an empty slot completes gracefully without frames", () => {
    const onComplete = vi.fn()
    const w = mount(Sequence, { props: { onComplete }, slots: { default: () => [] } })
    expect(queue.size).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
    w.unmount()
  })
})
