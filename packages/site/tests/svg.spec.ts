// @rstest-environment jsdom
// The SVG writer a frame's vector picture goes through: cells merged into
// runs per ink, colours and faces as a design tool reads them, names as
// layer ids, and a known frame written whole.
import { describe, expect, it } from "rstack/test"
import { cellRuns, fontStack, inkPaint, parseColor, runsPath, svgDocument, xmlText } from "@/entities/artboard/svg"

/** A raster from rows of letters: `.` clear, each other letter an ink. */
function raster(rows: string[]) {
  const inks: Record<string, number[]> = { a: [255, 0, 0, 255], b: [0, 0, 255, 128] }
  const w = rows[0].length
  const data = new Uint8ClampedArray(w * rows.length * 4)
  rows.forEach((row, y) => [...row].forEach((c, x) => c !== "." && data.set(inks[c], (y * w + x) * 4)))
  return { data, w, h: rows.length }
}

describe("cell runs", () => {
  it("merges a row's stretch and the same stretch under it into one run, per ink", () => {
    const r = raster(["aa.b", "aa.b", "a..."])
    const runs = cellRuns(r.data, r.w, r.h)!
    expect([...runs.entries()].map(([ink, list]) => [inkPaint(ink), list])).toEqual([
      [
        { hex: "#ff0000", alpha: 1 },
        [
          { x: 0, y: 0, w: 2, h: 2 },
          { x: 0, y: 2, w: 1, h: 1 },
        ],
      ],
      [{ hex: "#0000ff", alpha: 128 / 255 }, [{ x: 3, y: 0, w: 1, h: 2 }]],
    ])
  })

  it("gives up past the inks or the runs a print has", () => {
    const r = raster(["ab", "ba"])
    expect(cellRuns(r.data, r.w, r.h, 1)).toBeNull()
    expect(cellRuns(r.data, r.w, r.h, 32, 3)).toBeNull()
    expect(cellRuns(r.data, r.w, r.h)?.size).toBe(2)
  })

  it("writes runs as one path of rectangles at the cell's size", () => {
    expect(
      runsPath(
        [
          { x: 0, y: 0, w: 2, h: 1 },
          { x: 3, y: 1, w: 1, h: 2 },
        ],
        2.5,
        2,
        10,
        0,
      ),
    ).toBe("M10 0h5v2h-5zM17.5 2h2.5v4h-2.5z")
  })
})

describe("paints and faces", () => {
  it("reads rgb, rgba and hex colours, and none for a clear one", () => {
    expect(parseColor("rgb(255, 128, 0)")).toEqual({ hex: "#ff8000", alpha: 1 })
    expect(parseColor("rgba(0, 0, 0, 0.5)")).toEqual({ hex: "#000000", alpha: 0.5 })
    expect(parseColor("rgb(0 0 0 / 25%)")).toEqual({ hex: "#000000", alpha: 0.25 })
    expect(parseColor("#abc")).toEqual({ hex: "#aabbcc", alpha: 1 })
    expect(parseColor("rgba(0, 0, 0, 0)")).toBeNull()
    expect(parseColor("transparent")).toBeNull()
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull()
  })

  it("puts a face the tools ship first and drops the system keywords", () => {
    expect(fontStack('ui-monospace, "SF Mono", "JetBrains Mono", "Menlo", monospace')).toBe(
      "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
    )
    expect(fontStack('"Michroma", ui-monospace, "SF Mono", monospace')).toBe("'Michroma', 'SF Mono', monospace")
    expect(fontStack("ui-monospace, Menlo")).toBe("'JetBrains Mono', 'Menlo', monospace")
    expect(fontStack('"Inter", ui-sans-serif, system-ui, sans-serif')).toBe("'Inter', sans-serif")
  })

  it("escapes text and drops what XML forbids", () => {
    expect(xmlText(`<a & "b" 'c'>\u0001`)).toBe("&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;")
  })
})

describe("the document", () => {
  const frame = {
    name: "Sign in",
    x: 0,
    y: 0,
    w: 120,
    h: 40,
    clip: true,
    nodes: [
      {
        t: "g" as const,
        name: "Background",
        children: [{ t: "rect" as const, x: 0, y: 0, w: 120, h: 40, rx: 8, fill: { hex: "#101214", alpha: 1 } }],
      },
      {
        t: "g" as const,
        name: "Button",
        children: [
          {
            t: "rect" as const,
            x: 10,
            y: 8,
            w: 100,
            h: 24,
            rx: 4,
            fill: null,
            stroke: { paint: { hex: "#a6abb1", alpha: 0.5 }, width: 1 },
          },
          { t: "cells" as const, d: "M10 8h4v4h-4z", fill: { hex: "#e4e1d8", alpha: 1 } },
          {
            t: "text" as const,
            x: 20,
            y: 24,
            text: "Sign <in>",
            font: { family: "'JetBrains Mono', monospace", size: 12, weight: "500", style: "normal" },
            fill: { hex: "#e4e1d8", alpha: 1 },
            spacing: 0,
          },
        ],
      },
      { t: "g" as const, name: "Button", children: [] },
    ],
  }

  it("writes a known frame whole: its group, its layers by name, text as text", () => {
    expect(svgDocument([frame], 120, 40)).toMatchInlineSnapshot(`
      "<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="120" height="40" viewBox="0 0 120 40" fill="none">
      <defs>
      <clipPath id="frame-clip-1"><rect width="120" height="40"/></clipPath>
      </defs>
      <g id="Sign in" data-name="Sign in">
        <g clip-path="url(#frame-clip-1)">
          <g id="Background" data-name="Background">
            <rect x="0" y="0" width="120" height="40" rx="8" fill="#101214"/>
          </g>
          <g id="Button" data-name="Button">
            <rect x="10" y="8" width="100" height="24" rx="4" fill="none" stroke="#a6abb1" stroke-opacity="0.5" stroke-width="1"/>
            <path d="M10 8h4v4h-4z" fill="#e4e1d8" shape-rendering="crispEdges"/>
            <text x="20" y="24" font-family="&apos;JetBrains Mono&apos;, monospace" font-size="12" font-weight="500" fill="#e4e1d8" xml:space="preserve">Sign &lt;in&gt;</text>
          </g>
          <g id="Button 2" data-name="Button"/>
        </g>
      </g>
      </svg>
      "
    `)
  })

  it("is well-formed SVG, every id once, at the size asked", () => {
    const two = svgDocument([frame, { ...frame, x: 160 }], 280, 40)
    const doc = new DOMParser().parseFromString(two, "image/svg+xml")
    expect(doc.querySelector("parsererror")).toBeNull()
    const root = doc.documentElement
    expect([root.getAttribute("width"), root.getAttribute("height")]).toEqual(["280", "40"])
    const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(doc.querySelectorAll("text")).toHaveLength(2)
    expect(doc.getElementById("Sign in 2")?.getAttribute("transform")).toBe("translate(160 0)")
  })
})
