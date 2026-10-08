import { describe, expect, it } from "vitest"
import { facesOf, parseVrml, parseVrmlNodes, tokenizeVrml, vrmlTransform } from "../dither-kit/models"
import { transformPoint } from "../dither-kit/world"

const V2 = "#VRML V2.0 utf8\n"
const extent = (p: Float32Array, axis: number) => Math.max(...Array.from(p).filter((_, i) => i % 3 === axis).map(Math.abs))

describe("tokenizer + generic grammar", () => {
  it("drops comments, keeps strings whole, treats commas as whitespace", () => {
    expect(tokenizeVrml('a,b # c { }\n"str \\"q\\" {x}" [1 2]')).toEqual(["a", "b", '"str "q" {x}', "[", "1", "2", "]"])
  })
  it("parses nested nodes, lists, enums, booleans, DEF/USE, NULL, and skips PROTO/ROUTE", () => {
    const { version, nodes } = parseVrmlNodes(`${V2}
      PROTO Thing [ field SFFloat size 1 ] { Shape { geometry Box {} } }
      DEF T TimeSensor { loop TRUE cycleInterval 2 }
      ROUTE T.fraction_changed TO X.set_fraction
      Transform {
        translation 1 2 3
        children [ DEF S Shape { appearance NULL geometry Box { size 1, 1, 1 } }, USE S ]
      }
      WorldInfo { title "a { brace }" info [ "x", "y" ] }
      ShapeHints { vertexOrdering COUNTERCLOCKWISE }
    `)
    expect(version).toBe(2)
    expect(nodes.map((n) => n.type)).toEqual(["TimeSensor", "Transform", "WorldInfo", "ShapeHints"])
    expect(nodes[0].fields).toEqual({ loop: true, cycleInterval: [2] })
    const t = nodes[1]
    expect(t.fields.translation).toEqual([1, 2, 3])
    const kids = t.fields.children as { type: string; fields: Record<string, unknown> }[]
    expect(kids.length).toBe(2)
    expect(kids[0]).toBe(kids[1])
    expect(kids[0].fields.appearance).toEqual([])
    expect((kids[0].fields.geometry as { fields: unknown }[])[0].fields).toEqual({ size: [1, 1, 1] })
    expect(nodes[2].fields).toEqual({ title: ["a { brace }"], info: ["x", "y"] })
    expect(nodes[3].fields.vertexOrdering).toEqual(["COUNTERCLOCKWISE"])
  })
  it("never stalls on junk and reads X3D classic headers", () => {
    expect(parseVrmlNodes("} ] 12 foo { bar").nodes).toEqual([{ type: "foo", fields: {} }])
    const world = parseVrml('#X3D V3.3 utf8\nPROFILE Immersive\nCOMPONENT Geospatial:1\nMETA "generator" "test"\nShape { geometry Box {} }')
    expect(world.meshes.length).toBe(1)
  })
  it("splits coordIndex rings on -1", () => {
    expect(facesOf([0, 1, 2, -1, 3, 4, 5, 6, -1, 7, 8])).toEqual([[0, 1, 2], [3, 4, 5, 6], [7, 8]].filter((f) => f.length >= 3))
  })
})

