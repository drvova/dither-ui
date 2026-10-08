import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { formatOf, parseObj, parseStl, parseVrml, parseWorld, sniffFormat } from "../dither-kit/models"
import {
  boxGeometry,
  coneGeometry,
  cylinderGeometry,
  finishWorld,
  emptyWorld,
  mat4Multiply,
  mat4Rotate,
  mat4Scale,
  mat4Translate,
  meshFrom,
  paintWorld,
  sampleWorld,
  sphereGeometry,
  transformPoint,
  type WorldMesh,
  type WorldStyle,
  type WorldView,
} from "../dither-kit/world"

const view: WorldView = { yaw: 30, pitch: 20, zoom: 1, fov: 40 }
const style: WorldStyle = { fill: [255, 0, 0], matrix: BAYER4, shade: 0.2, material: false, wire: false, fog: 0 }
const paint = (text: string, v: Partial<WorldView> = {}, s: Partial<WorldStyle> = {}, w = 64, h = 48) => {
  const buf = createRasterBuffer(w, h)
  paintWorld(buf, parseVrml(text), { ...view, ...v }, { ...style, ...s })
  return buf.data
}
const alphaAt = (d: Uint8ClampedArray, w: number, x: number, y: number) => d[(y * w + x) * 4 + 3]
const count = (d: Uint8ClampedArray, pred: (a: number) => boolean) => {
  let n = 0
  for (let i = 3; i < d.length; i += 4) if (pred(d[i])) n++
  return n
}

/** Every triangle's normal points away from the (convex) mesh's interior. */
function outward(mesh: WorldMesh): boolean {
  const p = mesh.positions
  const n = p.length / 3
  let cx = 0
  let cy = 0
  let cz = 0
  for (let i = 0; i < p.length; i += 3) {
    cx += p[i] / n
    cy += p[i + 1] / n
    cz += p[i + 2] / n
  }
  const idx = mesh.indices
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3
    const b = idx[t + 1] * 3
    const c = idx[t + 2] * 3
    const ux = p[b] - p[a]
    const uy = p[b + 1] - p[a + 1]
    const uz = p[b + 2] - p[a + 2]
    const vx = p[c] - p[a]
    const vy = p[c + 1] - p[a + 1]
    const vz = p[c + 2] - p[a + 2]
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    const mx = (p[a] + p[b] + p[c]) / 3 - cx
    const my = (p[a + 1] + p[b + 1] + p[c + 1]) / 3 - cy
    const mz = (p[a + 2] + p[b + 2] + p[c + 2]) / 3 - cz
    if (nx * mx + ny * my + nz * mz <= 0) return false
  }
  return true
}

describe("matrices", () => {
  it("rotate, translate and scale compose column-major on column vectors", () => {
    const r = mat4Rotate([0, 1, 0], Math.PI / 2)
    const p = transformPoint(r, [1, 0, 0])
    expect(p[0]).toBeCloseTo(0)
    expect(p[2]).toBeCloseTo(-1)
    const m = mat4Multiply(mat4Translate([10, 0, 0]), mat4Scale([2, 2, 2]))
    expect(transformPoint(m, [1, 1, 1])).toEqual([12, 2, 2])
  })
})

