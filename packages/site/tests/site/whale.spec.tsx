// The World section's whale: a file the example builds and the kit reads,
// ONE surface whose points a wave bends as it swims, curled at rest.
import { describe, expect, it } from "vitest"
import { parseWorld } from "@dither-ui/kit/engine/models.ts"
import { posedPositions } from "@dither-ui/kit/engine/world-scene.ts"
import { WHALE } from "@/pages/docs/components/examples/world-4"

const world = parseWorld(WHALE, "vrml")
const [skin] = world.meshes
const STROKE = 1.8
/** The tail's height over the nose's, at `t` seconds (the whale's own frame). */
function lift(t: number) {
  const p = posedPositions(skin, null, t)
  let nose = 0
  let tail = 0
  for (let i = 0; i < p.length; i += 3) {
    if (p[i] > p[nose]) nose = i
    if (p[i] < p[tail]) tail = i
  }
  return p[tail + 1] - p[nose + 1]
}

describe("the whale", () => {
  it("is one surface, no face on it, under its wander and its bob", () => {
    expect(world.meshes).toHaveLength(1)
    expect(skin.morph).not.toBeNull()
    expect(skin.normals).not.toBeNull()
    expect(world.nodes).toHaveLength(2)
    expect(world.duration).toBeCloseTo(12)
  })

  it("curls its tail up, and swings it as it swims", () => {
    const lifts = Array.from({ length: 12 }, (_, i) => lift((i / 12) * STROKE))
    expect(Math.min(...lifts)).toBeGreaterThan(0.1)
    expect(Math.max(...lifts) - Math.min(...lifts)).toBeGreaterThan(0.1)
  })

  it("never tears: every point stays within reach of its rest place", () => {
    const rest = posedPositions(skin, null, 0).slice()
    const mid = posedPositions(skin, null, STROKE / 2)
    let far = 0
    for (let i = 0; i < rest.length; i += 3) far = Math.max(far, Math.hypot(mid[i] - rest[i], mid[i + 1] - rest[i + 1]))
    expect(far).toBeLessThan(1.2)
  })
})
