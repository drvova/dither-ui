// A frame as drawn, read into its layered SVG: a frame of each widget kind
// and each chart type comes out well-formed, at its size, its layers named
// as the layer tree names them and its text as `<text>`; the selection as
// one picture; and `svg.export` answers with it. jsdom lays nothing out, so
// every box is given one here.
import { cleanup, render } from "@solidjs/testing-library"
import { For } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DitherBadge, DitherButton } from "@dither-ui/kit"
import { screenTone, toneTile } from "@dither-ui/kit/engine"
import { elementSvg, framesSvg } from "@/entities/artboard"
import { editor } from "@/entities/editor"
import { runCommand } from "@/features/agent"
import { CHART_TYPES } from "@/shared/config"
import { SIMPLE_WIDGET_KINDS } from "@/entities/widget"
import Artboard from "../../src/widgets/canvas/Artboard"
import { world } from "@dither-ui/kit/testing/world.ts"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
  // A layout for jsdom: a frame's surface its own box, all else a small box in it.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const frame = this.matches("[data-artboard-surface]")
      ? editor.artboards.find((a) => a.id === this.closest<HTMLElement>("[data-artboard-id]")?.dataset.artboardId)
      : null
    return frame ? new DOMRect(0, 0, frame.w, frame.h) : new DOMRect(8, 8, 60, 18)
  })
  Range.prototype.getClientRects = () => [new DOMRect(12, 10, 7, 14)] as unknown as DOMRectList
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  w.restore()
})

const idOf = (r: ReturnType<typeof runCommand>) => (r.ok ? (r.data as { id: string }).id : "")

/** The frames on a canvas, as the Studio draws them. */
function draw() {
  render(() => <For each={editor.artboards}>{(a) => <Artboard artboard={a} />}</For>)
  w.show()
}

function parse(svg: string | null) {
  expect(svg).not.toBeNull()
  const doc = new DOMParser().parseFromString(svg!, "image/svg+xml")
  expect(doc.querySelector("parsererror")).toBeNull()
  return doc
}

/** The names of the groups under a frame's group, in paint order. */
const layers = (doc: Document, frame: string) =>
  [...(doc.getElementById(frame)?.querySelectorAll("g[data-name]") ?? [])].map((g) => g.getAttribute("data-name"))

describe("a frame as SVG", () => {
  it.each(CHART_TYPES)("a %s chart: its size, its frame and the chart's root layer", (type) => {
    const id = idOf(runCommand({ type: "chart.add", chart: type, name: `${type} chart` }))
    draw()
    const a = editor.artboards.find((x) => x.id === id)!
    const doc = parse(framesSvg([a]))
    const root = doc.documentElement
    expect([root.getAttribute("width"), root.getAttribute("height")]).toEqual([String(a.w), String(a.h)])
    expect(root.getAttribute("viewBox")).toBe(`0 0 ${a.w} ${a.h}`)
    const names = layers(doc, `${type} chart`)
    expect(names[0]).toBe("Background")
    expect(names).toContain(`${type[0].toUpperCase()}${type.slice(1)}Chart`)
  })

  it.each(SIMPLE_WIDGET_KINDS)("a %s widget: one layer named after it", (kind) => {
    const id = idOf(runCommand({ type: "widget.add", widget: kind, name: `My ${kind}` }))
    draw()
    const doc = parse(framesSvg([editor.artboards.find((x) => x.id === id)!]))
    expect(layers(doc, `My ${kind}`).slice(0, 2)).toEqual(["Background", `${kind[0].toUpperCase()}${kind.slice(1)}`])
  })

  it("a component: its layer is the component, its words are text", () => {
    const id = idOf(
      runCommand({
        type: "component.add",
        is: "DitherBadge",
        name: "Badge frame",
      }),
    )
    draw()
    const doc = parse(framesSvg([editor.artboards.find((x) => x.id === id)!]))
    expect(layers(doc, "Badge frame")).toContain("Badge")
    const texts = [...doc.querySelectorAll("text")]
    expect(texts.length).toBeGreaterThan(0)
    expect(texts[0].getAttribute("font-size")).toMatch(/^\d/)
    expect(texts[0].getAttribute("font-family")).toMatch(/serif|monospace/)
  })

  it("a screen: a group a row, a group a cell, named as the layer tree names them", () => {
    const id = idOf(
      runCommand({
        type: "screen.add",
        name: "Sign in",
        rows: [{ cells: [{ is: "DitherBadge" }] }, { cells: [{ is: "DitherSwitch" }, { is: "DitherBadge" }] }],
      }),
    )
    draw()
    const doc = parse(framesSvg([editor.artboards.find((x) => x.id === id)!]))
    const outline = (g: Element): unknown[] =>
      [...g.children]
        .filter((c) => c.localName === "g" && c.hasAttribute("data-name"))
        .map((c) => {
          const kids = outline(c)
          return kids.length ? { [c.getAttribute("data-name")!]: kids } : c.getAttribute("data-name")
        })
    expect(outline(doc.getElementById("Sign in")!.firstElementChild!)).toMatchInlineSnapshot(`
      [
        "Background",
        {
          "Row 1": [
            "Badge",
          ],
        },
        {
          "Row 2": [
            "Switch",
            "Badge",
          ],
        },
      ]
    `)
    expect(doc.querySelectorAll("text").length).toBeGreaterThan(0)
  })

  it("a selection: the frames at their places in one picture", () => {
    const one = idOf(runCommand({ type: "widget.add", widget: "button", name: "One" }))
    const two = idOf(runCommand({ type: "widget.add", widget: "button", name: "Two" }))
    draw()
    const [a, b] = [one, two].map((i) => editor.artboards.find((x) => x.id === i)!)
    const doc = parse(framesSvg([a, b]))
    const x0 = Math.min(a.x, b.x)
    const y0 = Math.min(a.y, b.y)
    expect(doc.documentElement.getAttribute("width")).toBe(String(Math.max(a.x + a.w, b.x + b.w) - x0))
    for (const f of [a, b])
      expect(doc.getElementById(f.name)?.getAttribute("transform") ?? "translate(0 0)").toBe(
        `translate(${f.x - x0} ${f.y - y0})`,
      )
  })

  it("is none for a frame not on the page", () => {
    const id = idOf(runCommand({ type: "widget.add", widget: "button" }))
    expect(framesSvg([editor.artboards.find((x) => x.id === id)!])).toBeNull()
  })
})

