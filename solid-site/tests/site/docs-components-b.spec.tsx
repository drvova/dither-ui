// The docs' component packs on Solid, second half (`src/pages/docs/components/`:
// Navigation, Overlay, Selection, Structure, Surface): each pack's sections
// against the nav table the rail, the search and the crawler read, each
// preview mounting its demo once in view, the snippets held to the Vue
// site's character for character, and the demos' own state.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { NAVIGATION_NAV } from "@/pages/docs/components/navigation-nav"
import { OVERLAY_NAV } from "@/pages/docs/components/overlay-nav"
import { SELECTION_NAV } from "@/pages/docs/components/selection-nav"
import { STRUCTURE_NAV } from "@/pages/docs/components/structure-nav"
import { SURFACE_NAV } from "@/pages/docs/components/surface-nav"
import NavigationDocs from "../../src/pages/docs/components/NavigationDocs"
import OverlayDocs from "../../src/pages/docs/components/OverlayDocs"
import SelectionDocs from "../../src/pages/docs/components/SelectionDocs"
import StructureDocs from "../../src/pages/docs/components/StructureDocs"
import SurfaceDocs from "../../src/pages/docs/components/SurfaceDocs"
import { world } from "../world"

const PACKS: { name: string; Pack: () => JSX.Element; nav: readonly { id: string; label: string }[] }[] = [
  { name: "NavigationDocs", Pack: NavigationDocs, nav: NAVIGATION_NAV },
  { name: "OverlayDocs", Pack: OverlayDocs, nav: OVERLAY_NAV },
  { name: "SelectionDocs", Pack: SelectionDocs, nav: SELECTION_NAV },
  { name: "StructureDocs", Pack: StructureDocs, nav: STRUCTURE_NAV },
  { name: "SurfaceDocs", Pack: SurfaceDocs, nav: SURFACE_NAV },
]

// the specs run from the app's folder (`solid-site/`)
const SITE = process.cwd()

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  document.body.innerHTML = ""
})

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
}
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, " ").trim() ?? ""
const section = (root: Element, id: string) => root.querySelector(`section[id="${id}"]`)!
const button = (root: Element, name: string) =>
  [...root.querySelectorAll("button")].find((b) => text(b) === name || b.getAttribute("aria-label") === name)!
const waiting = (card: Element) => !!card.querySelector('.demo-well [aria-hidden="true"].animate-pulse')

describe.each(PACKS)("$name", ({ Pack, nav }) => {
  it("renders the nav table's sections, in order, each under its heading", () => {
    const { container } = render(() => <Pack />)
    const sections = [...container.children]
    expect(sections.every((s) => s.tagName === "SECTION")).toBe(true)
    expect(sections.map((s) => s.id)).toEqual(nav.map((n) => n.id))
    for (const [i, s] of sections.entries()) {
      expect(s.className).toBe("mt-16 scroll-mt-24")
      const heads = s.querySelectorAll("h2")
      expect(heads.length).toBe(1)
      expect(text(heads[0])).toBe(nav[i].label)
      // a lede under the heading, a preview, and the API as a table
      expect(s.querySelector(":scope > p")!.className).toContain("text-muted-foreground")
      expect(s.querySelectorAll("[data-demo-card]").length).toBeGreaterThan(0)
      expect(s.querySelector("table")).not.toBeNull()
    }
  })

  it("mounts each preview's demo once it comes into view, and not before", async () => {
    const { container } = render(() => <Pack />)
    const cards = [...container.querySelectorAll("[data-demo-card]")]
    expect(cards.length).toBeGreaterThanOrEqual(nav.length)
    for (const card of cards) expect(waiting(card)).toBe(true)
    w.show()
    await settle()
    for (const card of cards) {
      expect(waiting(card)).toBe(false)
      const demo = card.querySelector(".demo-well > .w-full")!
      expect(demo.children.length).toBeGreaterThan(0)
    }
  })
})

