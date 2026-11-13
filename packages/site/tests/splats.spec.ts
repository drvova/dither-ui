// Gaussian splats: the ellipsoid's covariance, the two files captures ship
// as (the 32-byte record and the training PLY, its logit, log scale and
// spherical-harmonic colour undone), a capture turned upright, its bounds
// without stray splats, and the composite on the world's target: covered
// cells take the colour cube's entry and their luminance, a nearer mesh
// hides what is behind it, and a view prints the same however it was reached.
import { describe, expect, it } from "rstack/test"
import { formatOf, parseWorld } from "dither-kit/engine/models.ts"
import {
  cloudBounds,
  covariance,
  cubeIndex,
  MAX_SPLATS,
  parseSplat,
  SH_C0,
  SPLAT_LEVELS,
  SPLAT_PLY_PROPS,
} from "dither-kit/engine/splats.ts"
import { createWorldTarget, rasterizeWorld, type WorldStyle } from "dither-kit/engine/world.ts"

type Splat = { p: number[]; s?: number[]; rgba?: number[]; q?: number[] }

/** `.splat` records: position, scale, rgba bytes, rotation bytes (w, x, y, z around 128). */
function splatFile(splats: Splat[]): Uint8Array {
  const out = new Uint8Array(splats.length * 32)
  splats.forEach(({ p, s = [0.05, 0.05, 0.05], rgba = [255, 255, 255, 255], q = [255, 128, 128, 128] }, i) => {
    out.set(new Uint8Array(new Float32Array([...p, ...s]).buffer), i * 32)
    out.set([...rgba, ...q], i * 32 + 24)
  })
  return out
}

const STYLE: WorldStyle = { fill: [255, 255, 255], matrix: [[0]], shade: 0.3, material: true, wire: false, fog: 0 }
const VIEW = { yaw: 0, pitch: 0, zoom: 1, fov: 40 }

describe("the ellipsoid", () => {
  it("is its scale squared on its axes, turned with its rotation", () => {
    const c = new Float32Array(6)
    covariance(2, 3, 4, 1, 0, 0, 0, c, 0)
    expect([...c]).toEqual([4, 0, 0, 9, 0, 16])
    // a quarter turn about z swaps x and y
    covariance(2, 3, 4, Math.SQRT1_2, 0, 0, Math.SQRT1_2, c, 0)
    expect(c[0]).toBeCloseTo(9)
    expect(c[3]).toBeCloseTo(4)
    expect(c[5]).toBeCloseTo(16)
  })
})

describe("the files", () => {
  it("reads 32-byte records: position, colour, opacity", () => {
    const cloud = parseSplat(splatFile([{ p: [1, 2, 3], rgba: [255, 0, 51, 128] }]))
    expect(cloud.count).toBe(1)
    expect([...cloud.positions]).toEqual([1, 2, 3])
    expect(cloud.colors[0]).toBe(1)
    expect(cloud.colors[2]).toBeCloseTo(0.2)
    expect(cloud.opacity[0]).toBeCloseTo(128 / 255)
    expect(formatOf("scan.splat?v=2")).toBe("splat")
  })
  it("keeps every k-th past the most a cloud keeps", () => {
    const n = MAX_SPLATS * 2 + 1
    expect(parseSplat(new Uint8Array(n * 32)).count).toBe(Math.ceil(n / 3))
  })
  it("reads a training PLY's Gaussians, its logit, log scale and colour undone", () => {
    const props = ["x", "y", "z", "nx", "ny", "nz", ...SPLAT_PLY_PROPS.slice(3)]
    const values: Record<string, number> = {
      x: 0.5,
      y: -1,
      z: 2,
      f_dc_0: (1 - 0.5) / SH_C0,
      f_dc_1: 0,
      f_dc_2: -0.5 / SH_C0,
      opacity: 0,
      scale_0: Math.log(0.2),
      scale_1: Math.log(0.2),
      scale_2: Math.log(0.2),
      rot_0: 1,
      rot_1: 0,
      rot_2: 0,
      rot_3: 0,
    }
    const head = `ply\nformat binary_little_endian 1.0\nelement vertex 1\n${props.map((p) => `property float ${p}\n`).join("")}end_header\n`
    const body = new Float32Array(props.map((p) => values[p] ?? 0))
    const bytes = new Uint8Array([...new TextEncoder().encode(head), ...new Uint8Array(body.buffer)])
    const world = parseWorld(bytes, "ply", { up: "y" })
    const cloud = world.splats!
    expect(world.meshes).toHaveLength(0)
    expect([...cloud.positions]).toEqual([0.5, -1, 2])
    expect(cloud.colors[0]).toBeCloseTo(1)
    expect(cloud.colors[1]).toBeCloseTo(0.5)
    expect(cloud.colors[2]).toBeCloseTo(0)
    expect(cloud.opacity[0]).toBeCloseTo(0.5)
    expect(cloud.cov[0]).toBeCloseTo(0.04)
    // upright by default: a capture's y runs down
    expect([...parseWorld(bytes, "ply").splats!.positions]).toEqual([0.5, 1, -2])
  })
  it("leaves a plain PLY a mesh", () => {
    const ply =
      "ply\nformat ascii 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nelement face 1\nproperty list uchar int vertex_indices\nend_header\n0 0 0\n1 0 0\n0 1 0\n3 0 1 2\n"
    const world = parseWorld(ply, "ply")
    expect(world.splats).toBeNull()
    expect(world.meshes).toHaveLength(1)
  })
  it("bounds a capture without its stray splats", () => {
    const splats: Splat[] = Array.from({ length: 100 }, (_, i) => ({ p: [i / 100, 0, 0] }))
    splats.push({ p: [500, 0, 0] })
    const b = cloudBounds(parseSplat(splatFile(splats)))!
    expect(b.max[0]).toBeLessThan(2)
  })
})

