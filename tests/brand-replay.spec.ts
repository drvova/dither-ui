// @rstest-environment jsdom
// The hero's brand plays its moment again under a resting mouse or pen:
// only once it is home (never over a moment still playing), never for a
// finger passing over, and only where the parent asks for it (`replay`),
// saying `moving` as it starts and `settled` again when it is home.
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
const saved: [object, string, PropertyDescriptor | undefined][] = []
const stub = (target: object, key: string, value: PropertyDescriptor) => {
  saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
  Object.defineProperty(target, key, { configurable: true, ...value })
}

beforeEach(() => {
  anims = []
  reveal = null
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
  stub(window, "matchMedia", { value: () => ({ matches: false }) })
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
    reveal!()
    expect(anims.every((a) => a.playState === "running")).toBe(true)

    // Over a moment still playing, a hover does nothing.
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toBeUndefined()
    await settle()
    expect(w.emitted("settled")).toHaveLength(1)

    // A finger passing over is no hover.
    hover(lockup, "touch")
    expect(w.emitted("moving")).toBeUndefined()

    // A mouse plays it again from the top, and it settles again.
    for (const a of anims) a.currentTime = 4600
    hover(lockup, "mouse")
    expect(w.emitted("moving")).toHaveLength(1)
    expect(anims.every((a) => a.playState === "running" && a.currentTime === 0)).toBe(true)
    await settle()
    expect(w.emitted("settled")).toHaveLength(2)
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
    expect(w.emitted("moving")).toBeUndefined()
    expect(anims.every((a) => a.playState === "finished")).toBe(true)
    w.unmount()
    host.remove()
  })
})
