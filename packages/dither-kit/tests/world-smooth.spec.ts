// Smooth shading: a face set's creaseAngle (and every sphere) blends each
// triangle corner's light across it, so a curved surface shades without
// facets; an edge sharper than the angle stays a crease, and a file that
// asks nothing shades flat, byte for byte as before.
import { describe, expect, it } from "rstack/test"
import { parseVrml } from "../src/engine/models"
import { cornerNormals } from "../src/engine/world-scene"
import { createWorldTarget, rasterizeWorld, type WorldStyle } from "../src/engine/world"
import { BAYER4 } from "../src/engine/pixel"

const style: WorldStyle = { fill: [255, 255, 255], matrix: BAYER4, shade: 0.2, material: false, wire: false, fog: 0 }
const view = { yaw: 25, pitch: 15, zoom: 1, fov: 40 }

/** Distinct shades a sphere's lit cells take: a flat sphere has one per face. */
function shadesOf(file: string) {
  const world = parseVrml(file)
  const target = createWorldTarget(96, 96)
  rasterizeWorld(world, view, target, style)
  const seen = new Set<number>()
  for (let i = 0; i < target.shade.length; i++) if (target.index[i]) seen.add(Math.round(target.shade[i] * 1e4))
  return { world, target, distinct: seen.size }
}

const cube = (crease: number) => `#VRML V2.0 utf8
Shape { geometry IndexedFaceSet { creaseAngle ${crease}
  coord Coordinate { point [-1 -1 1, 1 -1 1, 1 1 1, -1 1 1, -1 -1 -1, 1 -1 -1, 1 1 -1, -1 1 -1] }
  coordIndex [0 1 2 3 -1, 5 4 7 6 -1, 1 5 6 2 -1, 4 0 3 7 -1, 3 2 6 7 -1, 4 5 1 0 -1] } }`

describe("smooth shading", () => {
  it("averages the faces around a point within the crease, and keeps sharper edges", () => {
    // two triangles folded 90 degrees along their shared edge
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, -1])
    const indices = new Uint32Array([0, 1, 2, 0, 3, 1])
    const soft = cornerNormals(positions, indices, Math.PI)
    // at the shared point the two faces' normals meet halfway
    expect(Math.hypot(soft[0], soft[1], soft[2])).toBeCloseTo(1)
    expect([soft[0], soft[1], soft[2]].map((v) => +v.toFixed(4))).toEqual([0, -0.7071, 0.7071])
    const sharp = cornerNormals(positions, indices, 0.5)
    // under a crease of half a radian each corner keeps its own face
    expect([...sharp.slice(0, 3)].map((v) => +v.toFixed(6))).toEqual([0, 0, 1])
  })

  it("shades a sphere as one surface, many tones where flat faces would give a few", () => {
    const smooth = shadesOf(`#VRML V2.0 utf8\nShape { geometry Sphere { radius 1 } }`)
    expect(smooth.world.meshes[0].normals).not.toBeNull()
    const facets = shadesOf(
      `#VRML V2.0 utf8\nShape { geometry IndexedFaceSet { creaseAngle 0 coord Coordinate { point [-1 -1 1, 1 -1 1, 1 1 1, -1 1 1] } coordIndex [0 1 2 3 -1] } }`,
    )
    expect(facets.distinct).toBe(1)
    expect(smooth.distinct).toBeGreaterThan(200)
  })

  it("leaves a face set that asks nothing flat, and keeps a cube's edges under a small crease", () => {
    const flat = parseVrml(cube(0))
    expect(flat.meshes[0].normals).toBeNull()
    const kept = shadesOf(cube(0.5))
    const plain = shadesOf(cube(0))
    // every corner keeps its face: the same picture as flat shading
    expect([...kept.target.shade]).toEqual([...plain.target.shade])
  })
})
