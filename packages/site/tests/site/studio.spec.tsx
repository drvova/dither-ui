// The Studio's page on Solid (`src/pages/studio/`, `src/routes/studio.tsx`),
// held to what its Vue twin did. Carried from the earlier Vue site's
// `tests/studio-columns.spec.ts` (the side columns, a deleted project's
// chats), `tests/studio-shell.spec.ts` (a row's menu, the search; the
// page's own keys are in `state.spec.tsx`) and `tests/studio-guide.spec.ts`
// (the tour; where it hovers and the first visit are framework-free and
// stay with the framework-free specs), assertion for assertion; then this port's
// own: the panel's tabs, the sidebar, what the page brings in as it mounts
// and the head the route gives it.
import { MetaProvider } from "@solidjs/meta"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { APP_HEAD } from "@/app/install-files"
import type { GuideStop } from "@/pages/studio/guide"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { editor, stopInspecting } from "../../src/entities/editor"
import { chats, openProject } from "../../src/features/agent/chats"
import { handoff } from "../../src/features/agent/handoff"
import { resetHistory } from "../../src/features/history"
import { activeProjectId, createProject, deleteProject, hydrate, projects } from "../../src/features/persistence"
import { StudioPage } from "../../src/pages/studio"
import RowMenu from "../../src/pages/studio/ui/RowMenu"
import SearchPalette from "../../src/pages/studio/ui/SearchPalette"
import StudioGuide from "../../src/pages/studio/ui/StudioGuide"
import StudioPanel from "../../src/pages/studio/ui/StudioPanel"
import StudioSidebar from "../../src/pages/studio/ui/StudioSidebar"
import Studio from "../../src/routes/studio"
import { world } from "dither-kit/testing/world.ts"

// jsdom lays nothing out, so it has no scrolling to do.
Element.prototype.scrollIntoView ??= () => {}

/** What Vue's `nextTick` was to the Vue specs: the watchers of this turn, and
 * what they queued, have run. */
const tick = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve()
}
const click = async (el: Element) => {
  fireEvent.click(el)
  await tick()
}
const type = async (el: HTMLInputElement, value: string) => {
  fireEvent.input(el, { target: { value } })
  await tick()
}
const get = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T => {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`nothing matches ${selector}`)
  return el
}

/** A window this wide, as `matchMedia` and `innerWidth` say it. */
function at(width: number) {
  vi.stubGlobal("innerWidth", width)
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: /max-width: (\d+)px/.test(q) ? width <= Number(q.match(/max-width: (\d+)px/)![1]) : width >= 1024,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }))
}

/** Nothing kept and nothing open: a first visit. */
function reset() {
  localStorage.clear()
  stopInspecting()
  handoff.picking = false
  handoff.asks.splice(0)
  projects.splice(0, projects.length)
  activeProjectId.value = ""
  chats.project = ""
  chats.list = []
  editor.artboards = []
  editor.groups = []
  resetHistory()
}
beforeEach(() => {
  world()
  reset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  history.replaceState(null, "", "/")
  localStorage.clear()
})

/** The page as its route mounts it, and what its title bar says of the two
 * side columns. */
async function page(width: number) {
  at(width)
  const view = render(() => <StudioPage />)
  await tick()
  const pressed = (label: string) => get(view.container, `button[aria-label^="${label}"]`)
  const chat = () => pressed("Toggle the chat")
  const panel = () => pressed("Toggle properties and layers")
  const state = () => ({
    chat: chat().getAttribute("aria-pressed") === "true",
    panel: panel().getAttribute("aria-pressed") === "true",
  })
  return { ...view, chat, panel, state }
}

