// The World section's whale: a file the example builds and the kit reads, a
// chain of segments curled at rest that one wave bends more toward the tail.
import { describe, expect, it } from "vitest"
import { parseWorld } from "@dither-ui/kit/engine/models.ts"
import { nodeMatrices } from "@dither-ui/kit/engine/world.ts"
import { WHALE } from "@/pages/docs/components/examples/world-4"

const world = parseWorld(WHALE, "vrml")
const turn = (m: number[]) => Math.atan2(m[1], m[0])
/** How far a node is turned from its parent, in radians, at `t` seconds. */
const bend = (node: number, t: number) => {
  const m = nodeMatrices(world, t)
  return turn(m[node]) - turn(m[world.nodes[node].parent])
}

describe("the whale", () => {
  it("is a body of six segments under its wander and its bob, with no face", () => {
    expect(world.nodes).toHaveLength(8)
    expect(world.duration).toBeCloseTo(12)
    // body, flippers and flukes: no eyes, no mouth
    expect(world.meshes).toHaveLength(10)
    expect(WHALE).not.toMatch(/0\.12 0\.13 0\.14/)
  })

  it("ends in domes, never a point: its nose rings close small, not on one vertex", () => {
    const head = world.meshes[0]
    const xs: number[] = []
    for (let i = 0; i < head.positions.length; i += 3) xs.push(head.positions[i])
    const tip = Math.max(...xs)
    expect(xs.filter((x) => Math.abs(x - tip) < 1e-6).length).toBeGreaterThan(8)
  })

  it("curls its tail up at rest", () => {
    const lift = (t: number) => {
      const m = nodeMatrices(world, t)
      return turn(m[7]) - turn(m[2])
    }
    expect((lift(0) + lift(0.9)) / 2).toBeLessThan(-0.5)
  })

  it("bends more toward the tail", () => {
    const swing = (node: number) => {
      const at = Array.from({ length: 16 }, (_, i) => bend(node, (i / 16) * 1.8))
      return Math.max(...at) - Math.min(...at)
    }
    expect(swing(7)).toBeGreaterThan(swing(4))
    expect(swing(4)).toBeGreaterThan(swing(3))
  })
})
