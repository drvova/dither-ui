// @rstest-environment jsdom
// The brand says `moving` as its moment starts, and the hero's plays it
// again under a resting mouse or pen:
// only once it is home (never over a moment still playing or still held for
// its first view), never for a finger passing over, never once the reader
// asks for reduced motion, and only where the parent asks for it (`replay`),
// saying `moving` again as it starts and `settled` again when it is home.
import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it } from "rstack/test"
import { STAGINGS } from "../src/pages/landing/brand"
import BrandGather from "../src/pages/landing/BrandGather.vue"

/** Enough of a Web Animation: a playState, a clock and a finished promise
 * that, as in the platform, is renewed only when a finished one plays. */
class FakeAnimation {
  playState: AnimationPlayState = "idle"
  currentTime: number | null = null
  private done!: () => void
  finished = this.fresh()
  private fresh() {
    return new Promise<void>((resolve) => (this.done = resolve))
  }
  pause() {
    this.playState = "paused"
  }
  play() {
    if (this.playState === "finished") this.finished = this.fresh()
    this.playState = "running"
  }
  finish() {
    this.playState = "finished"
    this.done()
  }
}

let anims: FakeAnimation[] = []
let reveal: (() => void) | null = null
let reduced = false
const saved: [object, string, PropertyDescriptor | undefined][] = []
const stub = (target: object, key: string, value: PropertyDescriptor) => {
  saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
  Object.defineProperty(target, key, { configurable: true, ...value })
}

beforeEach(() => {
  anims = []
  reveal = null
  reduced = false
  stub(HTMLElement.prototype, "animate", {
    value: () => {
      const a = new FakeAnimation()
      anims.push(a)
      return a
    },
  })
  stub(HTMLElement.prototype, "offsetParent", {
    get(this: HTMLElement) {
      return this.parentElement
    },
  })
  stub(window, "matchMedia", { value: () => ({ matches: reduced }) })
  stub(window, "IntersectionObserver", {
    value: class {
      constructor(callback: IntersectionObserverCallback) {
        reveal = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
      }
      observe() {}
      disconnect() {}
    },
  })
})
afterEach(() => {
  for (const [target, key, descriptor] of saved.reverse()) {
    if (descriptor) Object.defineProperty(target, key, descriptor)
    else delete (target as Record<string, unknown>)[key]
  }
  saved.length = 0
})

const settle = async () => {
  for (const a of anims) a.finish()
  await Promise.resolve()
  await Promise.resolve()
}
const hover = (el: Element, pointerType: string) => el.dispatchEvent(new PointerEvent("pointerenter", { pointerType }))

describe("brand replay", () => {
  it("plays again under a resting mouse once home, never for a finger", async () => {
    const host = document.createElement("div")
    document.body.append(host)
    const w = mount(BrandGather, { props: { scene: STAGINGS.hero, replay: true }, attachTo: host })
    const lockup = w.get(".brand-gather").element
    expect(anims.length).toBeGreaterThan(0)
    // Held loose for its first view, a hover does not start it early.
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toBeUndefined()
    expect(anims.every((a) => a.playState === "paused")).toBe(true)
    reveal!()
    expect(anims.every((a) => a.playState === "running")).toBe(true)
    expect(w.emitted("moving")).toHaveLength(1)

    // Over a moment still playing, a hover does nothing.
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toHaveLength(1)
    await settle()
    expect(w.emitted("settled")).toHaveLength(1)

    // A finger passing over is no hover.
    hover(lockup, "touch")
    expect(w.emitted("moving")).toHaveLength(1)

    // A mouse plays it again from the top, and it settles again.
    for (const a of anims) a.currentTime = 4600
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toHaveLength(2)
    expect(anims.every((a) => a.playState === "running" && a.currentTime === 0)).toBe(true)
    await settle()
    expect(w.emitted("settled")).toHaveLength(2)

    // Reduced motion asked for since the page opened: a hover replays nothing.
    reduced = true
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toHaveLength(2)
    expect(anims.every((a) => a.playState === "finished")).toBe(true)
    w.unmount()
    host.remove()
  })

  it("plays once only where the parent does not ask for replays", async () => {
    const host = document.createElement("div")
    document.body.append(host)
    const w = mount(BrandGather, { props: { scene: STAGINGS.foot }, attachTo: host })
    reveal!()
    await settle()
    hover(w.get(".brand-gather").element, "mouse")
    expect(w.emitted("moving")).toHaveLength(1)
    expect(anims.every((a) => a.playState === "finished")).toBe(true)
    w.unmount()
    host.remove()
  })
})
