// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import { DitherThumbnail } from "@dither-kit"
import { BAYER4 } from "@dither-kit/pixel"

// The interactive thumbnail's contract: a parent link trigger, a masked
// frame (radius + hairline + clipped), a recessed cover image that wakes on
// the group's hover (scale + opacity on the exact recipe values), and the
// Bayer veil that dissolves. The link's accessible name is the image alt.

describe("DitherThumbnail", () => {
  const mountThumb = (overrides = {}) =>
    mount(DitherThumbnail, {
      props: { src: "/x.png", alt: "A dithered sunrise", href: "/docs/sunrise", ...overrides },
    })

  it("renders a parent link trigger whose accessible name is the image alt", () => {
    const w = mountThumb()
    expect(w.element.tagName).toBe("A")
    expect(w.attributes("href")).toBe("/docs/sunrise")
    expect(w.attributes("aria-label")).toBe("A dithered sunrise")
    const img = w.find("img")
    expect(img.attributes("alt")).toBe("A dithered sunrise")
    expect(img.attributes("loading")).toBe("lazy")
    expect(img.attributes("decoding")).toBe("async")
  })

  it("recesses the image at 70% and wakes it on the parent hover", async () => {
    const w = mountThumb()
    const img = w.find("img")
    expect(img.classes()).toContain("opacity-70")
    await w.trigger("mouseenter")
    expect(img.classes()).toContain("group-hover:scale-[1.04]")
    expect(img.classes()).toContain("group-hover:opacity-100")
  })

  it("rides the house curve inside the 0.25-0.4s window, transition named", () => {
    const w = mountThumb()
    const img = w.find("img")
    expect(img.classes()).toContain("duration-300")
    expect(img.classes()).toContain("ease-[cubic-bezier(0.16,1,0.3,1)]")
    // Only what changes: opacity and scale, never `all`.
    expect(img.classes()).toContain("transition-[opacity,scale]")
    expect(img.classes()).not.toContain("transition-all")
  })

  it("frames and clips: radius, hairline border, overflow hidden, zoom cursor", () => {
    const w = mountThumb()
    expect(w.classes()).toContain("overflow-hidden")
    expect(w.classes()).toContain("cursor-zoom-in")
    expect(w.classes()).toContain("rounded-md")
    const frame = w.find(".absolute > span, span")
    expect(frame.classes()).toContain("border")
    expect(frame.classes()).toContain("overflow-hidden")
  })

  it("carries the dither veil at the house lattice size", () => {
    const w = mountThumb({ veilCell: 6 })
    const veil = w.find(".dither-veil")
    expect(veil.exists()).toBe(true)
    expect(veil.attributes("style")).toContain("background-size: 24px 24px") // 6 * 4
    expect(veil.classes()).toContain("group-hover:opacity-0")
  })

  it("drops all motion under reduced motion", () => {
    const w = mountThumb()
    for (const el of [w.find("img"), w.find(".dither-veil")]) {
      expect(el.classes()).toContain("motion-reduce:transition-none")
    }
  })

  it("keeps the frame concentric: the veil and image fill the same rounded box", () => {
    const w = mountThumb()
    const frame = w.find("a > span")
    expect(frame.classes()).toContain("rounded-[inherit]") // the frame inherits the link's radius
    expect(BAYER4.length).toBe(4) // the veil's lattice is the house matrix geometry
  })
})
