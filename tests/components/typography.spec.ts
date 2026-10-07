// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { describe, expect, it, vi } from "vitest"
import Heading from "../../dither-kit/Heading.vue"
import Label from "../../dither-kit/Label.vue"
import LineClamp from "../../dither-kit/LineClamp.vue"
import MiddleEllipsis from "../../dither-kit/MiddleEllipsis.vue"
import EllipsisTooltip from "../../dither-kit/EllipsisTooltip.vue"
import Link from "../../dither-kit/Link.vue"
import ExternalLink from "../../dither-kit/ExternalLink.vue"
import KbdCombo from "../../dither-kit/KbdCombo.vue"
import CopyableText from "../../dither-kit/CopyableText.vue"

describe("Heading", () => {
  it("maps level to the semantic tag and scale class", () => {
    for (const level of ["1", "2", "3", "4", "5", "6"] as const) {
      const w = mount(Heading, { props: { level }, slots: { default: "t" } })
      expect(w.element.tagName).toBe(`H${level}`)
    }
    expect(mount(Heading, { props: { level: "1" } }).classes()).toContain("text-2xl")
    expect(mount(Heading).element.tagName).toBe("H2") // default level
  })
})

describe("Label", () => {
  it("renders a real label and a hidden asterisk when required", () => {
    const w = mount(Label, { slots: { default: "Email" } })
    expect(w.find("label").exists()).toBe(true)
    expect(w.text()).not.toContain("*")
    const req = mount(Label, { props: { required: true }, slots: { default: "Email" } })
    expect(req.text()).toContain("*")
    expect(req.find("span").attributes("aria-hidden")).toBe("true")
  })
})

describe("LineClamp", () => {
  it("clamps 1–6 lines", () => {
    expect(mount(LineClamp, { props: { lines: 2 } }).classes()).toContain("line-clamp-2")
    expect(mount(LineClamp, { props: { lines: 6 } }).classes()).toContain("line-clamp-6")
    expect(mount(LineClamp).classes()).toContain("line-clamp-3")
  })
})

describe("MiddleEllipsis", () => {
  it("keeps both ends of a long identifier and passes short strings through", () => {
    const w = mount(MiddleEllipsis, { props: { text: "abcdefghij0123456789", head: 4, tail: 4 } })
    expect(w.text()).toBe("abcd…6789")
    expect(w.attributes("title")).toBe("abcdefghij0123456789")
    const short = mount(MiddleEllipsis, { props: { text: "short" } })
    expect(short.text()).toBe("short")
    const noTitle = mount(MiddleEllipsis, { props: { text: "abcdefghij0123456789", title: false } })
    expect(noTitle.attributes("title")).toBeUndefined()
  })
})

describe("EllipsisTooltip", () => {
  it("publishes title only while clipped, through the observer seam", async () => {
    let roCb: (() => void) | null = null
    class StubRO {
      constructor(cb: () => void) {
        roCb = cb
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", StubRO)

    const SENTENCE = "a sentence long enough to clip inside a narrow box"
    const w = mount(EllipsisTooltip, {
      slots: { default: SENTENCE },
      attachTo: document.body,
    })
    await nextTick()
    expect(w.attributes("title")).toBeUndefined() // jsdom: both widths 0

    const el = w.element as HTMLElement
    Object.defineProperty(el, "scrollWidth", { value: 300, configurable: true })
    Object.defineProperty(el, "clientWidth", { value: 100, configurable: true })
    roCb?.() // resize fires -> re-measure
    await nextTick()
    expect(w.attributes("title")).toBe(SENTENCE)

    Object.defineProperty(el, "scrollWidth", { value: 100, configurable: true })
    roCb?.() // shrinking back drops the tooltip
    await nextTick()
    expect(w.attributes("title")).toBeUndefined()
    w.unmount()
    vi.unstubAllGlobals()
  })

  it("never tootips when disabled", async () => {
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      disconnect() {}
    })
    const w = mount(EllipsisTooltip, {
      props: { enabled: false },
      slots: { default: "clipped text" },
      attachTo: document.body,
    })
    const el = w.element as HTMLElement
    Object.defineProperty(el, "scrollWidth", { value: 300, configurable: true })
    Object.defineProperty(el, "clientWidth", { value: 10, configurable: true })
    await nextTick()
    expect(w.attributes("title")).toBeUndefined()
    w.unmount()
    vi.unstubAllGlobals()
  })
})

describe("Link / ExternalLink", () => {
  it("dresses internal anchors and hardens external ones", () => {
    const internal = mount(Link, { props: { href: "#x" }, slots: { default: "go" } })
    expect(internal.attributes("target")).toBeUndefined()
    expect(internal.classes().some((c) => c.includes("underline"))).toBe(true)
    const external = mount(ExternalLink, { props: { href: "https://example.com" }, slots: { default: "out" } })
    expect(external.attributes("target")).toBe("_blank")
    expect(external.attributes("rel")).toBe("noreferrer")
    expect(external.find("svg").exists()).toBe(true) // ExternalLink glyph
  })
})

describe("KbdCombo", () => {
  it("renders one chip per key with separators between", () => {
    const w = mount(KbdCombo, { props: { keys: ["Ctrl", "Shift", "P"], separator: "›" } })
    expect(w.text()).toContain("Ctrl")
    expect(w.text()).toContain("›")
    expect(w.text().indexOf("Ctrl")).toBeLessThan(w.text().indexOf("P"))
    expect(w.findAll("kbd").length).toBe(3)
  })
})

describe("CopyableText", () => {
  it("copies the value and flips its accessible name", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
    const w = mount(CopyableText, { props: { value: "token-123" }, slots: { default: "copy" } })
    await w.find("button").trigger("click")
    expect(writeText).toHaveBeenCalledWith("token-123")
    expect(w.find("button").attributes("aria-label")).toBe("Copied")
  })
})
