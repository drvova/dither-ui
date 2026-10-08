// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { h, nextTick } from "vue"
import { mount, type VueWrapper } from "@vue/test-utils"
import DitherContainer from "../dither-kit/DitherContainer.vue"
import type { CqState } from "../dither-kit/containers"

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  cb: (entries: Array<{ contentRect: { width: number } }>) => void
  observed: Element | null = null
  disconnected = false
  constructor(cb: FakeResizeObserver["cb"]) {
    this.cb = cb
    FakeResizeObserver.instances.push(this)
  }
  observe(el: Element): void {
    this.observed = el
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true
  }
  fire(width: number, height = width): void {
    this.cb([{ contentRect: { width, height } }])
  }
  static get last(): FakeResizeObserver | undefined {
    return FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1]
  }
}

const realClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth")
const rootOf = (w: VueWrapper) => w.element as HTMLElement

beforeEach(() => {
  FakeResizeObserver.instances = []
  vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  vi.useFakeTimers() // the silent-observer fallback rides window.setTimeout
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (realClientWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", realClientWidth)
})

describe("DitherContainer", () => {
  it("publishes the bucket, index and width vars from an observation", async () => {
    const w = mount(DitherContainer)
    const ro = FakeResizeObserver.last!
    expect(ro.observed).toBe(w.element)
    ro.fire(360) // md's min — boundaries are inclusive (height mirrors it)
    await nextTick()
    expect(rootOf(w).getAttribute("data-cq")).toBe("md")
    expect(rootOf(w).style.getPropertyValue("--cq-i")).toBe("2")
    expect(rootOf(w).style.getPropertyValue("--cq-w")).toBe("360")
    expect(rootOf(w).style.getPropertyValue("--cq-h")).toBe("360")
    w.unmount()
    expect(ro.disconnected).toBe(true) // observer leak contract
  })

  it("slot props carry width + resolution; step quantizes only the var", async () => {
    let seen: (CqState & { width: number }) | null = null
    const w = mount(DitherContainer, {
      props: { scale: { narrow: 0, wide: 400 }, step: 8 },
      slots: {
        default: (p) => {
          seen = p as CqState & { width: number }
          return h("span", "kid")
        },
      },
    })
    FakeResizeObserver.last!.fire(404, 300) // 404/8 = 50.5 → 51 → 408
    await nextTick()
    expect(seen).toEqual({ width: 404, height: 300, size: "wide", index: 1, matches: ["narrow", "wide"] })
    expect(rootOf(w).style.getPropertyValue("--cq-w")).toBe("408")
    expect(rootOf(w).style.getPropertyValue("--cq-h")).toBe("304") // 300/8 = 37.5 → 38
    expect(rootOf(w).style.getPropertyValue("--cq-i")).toBe("1")
    w.unmount()
  })

  it("stays at the zero-width bucket without ResizeObserver", async () => {
    vi.unstubAllGlobals() // jsdom ships none — the engine must not guess
    const w = mount(DitherContainer)
    await nextTick()
    expect(rootOf(w).getAttribute("data-cq")).toBe("xs")
    expect(rootOf(w).style.getPropertyValue("--cq-w")).toBe("0")
    w.unmount()
  })

  it("reads the box once when the observer stays silent", async () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 360 })
    const w = mount(DitherContainer)
    expect(rootOf(w).getAttribute("data-cq")).toBe("xs") // pre-fallback: 0-width bucket
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(rootOf(w).getAttribute("data-cq")).toBe("md")
    w.unmount()
  })

  it("honours a custom scale's ranges (max exclusive)", async () => {
    const w = mount(DitherContainer, { props: { scale: { small: { max: 100 }, large: { min: 100 } } } })
    FakeResizeObserver.last!.fire(99)
    await nextTick()
    expect(rootOf(w).getAttribute("data-cq")).toBe("small")
    FakeResizeObserver.last!.fire(100)
    await nextTick()
    expect(rootOf(w).getAttribute("data-cq")).toBe("large")
    w.unmount()
  })
})