describe("VRML97 scene", () => {
  it("composes Transform fields: translation, rotation, scale, center", () => {
    const moved = parseVrml(`${V2}Transform { translation 5 0 0 children Shape { geometry Box { size 2 2 2 } } }`)
    expect(moved.center).toEqual([5, 0, 0])
    const turned = parseVrml(`${V2}Transform { rotation 0 0 1 1.5707963 children Shape { geometry Box { size 4 2 2 } } }`)
    expect(extent(turned.meshes[0].positions, 1)).toBeCloseTo(2, 4)
    expect(extent(turned.meshes[0].positions, 0)).toBeCloseTo(1, 4)
    const scaled = parseVrml(`${V2}Transform { scale 1 2 3 children Shape { geometry Box { size 2 2 2 } } }`)
    expect(extent(scaled.meshes[0].positions, 2)).toBe(3)
    const about = parseVrml(`${V2}Transform { center 1 0 0 rotation 0 0 1 3.14159265 children Shape { geometry Box { size 2 2 2 } } }`)
    expect(about.center[0]).toBeCloseTo(2, 4)
    const nested = parseVrml(`${V2}Transform { translation 1 0 0 children Transform { translation 2 0 0 children Shape { geometry Sphere { radius 1 } } } }`)
    expect(nested.center[0]).toBeCloseTo(3, 4)
    const p = transformPoint(vrmlTransform([0, 0, 0], [0, 0, 1, Math.PI / 2], [2, 1, 1], [0, 0, 1, 0], [0, 0, 0]), [1, 0, 0])
    expect(p[0]).toBeCloseTo(0)
    expect(p[1]).toBeCloseTo(2)
  })
  it("walks groups, DEF/USE instances, Switch choices and LOD's first level", () => {
    const shared = parseVrml(`${V2}DEF B Shape { geometry Box {} }\nGroup { children Transform { translation 4 0 0 children USE B } }`)
    expect(shared.meshes.length).toBe(2)
    expect(shared.center[0]).toBeCloseTo(2)
    const sw = parseVrml(`${V2}Switch { whichChoice 1 choice [ Shape { geometry Box {} } Shape { geometry Sphere {} } ] }`)
    expect(sw.meshes.length).toBe(1)
    expect(sw.meshes[0].positions.length).toBeGreaterThan(100)
    expect(parseVrml(`${V2}Switch { choice [ Shape { geometry Box {} } ] }`).meshes.length).toBe(0)
    expect(parseVrml(`${V2}LOD { level [ Shape { geometry Box {} } Shape { geometry Sphere {} } ] }`).meshes[0].positions.length).toBe(24)
  })
  it("reads materials, IndexedFaceSet winding flags and ElevationGrid", () => {
    const m = parseVrml(`${V2}Shape { appearance Appearance { material Material { diffuseColor 1 0 0.5 } } geometry Box {} }`)
    expect(m.meshes[0].color).toEqual([255, 0, 128])
    const quad = (flags: string) => `${V2}Shape { geometry IndexedFaceSet { ${flags} coord Coordinate { point [ 0 0 0, 1 0 0, 1 1 0, 0 1 0 ] } coordIndex [ 0, 1, 2, 3, -1 ] } }`
    const q = parseVrml(quad("")).meshes[0]
    expect(q.indices.length).toBe(6)
    expect(q.edges.length).toBe(12)
    expect(q.solid).toBe(true)
    expect(Array.from(q.indices.slice(0, 3))).toEqual([0, 1, 2])
    const cw = parseVrml(quad("ccw FALSE solid FALSE")).meshes[0]
    expect(Array.from(cw.indices.slice(0, 3))).toEqual([3, 2, 1])
    expect(cw.solid).toBe(false)
    const grid = parseVrml(`${V2}Shape { geometry ElevationGrid { xDimension 3 zDimension 2 xSpacing 1 zSpacing 2 height [ 0 1 0 0 1 0 ] } }`).meshes[0]
    expect(grid.positions.length).toBe(18)
    expect(grid.indices.length).toBe(12)
    expect(grid.positions[4]).toBe(1)
    expect(grid.positions[11]).toBe(2)
  })
  it("keeps the viewpoint, directional lights (transformed) and the headlight flag", () => {
    const w = parseVrml(`${V2}Viewpoint { position 0 0 8 fieldOfView 0.5 }\nTransform { rotation 0 0 1 1.5707963 children DirectionalLight { direction 0 -1 0 intensity 0.5 } }\nDirectionalLight { on FALSE }\nNavigationInfo { headlight FALSE }\nShape { geometry Box {} }`)
    expect(w.viewpoint?.position).toEqual([0, 0, 8])
    expect(w.viewpoint?.fov).toBeCloseTo(28.6479, 3)
    expect(w.lights.length).toBe(1)
    expect(w.lights[0].direction[0]).toBeCloseTo(1)
    expect(w.lights[0].direction[1]).toBeCloseTo(0)
    expect(w.lights[0].intensity).toBe(0.5)
    expect(w.headlight).toBe(false)
    expect(parseVrml(`${V2}Shape { geometry Box {} }`).headlight).toBe(true)
  })
})

describe("VRML 1.0 scene", () => {
  const V1 = "#VRML V1.0 ascii\n"
  it("runs the Separator state machine: coords, material, translation scope, Cube", () => {
    const w = parseVrml(`${V1}
      Separator {
        Material { diffuseColor [ 1 0 0, 0 1 0 ] }
        Translation { translation 10 0 0 }
        Coordinate3 { point [ 0 0 0, 1 0 0, 1 1 0, 0 1 0 ] }
        IndexedFaceSet { coordIndex [ 0, 1, 2, 3, -1 ] }
      }
      Cube { width 2 height 4 depth 6 }
    `)
    expect(w.meshes.length).toBe(2)
    const [quad, cube] = w.meshes
    expect(quad.color).toEqual([255, 0, 0])
    expect(quad.solid).toBe(false)
    expect(Math.min(...Array.from(quad.positions).filter((_, i) => i % 3 === 0))).toBe(10)
    expect(cube.color).toEqual([204, 204, 204])
    expect(extent(cube.positions, 0)).toBe(1)
    expect(extent(cube.positions, 1)).toBe(2)
    expect(extent(cube.positions, 2)).toBe(3)
  })
  it("honours ShapeHints, MatrixTransform (row-vector), Transform scaleFactor and Switch", () => {
    const hinted = parseVrml(`${V1}ShapeHints { vertexOrdering CLOCKWISE shapeType SOLID }\nCoordinate3 { point [ 0 0 0, 1 0 0, 1 1 0 ] }\nIndexedFaceSet { coordIndex [ 0 1 2 -1 ] }`)
    expect(hinted.meshes[0].solid).toBe(true)
    expect(Array.from(hinted.meshes[0].indices)).toEqual([2, 1, 0])
    const moved = parseVrml(`${V1}MatrixTransform { matrix 1 0 0 0  0 1 0 0  0 0 1 0  5 6 7 1 }\nCube {}`)
    expect(moved.center.map((v) => Math.round(v))).toEqual([5, 6, 7])
    const scaled = parseVrml(`${V1}Transform { scaleFactor 2 2 2 }\nCube {}`)
    expect(extent(scaled.meshes[0].positions, 0)).toBe(2)
    expect(parseVrml(`${V1}Switch { whichChild -3 Cube {} Sphere {} }`).meshes.length).toBe(2)
    expect(parseVrml(`${V1}Switch { whichChild 0 Cube {} Sphere {} }`).meshes.length).toBe(1)
    expect(parseVrml(`${V1}PerspectiveCamera { position 0 0 5 }\nTransformSeparator { Translation { translation 1 0 0 } }\nCube {}`).center[0]).toBe(0)
  })
})
