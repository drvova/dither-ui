import { afterEach, describe, expect, it, rs } from "rstack/test"
import { directFromHyperframes, directedTime, isDirected, onSeek, release, seek } from "../src/engine/clock"

// The Web Animations a browser gives, as small as the director reads them.
class FakeAnimation {
  currentTime: number | null = 0
  playState = "running"
  timeline: unknown
  constructor(timeline: unknown) {
    this.timeline = timeline
  }
  pause() {
    this.playState = "paused"
  }
  play() {
    this.playState = "running"
  }
  finish() {
    this.playState = "finished"
  }
}
class FakeCSSAnimation extends FakeAnimation {
  constructor(
    readonly animationName: string,
    timeline: unknown,
  ) {
    super(timeline)
  }
}
class FakeCSSTransition extends FakeAnimation {}

afterEach(() => {
  release()
})

describe("clock — the director", () => {
  it("broadcasts the directed moment and hands time back on release", () => {
    const seen: (number | null)[] = []
    const off = onSeek((ms) => seen.push(ms))
    expect(isDirected()).toBe(false)
    seek(250)
    expect(isDirected()).toBe(true)
    expect(directedTime()).toBe(250)
    seek(-5) // clamped: the composition has no negative time
    seek(Number.NaN)
    release()
    expect(isDirected()).toBe(false)
    expect(seen).toEqual([250, 0, 0, null])
    release() // idempotent: no second null
    expect(seen).toEqual([250, 0, 0, null])
    off()
    seek(10)
    expect(seen).toEqual([250, 0, 0, null])
  })

  it("takes direction from HyperFrames' hf-seek events (seconds → ms)", () => {
    const target = new EventTarget()
    const paint = rs.fn()
    onSeek(paint)
    const off = directFromHyperframes(target)
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 1.5, waitUntil: () => {} } }))
    expect(paint).toHaveBeenCalledWith(1500)
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: "x" } }))
    expect(paint).toHaveBeenCalledTimes(1)
    off()
    target.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 2 } }))
    expect(paint).toHaveBeenCalledTimes(1)
  })

  it("holds the kit's CSS motion at the moment, catches what starts later, and plays it on at release", () => {
    const g = globalThis as Record<string, unknown>
    const timeline = {}
    const listeners = new Map<string, (e: Event) => void>()
    const kit = new FakeCSSAnimation("dk-focus", timeline)
    const theirs = new FakeCSSAnimation("spin", timeline)
    const scrolled = new FakeCSSAnimation("dk-sv-push", {})
    const moving = new FakeCSSTransition(timeline)
    const late = new FakeCSSAnimation("dk-type", timeline)
    class FakeElement {
      getAnimations() {
        return [late]
      }
    }
    const saved = {
      document: g.document,
      CSSAnimation: g.CSSAnimation,
      CSSTransition: g.CSSTransition,
      Element: g.Element,
    }
    Object.assign(g, {
      CSSAnimation: FakeCSSAnimation,
      CSSTransition: FakeCSSTransition,
      Element: FakeElement,
      document: {
        timeline,
        getAnimations: () => [kit, theirs, scrolled, moving],
        addEventListener: (type: string, fn: (e: Event) => void) => listeners.set(type, fn),
        removeEventListener: (type: string) => listeners.delete(type),
      },
    })
    try {
      seek(1250)
      expect([kit.playState, kit.currentTime]).toEqual(["paused", 1250])
      expect(theirs.playState).toBe("running") // not the kit's keyframes
      expect(scrolled.playState).toBe("running") // its time is the scroll
      expect(moving.playState).toBe("finished") // a fresh mount runs none
      listeners.get("animationstart")!({ target: new FakeElement() } as unknown as Event)
      expect([late.playState, late.currentTime]).toEqual(["paused", 1250])
      seek(400)
      expect(kit.currentTime).toBe(400)
      release()
      expect([kit.playState, late.playState]).toEqual(["running", "running"])
      expect(listeners.size).toBe(0)
    } finally {
      Object.assign(g, saved)
    }
  })
})
