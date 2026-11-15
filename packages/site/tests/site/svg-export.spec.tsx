// A frame as drawn, read into its layered SVG: a frame of each widget kind
// and each chart type comes out well-formed, at its size, its layers named
// as the layer tree names them and its text as `<text>`; the selection as
// one picture; and `svg.export` answers with it. jsdom lays nothing out, so
// every box is given one here.
import { cleanup, render } from "@solidjs/testing-library"
import { For } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { framesSvg } from "@/entities/artboard"
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
    const id = idOf(runCommand({ type: "component.add", is: "DitherBadge", name: "Badge frame" }))
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