describe("the Studio's side columns", () => {
  it("take turns below 1280px: opening one puts the other away", async () => {
    const { container, chat, panel, state } = await page(1100)
    expect(state()).toEqual({ chat: true, panel: false })
    await click(panel())
    expect(state()).toEqual({ chat: false, panel: true })
    // the window says the same of its columns as its keys do
    expect(get(container, ".studio").className).toContain("no-chat")
    expect(get(container, ".studio-chat").style.display).toBe("none")
    expect(container.querySelector("aside.studio-side")).not.toBeNull()
    await click(chat())
    expect(state()).toEqual({ chat: true, panel: false })
    expect(get(container, ".studio").className).toContain("no-panel")
    expect(container.querySelector("aside.studio-side")).toBeNull()
  })
  it("stand side by side on a wide screen", async () => {
    const { panel, state } = await page(1440)
    await click(panel())
    expect(state()).toEqual({ chat: true, panel: true })
  })
  it("open the panel at first where the window holds all four, then as the reader last left it", async () => {
    const wide = await page(1600)
    expect(wide.state()).toEqual({ chat: true, panel: true })
    // what the window's width chose is not a choice of the reader's to keep
    expect(localStorage.getItem("dither-studio-panel-open")).toBeNull()
    await click(wide.panel())
    expect(localStorage.getItem("dither-studio-panel-open")).toBe("false")
    cleanup()
    expect((await page(1600)).state()).toEqual({ chat: true, panel: false })
  })
})

describe("deleting a project in the Studio", () => {
  it("takes the project's chats with it", async () => {
    await page(1440)
    createProject("Doomed")
    const id = projects[projects.length - 1].id
    localStorage.setItem(`dither-agent-chats-${id}`, "[]")
    localStorage.setItem(`dither-agent-session-${id}/c1`, "{}")
    await tick()
    deleteProject(id)
    await tick()
    expect(Object.keys(localStorage).filter((k) => k.includes(id))).toEqual([])
  })
})

describe("the page as it mounts", () => {
  it("draws the window's shell before anything of the browser's is read, then brings the document in", async () => {
    at(1440)
    const read = vi.spyOn(Storage.prototype, "getItem")
    let before = -1
    const view = render(() => {
      const el = <StudioPage />
      before = read.mock.calls.length
      return el
    })
    // nothing was read to draw it: a server draws the same
    expect(before).toBe(0)
    await tick()
    expect(projects.length).toBe(1)
    expect(editor.artboards.length).toBe(1)
    expect(view.container.querySelector("main.studio-canvas")).not.toBeNull()
    expect(get(view.container, ".studio > header")).toBe(get(view.container, ".studio").firstElementChild)
  })
  it("opens the agent's protocol with the Studio and closes it with it", async () => {
    const view = await page(1440)
    expect(typeof window.ditherStudio?.run).toBe("function")
    const heard: string[] = []
    const onResult = (e: Event) => heard.push(String((e as CustomEvent).detail))
    document.addEventListener("dither-studio:result", onResult)
    document.dispatchEvent(
      new CustomEvent("dither-studio:command", { detail: JSON.stringify({ id: 3, type: "nope" }) }),
    )
    expect(JSON.parse(heard[0])).toMatchObject({ id: 3, ok: false })
    view.unmount()
    document.dispatchEvent(
      new CustomEvent("dither-studio:command", { detail: JSON.stringify({ id: 4, type: "nope" }) }),
    )
    document.removeEventListener("dither-studio:result", onResult)
    expect(heard).toHaveLength(1)
  })
  it("adds the frame its hash asks for, once, and cleans the address (the legacy hash too)", async () => {
    for (const hash of ["#new/pie", "#/studio/new/pie"]) {
      reset()
      history.replaceState(null, "", `/studio${hash}`)
      await page(1440)
      expect(editor.artboards.map((a) => a.name)).toEqual(["Area chart", "Pie chart"])
      expect(location.pathname + location.hash).toBe("/studio")
      cleanup()
    }
    reset()
    history.replaceState(null, "", "/studio#new/nothing")
    await page(1440)
    expect(editor.artboards).toHaveLength(1)
    expect(location.hash).toBe("#new/nothing")
  })
  it("shows the hint below 1024px, with the Studio's own link to carry and the docs", async () => {
    at(800)
    const { container } = render(() => <StudioPage />)
    await tick()
    expect(container.querySelector(".studio")).toBeNull()
    expect(get(container, "h1").textContent).toBe("The Studio is best on a desktop")
    expect(get(container, "button.key-chrome").textContent).toBe("Copy the Studio link")
    expect(get(container, "a").getAttribute("href")).toBe("/docs")
    // a wider window brings the editor
    at(1440)
    window.dispatchEvent(new Event("resize"))
    await tick()
    expect(container.querySelector(".studio")).not.toBeNull()
  })
  it("opens search on ⌘K and folds the sidebar on ⌘B", async () => {
    const { container } = await page(1440)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await tick()
    expect(get(container, '[role="dialog"][aria-label="Search"]')).toBeTruthy()
    fireEvent.keyDown(get(container, 'input[name="studio-search"]'), { key: "Escape" })
    await tick()
    expect(container.querySelector('[aria-label="Search"][role="dialog"]')).toBeNull()
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    await tick()
    expect(get(container, ".studio").className).toContain("is-folded")
    expect(get(container, "aside.side").style.display).toBe("none")
  })
})

