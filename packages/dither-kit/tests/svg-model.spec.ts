// SVG as a model (`engine/models/svg.ts`): paths flattened, holes cut,
// shapes triangulated once and extruded into slabs the 3D engine draws.
import { describe, expect, it } from "rstack/test"
import { flattenPath, formatOf, nest, parseSvg, parseWorld, sniffFormat, triangulate } from "../src/engine/models"
import { MAX_POINTS } from "../src/engine/models/svg"
import { clockSeconds } from "../src/engine/models/svg-motion"
import { nodeMatrices } from "../src/engine/world"

const enc = (s: string) => new TextEncoder().encode(s)
const svg = (body: string, box = "0 0 10 10") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${body}</svg>`
type Pt = [number, number]

/** Area the triangles cover. */
function covered(points: Pt[], tris: number[]) {
  let s = 0
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [points[tris[t]], points[tris[t + 1]], points[tris[t + 2]]]
    s += ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2
  }
  return s
}

describe("an SVG as a model", () => {
  it("is named and sniffed apart from X3D", () => {
    expect(formatOf("logo.svg?v=1")).toBe("svg")
    // a data URI by its media type, its payload never taken for a name
    expect(formatOf(`data:image/svg+xml,${svg('<rect fill="#fff" width="1.off"/>')}`)).toBe("svg")
    expect(formatOf("data:image/svg+xml;base64,PHN2Zy8+")).toBe("svg")
    expect(formatOf("data:model/gltf-binary;base64,Z2xURg==")).toBe("gltf")
    expect(formatOf("data:text/plain,a.obj")).toBeNull()
    expect(sniffFormat(enc(svg("")))).toBe("svg")
    expect(sniffFormat(enc(`<?xml version="1.0"?>\n${svg("")}`))).toBe("svg")
    expect(sniffFormat(enc('<?xml version="1.0"?><X3D></X3D>'))).toBe("x3d")
  })

  it("flattens every path command, absolute and relative", () => {
    expect(flattenPath("M0 0 10 0 10 10z")).toEqual([
      {
        ring: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
        closed: true,
      },
    ])
    expect(flattenPath("m1 1h4v4H1Z")[0].ring).toEqual([
      [1, 1],
      [5, 1],
      [5, 5],
      [1, 5],
    ])
    // a circle drawn as two arcs, flags packed as minifiers write them
    const [circle] = flattenPath("M-5 0a5 5 0 1010 0 5 5 0 10-10 0z", 0.01)
    expect(circle.ring.length).toBeGreaterThan(16)
    for (const [x, y] of circle.ring) expect(Math.hypot(x, y)).toBeCloseTo(5, 6)
    // curves end where they say, smooth ones reflecting the last control
    for (const d of ["M0 0C0 5 5 5 5 0S10 -5 10 0", "M0 0Q2.5 5 5 0T10 0"]) {
      const { ring, closed } = flattenPath(d)[0]
      expect(closed).toBe(false)
      expect(ring.at(-1)).toEqual([10, 0])
      expect(ring.length).toBeGreaterThan(4)
    }
  })

  it("triangulates concave outlines and cuts holes, covering exactly their area", () => {
    const L: Pt[] = [
      [0, 0],
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 2],
      [0, 2],
    ]
    const l = triangulate(L)
    expect(l.triangles).toHaveLength(12)
    expect(covered(l.points, l.triangles)).toBeCloseTo(3)
    const square: Pt[] = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ]
    const hole: Pt[] = [
      [1, 1],
      [1, 3],
      [3, 3],
      [3, 1],
    ]
    const cut = triangulate(square, [hole])
    expect(covered(cut.points, cut.triangles)).toBeCloseTo(12)
    // no triangle sits in the hole
    for (let t = 0; t < cut.triangles.length; t += 3) {
      const c = [0, 1].map(
        (ax) =>
          (cut.points[cut.triangles[t]][ax] +
            cut.points[cut.triangles[t + 1]][ax] +
            cut.points[cut.triangles[t + 2]][ax]) /
          3,
      )
      expect(c[0] > 1 && c[0] < 3 && c[1] > 1 && c[1] < 3).toBe(false)
    }
  })

  it("nests rings by depth: even fills, odd cuts, whichever way each winds", () => {
    const box = (s: number, o: number): Pt[] => [
      [o, o],
      [o + s, o],
      [o + s, o + s],
      [o, o + s],
    ]
    const shapes = nest([box(10, 0), box(6, 2), box(2, 4)])
    expect(shapes.map((s) => s.holes.length)).toEqual([1, 0])
    expect(shapes[1].outer[0]).toEqual([4, 4])
  })

  it("extrudes a filled shape into a closed slab in its colour, the wire on its outline only", () => {
    const world = parseSvg(svg('<rect x="1" y="1" width="8" height="4" fill="#ff8000"/>'))
    expect(world.meshes).toHaveLength(1)
    const [m] = world.meshes
    expect(m.kind).toBe("faces")
    expect(m.solid).toBe(true)
    expect(world.palette[m.color]).toEqual([255, 128, 0])
    // two caps of two triangles, four walls of two
    expect(m.indices.length / 3).toBe(12)
    // four edges a cap, four corners: never a diagonal
    expect(m.edges.length / 3).toBe(12)
    // the page's y runs down, the world's up
    const ys = [...m.positions].filter((_, i) => i % 3 === 1)
    expect(Math.max(...ys)).toBeCloseTo(-1)
    expect(Math.min(...ys)).toBeCloseTo(-5)
  })

  it("stacks later shapes in front, inherits paint and transforms, draws strokes as lines", () => {
    const world = parseSvg(
      svg(
        `<g fill="red" transform="translate(2 0)"><circle cx="2" cy="2" r="1"/></g>
         <path d="M0 0L10 10" stroke="#00f" fill="none"/>
         <rect width="2" height="2" style="fill: none"/>`,
      ),
    )
    expect(world.meshes.map((m) => m.kind)).toEqual(["faces", "lines"])
    const [disc, stroke] = world.meshes
    expect(world.palette[disc.color]).toEqual([255, 0, 0])
    const xs = [...disc.positions].filter((_, i) => i % 3 === 0)
    expect(Math.min(...xs)).toBeCloseTo(3, 1)
    const front = (m: typeof disc) => Math.max(...[...m.positions].filter((_, i) => i % 3 === 2))
    expect(front(stroke)).toBeGreaterThan(front(disc))
  })

  it("loads from a data URI as the component fetches it, URL-encoded or base64", async () => {
    const text = svg('<polygon points="0,0 10,0 5,8" fill="#ff8000"/>')
    for (const uri of [`data:image/svg+xml,${encodeURIComponent(text)}`, `data:image/svg+xml;base64,${btoa(text)}`]) {
      const bytes = await (await fetch(uri)).arrayBuffer()
      const world = parseWorld(bytes, formatOf(uri) ?? "auto")
      expect(world.meshes[0].indices.length / 3).toBe(8)
      expect(world.palette[world.meshes[0].color]).toEqual([255, 128, 0])
    }
  })

  it("is the same world through parseWorld, by name or by bytes", () => {
    const text = svg('<polygon points="0,0 10,0 5,8"/>')
    expect(parseWorld(text, "auto").meshes[0].indices.length).toBe(parseSvg(text).meshes[0].indices.length)
  })

  it("stops taking points past its bound, so a hostile drawing cannot hang the page", () => {
    const path = `<path d="M0 0${" l1 1 l-1 1".repeat(20_000)}z"/>`
    const world = parseSvg(svg(path.repeat(20)))
    const points = world.meshes.reduce((s, m) => s + m.positions.length / 6, 0)
    expect(points).toBeLessThan(MAX_POINTS * 1.5)
  })
})

describe("an SVG's own animation", () => {
  const at = (world: ReturnType<typeof parseSvg>, t: number) => nodeMatrices(world, t)

  it("reads SMIL clock values", () => {
    expect([clockSeconds("2s"), clockSeconds("350ms"), clockSeconds("1.5"), clockSeconds("0:01.5")]).toEqual([
      2, 0.35, 1.5, 1.5,
    ])
    expect(clockSeconds("indefinite")).toBe(0)
  })

  it("moves along a path paced by length, heading along it, the page's y turned over", () => {
    const world = parseSvg(
      svg(
        `<g><animateMotion dur="4s" repeatCount="indefinite" rotate="auto" path="M0 0 H10 V10"/><rect width="1" height="1"/></g>`,
      ),
    )
    expect(world.nodes).toHaveLength(1)
    expect(world.duration).toBe(4)
    const half = at(world, 2)[0]
    expect(half[12]).toBeCloseTo(10)
    expect(half[13]).toBeCloseTo(0)
    // heading down the page is heading down the world: the x axis points to -y
    const down = at(world, 3)[0]
    expect(down[13]).toBeCloseTo(-5)
    expect(down[1]).toBeCloseTo(-1)
    // the drawing frames by its page, which the motion keeps to
    expect(world.center[0]).toBe(5)
    expect(world.radius).toBeCloseTo(Math.hypot(10, 10) / 2)
  })

  it("turns about its centre the long way when told to, and sums onto the element's own transform", () => {
    const world = parseSvg(
      svg(
        `<g transform="translate(5 5)"><animateTransform attributeName="transform" type="rotate" values="0 1 0;360 1 0" dur="4s" additive="sum"/><rect width="2" height="1"/></g>`,
      ),
    )
    const m = (t: number) => at(world, t)[0]
    // a half turn about (1, 0), after the move to (5, 5): the origin lands at (7, 5)
    expect(m(2)[12]).toBeCloseTo(7)
    expect(m(2)[13]).toBeCloseTo(-5)
    // a full turn is not the short way back to no turn at all
    expect(m(1)[0]).toBeCloseTo(0)
    expect(m(4)[0]).toBeCloseTo(1)
  })

  it("takes keyTimes, and a scale through zero turns a shape about", () => {
    const world = parseSvg(
      svg(
        `<g><animateTransform attributeName="transform" type="scale" values="1 1;-1 1;-1 1" keyTimes="0;0.25;1" dur="4s"/><rect width="1" height="1"/></g>`,
      ),
    )
    expect(at(world, 1)[0][0]).toBeCloseTo(-1)
    expect(at(world, 0.5)[0][0]).toBeCloseTo(0)
  })

  it("stays still where nothing animates, and leaves an animation it cannot read", () => {
    expect(parseSvg(svg('<rect width="1" height="1"/>')).nodes).toHaveLength(0)
    const odd = parseSvg(
      svg(`<g><animateTransform type="skewX" values="0;10" dur="1s"/><rect width="1" height="1"/></g>`),
    )
    expect(odd.nodes).toHaveLength(0)
    expect(odd.meshes).toHaveLength(1)
  })
})
