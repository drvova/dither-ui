// The docs' component packs Feedback, Field, Form, Layout and Media on
// Solid: every section of each pack's nav in order under its label, its
// prose word for word and its authored snippets and tables character for
// character as the Vue file has them, each preview mounting its demo once
// it nears the view, and the demos' own state driving what they show. The
// Vue site has no spec of these files beyond the packs' navs
// (`tests/docs-packs.spec.ts`), carried here as the id order.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FEEDBACK_NAV } from "@/pages/docs/components/feedback-nav"
import { FIELD_NAV } from "@/pages/docs/components/field-nav"
import { FORM_NAV } from "@/pages/docs/components/form-nav"
import { LAYOUT_NAV } from "@/pages/docs/components/layout-nav"
import { MEDIA_NAV } from "@/pages/docs/components/media-nav"
import { LAUNCH_S } from "@/pages/docs/components/rocket"
import FeedbackDocs from "../../src/pages/docs/components/FeedbackDocs"
import FieldDocs from "../../src/pages/docs/components/FieldDocs"
import FormDocs from "../../src/pages/docs/components/FormDocs"
import LayoutDocs from "../../src/pages/docs/components/LayoutDocs"
import MediaDocs from "../../src/pages/docs/components/MediaDocs"
import { world } from "../world"

// No GPU in jsdom: a shader says so, a world keeps to its CPU engine.
vi.mock("../../../dither-kit/engine/gl", async (original) => ({
  ...(await original<typeof import("../../../dither-kit/engine/gl")>()),
  createGl: () => null,
}))

// The specs run from `solid-site/`: a path is from the repository's root.
const read = (path: string) => readFileSync(join(process.cwd(), "..", path), "utf8")

const PACKS: [string, () => JSX.Element, readonly { id: string; label: string }[]][] = [
  ["FeedbackDocs", FeedbackDocs, FEEDBACK_NAV],
  ["FieldDocs", FieldDocs, FIELD_NAV],
  ["FormDocs", FormDocs, FORM_NAV],
  ["LayoutDocs", LayoutDocs, LAYOUT_NAV],
  ["MediaDocs", MediaDocs, MEDIA_NAV],
]

let w: ReturnType<typeof world>
let reduced = false
beforeEach(() => {
  w = world()
  // jsdom scrolls nothing: the console follows its newest line
  Element.prototype.scrollTo = () => {}
  reduced = false
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduced-motion"),
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  w.restore()
})

const cards = (root: Element) => [...root.querySelectorAll("[data-demo-card]")]
const words = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim()
/** A Vue template's text as a reader gets it: tags out, entities read, whitespace condensed. */
const prose = (html: string) =>
  words(
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  )
/** The pack mounted with every preview in view. */
function shown(Pack: () => JSX.Element) {
  const view = render(() => <Pack />)
  w.show()
  return view
}
const section = (root: Element, id: string) => root.querySelector(`section[id="${id}"]`)!
const key = (root: Element, name: string) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)!