describe("svg.export", () => {
  it("answers with the selection's SVG and its file", () => {
    const id = idOf(runCommand({ type: "widget.add", widget: "gradient", name: "Wash" }))
    draw()
    runCommand({ type: "artboard.select", id })
    const r = runCommand({ type: "svg.export" })
    expect(r.ok).toBe(true)
    const data = (r as { data: { ids: string[]; file: string; svg: string } }).data
    expect(data.ids).toEqual([id])
    expect(data.file).toBe("svg/wash.svg")
    expect(layers(parse(data.svg), "Wash")).toContain("Gradient")
  })

  it("fails for a frame not drawn, and with nothing selected", () => {
    const id = idOf(runCommand({ type: "widget.add", widget: "button" }))
    expect(runCommand({ type: "svg.export", id }).ok).toBe(false)
    editor.selectedIds = []
    expect(runCommand({ type: "svg.export" }).ok).toBe(false)
  })
})

describe("any element as SVG (the docs previews' workbench)", () => {
  it("reads a stage of kit components the way it reads a frame, what it skips left out", () => {
    const view = render(() => (
      <div data-stage>
        <DitherButton>Deploy now</DitherButton>
        <DitherBadge>Beta</DitherBadge>
        <div class="wb">overlay</div>
      </div>
    ))
    const stage = view.container.querySelector<HTMLElement>("[data-stage]")!
    stage.getBoundingClientRect = () => new DOMRect(0, 0, 320, 120)
    const svg = elementSvg(stage, "Button (dither-ui docs)", (el) => el.classList.contains("wb"))!
    expect(svg).toMatch(/<svg [^>]*width="320" height="120" viewBox="0 0 320 120"/)
    expect(svg).toContain('data-name="Button (dither-ui docs)"')
    expect(svg).toContain(">Deploy now</text>")
    expect(svg).toContain(">Beta</text>")
    expect(svg).not.toContain("overlay")
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml")
    expect(doc.querySelector("parsererror")).toBeNull()
  })

  it("reads nothing from an element not laid out", () => {
    const hidden = document.createElement("div")
    hidden.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0)
    expect(elementSvg(hidden, "x")).toBeNull()
  })
})

