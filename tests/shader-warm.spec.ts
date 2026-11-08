// @rstest-environment jsdom
// The shader's first cost, its context and its compile, is paid at idle as it
// nears the screen, never as its first frame on screen: that stall landed
// just as the footer's galaxy came into view.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import DitherShader from "../dither-kit/tailwind/DitherShader.vue"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
})

describe("a shader nearing the screen", () => {
  it("makes its GPU context at idle once near, before it paints a frame", async () => {
    // every observer near the screen (the warm-up's and the surface's own)
    const observers: (() => void)[] = []
    const near = () => observers.forEach((show) => show())
    rs.stubGlobal(
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
    rs.stubGlobal("requestIdleCallback", (cb: () => void) => idle.push(cb))
    rs.stubGlobal("cancelIdleCallback", () => {})
    // no frame ever runs: whatever is made, is made by the warm-up
    rs.stubGlobal("requestAnimationFrame", () => 1)
    rs.stubGlobal("cancelAnimationFrame", () => {})
    const asked: string[] = []
    HTMLCanvasElement.prototype.getContext = ((kind: string) => {
      asked.push(kind)
      return null
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const w = mount(DitherShader, { props: { source: "void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }" } })
    await nextTick()
    for (const cb of idle.splice(0)) cb()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual([])
    near()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual([])
    for (const cb of idle.splice(0)) cb()
    expect(asked.filter((k) => k.startsWith("webgl"))).toEqual(["webgl2", "webgl"])
    w.unmount()
  })
})
