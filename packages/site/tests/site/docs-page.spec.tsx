// The docs' page: the shell around the sections (the rail, the
// sheet, "On this page", Share), one section per page by its route, the
// packs as chunks of their own and the ones kept, the page's head, and the
// routes' wiring.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { MetaProvider } from "@solidjs/meta"
import { createMemoryHistory, MemoryRouter, Route, useParams } from "@solidjs/router"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GROUPS } from "@/pages/docs/groups"
import { PACKS, type PackName } from "@/pages/docs/packs"
import { SECTION_IDS } from "@/pages/docs/pages"
import { docsBreadcrumb, docsMeta } from "@/pages/docs/seo"
import { STYLING_LABELS } from "@dither-ui/restyle"
import { SHEET_WIPE, bandFill } from "@/widgets/site-header/menu"
import DocsNav, { docsUrl, NAV_LINK, type PagePart } from "../../src/pages/docs/DocsNav"
import DocsPage, { DOCS_GROUND } from "../../src/pages/docs/DocsPage"
import { pageTags } from "../../src/pages/docs/heads"
import DocsSheet, { SHEET_ID } from "../../src/pages/docs/DocsSheet"
import OnThisPage from "../../src/pages/docs/OnThisPage"
import { PACK_COMPONENTS, PACK_LOADERS, preloadOpenPacks } from "../../src/pages/docs/pack-loaders"
import SectionShare from "../../src/pages/docs/SectionShare"
import { world } from "@dither-ui/kit/testing/world.ts"

const SITE = join(__dirname, "../..")
const DOCS = join(SITE, "src/pages/docs")
const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id))

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  vi.stubGlobal("scrollTo", vi.fn())
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterEach(() => {
  cleanup()
  w.restore()
  localStorage.clear()
  document.head.querySelectorAll("title, meta, link, script").forEach((el) => el.remove())
  delete document.documentElement.dataset.page
})

const settle = async (turns = 6) => {
  for (let i = 0; i < turns; i++) {
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
  }
}

/** The docs' page as its routes mount it, at an address. */
function openDocs(at: string) {
  const history = createMemoryHistory()
  history.set({ value: at })
  const view = render(() => (
    <MetaProvider>
      <MemoryRouter history={history}>
        <Route
          path="/docs/:section?"
          component={() => {
            const params = useParams()
            return <DocsPage section={params.section ?? ""} />
          }}
        />
      </MemoryRouter>
    </MetaProvider>
  ))
  return { ...view, history }
}
const shownIds = () =>
  [...document.querySelectorAll<HTMLElement>(".docs-flow > section")].filter((s) => !s.hidden).map((s) => s.id)