describe("a box's paint as SVG", () => {
  /** A stage of plain elements, each its own box by `data-box`. */
  function stage(html: string) {
    const root = document.createElement("div")
    root.innerHTML = html
    document.body.append(root)
    root.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100)
    for (const el of root.querySelectorAll<HTMLElement>("[data-box]")) {
      const [x, y, w, h] = el.dataset.box!.split(" ").map(Number)
      el.getBoundingClientRect = () => new DOMRect(x, y, w, h)
    }
    return root
  }
  afterEach(() => document.body.replaceChildren())

  it("writes a linear gradient as an SVG gradient and a dot screen as a repeating pattern", () => {
    const root = stage(`
      <div data-box="0 0 100 50" style="background-image: linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))"></div>
      <div data-box="0 50 200 50" style="background-image: radial-gradient(rgb(255, 255, 255) 1px, rgba(0, 0, 0, 0) 1px); background-size: 16px 16px"></div>
    `)
    const svg = elementSvg(root, "Stage")!
    expect(svg).toMatch(
      /<linearGradient id="gradient-\d+" gradientUnits="userSpaceOnUse" x1="0" y1="25" x2="100" y2="25">/,
    )
    expect(svg).toMatch(/<rect x="0" y="0" width="100" height="50" fill="url\(#gradient-\d+\)"\/>/)
    expect(svg).toMatch(
      /<pattern id="(pattern-\d+)" x="0" y="50" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="url\(#gradient-\d+\)"\/><\/pattern>/,
    )
    expect(svg).toMatch(/<rect x="0" y="50" width="200" height="50" fill="url\(#pattern-\d+\)"\/>/)
  })

  it("prints a kit tone as the tone's own pattern in its ink, laid from the box", () => {
    const root = stage(
      `<div class="dk-tone" data-box="10 10 40 20" style="background-color: rgb(255, 0, 0); --dk-cell: 2px"></div>`,
    )
    root.querySelector<HTMLElement>(".dk-tone")!.style.setProperty("--dk-tone-tile", toneTile(screenTone("bayer", 8)))
    const svg = elementSvg(root, "Stage")!
    expect(svg).toMatch(
      /<pattern id="tone-\d+" x="10" y="10" width="8" height="8" patternUnits="userSpaceOnUse"><path transform="scale\(2\)" fill="#ff0000" shape-rendering="crispEdges" d="M0 0h1v1h-1z/,
    )
    expect(svg).toMatch(/<rect x="10" y="10" width="40" height="20" fill="url\(#tone-\d+\)"\/>/)
  })

  it("clips what overflows a box and what a clip-path cuts, each corner its own radius", () => {
    const root = stage(`
      <div data-box="0 0 100 50" style="overflow: hidden; background-color: rgb(0, 0, 255); border-top-left-radius: 8px; border-bottom-right-radius: 8px">
        <span data-box="0 0 200 20" style="display: block; background-color: rgb(0, 255, 0)"></span>
      </div>
      <div data-box="100 0 100 100" style="clip-path: polygon(0px 0px, 100% 0px, 100% 100%); background-color: rgb(1, 2, 3)"></div>
    `)
    const svg = elementSvg(root, "Stage")!
    expect(svg).toMatch(
      /<clipPath id="clip-\d+"><path d="M8 0H100L100 0V42A8 8 0 0 1 92 50H0L0 50V8A8 8 0 0 1 8 0Z"\/><\/clipPath>/,
    )
    expect(svg).toContain('<path d="M8 0H100L100 0V42A8 8 0 0 1 92 50H0L0 50V8A8 8 0 0 1 8 0Z" fill="#0000ff"/>')
    expect(svg).toMatch(/<clipPath id="clip-\d+"><path d="M100 0L200 0L200 100Z"\/><\/clipPath>/)
    expect(svg.match(/data-name="Clip" clip-path="url\(#clip-\d+\)"/g)).toHaveLength(2)
  })

  it("draws an inset ring inside the border, lists what it left out in the desc", () => {
    const root = stage(`
      <div data-box="0 0 60 20" style="box-shadow: rgb(255, 0, 0) 0px 0px 0px 2px inset"></div>
      <div data-box="0 30 60 20" style="box-shadow: rgb(0, 0, 0) 0px 2px 4px 0px inset; background-color: rgb(9, 9, 9)"></div>
    `)
    const svg = elementSvg(root, "Stage")!
    expect(svg).toContain('<rect x="1" y="1" width="58" height="18" fill="none" stroke="#ff0000" stroke-width="2"/>')
    expect(svg).toContain("<desc>Approximated from the page: a blurred or offset inset shadow, left out.</desc>")
  })

  it("draws a control the browser draws as plain shapes, checked", () => {
    const root = stage(`<input type="checkbox" checked data-box="0 0 16 16" aria-label="Agree">`)
    const svg = elementSvg(root, "Stage")!
    expect(svg).toContain('data-name="Agree"')
    expect(svg).toMatch(/<rect x="0" y="0" width="16" height="16" rx="2" fill="#[0-9a-f]{6}"\/>/)
    expect(svg).toContain("a control the browser draws, drawn as plain shapes")
  })
})