describe("the route's head", () => {
  const head = (selector: string) => document.head.querySelector(selector)
  it("carries the title, the install table's tags and the chrome's colour, and marks the root", async () => {
    at(1440)
    const view = render(() => (
      <MetaProvider>
        <Studio />
      </MetaProvider>
    ))
    await tick()
    expect(document.title).toBe(ROUTE_TITLES.studio)
    expect(document.documentElement.dataset.page).toBe("studio")
    // the app's own tags of the one table the Vue build injected from (the
    // icons are the shell's, on every page)
    for (const t of APP_HEAD) {
      const el = head(
        t.tag === "link" ? `link[rel="${t.attrs.rel}"][href="/${t.attrs.href}"]` : `meta[name="${t.attrs.name}"]`,
      )
      expect(el, JSON.stringify(t)).not.toBeNull()
      if (t.tag === "meta") expect(el!.getAttribute("content")).toBe(t.attrs.content)
    }
    expect(head('link[rel="manifest"]')!.getAttribute("href")).toBe("/studio/app.webmanifest")
    expect(head('meta[name="theme-color"]')!.getAttribute("content")).toBe("#08090b")
    view.unmount()
    expect(document.documentElement.dataset.page).toBeUndefined()
    expect(head('link[rel="manifest"]')).toBeNull()
  })
  it("wears the page's ground in the theme the reader picked, as the theme turns", async () => {
    at(1440)
    let ground = "rgb(8, 9, 11)"
    vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ backgroundColor: ground }) as CSSStyleDeclaration)
    render(() => (
      <MetaProvider>
        <Studio />
      </MetaProvider>
    ))
    await tick()
    ground = "rgb(255, 255, 255)"
    document.documentElement.classList.toggle("dark")
    await new Promise((done) => setTimeout(done))
    expect(head('meta[name="theme-color"]')!.getAttribute("content")).toBe("rgb(255, 255, 255)")
    document.documentElement.classList.toggle("dark")
  })
})

describe("a row's menu", () => {
  it("is a menu: focus on its first item, Escape hands focus back to its key", async () => {
    const ran: string[] = []
    const { container } = render(() => (
      <RowMenu
        label="Chat options"
        actions={[
          { label: "Rename", run: () => ran.push("rename") },
          { label: "Delete chat", run: () => ran.push("delete"), danger: true },
        ]}
      />
    ))
    const key = get<HTMLButtonElement>(container, "button[aria-haspopup='menu']")
    await click(key)
    const items = [...container.querySelectorAll<HTMLElement>("[role='menuitem']")]
    expect(items.map((i) => i.textContent?.trim())).toEqual(["Rename", "Delete chat"])
    expect(document.activeElement).toBe(items[0])
    expect(key.getAttribute("aria-expanded")).toBe("true")
    fireEvent.keyDown(get(container, "[role='menu']"), { key: "Escape" })
    await tick()
    expect(container.querySelector("[role='menu']")).toBeNull()
    expect(document.activeElement).toBe(key)
    await click(key)
    await click(container.querySelectorAll("[role='menuitem']")[1])
    expect(ran).toEqual(["delete"])
    expect(container.querySelector("[role='menu']")).toBeNull()
  })
  it("closes on a press outside, and keeps its key's press to itself", async () => {
    let outer = 0
    const { container } = render(() => (
      <div onClick={() => outer++}>
        <RowMenu label="More" actions={[{ label: "Rename", run() {} }]} />
      </div>
    ))
    await click(get(container, "button[aria-haspopup='menu']"))
    expect(outer).toBe(0)
    expect(container.querySelector("[role='menu']")).not.toBeNull()
    fireEvent.pointerDown(document.body)
    await tick()
    expect(container.querySelector("[role='menu']")).toBeNull()
  })
})

