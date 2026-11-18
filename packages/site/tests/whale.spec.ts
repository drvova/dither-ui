// The World section's whale: a file the kit reads, a chain of segments that
// one wave bends more toward the tail, so the body swims.
import { describe, expect, it } from "rstack/test"
import { parseWorld } from "@dither-ui/kit/engine/models.ts"
import { nodeMatrices } from "@dither-ui/kit/engine/world.ts"
import { STROKE_S, WANDER_S, WHALE } from "@/pages/docs/components/whale"

const world = parseWorld(WHALE, "vrml")
/** How far a node's own frame is turned from its parent's, in radians, at `t`. */
function bend(node: number, t: number) {
  const m = nodeMatrices(world, t)
  const own = m[node]
  const parent = m[world.nodes[node].parent]
  return Math.atan2(own[1], own[0]) - Math.atan2(parent[1], parent[0])
}

describe("the whale", () => {
  it("is a body of segments, its fins, flukes and eyes riding on them", () => {
    // its wander, its bob, then a node a segment
    expect(world.nodes).toHaveLength(8)
    expect(world.meshes.length).toBeGreaterThanOrEqual(12)
    expect(world.duration).toBeCloseTo(WANDER_S)
  })

  it("curls its tail up at rest", () => {
    // the tail's frame turned upward from the head's, half a stroke either way
    const lift = (t: number) => {
      const m = nodeMatrices(world, t)
      return Math.atan2(m[7][1], m[7][0]) - Math.atan2(m[2][1], m[2][0])
    }
    expect((lift(0) + lift(STROKE_S / 2)) / 2).toBeLessThan(-0.5)
  })

  it("bends more toward the tail, and the bend travels down it", () => {
    const swing = (node: number) => {
      let most = 0
      for (let i = 0; i < 16; i++) most = Math.max(most, Math.abs(bend(node, (i / 16) * STROKE_S)))
      return most
    }
    expect(swing(7)).toBeGreaterThan(swing(4))
    expect(swing(4)).toBeGreaterThan(swing(3))
    // the tail lags the middle: its peak comes later in the stroke
    const peak = (node: number) => {
      let best = 0
      for (let i = 1; i < 64; i++) if (bend(node, (i / 64) * STROKE_S) > bend(node, (best / 64) * STROKE_S)) best = i
      return best
    }
    expect((peak(7) - peak(4) + 64) % 64).toBeGreaterThan(0)
  })
})