describe("the composite", () => {
  const capture = (splats: Splat[]) => parseWorld(splatFile(splats), "splat", { up: "y" })
  const render = (world: ReturnType<typeof capture>, view = VIEW, size = 40) => {
    const t = createWorldTarget(size, size)
    rasterizeWorld(world, view, t, STYLE)
    return t
  }

  it("covers the cells under a splat in its colour's cube entry and its luminance", () => {
    const world = capture([
      { p: [-0.5, 0, 0], s: [0.3, 0.3, 0.3], rgba: [255, 0, 0, 255] },
      { p: [0.5, 0, 0], s: [0.3, 0.3, 0.3], rgba: [0, 0, 255, 255] },
    ])
    const t = render(world)
    const mid = 20 * 40
    const left = t.index[mid + 10]
    const right = t.index[mid + 30]
    expect(world.palette[left - 1]).toEqual([255, 0, 0])
    expect(world.palette[right - 1]).toEqual([0, 0, 255])
    expect(t.shade[mid + 10]).toBeGreaterThan(t.shade[mid + 30]) // red reads brighter than blue
    expect(t.index[0]).toBe(0) // the corner: nothing
    expect(cubeIndex(1, 1, 1)).toBe(SPLAT_LEVELS ** 3 - 1)
  })
  it("lays the nearer splat over the farther", () => {
    const world = capture([
      { p: [0, 0, -0.5], s: [0.4, 0.4, 0.05], rgba: [255, 0, 0, 255] },
      { p: [0, 0, 0.5], s: [0.4, 0.4, 0.05], rgba: [0, 255, 0, 255] },
    ])
    // the camera stands on +z, looking down -z
    const t = render(world)
    expect(world.palette[t.index[20 * 40 + 20] - 1]).toEqual([0, 255, 0])
    const behind = render(world, { ...VIEW, yaw: 180 })
    expect(world.palette[behind.index[20 * 40 + 20] - 1]).toEqual([255, 0, 0])
  })
  it("prints a view the same however it was reached", () => {
    const world = capture(
      Array.from({ length: 60 }, (_, i) => ({
        p: [Math.sin(i), Math.cos(i * 1.3), Math.sin(i * 0.7)],
        rgba: [i * 4, 90, 200, 220],
      })),
    )
    const a = render(world, { ...VIEW, yaw: 37 })
    render(world, { ...VIEW, yaw: -80 })
    const b = render(world, { ...VIEW, yaw: 37 })
    expect(b.index).toEqual(a.index)
    expect(b.shade).toEqual(a.shade)
  })
})

describe("the mascot's capture", () => {
  it("is the same bytes every build, a capture the kit reads", async () => {
    const { mascotCapture } = await import("@/shared/ui/mascot-capture")
    const bytes = mascotCapture()
    expect(bytes).toEqual(mascotCapture())
    const world = parseWorld(bytes, "splat", { up: "y" })
    expect(world.splats!.count).toBe(bytes.length / 32)
    // the ember is in it: the heart, the antennae's tips and the orbits
    const ember = world.splats!.colors.filter((_, i) => i % 3 === 0 && world.splats!.colors[i + 2] < 0.3).length
    expect(ember).toBeGreaterThan(1000)
  })
})
