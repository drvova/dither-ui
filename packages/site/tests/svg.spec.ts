// @rstest-environment jsdom
// The SVG writer a frame's vector picture goes through: cells merged into
// runs per ink, colours and faces as a design tool reads them, names as
// layer ids, a known frame written whole, and computed CSS read as SVG
// (`css-svg.ts`: gradients, tiles, clips, corners, shadows).
import { describe, expect, it } from "rstack/test"
import { clipShape, gradientDef, radiiOf, shadowsOf, tileOf } from "@/entities/artboard/css-svg"
import {
  cellRuns,
  fontStack,
  inkPaint,
  parseColor,
  quantizeInks,
  runsPath,
  svgDocument,
  xmlText,
} from "@/entities/artboard/svg"

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

  it("holds a canvas's read-back to its inks: a hair off joins its ink, a few cells of their own hue keep theirs", () => {
    // 200 cells of one blue at alphas a step apart, 4 cells of red, 1 clear.
    const cells: number[][] = [
      ...Array.from({ length: 200 }, (_, i) => [40 + (i % 3), 90, 200, 120 + (i % 4)]),
      ...Array.from({ length: 4 }, () => [250, 20, 20, 255]),
      [0, 0, 0, 0],
    ]
    const out = quantizeInks(cells.flat(), 2)!
    const inks = new Set<string>()
    for (let i = 0; i < out.length; i += 4) if (out[i + 3]) inks.add(out.slice(i, i + 4).join())
    expect(inks.size).toBe(2)
    expect(out[200 * 4]).toBeGreaterThan(240) // the red kept its own ink
    expect([...out.slice(204 * 4)]).toEqual([0, 0, 0, 0])
  })

  it("is no print when the inks would move the cells too far (a smooth ramp)", () => {
    const ramp = Array.from({ length: 256 }, (_, i) => [i, 255 - i, (i * 7) % 256, 255]).flat()
    expect(quantizeInks(ramp, 2)).toBeNull()
    expect(quantizeInks(ramp, 64)).not.toBeNull()
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

describe("computed CSS as SVG", () => {
  const paint = (css: string) => parseColor(css)

  it("turns a linear gradient into one over the box, its stops spread, a corner to this box's corner", () => {
    const def = gradientDef(
      "linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255))",
      { x: 0, y: 0, w: 100, h: 50 },
      "g",
      paint,
    )!
    expect(def).toContain('x1="0" y1="25" x2="100" y2="25"')
    expect(def).toContain('<stop offset="0.5" stop-color="#00ff00"/>')
    const black = () => ({ hex: "#000000", alpha: 1 })
    const corner = gradientDef("linear-gradient(to right top, red, blue)", { x: 0, y: 0, w: 200, h: 100 }, "c", black)!
    const at = (k: string) => Number(new RegExp(` ${k}="([-\\d.]+)"`).exec(corner)![1])
    // Perpendicular to the box's other diagonal (200, 100).
    expect(Math.abs((at("x2") - at("x1")) * 200 + (at("y2") - at("y1")) * 100)).toBeLessThan(1)
    expect(gradientDef("conic-gradient(red, blue)", { x: 0, y: 0, w: 1, h: 1 }, "x", paint)).toBeNull()
  })

  it("keeps a dot screen as a radial gradient in a repeating tile", () => {
    expect(tileOf("16px 16px", "0% 0%", "repeat", { x: 0, y: 0, w: 200, h: 100 }, null)).toEqual({
      tile: { x: 0, y: 0, w: 16, h: 16 },
      repeats: true,
    })
    const def = gradientDef(
      "radial-gradient(rgb(255, 255, 255) 1px, rgba(0, 0, 0, 0) 1px)",
      { x: 0, y: 0, w: 16, h: 16 },
      "d",
      paint,
    )!
    expect(def).toContain('cx="8" cy="8" r="11.31"')
    expect(def).toContain(
      '<stop offset="0.0884" stop-color="#ffffff"/><stop offset="0.0884" stop-color="#000000" stop-opacity="0"/>',
    )
    expect(tileOf("auto", "0% 0%", "repeat", { x: 0, y: 0, w: 50, h: 50 }, null).repeats).toBe(false)
  })

  it("reads clip-path basic shapes, and none it cannot", () => {
    expect(clipShape("polygon(0px 0px, 100% 0px, 100% 100%)", { x: 10, y: 10, w: 20, h: 20 })).toBe(
      '<path d="M10 10L30 10L30 30Z"/>',
    )
    expect(clipShape("inset(2px round 4px)", { x: 0, y: 0, w: 20, h: 20 })).toContain("A4 4")
    expect(clipShape("circle(50% at 50% 50%)", { x: 0, y: 0, w: 20, h: 20 })).toContain("a10 10")
    expect(clipShape('url("#c")', { x: 0, y: 0, w: 1, h: 1 })).toBeNull()
  })

  it("reads each corner's radius and a shadow list", () => {
    expect(radiiOf(["8px", "0px", "50%", "4px 2px"], 100, 40)).toEqual([
      [8, 8],
      [0, 0],
      [50, 20],
      [4, 2],
    ])
    expect(shadowsOf("rgba(0, 0, 0, 0.2) 0px 4px 12px 0px, rgb(255, 0, 0) 0px 0px 0px 1px inset")).toEqual([
      { x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.2)", inset: false },
      { x: 0, y: 0, blur: 0, spread: 1, color: "rgb(255, 0, 0)", inset: true },
    ])
  })

  it("writes a box whose corners differ as arcs, agreeing corners as a rect, a ref'd fill, a clip and the notes", () => {
    const svg = svgDocument(
      [
        {
          name: "F",
          x: 0,
          y: 0,
          w: 100,
          h: 40,
          clip: false,
          nodes: [
            {
              t: "g",
              name: "Clipped",
              clip: "clip-1",
              children: [
                {
                  t: "rect",
                  x: 0,
                  y: 0,
                  w: 100,
                  h: 40,
                  rx: 0,
                  radii: radiiOf(["8px", "0px", "8px", "0px"], 100, 40),
                  fill: null,
                  ref: "gradient-1",
                },
                {
                  t: "rect",
                  x: 0,
                  y: 0,
                  w: 100,
                  h: 40,
                  rx: 0,
                  radii: radiiOf(["6px", "6px", "6px", "6px"], 100, 40),
                  fill: parseColor("#101214"),
                },
              ],
            },
          ],
        },
      ],
      100,
      40,
      ['<clipPath id="clip-1"><rect width="10" height="10"/></clipPath>'],
      ["a mask, drawn unmasked (2)"],
    )
    expect(svg).toContain(
      '<path d="M8 0H100L100 0V32A8 8 0 0 1 92 40H0L0 40V8A8 8 0 0 1 8 0Z" fill="url(#gradient-1)"/>',
    )
    expect(svg).toContain('<rect x="0" y="0" width="100" height="40" rx="6" fill="#101214"/>')
    expect(svg).toContain('clip-path="url(#clip-1)"')
    expect(svg).toContain("<desc>Approximated from the page: a mask, drawn unmasked (2).</desc>")
  })
})
