// @rstest-environment jsdom
import { afterEach, describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import DocsNav, { NAV_LINK } from "@/pages/docs/DocsNav.vue"
import DocsSheet, { SHEET_ID } from "@/pages/docs/DocsSheet.vue"
import { GROUPS } from "@/pages/docs/groups"
import { SHEET_WIPE, bandFill } from "@/widgets/site-header/menu"

const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id))

describe("docs section list", () => {
  it("lists every section once, the one in view current, a tap naming it", async () => {
    const w = mount(DocsNav, { props: { activeId: "slider", variant: "rail" } })
    const links = w.findAll("a")
    expect(links.map((a) => a.attributes("href")?.replace(/.*\/docs\//, ""))).toEqual(ids)
    expect(w.findAll("[aria-current]").map((a) => a.text())).toEqual(["Slider"])
    await links[3].trigger("click")
    expect(w.emitted("go")?.[0]).toEqual([ids[3]])
  })

  it("scrolls the rail, never the page, to put the current link in its middle", async () => {
    const rail = document.createElement("aside")
    rail.style.overflowY = "auto"
    document.body.append(rail)
    const w = mount(DocsNav, { props: { activeId: ids[0], variant: "rail" }, attachTo: rail })
    rail.getBoundingClientRect = () => ({ top: 0, bottom: 800, height: 800 }) as DOMRect
    const calls: ScrollToOptions[] = []
    rail.scrollTo = ((o: ScrollToOptions) => calls.push(o)) as typeof rail.scrollTo
    const page = window.scrollTo
    let pageMoved = false
    window.scrollTo = (() => (pageMoved = true)) as typeof window.scrollTo
    // The next section's link lies far below the rail's view.
    const far = ids[40]
    for (const a of w.findAll("a")) {
      ;(a.element as HTMLElement).getBoundingClientRect = () =>
        (a.attributes("href")?.endsWith(`/${far}`) ? { top: 3000, bottom: 3025 } : { top: 0, bottom: 25 }) as DOMRect
    }
    await w.setProps({ activeId: far })
    await new Promise((r) => setTimeout(r, 0))
    expect(calls.at(-1)?.top).toBe(3000 - 400)
    expect(pageMoved).toBe(false)
    window.scrollTo = page
    w.unmount()
    rail.remove()
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
    // The header stands at its head, "Close" where the sections key was, and
    // each family is a band of the menu's, one step of the ink per family.
    expect(dialog.querySelector(".sheet-head .site-capsule")).not.toBeNull()
    const bands = [...dialog.querySelectorAll<HTMLElement>(".nav-grp")]
    expect(bands).toHaveLength(GROUPS.length)
    expect(bands.map((b) => b.style.background)).toEqual(GROUPS.map((_, i) => bandFill(i, GROUPS.length)))
    expect(new Set(bands.map((b) => b.style.background)).size).toBe(GROUPS.length)
    // Escape and the close key each ask to close.
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    dialog.querySelector<HTMLButtonElement>('[aria-label="Close sections"]')!.click()
    expect(w.emitted("close")).toHaveLength(2)
    // Closed: the page scrolls again and focus goes back to the key.
    await w.setProps({ open: false })
    // It rolls back up over the wipe's length, then goes.
    await new Promise((r) => setTimeout(r, SHEET_WIPE.duration * 1000 + 50))
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
