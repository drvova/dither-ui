// A world as a build (`engine/assemble.ts`): a model comes apart along its own
// seams into pieces, rises bottom to top out of a dotted cage with the pieces
// in flight painted hot, scatters outward, and leans away from a point; the
// same state gives the same bytes, and whole and still it is the model as
// it was. The landing's lockup is built of exactly the cells it has.
import { describe, expect, it } from "rstack/test"
import { createAssembly } from "../dither-kit/engine/assemble"
import { parseWorld } from "../dither-kit/engine/models"
import { BAYER4 } from "../dither-kit/engine/pixel"
import { createRasterBuffer } from "../dither-kit/engine/raster"
import {
  cameraOf,
  createWorldTarget,
  paintTarget,
  rasterizeWorld,
  type World,
  type WorldStyle,
  type WorldView,
} from "../dither-kit/engine/world"
import { BUILD_PIECES, LIGHTS, lockupModel, stageAt } from "../src/pages/landing/build"

/** Three cubes stacked, apart: three pieces, low to high. */
function stack(): World {
  const v: string[] = []
  const f: string[] = []
  for (let k = 0; k < 3; k++) {
    const o = k * 8
    const y = k * 1.5
    for (const [x, yy, z] of [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ])
      v.push(`v ${x} ${yy + y} ${z}`)
    for (const q of [
      [1, 4, 3, 2],
      [5, 6, 7, 8],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 4, 8, 7],
      [4, 1, 5, 8],
    ])
      f.push(`f ${q.map((i) => i + o).join(" ")}`)
  }
  return parseWorld([...v, ...f].join("\n"), "obj")
}

const VIEW: WorldView = { yaw: 30, pitch: 15, zoom: 1, fov: 40 }
const HEAT: [number, number, number] = [255, 150, 50]
const still = { build: 1, scatter: 0, nudge: null }
const faces = (w: World) => w.meshes.filter((m) => m.kind === "faces")
const triangles = (w: World) => faces(w).reduce((n, m) => n + m.indices.length / 3, 0)
const cage = (w: World) => w.meshes.find((m) => m.kind === "points")