describe("docs section packs", () => {
  function find(name: string, dir = DOCS): string | null {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        const hit = find(name, path)
        if (hit) return hit
      } else if (entry === `${name}.tsx`) return path
    }
    return null
  }

  it("each pack renders exactly the sections its nav names", () => {
    for (const [name, nav] of Object.entries(PACKS)) {
      const file = find(name)
      expect({ name, file: !!file }).toEqual({ name, file: true })
      // The pack's own sections and those of the section files it imports.
      const own = readFileSync(file!, "utf8")
      const parts = [...own.matchAll(/^import \w+ from "\.\/(\w+Section)"/gm)].map((m) =>
        readFileSync(join(file!, "..", `${m[1]}.tsx`), "utf8"),
      )
      const found = [own, ...parts]
        .flatMap((src) => [...src.matchAll(/<section[^>]*\sid="([\w-]+)"/g)].map((m) => m[1]))
        .sort()
      expect({ name, ids: found }).toEqual({ name, ids: nav.map((i) => i.id).sort() })
    }
  })

  it("names each family on its rail heading", () => {
    const { container } = render(() => <DocsNav activeId="" variant="rail" />)
    expect([...container.querySelectorAll("button[aria-expanded]")].map((b) => b.getAttribute("data-group"))).toEqual(
      GROUPS.map((g) => g.title),
    )
  })

  it("has a chunk for every pack and loads only the open section's", async () => {
    expect(Object.keys(PACK_LOADERS).sort()).toEqual(Object.keys(PACKS).sort())
    expect(Object.keys(PACK_COMPONENTS).sort()).toEqual(Object.keys(PACKS).sort())
    const loaded: string[] = []
    const real = { ...PACK_LOADERS }
    for (const name of Object.keys(PACK_LOADERS) as PackName[])
      PACK_LOADERS[name] = (() => (loaded.push(name), real[name]())) as never
    await preloadOpenPacks("shiny-text")
    expect(loaded).toEqual(["TextDocs"])
    loaded.length = 0
    // a section DocsPage writes itself has no pack to load, nor has the front
    await preloadOpenPacks("area")
    await preloadOpenPacks("")
    expect(loaded).toEqual([])
    Object.assign(PACK_LOADERS, real)
  })

  it("places every section in the flow: each pack by name, the rest written by the page", () => {
    // the page places each pack by name: one left out would never show
    const page = readFileSync(join(DOCS, "DocsPage.tsx"), "utf8")
    const placed = [...page.matchAll(/<Pack name="(\w+)" \/>/g)].map((m) => m[1])
    expect([...placed].sort()).toEqual(Object.keys(PACKS).sort())
    const own = [...page.matchAll(/<Own id="([\w-]+)">/g)].map((m) => m[1])
    const files = [...page.matchAll(/^ {12}<(\w+Section|QuickStart) \/>/gm)].map(
      (m) => /<section[^>]*\sid="([\w-]+)"/.exec(readFileSync(find(m[1])!, "utf8"))![1],
    )
    const packed = placed.flatMap((name) => PACKS[name as PackName].map((i) => i.id))
    expect([...own, ...files, ...packed].sort()).toEqual([...SECTION_IDS].sort())
  })
})