describe("search", () => {
  let here = ""
  let there = ""
  beforeEach(() => {
    localStorage.clear()
    hydrate()
    createProject("Elsewhere")
    there = activeProjectId.value
    localStorage.setItem(
      `dither-agent-chats-${there}`,
      JSON.stringify([{ id: "far", title: "Pricing page far away", at: Date.now() }]),
    )
    here = projects[0].id
    localStorage.setItem(
      `dither-agent-chats-${here}`,
      JSON.stringify([{ id: "near", title: "Pricing table", at: Date.now() }]),
    )
    activeProjectId.value = here
    chats.project = ""
    openProject(here)
  })

  const open = async (locked = false) => {
    const said = { close: 0, agent: 0 }
    const [shown, setShown] = createSignal(false)
    const view = render(() => (
      <SearchPalette open={shown()} locked={locked} onClose={() => said.close++} onAgent={() => said.agent++} />
    ))
    setShown(true)
    await tick()
    const field = () => get<HTMLInputElement>(view.container, "input")
    return { ...view, said, field }
  }
  const hits = (c: Element) =>
    [...c.querySelectorAll("[role='option']")].map((o) => ({
      text: o.textContent ?? "",
      off: o.getAttribute("aria-disabled") === "true",
    }))

  it("finds chats in every project, the open one's first", async () => {
    const { container, field } = await open()
    expect(document.activeElement).toBe(field())
    await type(field(), "pricing")
    expect(hits(container).map((h) => h.text)).toEqual(["Pricing tablechat", "Pricing page far awaychat in Elsewhere"])
  })

  it("opens a chat in another project: the project, then the chat", async () => {
    const { field, said } = await open()
    await type(field(), "far away")
    fireEvent.keyDown(field(), { key: "Enter" })
    expect(activeProjectId.value).toBe(there)
    expect(chats.project).toBe(there)
    expect(chats.active).toBe("far")
    expect(said).toEqual({ close: 1, agent: 1 })
  })

  it("keeps the open chat while a turn runs and holds every other back", async () => {
    const { container, field, said } = await open(true)
    await type(field(), "pricing")
    expect(hits(container).map((h) => h.off)).toEqual([false, true])
    fireEvent.keyDown(field(), { key: "ArrowDown" })
    await tick()
    expect(field().getAttribute("aria-activedescendant")).toBe("search-hit-1")
    fireEvent.keyDown(field(), { key: "Enter" })
    expect(activeProjectId.value).toBe(here)
    expect(said.close).toBe(0)
  })

  it("says when nothing matches", async () => {
    const { container, field } = await open()
    await type(field(), "zzz")
    expect(container.textContent).toContain("Nothing matches")
  })

  it("closes on Escape and on a press on its scrim, never on one inside", async () => {
    const { container, field, said } = await open()
    fireEvent.pointerDown(get(container, ".palette"))
    expect(said.close).toBe(0)
    fireEvent.pointerDown(get(container, ".scrim"))
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(said.close).toBe(2)
  })
})