describe("a world as a build", () => {
  const world = stack()
  const cam = cameraOf(world, VIEW, 96, 64)

  it("comes apart along its own seams", () => {
    expect(createAssembly(world, HEAT).pieces).toBe(3)
  })

  it("whole and still is the model as it was, with no cage", () => {
    const a = createAssembly(world, HEAT)
    const out = a.frame(VIEW, cam, still, 0)
    expect(triangles(out)).toBe(triangles(world))
    expect(Array.from(faces(out)[0].positions)).toEqual(Array.from(faces(world)[0].positions))
    expect(cage(out)).toBeUndefined()
    expect([...faces(out)[0].triColors!].every((c) => c !== a.hot)).toBe(true)
  })

  it("rises bottom to top out of a dotted cage, the pieces in flight hot", () => {
    const a = createAssembly(world, HEAT)
    const none = a.frame(VIEW, cam, { ...still, build: 0 }, 0)
    expect(triangles(none)).toBe(0)
    expect(cage(none)!.indices.length).toBeGreaterThan(30)
    // Through the build the cubes start one at a time, lowest first, each hot in flight.
    const counts: number[] = []
    let firstHot: World | null = null
    for (let b = 0; b <= 1.0001; b += 0.01) {
      const out = a.frame(VIEW, cam, { ...still, build: b }, 0)
      counts.push(triangles(out))
      const hot = [...(faces(out)[0]?.triColors ?? [])].some((c) => c === a.hot)
      if (hot && !firstHot) firstHot = out
    }
    expect([...new Set(counts)]).toEqual([0, 12, 24, 36])
    expect(firstHot).not.toBeNull()
    const m = faces(firstHot!)[0]
    // The first to start is the lowest cube: its triangles index the first eight points.
    expect(Math.max(...m.indices)).toBeLessThan(8)
    expect(cage(firstHot!)).toBeDefined()
  })

  it("scatters outward and gives the same bytes for the same state", () => {
    const spread = (w: World) => {
      const p = faces(w)[0].positions
      let s = 0
      for (let i = 0; i < p.length; i += 3)
        s += Math.hypot(p[i] - world.center[0], p[i + 1] - world.center[1], p[i + 2] - world.center[2])
      return s
    }
    const a = createAssembly(world, HEAT, 7)
    const apart = a.frame(VIEW, cam, { ...still, scatter: 1 }, 0)
    expect(spread(apart)).toBeGreaterThan(spread(world) * 1.2)
    const b = createAssembly(world, HEAT, 7)
    expect(Array.from(faces(b.frame(VIEW, cam, { ...still, scatter: 1 }, 0))[0].positions)).toEqual(
      Array.from(faces(apart)[0].positions),
    )
  })

  it("leans the pieces under a point away from it, and settles them back", () => {
    const a = createAssembly(world, HEAT)
    const before = Array.from(faces(a.frame(VIEW, cam, still, 0))[0].positions)
    const pushed = a.frame(VIEW, cam, { ...still, nudge: { x: 48, y: 32, radius: 60, amount: 1 } }, 0)
    expect(Array.from(faces(pushed)[0].positions)).not.toEqual(before)
    let back = pushed
    for (let i = 0; i < 120; i++) back = a.frame(VIEW, cam, still, 1 / 30)
    const p = faces(back)[0].positions
    expect(Math.max(...before.map((x, i) => Math.abs(x - p[i])))).toBeLessThan(1e-3)
  })

  it("paints the hot entry as light in its own colour whatever the mode", () => {
    const a = createAssembly(world, HEAT)
    let b = 0
    let out = a.frame(VIEW, cam, { ...still, build: b }, 0)
    while (![...(faces(out)[0]?.triColors ?? [])].some((c) => c === a.hot))
      out = a.frame(VIEW, cam, { ...still, build: (b += 0.01) }, 0)
    const target = createWorldTarget(96, 64)
    const style: WorldStyle = {
      fill: [10, 10, 10],
      matrix: BAYER4,
      shade: 0,
      material: false,
      wire: false,
      fog: 0,
      ramp: [
        [20, 20, 20],
        [200, 200, 200],
      ],
      hot: a.hot,
    }
    rasterizeWorld(out, VIEW, target, style)
    const buf = createRasterBuffer(96, 64)
    paintTarget(buf, target, out, VIEW, style)
    let heat = 0
    for (let i = 0; i < buf.data.length; i += 4)
      if (buf.data[i] === 255 && buf.data[i + 1] === 150 && buf.data[i + 2] === 50 && buf.data[i + 3] === 255) heat++
    expect(heat).toBeGreaterThan(10)
  })
})

describe("the landing's build", () => {
  it("is the lockup, one piece per cell", () => {
    const world = parseWorld(lockupModel(), "vrml")
    expect(createAssembly(world, HEAT).pieces).toBe(BUILD_PIECES)
    // Lit by its own light, not the camera's: the faces take different tones.
    expect(world.headlight).toBe(false)
    expect(world.lights).toHaveLength(LIGHTS.length)
  })

  it("rises as the run starts, holds whole in its middle, and comes apart as it ends", () => {
    expect(stageAt(0)).toMatchObject({ build: 0, scatter: 0 })
    expect(stageAt(0.6)).toMatchObject({ build: 1, scatter: 0 })
    expect(stageAt(1).build).toBe(1)
    expect(stageAt(1).scatter).toBeGreaterThan(0.5)
    // Outside the run it clamps; the turn only ever goes one way.
    expect(stageAt(-1)).toEqual(stageAt(0))
    expect(stageAt(2)).toEqual(stageAt(1))
    for (let p = 0; p < 1; p += 0.05) {
      expect(stageAt(p + 0.05).build).toBeGreaterThanOrEqual(stageAt(p).build)
      expect(stageAt(p + 0.05).yaw).toBeGreaterThan(stageAt(p).yaw)
    }
  })
})
