// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { h, nextTick } from "vue"
import DemoCard from "@/pages/docs/DemoCard.vue"
import { hex, labelOf, readingOf, walk } from "@/pages/docs/inspector"

describe("docs inspector", () => {
  it("reads computed colours as hex", () => {
    expect(hex("rgb(237, 237, 237)")).toBe("#ededed")
    expect(hex("rgba(31, 111, 214, 0.5)")).toBe("#1f6fd680")
    expect(hex("rgb(31 111 214 / 50%)")).toBe("#1f6fd680")
    expect(hex("rgba(0, 0, 0, 0)")).toBe("transparent")
    expect(hex("oklab(0.5 0.1 0.1)")).toBe("oklab(0.5 0.1 0.1)")
  })

  it("names an element by tag, role and a short label", () => {
    document.body.innerHTML = `<div role="tablist"></div><button aria-label="Save"></button><nav role="navigation" aria-label="${"x".repeat(30)}"></nav>`
    const [list, button, nav] = document.body.children
    expect(labelOf(list)).toBe("div[tablist]")
    expect(labelOf(button)).toBe("button “Save”")
    expect(labelOf(nav)).toBe("nav[navigation]")
  })

  it("walks the tree without leaving its root", () => {
    document.body.innerHTML = `<section><div id="a"><span id="b"></span></div><p id="c"></p></section>`
    const root = document.querySelector("section")!
    const [a, b, c] = ["a", "b", "c"].map((id) => document.getElementById(id)!)
    expect(walk(a, root, "down")).toBe(b)
    expect(walk(b, root, "up")).toBe(a)
    expect(walk(a, root, "next")).toBe(c)
    expect(walk(c, root, "prev")).toBe(a)
    expect(walk(a, root, "up")).toBeNull()
    expect(walk(b, root, "down")).toBeNull()
    expect(walk(c, root, "next")).toBeNull()
  })

  it("reads padding and border sides for the padding band", () => {
    document.body.innerHTML = `<div id="f"><button style="padding: 4px 12px; border: 1px solid; border-radius: 6px"></button></div>`
    const r = readingOf(document.querySelector("button")!, document.getElementById("f")!)
    expect(r.pad).toEqual([4, 12, 4, 12])
    expect(r.edge).toEqual([1, 1, 1, 1])
    expect(r.radius).toBe("6")
    expect(r.padding).toBe("4 12")
  })

  it("keeps a press from reaching the demo while inspecting, and pins its target", async () => {
    // The setup's no-op observer would never reveal the slot; without one
    // DemoCard mounts it eagerly.
    vi.stubGlobal("IntersectionObserver", undefined)
    let clicks = 0
    const card = mount(DemoCard, {
      props: { code: "<DitherButton />" },
      slots: { default: () => h("button", { "aria-label": "Deploy", onClick: () => clicks++ }) },
      attachTo: document.body,
    })
    await nextTick()
    const demo = card.get("button[aria-label='Deploy']")
    await demo.trigger("click")
    expect(clicks).toBe(1)

    const toggle = card.findAll("button").find((b) => b.text() === "Inspect")!
    await toggle.trigger("click")
    expect(toggle.attributes("aria-pressed")).toBe("true")
    await demo.trigger("click")
    await nextTick()
    expect(clicks).toBe(1)
    expect(card.get("[aria-live]").text()).toBe("button “Deploy”, 0 by 0 pixels")

    const frame = card.get("[data-inspecting]")
    await frame.trigger("keydown", { key: "Escape" })
    expect(card.get("[aria-live]").text()).toBe("")
    await frame.trigger("keydown", { key: "Escape" })
    expect(toggle.attributes("aria-pressed")).toBe("false")
    expect(card.find("[data-inspecting]").exists()).toBe(false)
    card.unmount()
    vi.unstubAllGlobals()
  })
})