describe.each(PACKS)("%s", (name, Pack, nav) => {
  const vue = read(`src/pages/docs/components/${name}.vue`)
  const solid = read(`solid-site/src/pages/docs/components/${name}.tsx`)
  const template = vue.slice(vue.lastIndexOf("\n<template>"))

  it("writes every section of its nav, in order, under its label", () => {
    const { container } = render(() => <Pack />)
    const sections = [...container.querySelectorAll("section[id]")]
    expect(sections.map((s) => s.id)).toEqual(nav.map((n) => n.id))
    expect(sections.map((s) => s.querySelector("h2")?.textContent)).toEqual(nav.map((n) => n.label))
    for (const s of sections) {
      // a direct child of the flow, as the page shows one section at a time
      expect(s.parentElement).toBe(container)
      expect(s.className).toBe("mt-16 scroll-mt-24")
      expect(s.querySelector("h2")?.className).toBe("text-lg tracking-tight")
      expect(s.firstElementChild?.tagName).toBe("H2")
      expect(cards(s).length).toBeGreaterThan(0)
      // the API table closes the section
      expect(s.lastElementChild?.tagName).toBe("DL")
    }
  })

  it("carries the Vue file's headings and prose word for word", () => {
    const { container } = render(() => <Pack />)
    const theirs = [...template.matchAll(/<section id="([^"]+)"[^>]*>([\s\S]*?)\n {2}<\/section>/g)]
    expect(theirs.map((m) => m[1])).toEqual(nav.map((n) => n.id))
    for (const [, id, body] of theirs) {
      const s = section(container, id)
      expect(s.querySelector("h2")?.textContent).toBe(prose(body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)![1]))
      const ledes = [...body.matchAll(/<p class="mt-[26] text-\[13px\][^"]*">([\s\S]*?)<\/p>/g)].map((m) => prose(m[1]))
      expect(ledes.length).toBeGreaterThan(0)
      expect([...s.querySelectorAll(":scope > p")].map((p) => words(p.textContent))).toEqual(ledes)
      expect([...s.querySelectorAll(":scope > h3")].map((h) => h.textContent)).toEqual(
        [...body.matchAll(/\n {4}<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1]),
      )
    }
  })

  it("carries the authored snippets and the API tables character for character", () => {
    // every template literal the Vue file's script declares, as written
    const literals = [...vue.matchAll(/^const (\w+) = `(?:\\[\s\S]|[^`\\])*`$/gm)]
    expect(literals.some((m) => m[1].startsWith("SNIPPET_"))).toBe(true)
    // (`<\/script>` there keeps Vue's parser off the tag: the same characters as `</script>` here)
    for (const [text] of literals) expect(solid).toContain(text.replace(/(?<!\\)<\\\/script>/g, "</script>"))
    const api = vue.match(/^const API: Record<string, PropRow\[\]> = \{\n[\s\S]*?\n\}$/m)![0]
    expect(solid).toContain(api)
    // each card is handed one of them
    const handed = (source: string, attr: string) =>
      [...source.matchAll(new RegExp(`<DemoCard ${attr}=\\{?"?(SNIPPET_\\w+)`, "g"))].map((m) => m[1])
    expect(handed(solid, "code")).toEqual(handed(template, ":code"))
    expect(handed(solid, "code").length).toBeGreaterThan(0)
  })

  it("mounts each preview's demo once, when it comes into view", () => {
    const { container } = render(() => <Pack />)
    const all = cards(container)
    const wells = all.map((c) => c.querySelector(".demo-well")!)
    // the quiet frame waits in every well, the prose and the tables are there already
    for (const well of wells) expect(words(well.textContent)).toBe("preview")
    expect(container.querySelectorAll(".demo-well canvas")).toHaveLength(0)
    expect(container.querySelectorAll("table").length).toBe(nav.length)
    w.show()
    for (const well of wells) {
      expect(well.querySelector(":scope > .w-full > .animate-pulse")).toBeNull()
      expect(well.firstElementChild?.childElementCount).toBe(1)
    }
    // latched: a second report mounts nothing again
    const before = container.querySelectorAll(".demo-well *").length
    w.show()
    expect(container.querySelectorAll(".demo-well *").length).toBe(before)
  })
})

describe("FeedbackDocs", () => {
  it("rolls each spinner a new seed where it stands", () => {
    const { container } = shown(FeedbackDocs)
    const s = section(container, "spinner")
    expect([...section(container, "badge").querySelectorAll(".demo-well .grid > div:last-child > *")]).toHaveLength(4)
    const spinners = () => [...s.querySelectorAll(".demo-well .flex-wrap > *")]
    const first = spinners()
    expect(first).toHaveLength(6)
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    fireEvent.click(key(s, "Roll new spinners"))
    expect(spinners()).toEqual(first)
    vi.restoreAllMocks()
  })
})

describe("FieldDocs", () => {
  const input = (root: Element, selector: string) => root.querySelector<HTMLInputElement>(selector)!

  it("binds every field to its own value", () => {
    const { container } = shown(FieldDocs)
    const [name, email] = section(container, "input").querySelectorAll<HTMLInputElement>(".demo-well input")
    expect(name.placeholder).toBe("Ada Byte")
    expect(email.value).toBe("not-an-email")
    expect(email.getAttribute("aria-invalid")).toBe("true")
    fireEvent.input(name, { target: { value: "Rei" } })
    expect(name.value).toBe("Rei")
    expect(section(container, "textarea").querySelector("textarea")?.value).toBe(
      "Dithered interfaces, composed with Vue.",
    )
    // a field ties its label, its control and its small print
    const field = section(container, "field")
    const website = input(field, "input[placeholder='https://']")
    expect(field.querySelector(`label[for="${website.id}"]`)?.textContent).toBe("Website")
    expect(website.getAttribute("aria-invalid")).toBe("true")
    expect(document.getElementById(website.getAttribute("aria-describedby")!)?.textContent).toContain(
      "That URL does not resolve.",
    )
    const set = section(container, "fieldset")
    expect(set.querySelector("legend")?.textContent).toBe("Profile")
    expect(input(set, "#profile-name").value).toBe("Ada Byte")
    expect(input(set, "#profile-handle").value).toBe("ada")
  })

  it("counts a submit, steps the number and says when the code is whole", () => {
    const { container } = shown(FieldDocs)
    const form = section(container, "form")
    expect(form.querySelector("form")?.noValidate).toBe(true)
    expect(form.querySelector(".demo-well")?.textContent).toContain("submitted 0 times")
    fireEvent.submit(form.querySelector("form")!)
    fireEvent.submit(form.querySelector("form")!)
    expect(form.querySelector(".demo-well")?.textContent).toContain("submitted 2 times")

    const number = section(container, "number-field")
    expect(words(number.querySelector(".demo-well")?.textContent)).toContain("3 / 10")
    fireEvent.keyDown(number.querySelector("[role='spinbutton']")!, { key: "ArrowUp" })
    expect(words(number.querySelector(".demo-well")?.textContent)).toContain("4 / 10")

    const otp = section(container, "otp-field")
    const boxes = [...otp.querySelectorAll<HTMLInputElement>(".demo-well input")]
    expect(boxes).toHaveLength(6)
    expect(otp.querySelector(".demo-well")?.textContent).not.toContain("complete!")
    boxes.forEach((b, i) => fireEvent.input(b, { target: { value: String(i) } }))
    expect(otp.querySelector(".demo-well p")?.textContent).toBe("complete!")
  })
})

describe("FormDocs", () => {
  it("turns the switch and the checkboxes, each on its own value", () => {
    const { container } = shown(FormDocs)
    const toggle = section(container, "switch").querySelector<HTMLElement>("[role='switch']")!
    expect(toggle.getAttribute("aria-label")).toBe("Bloom on hover")
    expect(toggle.getAttribute("aria-checked")).toBe("true")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-checked")).toBe("false")

    const boxes = [...section(container, "checkbox").querySelectorAll<HTMLElement>("[role='checkbox']")]
    expect(boxes.map((b) => words(b.textContent))).toEqual(["Show grid", "Snap to pixels", "Show rulers"])
    expect(boxes.map((b) => b.getAttribute("aria-checked"))).toEqual(["true", "false", "true"])
    fireEvent.click(boxes[1])
    expect(boxes.map((b) => b.getAttribute("aria-checked"))).toEqual(["true", "true", "true"])
  })

  it("binds the progress bar to the slider above it, and each variant to its own level", () => {
    const { container } = shown(FormDocs)
    const slider = section(container, "slider")
    const thumbs = [...slider.querySelectorAll<HTMLElement>("[role='slider']")]
    // one, a range's two, one, then the four variants
    expect(thumbs.map((t) => t.getAttribute("aria-valuenow"))).toEqual(["40", "25", "75", "60", "65", "65", "65", "65"])
    expect(words(slider.querySelector(".demo-well")?.textContent)).toContain("25 – 75")
    const progress = section(container, "progress")
    expect(progress.querySelector(".demo-well")?.textContent).toContain("40%")
    fireEvent.keyDown(thumbs[0], { key: "ArrowRight" })
    expect(thumbs[0].getAttribute("aria-valuenow")).toBe("41")
    expect(progress.querySelector(".demo-well")?.textContent).toContain("41%")
    expect(progress.querySelector("[role='progressbar']")?.getAttribute("aria-valuenow")).toBe("41")
    // the quality slider steps by ten
    fireEvent.keyDown(thumbs[3], { key: "ArrowRight" })
    expect(thumbs[3].getAttribute("aria-valuenow")).toBe("70")
    // the gallery stands outside the card, each slider named after its variant
    const gallery = slider.querySelector(":scope > h3 + div")!
    expect([...gallery.querySelectorAll("[role='slider']")].map((t) => t.getAttribute("aria-label"))).toEqual([
      "gradient slider",
      "dotted slider",
      "hatched slider",
      "solid slider",
    ])
    fireEvent.keyDown(thumbs[5], { key: "ArrowLeft" })
    expect(thumbs.slice(4).map((t) => t.getAttribute("aria-valuenow"))).toEqual(["65", "64", "65", "65"])
  })
})

describe("LayoutDocs", () => {
  it("fills the shell's regions and marks the rail's pick", () => {
    const { container } = shown(LayoutDocs)
    const shell = section(container, "dither-shell").querySelector(".demo-well")!
    expect(shell.textContent).toContain("acme ops")
    expect(shell.textContent).toContain("production: all systems normal")
    const rail = shell.querySelector("[aria-label='Primary']")!
    const items = [...rail.querySelectorAll("button")]
    expect(items.map((b) => b.getAttribute("aria-label") ?? words(b.textContent))).toHaveLength(4)
    expect(shell.querySelector(".ml-auto.tabular-nums")?.textContent).toBe("Overview")
    fireEvent.click(items[2])
    expect(shell.querySelector(".ml-auto.tabular-nums")?.textContent).toBe("Data")
    expect(["Requests", "Errors", "P95"].every((label) => shell.textContent?.includes(label))).toBe(true)
    expect(section(container, "rail").querySelector("[aria-label='Demo rail']")).not.toBeNull()
  })

  it("streams a deploy into both consoles, one run at a time", () => {
    vi.useFakeTimers()
    const { container } = shown(LayoutDocs)
    const well = section(container, "console").querySelector(".demo-well")!
    const run = key(well, "Run") as HTMLButtonElement
    expect(well.textContent).toContain("build ok (4.2s)")
    expect(well.textContent).not.toContain("deployed to dither-ui.com")
    fireEvent.click(run)
    expect(run.disabled).toBe(true)
    vi.advanceTimersByTime(450 * 2)
    expect(well.textContent).toContain("linting… 0 problems")
    expect(well.textContent).not.toContain("bundling client…")
    vi.advanceTimersByTime(450 * 4)
    expect(well.textContent).toContain("deployed to dither-ui.com")
    expect(section(container, "dither-shell").querySelector(".demo-well")?.textContent).toContain(
      "deployed to dither-ui.com",
    )
    expect(run.disabled).toBe(false)
  })

  it("drops a deploy's pending lines when the page goes", () => {
    vi.useFakeTimers()
    const { container, unmount } = shown(LayoutDocs)
    const before = vi.getTimerCount()
    fireEvent.click(key(section(container, "console"), "Run"))
    // six lines to come, beside whatever the kit's own key set
    const queued = vi.getTimerCount()
    expect(queued).toBeGreaterThanOrEqual(before + 6)
    unmount()
    expect(vi.getTimerCount()).toBeLessThanOrEqual(queued - 6)
  })

  it("picks the canvas pattern, sizes the grid and reads the zoom", () => {
    const { container } = shown(LayoutDocs)
    const canvas = section(container, "canvas")
    const group = canvas.querySelector("[role='group'][aria-label='Pattern']")!
    const pressed = () => [...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-pressed"))
    expect([...group.querySelectorAll("button")].map((b) => b.textContent?.trim())).toEqual(["dots", "grid", "plain"])
    expect(pressed()).toEqual(["true", "false", "false"])
    fireEvent.click(key(group, "plain"))
    expect(pressed()).toEqual(["false", "false", "true"])
    expect(key(group, "plain").className).toContain("bg-card text-foreground")

    const grid = section(container, "grid")
    const range = grid.querySelector<HTMLInputElement>("input[type='range']")!
    expect(range.value).toBe("140")
    expect(grid.querySelectorAll(".demo-well .bg-background\\/60")).toHaveLength(6)
    fireEvent.input(range, { target: { value: "200" } })
    expect(grid.querySelector("label")?.textContent).toContain("200px")
    expect(grid.querySelector<HTMLElement>(".demo-well .mt-3")?.style.gridTemplateColumns).toContain("200px")

    const infinite = section(container, "infinite-canvas")
    expect(infinite.querySelector(".demo-well")?.textContent).toContain("100%")
    const boards = [...infinite.querySelectorAll<HTMLElement>(".demo-well .absolute.w-40")]
    expect(boards.map((b) => [b.style.left, b.style.top])).toEqual([
      ["32px", "32px"],
      ["280px", "150px"],
    ])
  })
})

describe("MediaDocs", () => {
  it("advances a picked winner into the final, and resets", () => {
    const { container } = shown(MediaDocs)
    const well = section(container, "bracket").querySelector(".demo-well")!
    // a side is a key until its match is decided
    const side = (name: string) =>
      [...well.querySelectorAll(".truncate")].filter((el) => el.textContent === name).map((el) => el.parentElement!)
    expect(side("TBD")).toHaveLength(2)
    fireEvent.click(side("Bayer")[0])
    expect(side("Bayer")).toHaveLength(2)
    expect(side("Bayer")[0].textContent).toContain("winner")
    expect(side("Ordered")[0].className).toContain("line-through")
    fireEvent.click(side("Threshold")[0])
    expect(side("Threshold")).toHaveLength(2)
    expect(side("TBD")).toHaveLength(0)
    // the final is the reader's to pick too
    fireEvent.click(side("Threshold")[1])
    expect(side("Threshold")[1].textContent).toContain("winner")
    fireEvent.click(key(well, "Reset bracket"))
    expect(side("TBD")).toHaveLength(2)
    expect(side("Bayer")).toHaveLength(1)
    expect(side("Bayer")[0].tagName).toBe("BUTTON")
    expect(well.querySelector(".line-through")).toBeNull()
    expect(well.textContent).not.toContain("winner")
  })

  it("moves the schedule's now with its hour", () => {
    const { container } = shown(MediaDocs)
    const s = section(container, "schedule")
    const range = s.querySelector<HTMLInputElement>("input[type='range']")!
    expect(s.querySelector("label span")?.textContent).toBe("13:30")
    fireEvent.input(range, { target: { value: "9.25" } })
    expect(s.querySelector("label span")?.textContent).toBe("9:15")
    expect(["Standup", "Design review", "Focus block", "Client call"].every((e) => s.textContent?.includes(e))).toBe(
      true,
    )
  })

  it("stands the worlds under their names and brings the texture's aurora on its switch", () => {
    const { container } = shown(MediaDocs)
    const s = section(container, "world")
    expect(cards(s)).toHaveLength(3)
    expect([...s.querySelectorAll(".demo-well [role='img']")].map((el) => el.getAttribute("aria-label"))).toEqual([
      "Sample probe, seed 7",
      "A rocket that climbs and bursts",
      "The mascot as a Gaussian capture",
    ])
    const well = cards(s)[0].querySelector(".demo-well")!
    const NAMES = ["wire", "ink", "texture", "ramp", "grain", "bloom", "nudge", "build", "scatter", "engine"]
    const labels = [...well.querySelectorAll("label")].map((l) => words(l.textContent))
    expect(labels.map((l, i) => l.startsWith(NAMES[i]))).toEqual(NAMES.map(() => true))
    expect(well.querySelector(".mb-2.h-\\[48px\\]")).toBeNull()
    const texture = well.querySelectorAll<HTMLInputElement>("input[type='checkbox']")[2]
    fireEvent.click(texture)
    const aurora = well.querySelector(".mb-2.h-\\[48px\\]")!
    expect(aurora.getAttribute("aria-hidden")).toBe("true")
    expect(aurora.nextElementSibling?.getAttribute("aria-label")).toBe("Sample probe, seed 7")
    fireEvent.click(texture)
    expect(well.querySelector(".mb-2.h-\\[48px\\]")).toBeNull()
    expect(well.querySelector<HTMLSelectElement>("select")?.value).toBe("cpu")
    expect((cards(s)[2].querySelector("input[type='checkbox']") as HTMLInputElement).checked).toBe(true)
  })

  it("flies the rocket on one clock from its key", () => {
    const { container } = shown(MediaDocs)
    const card = cards(section(container, "world"))[1]
    const launch = key(card, "Launch") as HTMLButtonElement
    expect(launch.disabled).toBe(false)
    // the page's own frames from here on, stepped by hand
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb))
    vi.spyOn(performance, "now").mockReturnValue(5000)
    // the clock's own frame among whatever the kit asked for
    const steps = () => frames.splice(0).filter((f) => f.name === "step")
    fireEvent.click(launch)
    const [first, ...none] = steps()
    expect(none).toEqual([])
    first(5000 + 1000)
    // in flight the key waits, and the clock asks for its next frame
    expect(launch.disabled).toBe(true)
    expect(launch.textContent).toBe("Launch")
    const [second] = steps()
    second(5000 + LAUNCH_S * 1000 + 50)
    expect(launch.disabled).toBe(false)
    expect(launch.textContent).toBe("Launch again")
    expect(steps()).toEqual([])
    vi.restoreAllMocks()
  })

  it("goes straight to the debris under reduced motion", () => {
    reduced = true
    const { container } = shown(MediaDocs)
    const card = cards(section(container, "world"))[1]
    fireEvent.click(key(card, "Launch"))
    const again = key(card, "Launch again") as HTMLButtonElement
    expect(again.disabled).toBe(false)
  })

  it("feeds the CRT shader the aurora beside it", () => {
    const { container } = shown(MediaDocs)
    const s = section(container, "shader")
    const graph = s.querySelector("[data-graph]")!
    expect([...graph.querySelectorAll("p")].map((p) => p.textContent)).toContain("source: aurora")
    expect(graph.querySelector(".h-\\[70px\\][aria-hidden='true'] canvas")).not.toBeNull()
    expect(graph.querySelector("[aria-label='Aurora through a CRT shader']")).not.toBeNull()
    const mono = s.querySelector<HTMLInputElement>("label input[type='checkbox']")!
    expect(mono.checked).toBe(false)
    fireEvent.click(mono)
    expect(mono.checked).toBe(true)
    expect(section(container, "video-player").querySelector("[aria-label='Flower sample clip']")).not.toBeNull()
  })
})
