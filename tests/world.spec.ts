import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { formatOf, parseObj, parseStl, parseVrml, parseWorld, sniffFormat } from "../dither-kit/models"
import {
  addMesh,
  addNode,
  boxGeometry,
  coneGeometry,
  cylinderGeometry,
  createWorldTarget,
  finishWorld,
  emptyWorld,
  mat4Multiply,
  mat4Rotate,
  mat4Scale,
  mat4Translate,
  nodeMatrices,
  packTarget,
  paintMaterial,
  paintTarget,
  paintWorld,
  quatFromAxisAngle,
  quatSlerp,
  rasterizeWorld,
  sampleTrack,
  sampleWorld,
  sphereGeometry,
  transformPoint,
  type Track,
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
/** A mesh baked into a fresh world. */
const bake = (geo: Parameters<typeof addMesh>[1], m: Parameters<typeof addMesh>[2], solid: boolean, ccw = true) => addMesh(emptyWorld(), geo, m, [0, 0, 0], solid, { ccw })!
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
    for (const g of geos) expect(outward(bake(g, null, true))).toBe(true)
  })
  it("box: 8 points, 6 quads → 12 triangles, 24 outline edges owned by their triangles", () => {
    const mesh = bake(boxGeometry([2, 2, 2]), null, true)
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
    expect(outward(bake(geo, null, true, false))).toBe(false)
    expect(outward(bake(geo, mat4Scale([-1, 1, 1]), true))).toBe(true)
    expect(outward(bake(geo, mat4Scale([-1, 1, 1]), true, false))).toBe(false)
  })
  it("drops faces with out-of-range indices, bakes the matrix, registers colours", () => {
    const world = emptyWorld()
    const mesh = addMesh(world, { points: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [[0, 1, 2], [0, 1, 9]], colors: [1, 0, 0, 0, 1, 0] }, mat4Translate([0, 0, 5]), [1, 2, 3], true)!
    expect(mesh.indices.length).toBe(3)
    expect(mesh.positions[2]).toBe(5)
    expect(world.palette[mesh.color]).toEqual([1, 2, 3])
    expect(world.palette[mesh.triColors![0]]).toEqual([255, 0, 0])
    expect(addMesh(world, { points: [], faces: [] }, null, [0, 0, 0], true)).toBeNull()
    const lines = addMesh(world, { points: [0, 0, 0, 1, 0, 0, 2, 0, 0], faces: [[0, 1, 2]] }, null, [9, 9, 9], false, { kind: "lines" })!
    expect(Array.from(lines.indices)).toEqual([0, 1, 1, 2])
    const points = addMesh(world, { points: [0, 0, 0, 1, 0, 0], faces: [] }, null, [9, 9, 9], false, { kind: "points" })!
    expect(Array.from(points.indices)).toEqual([0, 1])
  })
  it("fits a bounding sphere", () => {
    const world = emptyWorld()
    addMesh(world, boxGeometry([2, 2, 2]), mat4Translate([5, 0, 0]), [0, 0, 0], true)
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
    expect(formatOf("m.gltf")).toBe("gltf")
    expect(formatOf("m.fbx")).toBeNull()
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

describe("animation", () => {
  it("samples tracks: lerp, step, looping, slerp the short way", () => {
    const lerp: Track = { key: [0, 1, 2], value: [0, 0, 0, 10, 0, 0, 10, 10, 0], stride: 3, kind: "lerp", duration: 2, loop: true, start: 0 }
    const out = [0, 0, 0]
    sampleTrack(lerp, 0.5, out)
    expect(out).toEqual([5, 0, 0])
    sampleTrack(lerp, 2.5, out)
    expect(out).toEqual([5, 0, 0])
    sampleTrack({ ...lerp, loop: false }, 7, out)
    expect(out).toEqual([10, 10, 0])
    sampleTrack({ ...lerp, kind: "step" }, 1.9, out)
    expect(out).toEqual([10, 0, 0])
    const q = quatSlerp(quatFromAxisAngle([0, 1, 0], 0), quatFromAxisAngle([0, 1, 0], Math.PI / 2), 0.5)
    const half = quatFromAxisAngle([0, 1, 0], Math.PI / 4)
    q.forEach((v, i) => expect(v).toBeCloseTo(half[i], 5))
  })
  it("poses nodes through parents and pre-transforms, caching per time", () => {
    const world = emptyWorld()
    const root = addNode(world, { parent: -1, pre: mat4Translate([10, 0, 0]), tracks: { rotation: { key: [0, 1], value: [...quatFromAxisAngle([0, 0, 1], 0), ...quatFromAxisAngle([0, 0, 1], Math.PI)], stride: 4, kind: "slerp", duration: 1, loop: true, start: 0 } } })
    const child = addNode(world, { parent: root, translation: [1, 0, 0] })
    const m0 = nodeMatrices(world, 0)
    expect(transformPoint(m0[child], [0, 0, 0]).map((v) => Math.round(v * 1000) / 1000)).toEqual([11, 0, 0])
    const m1 = nodeMatrices(world, 0.5)
    const p = transformPoint(m1[child], [0, 0, 0])
    expect(p[0]).toBeCloseTo(10)
    expect(p[1]).toBeCloseTo(1)
    expect(nodeMatrices(world, 0.5)).toBe(m1)
  })
  it("VRML ROUTEs become tracks: the sample's arms revolve and its antenna bobs with time", () => {
    const world = parseVrml(sampleWorld(7))
    expect(world.nodes.length).toBe(2)
    expect(world.nodes[0].tracks.rotation?.loop).toBe(true)
    expect(world.nodes[1].tracks.translation?.stride).toBe(3)
    expect(world.duration).toBeGreaterThan(0)
    // One world, two moments: the pose, not a reparse, makes the difference.
    const still = { ...view, yaw: 0, pitch: 0 }
    const at = (time: number) => {
      const buf = createRasterBuffer(64, 48)
      paintWorld(buf, world, { ...still, time }, style)
      return Array.from(buf.data)
    }
    expect(at(0)).not.toEqual(at(1.3))
    expect(at(1.3)).toEqual(at(1.3))
    expect(at(0)).toEqual(at(world.duration))
  })
})

describe("kit engines in the shade", () => {
  const sphere = "#VRML V2.0 utf8\nShape { geometry Sphere { radius 1 } }"
  it("ramp mode bands the lighting across the palette over an opaque silhouette", () => {
    const d = paint(sphere, {}, { ramp: [[0, 0, 0], [128, 0, 0], [255, 255, 255]] })
    const seen = new Set<string>()
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) seen.add(`${d[i]},${d[i + 1]},${d[i + 2]}`)
    expect([...seen].sort()).toEqual(["0,0,0", "128,0,0", "255,255,255"])
    for (let i = 3; i < d.length; i += 4) expect([0, 255]).toContain(d[i])
    const soft = paint(sphere, {}, { ramp: [[0, 0, 0], [255, 255, 255]], dither: 0 })
    const greys = new Set<number>()
    for (let i = 0; i < soft.length; i += 4) if (soft[i + 3]) greys.add(soft[i])
    expect(greys.size).toBeGreaterThan(3)
  })
  it("grain modulates the shade deterministically per seed", () => {
    const plain = paint(sphere)
    const grainy = paint(sphere, {}, { grain: 0.8, seed: 3 })
    expect(Array.from(grainy)).not.toEqual(Array.from(plain))
    expect(Array.from(paint(sphere, {}, { grain: 0.8, seed: 3 }))).toEqual(Array.from(grainy))
    expect(Array.from(paint(sphere, {}, { grain: 0.8, seed: 4 }))).not.toEqual(Array.from(grainy))
  })
  it("line and point sets draw depth-tested over the faces", () => {
    const lines = "#VRML V2.0 utf8\nShape { appearance Appearance { material Material { emissiveColor 0 1 0 } } geometry IndexedLineSet { coord Coordinate { point [ -2 0 0, 2 0 0, 0 2 0 ] } coordIndex [ 0 1 2 0 -1 ] } }"
    const d = paint(lines, { yaw: 0, pitch: 0 }, { material: true })
    let lit = 0
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) {
      lit++
      expect([d[i], d[i + 1], d[i + 2]]).toEqual([0, 255, 0])
    }
    expect(lit).toBeGreaterThan(20)
    const pts = "#VRML V2.0 utf8\nShape { geometry PointSet { coord Coordinate { point [ -1 0 0, 1 0 0, 0 1 0, 0 -1 0 ] } } }"
    expect(count(paint(pts, { yaw: 0, pitch: 0 }), (al) => al === 255)).toBe(4)
    // A point inside the box (same bounds, so the same framing) is hidden by its front face.
    const hidden = "#VRML V2.0 utf8\nShape { geometry Box { size 2 2 2 } }\nShape { geometry PointSet { coord Coordinate { point [ 0 0 -0.5 ] } } }"
    expect(count(paint(hidden, { yaw: 0, pitch: 0 }, { shade: 1 }), (al) => al === 255)).toBe(count(paint("#VRML V2.0 utf8\nShape { geometry Box { size 2 2 2 } }", { yaw: 0, pitch: 0 }, { shade: 1 }), (al) => al === 255))
  })
  it("the two stages compose: a target filled by the CPU engine paints like paintWorld", () => {
    const world = parseVrml(sphere)
    const target = createWorldTarget(64, 48)
    rasterizeWorld(world, view, target, style)
    const buf = createRasterBuffer(64, 48)
    paintTarget(buf, target, world, view, style)
    expect(Array.from(buf.data)).toEqual(Array.from(paint(sphere)))
    expect(target.index[24 * 64 + 32]).toBe(1)
    expect(target.index[0]).toBe(0)
  })
})

