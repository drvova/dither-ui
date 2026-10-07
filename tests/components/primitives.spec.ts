// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { describe, expect, it, vi } from "vitest"
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

// ---------------------------------------------------------------------------
// Batch 2: interaction and a11y primitives
// ---------------------------------------------------------------------------
import Svg from "../../dither-kit/Svg.vue"
import Img from "../../dither-kit/Image.vue"
import Spacer from "../../dither-kit/Spacer.vue"
import Portal from "../../dither-kit/Portal.vue"
import Overlay from "../../dither-kit/Overlay.vue"
import Measure from "../../dither-kit/Measure.vue"
import Clipboard from "../../dither-kit/Clipboard.vue"
import ClickOutside from "../../dither-kit/ClickOutside.vue"
import FocusRing from "../../dither-kit/FocusRing.vue"
import FocusScope from "../../dither-kit/FocusScope.vue"
import HoverArea from "../../dither-kit/HoverArea.vue"
import Pressable from "../../dither-kit/Pressable.vue"
import InView from "../../dither-kit/InView.vue"

describe("Svg", () => {
  it("is aria-hidden by default and labeled when given a name", () => {
    const deco = mount(Svg, { slots: { default: "<path />" } })
    expect(deco.attributes("aria-hidden")).toBe("true")
    expect(deco.attributes("role")).toBeUndefined()
    const named = mount(Svg, { props: { label: "Close" } })
    expect(named.attributes("role")).toBe("img")
    expect(named.attributes("aria-label")).toBe("Close")
    expect(named.attributes("aria-hidden")).toBeUndefined()
  })
})

describe("Img", () => {
  it("carries the loading contract and required alt", () => {
    const w = mount(Img, { props: { src: "/a.png", alt: "" } })
    expect(w.attributes("src")).toBe("/a.png")
    expect(w.attributes("alt")).toBe("")
    expect(w.attributes("loading")).toBe("lazy")
    expect(w.attributes("decoding")).toBe("async")
    const eager = mount(Img, { props: { src: "/a.png", alt: "x", loading: "eager" } })
    expect(eager.attributes("loading")).toBe("eager")
  })
})

describe("Spacer", () => {
  it("maps axis and size to literal space classes", () => {
    expect(mount(Spacer).classes()).toContain("h-[16px]")
    expect(mount(Spacer, { props: { axis: "x", size: "xl" } }).classes()).toContain("w-[40px]")
    expect(mount(Spacer, { props: { size: "xs" } }).classes()).toContain("h-[4px]")
    expect(mount(Spacer).attributes("aria-hidden")).toBe("true")
  })
})

describe("Portal", () => {
  it("renders into body and stays in place when disabled", () => {
    const live = mount(Portal, { slots: { default: "<span>tele</span>" }, attachTo: document.body })
    expect(document.body.querySelector("span")?.textContent).toBe("tele")
    live.unmount()
    const inline = mount(Portal, { props: { disabled: true }, slots: { default: "<span>inline</span>" } })
    expect(inline.find("span").exists()).toBe(true)
    inline.unmount()
  })
})

describe("Overlay", () => {
  it("dims, stays click-transparent, and is hidden from AT by default", () => {
    const w = mount(Overlay, { props: { dim: "medium" } })
    expect(w.classes()).toContain("bg-background/40")
    expect(w.classes()).toContain("pointer-events-none")
    expect(w.attributes("aria-hidden")).toBe("true")
    const live = mount(Overlay, { props: { interactive: true } })
    expect(live.classes()).toContain("pointer-events-auto")
    expect(live.attributes("aria-hidden")).toBeUndefined()
  })
})

describe("Measure", () => {
  it("emits resize from ResizeObserver and renders without one", () => {
    const instances: Array<(e: unknown[]) => void> = []
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: (e: unknown[]) => void) {
          instances.push(cb)
        }
        observe() {}
        disconnect() {}
      },
    )
    const w = mount(Measure, { slots: { default: "<div>x</div>" } })
    expect(instances.length).toBe(1)
    instances[0]([{ contentRect: { width: 240, height: 80 } }])
    expect(w.emitted("resize")?.[0]).toEqual([{ width: 240, height: 80 }])
    vi.unstubAllGlobals()
  })
})

