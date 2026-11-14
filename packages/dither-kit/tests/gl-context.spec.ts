// @rstest-environment jsdom
// A WebGL context's life (`gl.ts` `createGl`): dispose loses the context,
// which frees everything it holds, and deletes nothing one by one (on
// WebKitGTK an object deleted in a context about to go was another live
// context's of the same name: the docs' GLSL-material world, Run a second
// time, drew from nothing); a loss reads as lost at once; a restored
// context has its objects made again.
import { afterEach, describe, expect, it } from "rstack/test"
import { createGl } from "../src/engine/gl"
import { parseVrml } from "../src/engine/models"
import { createWorldTarget, rasterizeWorld, type WorldView } from "../src/engine/world"
import { createWorldGpu, createWorldMaterial } from "../src/engine/world-gl"
import { BAYER4 } from "../src/engine/pixel"
import { fakeGl } from "./support/fake-gl"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
})

/** Every context the page makes is this fake. */
function stubWebgl() {
  const fake = fakeGl()
  fake.finish()
  HTMLCanvasElement.prototype.getContext = ((kind: string) =>
    kind === "webgl2" ? fake.gl : null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  return fake
}

const MATERIAL = "void mainMaterial(out vec4 o, in vec2 p) { o = vec4(1.0); }"
const view: WorldView = { yaw: 30, pitch: 20, zoom: 1, fov: 40 }
function scene() {
  const world = parseVrml("#VRML V2.0 utf8\nShape { geometry Sphere { radius 1 } }")
  const target = createWorldTarget(8, 8)
  rasterizeWorld(world, view, target, {
    fill: [255, 0, 0],
    matrix: BAYER4,
    shade: 0.2,
    material: false,
    wire: false,
    fog: 0,
  })
  return { world, target }
}
/** What was deleted one by one, past the shaders a build lets go of once linked. */
const deletes = (fake: ReturnType<typeof fakeGl>) => fake.state.deleted.filter((call) => call !== "deleteShader")
const inputs = { time: 0, color: [255, 255, 255] as [number, number, number], seed: 0 }

describe("a context let go", () => {
  it("is lost whole on dispose, nothing deleted one by one", () => {
    const fake = stubWebgl()
    const h = createGl()!
    h.readBehind(new Uint8Array(0))
    h.dispose()
    expect(fake.state.released).toBe(1)
    expect(deletes(fake)).toEqual([])
    expect(h.lost()).toBe(true)
    h.dispose()
    expect(fake.state.released).toBe(1)
  })

  it("frees a world's engines with it: its own material's, and both on the one they share", () => {
    const fake = stubWebgl()
    const { world, target } = scene()
    const own = createWorldMaterial()
    expect(own.shade(MATERIAL, target, world, view, inputs)).not.toBeNull()
    own.dispose()
    expect(fake.state.released).toBe(1)

    const shared = createGl()!
    const material = createWorldMaterial(shared)
    const gpu = createWorldGpu(shared)
    material.shade(MATERIAL, target, world, view, inputs)
    gpu.rasterize(world, view, createWorldTarget(8, 8), {
      fill: [255, 0, 0],
      matrix: BAYER4,
      shade: 0.2,
      material: false,
      wire: false,
      fog: 0,
    })
    // the component's order: the context, then the engines on it
    shared.dispose()
    material.dispose()
    gpu.dispose()
    expect(fake.state.released).toBe(2)
    expect(deletes(fake)).toEqual([])
  })

  it("keeps a context that lives on: an engine let go on it deletes what it made", () => {
    const fake = stubWebgl()
    const { world, target } = scene()
    const shared = createGl()!
    const material = createWorldMaterial(shared)
    material.shade(MATERIAL, target, world, view, inputs)
    material.dispose()
    expect(deletes(fake)).toContain("deleteProgram")
    expect(fake.state.released).toBe(0)
  })
})

describe("a context the browser loses", () => {
  it("reads as lost at once, before its event, and draws nothing while lost", () => {
    const fake = stubWebgl()
    const { world, target } = scene()
    const h = createGl()!
    const material = createWorldMaterial(h)
    expect(material.shade(MATERIAL, target, world, view, inputs)).not.toBeNull()
    fake.lose()
    expect(h.lost()).toBe(true)
    expect(material.shade(MATERIAL, target, world, view, inputs)).toBeNull()
  })

  it("makes its objects again once restored, deleting none of the gone ones", () => {
    const fake = stubWebgl()
    const { world, target } = scene()
    const h = createGl()!
    const material = createWorldMaterial(h)
    material.shade(MATERIAL, target, world, view, inputs)
    expect(fake.state.programs).toBe(1)
    const generation = h.generation()
    fake.lose()
    h.canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))
    expect(material.shade(MATERIAL, target, world, view, inputs)).toBeNull()
    fake.restore()
    h.canvas.dispatchEvent(new Event("webglcontextrestored"))
    expect(h.lost()).toBe(false)
    expect(h.generation()).toBe(generation + 1)
    expect(material.shade(MATERIAL, target, world, view, inputs)).not.toBeNull()
    expect(fake.state.programs).toBe(2)
    expect(deletes(fake)).toEqual([])
  })

  it("asks to be restored: the loss is kept, not the end", () => {
    stubWebgl()
    const h = createGl()!
    const lost = new Event("webglcontextlost", { cancelable: true })
    h.canvas.dispatchEvent(lost)
    expect(lost.defaultPrevented).toBe(true)
  })

  it("stays let go once disposed, whatever the browser restores", () => {
    const fake = stubWebgl()
    const h = createGl()!
    h.dispose()
    fake.restore()
    h.canvas.dispatchEvent(new Event("webglcontextrestored"))
    expect(h.lost()).toBe(true)
  })
})