describe("docs section list", () => {
  it("lists every section once, the one in view current, a tap naming it", () => {
    const go = vi.fn()
    const { container } = render(() => <DocsNav activeId="slider" variant="rail" onGo={go} />)
    const links = [...container.querySelectorAll("a")]
    expect(links.map((a) => a.getAttribute("href")?.replace(/.*\/docs\//, ""))).toEqual(ids)
    expect([...container.querySelectorAll("[aria-current]")].map((a) => a.textContent?.trim())).toEqual(["Slider"])
    const click = new MouseEvent("click", { bubbles: true, cancelable: true })
    links[3].dispatchEvent(click)
    expect(go.mock.calls).toEqual([[ids[3]]])
    // the page opens it: the browser does not follow the link
    expect(click.defaultPrevented).toBe(true)
  })

  it("opens the group of the section in view, folds and unfolds the rest, and keeps every link in the page", async () => {
    const [active, setActive] = createSignal("slider")
    const { container } = render(() => <DocsNav activeId={active()} variant="rail" />)
    const key = (title: string) => container.querySelector<HTMLButtonElement>(`button[data-group="${title}"]`)!
    const list = (title: string) => document.getElementById(key(title).getAttribute("aria-controls")!)!
    const open = () => GROUPS.filter((g) => key(g.title).getAttribute("aria-expanded") === "true").map((g) => g.title)
    expect(open()).toEqual(["Components"])
    expect(list("Components").style.display).toBe("")
    expect(list("Backgrounds").style.display).toBe("none")
    expect(list("Backgrounds").querySelectorAll("a").length).toBeGreaterThan(0)
    fireEvent.click(key("Backgrounds"))
    expect(open()).toEqual(["Components", "Backgrounds"])
    fireEvent.click(key("Components"))
    expect(open()).toEqual(["Backgrounds"])
    // moving to a section opens its group and leaves the reader's folds
    setActive("shiny-text")
    await settle(1)
    expect(open()).toEqual(["Backgrounds", "Text"])
  })

  it("scrolls the rail, never the page, to put the current link in its middle", async () => {
    const rail = document.createElement("aside")
    rail.style.overflowY = "auto"
    document.body.append(rail)
    const [active, setActive] = createSignal(ids[0])
    const { container, unmount } = render(() => <DocsNav activeId={active()} variant="rail" />, { container: rail })
    rail.getBoundingClientRect = () => ({ top: 0, bottom: 800, height: 800 }) as DOMRect
    const calls: ScrollToOptions[] = []
    rail.scrollTo = ((o: ScrollToOptions) => calls.push(o)) as typeof rail.scrollTo
    // The next section's link lies far below the rail's view.
    const far = ids[40]
    for (const a of container.querySelectorAll("a"))
      a.getBoundingClientRect = () =>
        (a.getAttribute("href")?.endsWith(`/${far}`) ? { top: 3000, bottom: 3025 } : { top: 0, bottom: 25 }) as DOMRect
    setActive(far)
    await settle(1)
    expect(calls.at(-1)?.top).toBe(3000 - 400)
    expect(window.scrollTo).not.toHaveBeenCalled()
    unmount()
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
  const parts = (): PagePart[] => [
    { label: "Slider", el: document.createElement("h2") },
    { label: "API", el: document.createElement("table") },
  ]

  it("opens as a modal with focus inside, holds the page and closes every way", async () => {
    const key = document.createElement("button")
    document.body.append(key)
    key.focus()
    const shown = parts()
    const [open, setOpen] = createSignal(false)
    const close = vi.fn()
    const go = vi.fn()
    const part = vi.fn()
    render(() => <DocsSheet open={open()} activeId="slider" parts={shown} onClose={close} onGo={go} onPart={part} />)
    expect(document.getElementById(SHEET_ID)).toBeNull()
    setOpen(true)
    await settle(2)
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
    expect(part.mock.calls[0]?.[0]).toBe(shown[1].el)
    dialog.querySelector<HTMLAnchorElement>('a[href$="/docs/aurora"]')!.click()
    expect(go.mock.calls[0]).toEqual(["aurora"])
    // The header stands at its head, "Close" where the sections key was, and
    // each family is a band of the menu's, one step of the ink per family.
    expect(dialog.querySelector(".sheet-head .site-capsule")).not.toBeNull()
    expect(dialog.querySelector(".sheet-title")?.textContent).toBe(`Sections ${ids.length}`)
    const bands = [...dialog.querySelectorAll<HTMLElement>(".nav-grp")]
    expect(bands).toHaveLength(GROUPS.length)
    const fill = (css: string) => Object.assign(document.createElement("i").style, { background: css }).background
    expect(bands.map((b) => b.style.background)).toEqual(GROUPS.map((_, i) => fill(bandFill(i, GROUPS.length))))
    expect(new Set(bands.map((b) => b.style.background)).size).toBe(GROUPS.length)
    expect(dialog.querySelectorAll(".menu-seam")).toHaveLength(GROUPS.length)
    // Escape and the close key each ask to close.
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    dialog.querySelector<HTMLButtonElement>('[aria-label="Close sections"]')!.click()
    expect(close).toHaveBeenCalledTimes(2)
    // Closed: the page scrolls again and focus goes back to the key.
    setOpen(false)
    await settle(1)
    // It rolls back up over the wipe's length, then goes.
    expect(document.getElementById(SHEET_ID)).not.toBeNull()
    await new Promise((r) => setTimeout(r, SHEET_WIPE.duration * 1000 + 50))
    expect(document.getElementById(SHEET_ID)).toBeNull()
    expect(document.documentElement.style.overflow).toBe("")
    expect(document.activeElement).toBe(key)
    key.remove()
  })

  it("leaves the parts out when the section in view has only its heading", async () => {
    const { unmount } = render(() => <DocsSheet open activeId="slider" parts={parts().slice(0, 1)} />)
    await settle(1)
    expect(document.getElementById(SHEET_ID)).not.toBeNull()
    expect(document.querySelector('[aria-label="On this page"]')).toBeNull()
    unmount()
    expect(document.documentElement.style.overflow).toBe("")
  })
})

describe("the rail right of the content", () => {
  it("lists the parts as keys that name their element, the first marked", () => {
    const shown: PagePart[] = [
      { label: "Avatar", el: document.createElement("h2") },
      { label: "Names", el: document.createElement("h3") },
    ]
    const go = vi.fn()
    const { container } = render(() => <OnThisPage parts={shown} onGo={go} />)
    const keys = [...container.querySelectorAll("button")]
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("On this page")
    expect(keys.map((b) => b.textContent)).toEqual(["Avatar", "Names"])
    expect(keys.map((b) => b.classList.contains("border-foreground"))).toEqual([true, false])
    keys[1].click()
    expect(go.mock.calls[0]?.[0]).toBe(shown[1].el)
  })

  it("shares the section: a disclosure with its card and three copies, each announced", async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
    const [id, setId] = createSignal("avatar")
    const { container } = render(() => <SectionShare id={id()} />)
    const key = container.querySelector<HTMLButtonElement>("button[aria-controls='section-share']")!
    expect(key.textContent).toBe("Share this section")
    expect(key.getAttribute("aria-expanded")).toBe("false")
    // the card loads only once the disclosure is open
    expect(container.querySelector("img")).toBeNull()
    key.click()
    expect(key.getAttribute("aria-expanded")).toBe("true")
    const img = container.querySelector("img")!
    expect(img.getAttribute("src")).toMatch(/\/og\/avatar\.gif$/)
    expect(img.alt).toBe("The Avatar card, playing")
    const copies = () => [...container.querySelectorAll<HTMLButtonElement>("#section-share button")]
    expect(copies().map((b) => b.textContent)).toEqual(["Copy link", "Copy Markdown", "Copy HTML"])
    const url = docsMeta("avatar").url
    copies()[0].click()
    await settle(2)
    expect(writeText.mock.calls[0]).toEqual([url])
    expect(copies()[0].textContent).toBe("Copied")
    expect(container.querySelector("[aria-live='polite']")?.textContent).toBe("link copied")
    copies()[1].click()
    copies()[2].click()
    await settle(2)
    const card = "https://dither-ui.com/og/avatar.gif"
    expect(writeText.mock.calls.slice(1)).toEqual([
      [`[![Avatar in the dither-ui docs](${card})](${url})`],
      [`<a href="${url}"><img src="${card}" alt="Avatar in the dither-ui docs" width="600" height="315"></a>`],
    ])
    // where no build drew the card, the image hides itself; a new section tries again
    fireEvent.error(img)
    expect(container.querySelector("img")).toBeNull()
    setId("button")
    await settle(1)
    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/\/og\/button\.gif$/)
    expect(copies().map((b) => b.textContent)).toEqual(["Copy link", "Copy Markdown", "Copy HTML"])
  })
})

describe("the docs' page", () => {
  it("lists the parts of a section opened straight from its address", async () => {
    openDocs("/docs/avatar")
    await settle()
    const rail = document.querySelector('nav[aria-label="On this page"]')!
    expect(rail).not.toBeNull()
    expect([...rail.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Avatar", "Names", "API"])
    expect(shownIds()).toEqual(["avatar"])
    // the front stays as the screen readers' h1 only
    const front = [...document.querySelectorAll<HTMLElement>("[data-docs-front]")]
    expect(front).toHaveLength(1)
    expect(front[0].classList.contains("sr-only")).toBe(true)
    expect(front[0].querySelector("h1")?.textContent).toBe("Documentation")
  })

  it("opens the docs' own address on the first section, under the front", async () => {
    openDocs("/docs")
    await settle()
    expect(shownIds()).toEqual([SECTION_IDS[0]])
    const front = [...document.querySelectorAll<HTMLElement>("[data-docs-front]")]
    expect(front).toHaveLength(2)
    expect(front[0].classList.contains("sr-only")).toBe(false)
    expect([...front[0].querySelectorAll(".speed-tag")].map((t) => t.textContent)).toEqual([
      `${ids.length} sections`,
      "Solid",
      "Tailwind or StyleX",
    ])
    // no Share for the front: it is no section's page
    expect(document.querySelector("button[aria-controls='section-share']")).toBeNull()
    expect(document.documentElement.dataset.page).toBe("docs")
  })

  it("renders only the sections it writes itself that are open or just read", async () => {
    // all of them rendered hidden once held most of a section page's nodes
    // and every one of its canvases
    const { history } = openDocs("/docs/area")
    const filled = (id: string) => (document.getElementById(id)?.children.length ?? 0) > 0
    await settle()
    expect(["area", "bar", "dashboard"].map(filled)).toEqual([true, false, false])
    for (const id of ["bar", "line", "pie"]) {
      history.set({ value: `/docs/${id}` })
      await settle()
      expect(shownIds()).toEqual([id])
    }
    // the last three read stay; the first lets go
    expect(["area", "bar", "line", "pie"].map(filled)).toEqual([false, true, true, true])
    // each section read from its top
    expect(vi.mocked(window.scrollTo).mock.calls.at(-1)).toEqual([{ top: 0, behavior: "auto" }])
  })

  it("shows one section of a pack that arrives after the page, lists its parts and keeps the pack", async () => {
    // a pack is a chunk of its own: its sections came after the hiding ran,
    // and a family's every section showed at once
    const { history } = openDocs("/docs/shiny-text")
    for (let i = 0; i < 400 && !document.getElementById("shiny-text"); i++) await new Promise((r) => setTimeout(r, 10))
    await settle()
    expect(shownIds()).toEqual(["shiny-text"])
    expect(document.querySelectorAll('nav[aria-label="On this page"] button').length).toBeGreaterThan(0)
    // only the rule that holds the rest back in the server's bytes names it
    expect(document.querySelector(".docs-flow > style")?.textContent).toBe(
      '.docs-flow > section:not([id="shiny-text"]) { display: none }',
    )
    // a section of its own next: the pack stays mounted, hidden
    const kept = document.getElementById("shiny-text")
    history.set({ value: "/docs/avatar" })
    await settle()
    expect(shownIds()).toEqual(["avatar"])
    expect(document.getElementById("shiny-text")).toBe(kept)
  }, 30_000)

  it("moves to a section by its route from the rail, the pager and the search", async () => {
    const { history } = openDocs("/docs/avatar")
    await settle()
    const at = () => history.get()
    fireEvent.click(document.querySelector<HTMLAnchorElement>('nav[aria-label="Docs sections"] a[href$="/docs/bar"]')!)
    await settle()
    expect(at()).toBe(docsUrl("bar"))
    expect(shownIds()).toEqual(["bar"])
    expect(
      [...document.querySelectorAll('nav[aria-label="Docs sections"] [aria-current]')].map((a) => a.textContent),
    ).toEqual(["Bar chart"])
    // the pager: the sections either side, in the sidebar's order, each with its group
    const pager = [...document.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Previous and next sections"] a')]
    expect(pager.map((a) => a.textContent)).toEqual(["Previous, ComponentsLine chart", "Next, ComponentsPie chart"])
    fireEvent.click(pager[1])
    await settle()
    expect(at()).toBe(docsUrl("pie"))
    // the breadcrumb: the docs, then the section's group by its first section
    const crumbs = [...document.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Breadcrumb"] a')]
    expect(crumbs.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Docs", docsUrl(SECTION_IDS[0])],
      ["Components", docsUrl("area")],
    ])
    // the search: Ctrl K opens the palette, a pick opens the section
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await settle(1)
    const input = document.querySelector<HTMLInputElement>('input[placeholder="Search docs…"]')!
    fireEvent.input(input, { target: { value: "Radar chart" } })
    fireEvent.keyDown(input, { key: "Enter" })
    await settle()
    expect(at()).toBe(docsUrl("radar"))
    expect(shownIds()).toEqual(["radar"])
    // nothing by that name: the page says so in its own words
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await settle(1)
    fireEvent.input(document.querySelector<HTMLInputElement>('input[placeholder="Search docs…"]')!, {
      target: { value: "zzzz" },
    })
    expect(document.body.textContent).toContain("Nothing in the docs is called “zzzz”.")
  })

  it("lands a legacy hash link on its section's page", async () => {
    window.history.replaceState(null, "", "/docs#/docs/avatar")
    const { history } = openDocs("/docs")
    await settle()
    expect(history.get()).toBe(docsUrl("avatar"))
    expect(shownIds()).toEqual(["avatar"])
    window.history.replaceState(null, "", "/")
  })

  it("sets its head from the section: title, description, canonical, og, X and the breadcrumb", async () => {
    const { history } = openDocs("/docs/avatar")
    await settle()
    const head = () => ({
      title: document.title,
      description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href"),
      og: ["og:type", "og:title", "og:description", "og:url"].map(
        (p) => document.querySelector<HTMLMetaElement>(`meta[property="${p}"]`)?.content,
      ),
      x: ["twitter:card", "twitter:title", "twitter:description"].map(
        (n) => document.querySelector<HTMLMetaElement>(`meta[name="${n}"]`)?.content,
      ),
      breadcrumb: document.getElementById("docs-breadcrumb")?.textContent,
      crumbType: document.getElementById("docs-breadcrumb")?.getAttribute("type"),
    })
    // The docs' own address says in a preview what the head table says of
    // it; a section, its meta.
    const front = (key: string) =>
      pageTags("docs").flatMap((t) =>
        t.tag === "meta" && (t.attrs.property ?? t.attrs.name) === key ? [t.attrs.content] : [],
      )[0]
    const of = (id: string) => {
      const m = docsMeta(id)
      return {
        title: m.title,
        description: m.description,
        canonical: m.url,
        og: [id ? "article" : "website", m.title, id ? m.description : front("og:description"), m.url],
        x: ["summary_large_image", m.title, id ? m.description : front("twitter:description")],
        breadcrumb: id ? docsBreadcrumb(id) : undefined,
        crumbType: id ? "application/ld+json" : undefined,
      }
    }
    expect(head()).toEqual(of("avatar"))
    history.set({ value: "/docs/bar" })
    await settle()
    expect(head()).toEqual(of("bar"))
    expect(document.querySelectorAll('link[rel="canonical"], #docs-breadcrumb')).toHaveLength(2)
    // the docs' own address: the generic head, no breadcrumb
    history.set({ value: "/docs" })
    await settle()
    expect(head()).toEqual(of(""))
  })

  it("names the browser chrome's colour as the docs' dark ground until the page has painted", async () => {
    openDocs("/docs/avatar")
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe(DOCS_GROUND)
    const css = readFileSync(join(SITE, "src/app/styles.css"), "utf8")
    const rule = /:root\.dark\[data-page="docs"\]\s*\{[^}]*--background:\s*(#[0-9a-f]{6})/i.exec(css)
    expect(rule?.[1].toLowerCase()).toBe(DOCS_GROUND)
  })

  it("switches what the page's code is written in, its sounds and its theme from the page's row", async () => {
    openDocs("/docs/styling")
    await settle()
    const group = (name: string) => document.querySelector(`main [role="group"][aria-label="${name}"]`)!
    const pressed = (name: string) =>
      [...group(name).querySelectorAll("button[aria-pressed='true']")].map((b) => b.textContent?.trim())
    // the code is Solid: there is no framework to switch
    expect(document.querySelector('main [role="group"][aria-label="Framework"]')).toBeNull()
    expect(pressed("Styling")).toEqual(["Tailwind"])
    expect([...group("Styling").querySelectorAll("button")].map((b) => b.textContent?.trim())).toEqual(
      Object.values(STYLING_LABELS),
    )
    const code = () => document.querySelector("#styling pre")?.textContent ?? ""
    const solid = code()
    expect(solid).toContain("<AreaChart")
    fireEvent.click([...group("Styling").querySelectorAll("button")][1])
    expect(pressed("Styling")).toEqual([STYLING_LABELS.css])
    expect(code()).not.toBe(solid)
    fireEvent.click([...group("Styling").querySelectorAll("button")][0])
    expect(code()).toBe(solid)
    const sound = document.querySelector<HTMLButtonElement>('button[aria-label="Interface sounds"]')!
    expect(sound.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(sound)
    expect(sound.getAttribute("aria-pressed")).toBe("false")
    expect(sound.title).toBe("Interface sounds: off")
    fireEvent.click(sound)
    const theme = document.querySelector<HTMLButtonElement>('button[aria-label="Use light theme"]')!
    fireEvent.click(theme)
    await settle(2)
    expect(theme.getAttribute("aria-label")).toBe("Use dark theme")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    fireEvent.click(theme)
    await settle(2)
  })

  it("opens the sections sheet from the header's key and closes it on a pick", async () => {
    const { history } = openDocs("/docs/avatar")
    await settle()
    const key = document.querySelector<HTMLButtonElement>('button[aria-label="Browse sections"]')!
    expect(key.getAttribute("aria-controls")).toBe(SHEET_ID)
    expect(key.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(key)
    await settle(2)
    expect(key.getAttribute("aria-expanded")).toBe("true")
    const sheet = document.getElementById(SHEET_ID)!
    // the parts of the section in view under its link
    expect(
      [...sheet.querySelectorAll('[aria-current] + ul[aria-label="On this page"] button')].map((b) => b.textContent),
    ).toEqual(["Names", "API"])
    fireEvent.click(sheet.querySelector<HTMLAnchorElement>('a[href$="/docs/bar"]')!)
    await settle()
    expect(key.getAttribute("aria-expanded")).toBe("false")
    expect(history.get()).toBe(docsUrl("bar"))
  })

  it("picks a variant from a gallery: the tile pressed, the code what the preview shows", async () => {
    openDocs("/docs/button")
    await settle()
    w.show()
    await settle(2)
    const chip = (text: string) =>
      [...document.querySelectorAll<HTMLButtonElement>("#button [data-demo-card] button[aria-pressed]")].find(
        (b) => b.textContent?.trim() === text,
      )!
    expect(chip("gradient").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(chip("hatched"))
    fireEvent.click(chip("bloom low"))
    expect(chip("gradient").getAttribute("aria-pressed")).toBe("false")
    expect(chip("hatched").getAttribute("aria-pressed")).toBe("true")
    expect(chip("hatched").classList.contains("ring-on")).toBe(true)
    expect(chip("bloom low").getAttribute("aria-pressed")).toBe("true")
  })
})

describe("the docs' routes", () => {
  const read = (path: string) => readFileSync(join(SITE, path), "utf8")

  it("are files: the docs' opening page and one page a section", () => {
    expect(read("src/routes/docs/index.tsx")).toContain('<DocsPage section="" />')
    const section = read("src/routes/docs/[section].tsx")
    expect(section).toContain("SECTION_IDS.includes(params.section")
    expect(section).toContain("Missing()")
    expect(section).toContain("preloadOpenPacks(params.section")
    // the missing page it falls back to answers 404
    expect(read("src/routes/[...404].tsx")).toContain("<HttpStatusCode code={404} />")
  })

  it("prerender every section from the docs' own table, never a kept list", () => {
    const config = read("vite.config.ts")
    expect(config).toContain('import { GROUPS } from "./src/pages/docs/groups.ts"')
    expect(config).toContain('["/docs", ...GROUPS.flatMap((g) => g.items.map((i) => `/docs/${i.id}`))]')
    expect(config).toContain('routes: ["/", MISSING_PAGE, PLAYER_ROUTE, ...DOCS_PAGES]')
    for (const id of ids) expect(id).toMatch(/^[\w-]+$/)
  })
})