describe("Clipboard", () => {
  it("writes the value, flips the slot state, and announces politely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
    const w = mount(Clipboard, {
      props: { value: "hello" },
      slots: { default: `<template #default="{ copied }"><button type="button">{{ copied ? "y" : "n" }}</button></template>` },
    })
    await w.find("button").trigger("click")
    expect(writeText).toHaveBeenCalledWith("hello")
    expect(w.emitted("copied")?.[0]).toEqual(["hello"])
    expect(w.find('[role="status"]').text()).toBe("Copied to clipboard")
    expect(w.text()).toContain("y")
  })
})

describe("ClickOutside", () => {
  it("emits outside for presses beyond the root and stays silent inside", async () => {
    const onOutside = vi.fn()
    const w = mount(ClickOutside, { slots: { default: "<button>in</button>" }, attrs: { onOutside }, attachTo: document.body })
    await w.find("button").trigger("pointerdown")
    expect(onOutside).not.toHaveBeenCalled()
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    expect(onOutside).toHaveBeenCalledTimes(1)
    w.unmount()
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })) // listener torn down
    expect(onOutside).toHaveBeenCalledTimes(1)
  })
})

describe("FocusRing", () => {
  it("carries the focus-within ring", () => {
    const w = mount(FocusRing, { slots: { default: "<button>x</button>" } })
    expect(w.classes().some((c) => c.includes("focus-within:ring-2"))).toBe(true)
  })
})

describe("FocusScope", () => {
  it("autofocuses the first focusable, traps Tab, and restores focus", async () => {
    const outside = document.createElement("button")
    document.body.appendChild(outside)
    outside.focus()
    const w = mount(FocusScope, {
      slots: {
        default: `<button id="a">a</button><button id="b">b</button>`,
      },
      attachTo: document.body,
    })
    await nextTick()
    await nextTick()
    expect(document.activeElement?.id).toBe("a")

    // Tab from the last item wraps to the first
    document.getElementById("b")!.focus()
    await w.find("div").trigger("keydown", { key: "Tab" })
    expect(document.activeElement?.id).toBe("a")

    // Shift+Tab from the first wraps to the last
    await w.find("div").trigger("keydown", { key: "Tab", shiftKey: true })
    expect(document.activeElement?.id).toBe("b")

    w.unmount()
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })
})

describe("HoverArea", () => {
  it("exposes pointer and focus state to the slot", async () => {
    const w = mount(HoverArea, {
      slots: { default: `<div class="inner">{{ hovered || focused ? "on" : "off" }}</div>` },
    })
    expect(w.find(".inner").text()).toBe("off")
    await w.trigger("pointerenter")
    expect(w.find(".inner").text()).toBe("on")
    await w.trigger("pointerleave")
    expect(w.find(".inner").text()).toBe("off")
    await w.trigger("focusin")
    expect(w.find(".inner").text()).toBe("on")
  })
})

describe("Pressable", () => {
  it("is a native non-submitting button with the press affordance", () => {
    const w = mount(Pressable, { slots: { default: "go" } })
    expect(w.find("button").attributes("type")).toBe("button")
    expect(w.classes().some((c) => c.includes("active:scale"))).toBe(true)
    const dis = mount(Pressable, { props: { disabled: true } })
    expect(dis.find("button").attributes("disabled")).toBeDefined()
  })
})

describe("InView", () => {
  it("renders always without IO, latches on enter with it", async () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const degraded = mount(InView, { slots: { default: `<div>{{ inView ? "in" : "out" }}</div>` } })
    expect(degraded.find("div").text()).toBe("in")
    vi.unstubAllGlobals()

    let instance: { cb: (e: unknown[]) => void; disconnected: boolean } | null = null
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        cb: (e: unknown[]) => void
        disconnected = false
        constructor(cb: (e: unknown[]) => void) {
          this.cb = cb
          instance = { cb, disconnected: false }
        }
        observe() {}
        disconnect() {
          this.disconnected = true
          if (instance) instance.disconnected = true
        }
      },
    )
    const w = mount(InView, { slots: { default: `<div>{{ inView ? "in" : "out" }}</div>` } })
    expect(w.find("div").text()).toBe("out")
    await nextTick() // the root watcher connects on the post-mount flush
    instance!.cb([{ isIntersecting: true, target: document.body }])
    await nextTick()
    expect(w.find("div").text()).toBe("in")
    expect(w.emitted("enter")?.length).toBe(1)
    expect(instance!.disconnected).toBe(true) // once = latched
    vi.unstubAllGlobals()
  })
})
