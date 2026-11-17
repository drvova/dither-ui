// The World section's whale: one SVG that carries its own swim, read by the
// kit as a model. It rounds its loop, faces the way it swims, and beats its tail.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { parseWorld } from "@dither-ui/kit/engine/models.ts"
import { nodeMatrices } from "@dither-ui/kit/engine/world.ts"

const source = readFileSync(new URL("../src/pages/docs/components/examples/world-4.tsx", import.meta.url), "utf8")
const whale = /^const WHALE = `([\s\S]*?)`$/m.exec(source)![1]
const world = parseWorld(whale, "auto")
const at = (t: number) => nodeMatrices(world, t)

describe("the whale", () => {
  it("is an SVG the kit reads, its body, belly, fin, eye and tail each a slab", () => {
    expect(world.meshes).toHaveLength(5)
    // the loop, the turn, the bob, the tail
    expect(world.nodes).toHaveLength(4)
    expect(world.duration).toBe(14)
  })

  it("rounds its loop, away to the left and back to the right", () => {
    const [x0, y0] = [at(0)[0][12], at(0)[0][13]]
    const far = at(3.5)[0]
    const near = at(10.5)[0]
    expect(far[13]).toBeGreaterThan(y0)
    expect(near[13]).toBeLessThan(y0)
    expect(at(7)[0][12]).toBeLessThan(x0 - 150)
  })

  it("faces the way it swims, smaller on the far side", () => {
    // the turn node's x axis, after the loop's
    const facing = (t: number) => at(t)[1][0]
    expect(facing(3.5)).toBeLessThan(0)
    expect(facing(10.5)).toBeGreaterThan(0)
    expect(Math.abs(facing(3.5))).toBeLessThan(facing(10.5))
  })

  it("beats its tail about the tail's root", () => {
    const tail = world.meshes[0]
    const tilt = (t: number) => Math.atan2(at(t)[tail.node][1], at(t)[tail.node][0])
    expect(Math.abs(tilt(0.4) - tilt(1.2))).toBeGreaterThan(0.3)
  })
})