describe("materials", () => {
  const sphere = "#VRML V2.0 utf8\nShape { geometry Sphere { radius 1 } }"
  it("packs the target for the GPU: shade, palette index, 16-bit depth, far where empty", () => {
    const world = parseVrml(sphere)
    const target = createWorldTarget(64, 48)
    rasterizeWorld(world, view, target, style)
    const px = packTarget(target, world, view)
    const centre = (24 * 64 + 32) * 4
    expect(px[centre + 1]).toBe(1)
    expect(px[centre]).toBe(Math.round(target.shade[24 * 64 + 32] * 255))
    const code = px[centre + 2] * 256 + px[centre + 3]
    expect(code).toBeGreaterThan(0)
    expect(code).toBeLessThan(65535)
    expect(Array.from(px.slice(0, 4))).toEqual([0, 0, 255, 255])
    expect(packTarget(target, world, view, px)).toBe(px)
  })
  it("paints a material's output through the Bayer cell, clear where it is zero, overlays on top", () => {
    const world = parseVrml(sphere)
    const target = createWorldTarget(8, 8)
    rasterizeWorld(world, view, target, style)
    // A material: full shade in green on the top GL row (= the raster's bottom row), half on the next, nothing elsewhere.
    const rgba = new Uint8Array(8 * 8 * 4)
    for (let x = 0; x < 8; x++) {
      rgba.set([0, 255, 0, 255], (7 * 8 + x) * 4)
      rgba.set([255, 0, 0, 128], (6 * 8 + x) * 4)
    }
    const buf = createRasterBuffer(8, 8)
    paintMaterial(buf, target, world, view, { ...style, shade: 0.5 }, rgba)
    const d = buf.data
    for (let x = 0; x < 8; x++) {
      expect(Array.from(d.slice(x * 4, x * 4 + 4))).toEqual([0, 255, 0, 255])
      const o = (1 * 8 + x) * 4
      expect([d[o], d[o + 1], d[o + 2]]).toEqual([255, 0, 0])
      expect([255, 128]).toContain(d[o + 3])
      expect(d[(4 * 8 + x) * 4 + 3]).toBe(0)
    }
    const wired = createRasterBuffer(8, 8)
    paintMaterial(wired, target, world, view, { ...style, wire: true }, new Uint8Array(8 * 8 * 4))
    expect(count(wired.data, (al) => al === 255)).toBeGreaterThan(0)
    expect(count(createRasterBuffer(8, 8).data, (al) => al > 0)).toBe(0)
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
    expect(world.palette.length).toBeGreaterThanOrEqual(4)
    expect(count(paint(sampleWorld(7)), (al) => al > 0)).toBeGreaterThan(100)
  })
})
