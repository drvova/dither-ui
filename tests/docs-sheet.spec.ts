// @rstest-environment jsdom
import { afterEach, describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import DocsNav, { NAV_LINK } from "@/pages/docs/DocsNav.vue"
import DocsSheet, { SHEET_ID } from "@/pages/docs/DocsSheet.vue"
import { GROUPS } from "@/pages/docs/groups"
import { spyMargin, spySections } from "@/pages/docs/scroll-spy"

const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id))

describe("docs scroll-spy", () => {
  // A fake observer: the test hands it the entries that changed, as the
  // browser does, never the whole band.
  type Entry = { target: Element; isIntersecting: boolean }
  let fire: (entries: Entry[]) => void = () => {}
  const real = globalThis.IntersectionObserver
  afterEach(() => {
    globalThis.IntersectionObserver = real
  })
  const section = (id: string, top: number) => {
    const el = document.createElement("section")
    el.id = id
    el.getBoundingClientRect = () => ({ top }) as DOMRect
    return el
  }

  it("keeps a section already in the band when the next one enters", () => {
    globalThis.IntersectionObserver = class {
      constructor(cb: (e: Entry[]) => void) {
        fire = cb
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
    const a = section("aurora", 96)
    const b = section("waves", 420)
    const seen: string[] = []
    spySections([a, b], (id) => seen.push(id))
    fire([{ target: a, isIntersecting: true }])
    // Only the newcomer changed: the topmost of the whole band still wins.
    fire([{ target: b, isIntersecting: true }])
    expect(seen).toEqual(["aurora", "aurora"])
    fire([{ target: a, isIntersecting: false }])
    expect(seen.at(-1)).toBe("waves")
    // Between sections the last one stays: no call with an empty band.
    fire([{ target: b, isIntersecting: false }])
    expect(seen).toHaveLength(3)
  })
})

describe("docs scroll-spy band", () => {
  const real = globalThis.IntersectionObserver
  afterEach(() => {
    globalThis.IntersectionObserver = real
  })
  it("runs from the header to the middle in px, and follows the viewport's height", () => {
    // A percentage resolves against the root's width: px only.
    expect(spyMargin(900)).toBe("-56px 0px -450px 0px")
    const margins: string[] = []
    globalThis.IntersectionObserver = class {
      constructor(_cb: unknown, opts: IntersectionObserverInit) {
        margins.push(String(opts.rootMargin))
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
    const height = window.innerHeight
    const stop = spySections([document.createElement("section")], () => {})
    expect(margins).toEqual([spyMargin(height)])
    Object.defineProperty(window, "innerHeight", { value: height + 200, configurable: true })
    window.dispatchEvent(new Event("resize"))
    expect(margins.at(-1)).toBe(spyMargin(height + 200))
    stop()
    Object.defineProperty(window, "innerHeight", { value: height, configurable: true })
  })
})

describe("docs section list", () => {
  it("lists every section once, the one in view current, a tap naming it", async () => {
    const w = mount(DocsNav, { props: { activeId: "slider", variant: "rail" } })
    const links = w.findAll("a")
    expect(links.map((a) => a.attributes("href")?.replace(/.*\/docs\//, ""))).toEqual(ids)
    expect(w.findAll("[aria-current]").map((a) => a.text())).toEqual(["Slider"])
    await links[3].trigger("click")
    expect(w.emitted("go")?.[0]).toEqual([ids[3]])
  })

  it("keeps its links 24px targets (WCAG 2.5.8): rail for a pointer, sheet for a finger", () => {
    // Each link is its text's line (1.5) plus its padding, 4px a unit.
    for (const cls of Object.values(NAV_LINK)) {
      const pad = Number(/py-([\d.]+)/.exec(cls)![1]) * 4
      const size = Number(/text-\[(\d+)px\]/.exec(cls)![1])
      expect(size * 1.5 + pad * 2).toBeGreaterThanOrEqual(24)
    }
    const sheet = (s: string) => Number(/py-([\d.]+)/.exec(s)![1])
    expect(sheet(NAV_LINK.sheet)).toBeGreaterThan(sheet(NAV_LINK.rail))
  })
})

describe("docs sections sheet", () => {
  const parts = () => {
    const h = document.createElement("h2")
    const t = document.createElement("table")
    return [
      { label: "Slider", el: h },
      { label: "API", el: t },
    ]
  }

  it("opens as a modal with focus inside, holds the page and closes every way", async () => {
    const key = document.createElement("button")
    document.body.append(key)
    key.focus()
    const shown = parts()
    const w = mount(DocsSheet, {
      props: { open: false, activeId: "slider", parts: shown },
      attachTo: document.body,
    })
    expect(document.getElementById(SHEET_ID)).toBeNull()
    await w.setProps({ open: true })
    await nextTick()
    await nextTick()
    const dialog = document.getElementById(SHEET_ID)!
    expect(dialog.getAttribute("role")).toBe("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.getAttribute("aria-label")).toBe("Docs sections")
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close sections")
    expect(document.documentElement.style.overflow).toBe("hidden")
    // The section in view and the parts of it, a tap on each naming it.
    expect(dialog.querySelector("[aria-current]")?.textContent?.trim()).toBe("Slider")
    const api = [
      ...dialog.querySelectorAll<HTMLButtonElement>('[aria-current] + ul[aria-label="On this page"] button'),
    ].find((b) => b.textContent?.trim() === "API")!
    api.click()
    expect(w.emitted("part")?.[0]?.[0]).toBe(shown[1].el)
    dialog.querySelector<HTMLAnchorElement>('a[href$="/docs/aurora"]')!.click()
    expect(w.emitted("go")?.[0]).toEqual(["aurora"])
    // Escape, the close key and the backdrop each ask to close.
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    dialog.querySelector<HTMLButtonElement>('[aria-label="Close sections"]')!.click()
    dialog.parentElement!.querySelector<HTMLElement>('[aria-hidden="true"]')!.click()
    expect(w.emitted("close")).toHaveLength(3)
    // Closed: the page scrolls again and focus goes back to the key.
    await w.setProps({ open: false })
    await new Promise((r) => setTimeout(r, 350))
    expect(document.documentElement.style.overflow).toBe("")
    expect(document.activeElement).toBe(key)
    w.unmount()
    key.remove()
  })

  it("leaves the parts out when the section in view has only its heading", async () => {
    const w = mount(DocsSheet, { props: { open: true, activeId: "slider", parts: parts().slice(0, 1) } })
    await nextTick()
    expect(w.find('[aria-label="On this page"]').exists()).toBe(false)
    w.unmount()
    expect(document.documentElement.style.overflow).toBe("")
  })
})