describe("primitives", () => {
  it("wind outward so back faces cull correctly", () => {
    const geos = [boxGeometry([2, 3, 4]), sphereGeometry(1), cylinderGeometry(1, 2), coneGeometry(1, 2)]
    for (const g of geos) expect(outward(meshFrom(g, null, [0, 0, 0], true)!)).toBe(true)
  })
  it("box: 8 points, 6 quads → 12 triangles, 24 outline edges owned by their triangles", () => {
    const mesh = meshFrom(boxGeometry([2, 2, 2]), null, [0, 0, 0], true)!
    expect(mesh.positions.length).toBe(24)
    expect(mesh.indices.length).toBe(36)
    expect(mesh.edges.length).toBe(24 * 3)
    for (let e = 0; e < mesh.edges.length; e += 3) {
      const tri = mesh.edges[e + 2]
      const verts = [mesh.indices[tri * 3], mesh.indices[tri * 3 + 1], mesh.indices[tri * 3 + 2]]
      expect(verts).toContain(mesh.edges[e])
      expect(verts).toContain(mesh.edges[e + 1])
    }
  })
  it("ccw=false and a mirroring matrix both reverse the winding", () => {
    const geo = boxGeometry([2, 2, 2])
    expect(outward(meshFrom(geo, null, [0, 0, 0], true, false)!)).toBe(false)
    expect(outward(meshFrom(geo, mat4Scale([-1, 1, 1]), [0, 0, 0], true)!)).toBe(true)
    expect(outward(meshFrom(geo, mat4Scale([-1, 1, 1]), [0, 0, 0], true, false)!)).toBe(false)
  })
  it("drops faces with out-of-range indices and bakes the matrix", () => {
    const mesh = meshFrom({ points: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [[0, 1, 2], [0, 1, 9]] }, mat4Translate([0, 0, 5]), [1, 2, 3], true)!
    expect(mesh.indices.length).toBe(3)
    expect(mesh.positions[2]).toBe(5)
    expect(meshFrom({ points: [], faces: [] }, null, [0, 0, 0], true)).toBeNull()
  })
  it("fits a bounding sphere", () => {
    const world = emptyWorld()
    world.meshes.push(meshFrom(boxGeometry([2, 2, 2]), mat4Translate([5, 0, 0]), [0, 0, 0], true)!)
    finishWorld(world)
    expect(world.center).toEqual([5, 0, 0])
    expect(world.radius).toBeCloseTo(Math.sqrt(3))
    expect(finishWorld(emptyWorld()).radius).toBe(1)
  })
})

describe("obj + stl", () => {
  it("reads v/f with slashes, negative indices and polygons", () => {
    const world = parseObj("# cube-ish\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1/1/1 2/2/2 3/3/3 4/4/4\nf -4 -3 -2\n")
    expect(world.meshes.length).toBe(1)
    expect(world.meshes[0].indices.length).toBe(9)
    expect(world.meshes[0].solid).toBe(true)
    expect(Array.from(world.meshes[0].indices.slice(6))).toEqual([0, 1, 2])
  })
  it("reads ASCII and binary STL as two-sided triangles", () => {
    const ascii = "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid t\n"
    const a = parseStl(ascii)
    expect(a.meshes[0].indices.length).toBe(3)
    expect(a.meshes[0].solid).toBe(false)
    const bin = new Uint8Array(84 + 50 * 2)
    const dv = new DataView(bin.buffer)
    dv.setUint32(80, 2, true)
    const tri = [0, 0, 0, 1, 0, 0, 0, 1, 0]
    for (let t = 0; t < 2; t++) for (let k = 0; k < 9; k++) dv.setFloat32(84 + t * 50 + 12 + k * 4, tri[k] + t, true)
    const b = parseStl(bin)
    expect(b.meshes[0].indices.length).toBe(6)
    expect(b.meshes[0].positions[9]).toBe(1)
  })
  it("formatOf by extension, sniffFormat by content", () => {
    expect(formatOf("a/b/rover.WRL?x=1")).toBe("vrml")
    expect(formatOf("m.obj")).toBe("obj")
    expect(formatOf("m.stl#f")).toBe("stl")
    expect(formatOf("m.gltf")).toBeNull()
    const enc = (s: string) => new TextEncoder().encode(s)
    expect(sniffFormat(enc("#VRML V2.0 utf8\n"))).toBe("vrml")
    expect(sniffFormat(enc("solid x\n facet normal 0 0 1\n"))).toBe("stl")
    expect(sniffFormat(enc("# made by x\nv 1 2 3\nf 1 2 3\n"))).toBe("obj")
  })
  it("parseWorld swings z-up STLs to y-up and leaves VRML alone", () => {
    const stl = parseWorld("solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 0 1\nendloop\nendfacet\nendsolid\n", "auto")
    const p = stl.meshes[0].positions
    expect([p[6], p[7], p[8]]).toEqual([0, 1, -0])
    const wrl = parseWorld("#VRML V2.0 utf8\nShape { geometry Box { size 2 2 4 } }", "auto")
    expect(wrl.radius).toBeCloseTo(Math.sqrt(1 + 1 + 4))
    expect(Math.max(...Array.from(wrl.meshes[0].positions).filter((_, i) => i % 3 === 2))).toBe(2)
  })
})