describe("the tour", () => {
  const parts = [document.createElement("div"), document.createElement("div")]
  const opened: number[] = []
  const stops: GuideStop[] = [
    { target: () => parts[0], line: "First part." },
    { target: () => parts[1], line: "Second part.", show: () => opened.push(1) },
  ]

  it("says each part's line, opens the next part and ends on Done", async () => {
    let closed = 0
    const { container } = render(() => <StudioGuide open stops={stops} onClose={() => closed++} />)
    await tick()
    expect(get(container, '[role="dialog"]').getAttribute("aria-label")).toBe("Studio tour")
    expect(container.textContent).toContain("First part.")
    expect(container.textContent).toContain("1 of 2")
    await click(get(container, ".next"))
    expect(opened).toEqual([1])
    expect(container.textContent).toContain("Second part.")
    expect(get(container, ".next").textContent).toBe("Done")
    expect(container.querySelector(".skip")).toBeNull()
    await click(get(container, ".next"))
    expect(closed).toBe(1)
  })

  it("ends on Skip and on Escape", async () => {
    let closed = 0
    const { container } = render(() => <StudioGuide open stops={stops} onClose={() => closed++} />)
    await tick()
    await click(get(container, ".skip"))
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(closed).toBe(2)
  })

  it("hovers where its part is, and gives the focus back as it closes", async () => {
    at(1440)
    vi.stubGlobal("innerHeight", 900)
    const before = document.body.appendChild(document.createElement("button"))
    before.focus()
    parts[0].getBoundingClientRect = () => ({ left: 600, top: 48, right: 1100, bottom: 892 }) as DOMRect
    const [shown, setShown] = createSignal(true)
    const { container } = render(() => <StudioGuide open={shown()} stops={stops} />)
    await tick()
    // inside a tall part, near its top left (`placeGuide`)
    expect(get(container, ".guide").style.transform).toBe("translate(616px, 96px)")
    expect(document.activeElement).toBe(get(container, ".next"))
    setShown(false)
    await tick()
    expect(container.querySelector(".guide")).toBeNull()
    expect(document.activeElement).toBe(before)
    before.remove()
  })
})

describe("the panel beside the canvas", () => {
  const selected = (c: Element) => get(c, '[role="tab"][aria-selected="true"]').textContent?.trim()
  it("is two tabs, the arrows between them, the choice kept for the next visit", async () => {
    const { container } = render(() => <StudioPanel />)
    await tick()
    expect(selected(container)).toBe("Properties")
    expect(get(container, "#panel-layers").style.display).toBe("none")
    expect(get(container, "#panel-properties").style.display).toBe("")
    expect(localStorage.getItem("dither-studio-panel-tab")).toBeNull()
    fireEvent.keyDown(get(container, '[role="tablist"]'), { key: "ArrowRight" })
    await tick()
    expect(selected(container)).toBe("Layers")
    expect(document.activeElement).toBe(get(container, "#panel-tab-layers"))
    expect(get(container, "#panel-tab-properties").getAttribute("tabindex")).toBe("-1")
    expect(get(container, "#panel-properties").style.display).toBe("none")
    expect(localStorage.getItem("dither-studio-panel-tab")).toBe('"layers"')
    cleanup()
    const again = render(() => <StudioPanel />)
    await tick()
    expect(selected(again.container)).toBe("Layers")
    await click(get(again.container, "#panel-tab-properties"))
    expect(selected(again.container)).toBe("Properties")
  })
})

