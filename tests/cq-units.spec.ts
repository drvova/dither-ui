// @vitest-environment jsdom
// Container units as first-class transform distances: numbers stay px,
// strings ride the nearest query container, and the shipped keyframes must
// measure cqw/cqh — never the viewport.
import { readFileSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mount } from "@vue/test-utils"
import AnimatedContent from "../dither-kit/AnimatedContent.vue"

/** IO that never fires: reveal-on-view components must keep their hidden
 * transform so the offset string stays observable. */
class NeverIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => vi.stubGlobal("IntersectionObserver", NeverIntersectionObserver))
afterEach(() => vi.unstubAllGlobals())

describe("container units in transforms", () => {
  it("AnimatedContent: numbers stay px, direction picks the axis", () => {
    const a = mount(AnimatedContent, { props: { distance: 40 } })
    expect((a.element as HTMLElement).style.transform).toBe("translateY(40px)")
    const b = mount(AnimatedContent, { props: { distance: 40, reverse: true } })
    expect((b.element as HTMLElement).style.transform).toBe("translateY(-40px)")
    const c = mount(AnimatedContent, { props: { distance: 40, direction: "horizontal" } })
    expect((c.element as HTMLElement).style.transform).toBe("translateX(40px)")
  })

  it("AnimatedContent: CSS length strings pass through with sign handling", () => {
    const a = mount(AnimatedContent, { props: { distance: "4cqw" } })
    expect((a.element as HTMLElement).style.transform).toBe("translateY(4cqw)")
    const b = mount(AnimatedContent, { props: { distance: "6cqh", direction: "horizontal" } })
    expect((b.element as HTMLElement).style.transform).toBe("translateX(6cqh)")
    const c = mount(AnimatedContent, { props: { distance: "6cqh", reverse: true } })
    expect((c.element as HTMLElement).style.transform).toBe("translateY(-6cqh)")
    const d = mount(AnimatedContent, { props: { distance: "-4cqw", reverse: true } })
    expect((d.element as HTMLElement).style.transform).toBe("translateY(4cqw)")
    const e = mount(AnimatedContent, { props: { distance: "1em" } })
    expect((e.element as HTMLElement).style.transform).toBe("translateY(1em)")
  })

  it("DitherContainer ships container-relative keyframes with no viewport units", () => {
    const src = readFileSync("dither-kit/DitherContainer.vue", "utf8")
    const start = src.indexOf("@keyframes dither-cq-traverse")
    expect(start).toBeGreaterThan(-1)
    const keyframes = src.slice(start)
    expect(keyframes).toContain("translateX(-100cqw)")
    expect(keyframes).toContain("translateX(100cqw)")
    expect(keyframes).toContain("translateY(-100cqh)")
    expect(keyframes).toContain("translateY(100cqh)")
    // viewport leak guard: traversal must never be measured in vw/vh
    expect(keyframes).not.toMatch(/translate[XY]\(-?[\d.]+v[wh]\)/)
  })
})
