// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Box from "../../dither-kit/Box.vue"
import Text from "../../dither-kit/Text.vue"
import Divider from "../../dither-kit/Divider.vue"
import VisuallyHidden from "../../dither-kit/VisuallyHidden.vue"

describe("Box", () => {
  it("renders the default div and swaps tags via as", () => {
    const d = mount(Box, { slots: { default: "content" } })
    expect(d.element.tagName).toBe("DIV")
    expect(d.text()).toBe("content")
    const s = mount(Box, { props: { as: "section" } })
    expect(s.element.tagName).toBe("SECTION")
  })

  it("merges the class prop and forwards attributes", () => {
    const w = mount(Box, { props: { class: "p-4 rounded" }, attrs: { id: "panel" } })
    expect(w.classes()).toContain("p-4")
    expect(w.classes()).toContain("rounded")
    expect(w.attributes("id")).toBe("panel")
  })
})

describe("Text", () => {
  it("maps tone and size to token utilities", () => {
    const w = mount(Text, { props: { tone: "muted", size: "xs" } })
    expect(w.classes()).toContain("text-muted-foreground")
    expect(w.classes()).toContain("text-[11px]")
  })

  it("defaults to a paragraph in foreground and honors as", () => {
    const w = mount(Text, { slots: { default: "hello" } })
    expect(w.element.tagName).toBe("P")
    expect(w.classes()).toContain("text-foreground")
    const h = mount(Text, { props: { as: "h3", size: "lg" } })
    expect(h.element.tagName).toBe("H3")
    expect(h.classes()).toContain("text-[15px]")
  })
})

describe("Divider", () => {
  it("renders a horizontal hr with separator semantics", () => {
    const w = mount(Divider)
    expect(w.element.tagName).toBe("HR")
    expect(w.attributes("role")).toBe("separator")
    expect(w.attributes("aria-orientation")).toBe("horizontal")
    expect(w.classes()).toContain("h-px")
  })

  it("renders a vertical divider that stretches in flex rows", () => {
    const w = mount(Divider, { props: { orientation: "vertical" } })
    expect(w.element.tagName).toBe("DIV")
    expect(w.attributes("aria-orientation")).toBe("vertical")
    expect(w.classes()).toContain("w-px")
    expect(w.classes()).toContain("self-stretch")
  })
})

describe("VisuallyHidden", () => {
  it("hides content with sr-only", () => {
    const w = mount(VisuallyHidden, { slots: { default: "label" } })
    expect(w.classes()).toContain("sr-only")
    expect(w.text()).toBe("label")
  })

  it("adds the focus reveal styles only when focusable", () => {
    const off = mount(VisuallyHidden, { slots: { default: "x" } })
    expect(off.classes().some((c) => c.includes("focus:"))).toBe(false)
    const on = mount(VisuallyHidden, { props: { focusable: true }, slots: { default: "x" } })
    expect(on.classes().some((c) => c.includes("focus:not-sr-only"))).toBe(true)
  })
})