describe("the sidebar", () => {
  const side = (locked = false) => {
    const said = { agent: 0, search: 0, library: 0 }
    let root: HTMLElement | undefined
    const [show, setShow] = createSignal(true)
    const view = render(() => (
      <StudioSidebar
        ref={(el) => (root = el)}
        show={show()}
        locked={locked}
        onAgent={() => said.agent++}
        onSearch={() => said.search++}
        onLibrary={() => said.library++}
      />
    ))
    return { ...view, said, setShow, root: () => root }
  }
  const named = (c: Element, words: string) =>
    [...c.querySelectorAll<HTMLElement>("button, a")].find((b) => b.textContent?.trim().startsWith(words))!
  beforeEach(() => {
    hydrate()
    openProject(activeProjectId.value)
  })

  it("starts a chat, a search and a frame, and leads home and to the docs", async () => {
    const { container, said, root, setShow } = side()
    await tick()
    expect(root()).toBe(get(container, "aside.side"))
    expect(root()!.getAttribute("aria-label")).toBe("Projects and chats")
    await click(named(container, "New chat"))
    await click(named(container, "Search"))
    await click(named(container, "Add a frame"))
    expect(said).toEqual({ agent: 1, search: 1, library: 1 })
    expect(container.textContent).toContain("No chats yet.")
    expect([...container.querySelectorAll(".foot a")].map((a) => a.getAttribute("href"))).toEqual(["/", "/docs"])
    // folded away it stays mounted
    setShow(false)
    expect(root()!.style.display).toBe("none")
  })

  it("lists the projects, the open one unfolded, and opens another", async () => {
    const { container } = side()
    createProject("Second")
    const first = projects[0].id
    await tick()
    const rows = () => [...container.querySelectorAll<HTMLButtonElement>(".project-row")]
    expect(
      rows().map((r) => [r.textContent?.trim(), r.getAttribute("aria-current"), r.getAttribute("aria-expanded")]),
    ).toEqual([
      [projects[0].name, null, "false"],
      ["Second", "page", "true"],
    ])
    await click(rows()[0])
    expect(activeProjectId.value).toBe(first)
    await click(get(container, 'button[aria-label="New project"]'))
    expect(projects.map((p) => p.name)).toContain("Project 3")
  })

  it("names a project in place: Enter keeps the name, Escape backs out", async () => {
    const { container } = side()
    await tick()
    const was = projects[0].name
    fireEvent.dblClick(get(container, ".project-row"))
    await tick()
    const field = () => get<HTMLInputElement>(container, 'input[name="project-name"]')
    expect(field().value).toBe(was)
    expect(container.querySelector(".row-menu")).toBeNull()
    await type(field(), "Renamed")
    fireEvent.keyDown(field(), { key: "Escape" })
    await tick()
    expect(container.querySelector('input[name="project-name"]')).toBeNull()
    expect(projects[0].name).toBe(was)
    fireEvent.dblClick(get(container, ".project-row"))
    await tick()
    await type(field(), "Renamed")
    fireEvent.submit(field().form!)
    await tick()
    expect(projects[0].name).toBe("Renamed")
    expect(get(container, ".project-row").textContent?.trim()).toBe("Renamed")
  })

  it("lists the open project's chats by day, and keeps them put while a turn runs", async () => {
    const id = activeProjectId.value
    localStorage.setItem(
      `dither-agent-chats-${id}`,
      JSON.stringify([
        { id: "a", title: "Pricing table", at: Date.now() },
        { id: "b", title: "Sign in", at: Date.now() - 1000, pinned: true },
      ]),
    )
    chats.project = ""
    openProject(id)
    const { container, said } = side(true)
    await tick()
    const rows = [...container.querySelectorAll<HTMLButtonElement>(".chat-row")]
    expect(rows.map((r) => get(r, ".grow").textContent)).toEqual(expect.arrayContaining(["Pricing table", "Sign in"]))
    expect(container.querySelectorAll(".day-label").length).toBeGreaterThan(0)
    // locked: only the open chat answers, and nothing new starts
    expect(rows.every((r) => r.disabled === (chats.active !== (r.textContent?.includes("Pricing") ? "a" : "b")))).toBe(
      true,
    )
    expect(named(container, "New chat").hasAttribute("disabled")).toBe(true)
    await click(named(container, "New chat"))
    expect(said.agent).toBe(0)
  })

  it("asks before it deletes a project", async () => {
    const { container } = side()
    createProject("Doomed")
    await tick()
    const doomed = activeProjectId.value
    const wrap = [...container.querySelectorAll(".project > .row-wrap")][1]
    await click(get(wrap, "button[aria-haspopup='menu']"))
    await click(
      [...wrap.querySelectorAll("[role='menuitem']")].find((i) => i.textContent?.trim() === "Delete project")!,
    )
    expect(projects.some((p) => p.id === doomed)).toBe(true)
    const dialog = get(document.body, '[role="alertdialog"]')
    expect(dialog.textContent).toContain("Delete project?")
    await click([...dialog.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Delete")!)
    expect(projects.some((p) => p.id === doomed)).toBe(false)
  })
})