describe("paintWorld", () => {
  const sphere = "#VRML V2.0 utf8\nShape { geometry Sphere { radius 1 } }"
  it("is deterministic and clears the frame each call", () => {
    const a = paint(sphere)
    const b = paint(sphere)
    expect(Array.from(a)).toEqual(Array.from(b))
    const buf = createRasterBuffer(64, 48)
    paintWorld(buf, parseVrml(sphere), view, style)
    paintWorld(buf, parseVrml("#VRML V2.0 utf8\n"), view, style)
    expect(count(buf.data, (al) => al > 0)).toBe(0)
  })
  it("lights the silhouette, leaves the corners clear, keeps the fill colour", () => {
    const d = paint(sphere)
    expect(alphaAt(d, 64, 32, 24)).toBeGreaterThan(0)
    expect(alphaAt(d, 64, 0, 0)).toBe(0)
    expect(alphaAt(d, 64, 63, 47)).toBe(0)
    expect(count(d, (al) => al === 255)).toBeGreaterThan(50)
    expect(count(d, (al) => al === 51)).toBeGreaterThan(10)
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) expect([d[i], d[i + 1], d[i + 2]]).toEqual([255, 0, 0])
  })
  it("shade 0 makes unlit cells transparent; fog thins the far side", () => {
    expect(count(paint(sphere, {}, { shade: 0 }), (al) => al > 0 && al < 255)).toBe(0)
    const sum = (d: Uint8ClampedArray) => count(d, (al) => al === 255)
    expect(sum(paint(sphere, {}, { fog: 1 }))).toBeLessThan(sum(paint(sphere)))
  })
  it("culls back faces of solid geometry and keeps two-sided faces", () => {
    const tri = (solid: string) =>
      `#VRML V2.0 utf8\nShape { geometry IndexedFaceSet { solid ${solid} coord Coordinate { point [ -1 -1 0, 1 -1 0, 0 1 0 ] } coordIndex [ 0 1 2 -1 ] } }`
    expect(count(paint(tri("TRUE"), { yaw: 0, pitch: 0 }), (al) => al > 0)).toBeGreaterThan(0)
    expect(count(paint(tri("TRUE"), { yaw: 180, pitch: 0 }), (al) => al > 0)).toBe(0)
    expect(count(paint(tri("FALSE"), { yaw: 180, pitch: 0 }), (al) => al > 0)).toBeGreaterThan(0)
  })
  it("resolves depth: a near box hides a far one", () => {
    const two = "#VRML V2.0 utf8\nTransform { translation 0 0 2 children Shape { appearance Appearance { material Material { diffuseColor 1 0 0 } } geometry Box { size 1 1 1 } } }\nTransform { translation 0 0 -2 children Shape { appearance Appearance { material Material { diffuseColor 0 1 0 } } geometry Box { size 1 1 1 } } }"
    const d = paint(two, { yaw: 0, pitch: 0, zoom: 2 }, { material: true, shade: 1 })
    const c = (32 * 64 + 32) * 4
    expect([d[c], d[c + 1]]).toEqual([255, 0])
    const far = paint(two, { yaw: 180, pitch: 0, zoom: 2 }, { material: true, shade: 1 })
    expect([far[c], far[c + 1]]).toEqual([0, 255])
  })
  it("yaw and pitch change the picture; wire adds opaque outline pixels", () => {
    const box = "#VRML V2.0 utf8\nShape { geometry Box { size 2 1 3 } }"
    expect(Array.from(paint(box))).not.toEqual(Array.from(paint(box, { yaw: 75 })))
    expect(Array.from(paint(box))).not.toEqual(Array.from(paint(box, { pitch: -20 })))
    expect(count(paint(box, {}, { wire: true }), (al) => al === 255)).toBeGreaterThan(count(paint(box), (al) => al === 255))
  })
  it("uses the file's lights and headlight flag", () => {
    const lit = paint(sphere + "\nDirectionalLight { direction 0 0 -1 }")
    const dark = paint(sphere + "\nNavigationInfo { headlight FALSE }\nDirectionalLight { direction 0 0 1 }")
    expect(count(lit, (al) => al === 255)).toBeGreaterThan(count(dark, (al) => al === 255))
  })
})

describe("sampleWorld", () => {
  it("writes deterministic VRML97 per seed that parses into a multi-mesh world", () => {
    expect(sampleWorld(7)).toBe(sampleWorld(7))
    expect(sampleWorld(7)).not.toBe(sampleWorld(8))
    expect(sampleWorld(7).startsWith("#VRML V2.0 utf8")).toBe(true)
    const world = parseVrml(sampleWorld(7))
    expect(world.meshes.length).toBeGreaterThanOrEqual(5)
    expect(world.radius).toBeGreaterThan(1)
    expect(count(paint(sampleWorld(7)), (al) => al > 0)).toBeGreaterThan(100)
  })
})