// The snippets are the authored notation the tooling derives Solid and
// Svelte from: the same characters as the Vue site's.
describe("snippets", () => {
  const SNIPPET = /const (SNIPPET_\w+) = (?:\w+\(\s*\(\) => )?`((?:[^`\\]|\\[\s\S])*)`/g
  const snippets = (source: string) =>
    Object.fromEntries(
      [...source.matchAll(SNIPPET)].map((m) => [m[1], m[2].replace(/\b(\w+)\.value\b/g, "$1()").replace(/\\\//g, "/")]),
    )
  const api = (source: string) => /const API: Record<string, PropRow\[\]> = \{[\s\S]*?\n\}/.exec(source)![0]

  it.each(PACKS)("$name carries its Vue twin's snippets and API rows verbatim", ({ name }) => {
    const vue = readFileSync(join(SITE, "../src/pages/docs/components", `${name}.vue`), "utf8")
    const solid = readFileSync(join(SITE, "src/pages/docs/components", `${name}.tsx`), "utf8")
    const theirs = snippets(vue)
    expect(Object.keys(theirs).length).toBeGreaterThan(0)
    expect(snippets(solid)).toEqual(theirs)
    expect(api(solid)).toBe(api(vue))
  })
})

describe("the demos' own state", () => {
  async function open(Pack: () => JSX.Element) {
    const view = render(() => <Pack />)
    w.show()
    await settle()
    return view.container
  }

  it("Navigation: the pager moves its line, the rating reads its value, the seeds reroll in place", async () => {
    const root = await open(NavigationDocs)
    const pager = section(root, "pagination")
    expect(text(pager)).toContain("on page 3 of 12")
    fireEvent.click(button(pager, "4") ?? button(pager, "Page 4"))
    expect(text(pager)).toContain("on page 4 of 12")

    const rating = section(root, "rating")
    expect(text(rating)).toContain("3 / 5 (click or arrow-key)")
    const stars = [...rating.querySelectorAll('[role="img"], [role="slider"]')]
    expect(stars.length).toBe(9)
    fireEvent.click(button(rating, "Reroll star seeds"))
    // rerolled by index: the same four ratings stay mounted
    expect([...rating.querySelectorAll('[role="img"], [role="slider"]')].slice(5)).toEqual(stars.slice(5))

    expect(section(root, "breadcrumb").querySelector('[aria-current="page"]')!.textContent).toBe("Breadcrumb")
    expect(text(section(root, "timeline"))).toContain("Kicked off")
  })

  it("Overlay: the popover opens from its trigger, the menu reports its pick, ⌘K toggles the palette", async () => {
    const root = await open(OverlayDocs)
    const popover = section(root, "popover")
    expect(document.body.textContent).not.toContain("Anchored to its trigger.")
    fireEvent.click(button(popover, "Open popover"))
    expect(document.body.textContent).toContain("Anchored to its trigger.")

    const menu = section(root, "menu")
    expect(text(menu)).toContain("last action: none")
    fireEvent.click(button(menu, "Actions"))
    fireEvent.click([...document.querySelectorAll('[role="menuitem"]')].find((i) => text(i) === "Duplicate")!)
    expect(text(menu)).toContain("last action: Duplicate")

    expect(text(section(root, "context-menu"))).toContain("right-click me")
    expect(section(root, "menubar").querySelector('[role="menubar"]')).not.toBeNull()
    expect(text(section(root, "tooltip"))).toContain("frozen")
    expect(text(section(root, "preview-card"))).toContain("@ada")

    const command = section(root, "command")
    expect(text(command)).toContain("last ran: none")
    const palette = () => document.querySelector('[role="dialog"] input, [role="combobox"]')
    expect(palette()).toBeNull()
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await settle()
    expect(palette()).not.toBeNull()
    fireEvent.keyDown(window, { key: "K", ctrlKey: true })
    await settle()
    w.frame(0)
  })

  it("Overlay: the hotkey leaves with the page", async () => {
    const view = render(() => <OverlayDocs />)
    view.unmount()
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it("Selection: each control writes the line under it", async () => {
    const root = await open(SelectionDocs)
    expect(text(section(root, "select"))).toContain('chart: "area"')
    expect(text(section(root, "combobox"))).toContain('swatch: "blue"')
    expect(text(section(root, "autocomplete"))).toContain('term: ""')
    expect(text(section(root, "wheel-picker"))).toContain("time: 09:30")
    expect(text(section(root, "checkbox-group"))).toContain("parts: [grid, axes]")

    const radio = section(root, "radio")
    expect(text(radio)).toContain('bloom: "low"')
    fireEvent.click([...radio.querySelectorAll('[role="radio"]')].find((r) => text(r) === "High")!)
    expect(text(radio)).toContain('bloom: "high"')

    const toggle = section(root, "toggle")
    expect(text(toggle)).toContain("bloom: true")
    fireEvent.click(toggle.querySelector(".demo-well button[aria-pressed]")!)
    expect(text(toggle)).toContain("bloom: false")

    const group = section(root, "toggle-group")
    expect(text(group)).toContain('align: "left", styles: [bold]')
    fireEvent.click(button(group, "Center"))
    fireEvent.click(button(group, "Italic"))
    expect(text(group)).toContain('align: "center", styles: [bold, italic]')
  })

  it("Structure: tabs show their panel, the variants share one value, the dialog opens and confirms", async () => {
    const root = await open(StructureDocs)
    const tabs = section(root, "tabs")
    const shown = () =>
      [...tabs.querySelector("[data-demo-card]")!.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
        .filter((p) => p.style.display !== "none")
        .map(text)
    expect(shown()).toEqual(["Requests are steady; nothing on fire."])
    const card = tabs.querySelector("[data-demo-card]")!
    fireEvent.click([...card.querySelectorAll('[role="tab"]')].find((t) => text(t) === "Logs")!)
    expect(shown()).toEqual(["3 warnings in the last hour, zero errors."])
    expect([...tabs.querySelectorAll("h3")].map(text)).toEqual(["Variants", "Vertical, badges and disabled"])
    // three variants and the vertical rail stand outside the card
    expect([...tabs.querySelectorAll('[role="tablist"]')].filter((t) => !t.closest("[data-demo-card]")).length).toBe(4)
    expect(text(tabs)).toContain("Inbox: 12 items.")

    const dialog = section(root, "dialog")
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    fireEvent.click(button(dialog, "Open dialog"))
    await settle()
    const sheet = document.querySelector('[role="dialog"]')!
    expect(text(sheet)).toContain("Ship the dithered build to production?")
    expect(button(sheet, "Confirm")).toBeDefined()

    expect(section(root, "collapsible").querySelectorAll("button[aria-expanded]").length).toBe(2)
    expect(section(root, "kbd").querySelectorAll("kbd").length).toBe(3)
  })

  it("Surface: the alert reports the choice, the sidebar its pick, the swipe strip mounts only when armed", async () => {
    const root = await open(SurfaceDocs)
    const accordion = section(root, "accordion")
    expect(text(accordion)).toContain("One engine paints every fill, so components stay coherent.")

    const alert = section(root, "alert-dialog")
    expect(text(alert)).toContain("Last choice: nothing yet")
    fireEvent.click(button(alert, "Delete artboard…"))
    await settle()
    fireEvent.click(button(document.querySelector('[role="alertdialog"]')!, "Delete"))
    expect(text(alert)).toContain("Last choice: confirmed")

    const sidebar = section(root, "sidebar")
    const demo = sidebar.querySelector("[data-demo-card] .demo-well")!
    fireEvent.click([...demo.querySelectorAll("button")].find((b) => text(b).startsWith("Charts"))!)
    expect(text(demo.querySelector("div.grid.flex-1.place-items-center"))).toBe("Charts")
    expect([...sidebar.querySelectorAll("h3")].map(text)).toEqual(["Variants", "Modes"])
    expect(text(sidebar)).toContain('permanent rail (:toggle="false")')

    const drawer = section(root, "drawer")
    expect(text(drawer)).toContain("last action: none")
    const arm = drawer.querySelector('[role="switch"][aria-label="Arm swipe area"]')!
    expect(arm.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(arm)
    expect(arm.getAttribute("aria-checked")).toBe("true")

    expect(section(root, "meter").querySelectorAll('[role="meter"]').length).toBe(3)
    expect(section(root, "gauge").querySelectorAll("[data-demo-card]").length).toBe(2)
    expect(section(root, "scope").querySelector('[role="group"][aria-label="Wave"]')).not.toBeNull()
    expect(section(root, "scroll-area").querySelectorAll(".dk-scroll p").length).toBe(15)
    expect(section(root, "toolbar").querySelectorAll('[role="toolbar"] button').length).toBe(6)

    const nav = section(root, "nav-menu")
    expect(text(nav)).toContain("Viewing: Overview")
  })
})
