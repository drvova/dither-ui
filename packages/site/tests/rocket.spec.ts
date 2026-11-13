// The World section's rocket: a file the kit reads, in pieces, with a flame
// and a fireball that give off light, a climb, a fireball that swells only
// at the burst, and the launch's one clock: whole until the top, apart after.
import { describe, expect, it } from "rstack/test"
import { parseWorld } from "@dither-ui/kit/engine/models.ts"
import { nodeMatrices } from "@dither-ui/kit/engine/world.ts"
import { CLIMB_S, launchAt, LAUNCH_S, ROCKET } from "@/pages/docs/components/rocket"

const world = parseWorld(ROCKET, "vrml")
/** A node's scale on x at `t` seconds, from its matrix. */
const scaleAt = (node: number, t: number) => Math.hypot(...nodeMatrices(world, t)[node].slice(0, 3))
const heightAt = (node: number, t: number) => nodeMatrices(world, t)[node][13]

describe("the rocket", () => {
  it("is a file of pieces, a flame and a fireball that give off light", () => {
    expect(world.meshes.length).toBeGreaterThanOrEqual(10)
    expect(world.glows.length).toBeGreaterThanOrEqual(2)
    expect(world.nodes.length).toBe(3) // the rocket, its flame, the fireball
  })
  it("climbs, and swells its fireball only at the burst", () => {
    const [rocket, , fireball] = [0, 1, 2]
    expect(heightAt(rocket, CLIMB_S)).toBeGreaterThan(heightAt(rocket, 0) + 0.2)
    expect(scaleAt(fireball, CLIMB_S / 2)).toBeLessThan(0.01)
    expect(scaleAt(fireball, CLIMB_S + 0.6)).toBeGreaterThan(0.9)
    expect(scaleAt(fireball, LAUNCH_S)).toBeLessThan(0.01)
  })
  it("is whole until the top of the climb and apart after", () => {
    expect(launchAt(0)).toEqual({ time: 0, scatter: 0 })
    expect(launchAt(CLIMB_S).scatter).toBe(0)
    expect(launchAt(CLIMB_S + 0.3).scatter).toBeGreaterThan(0.5)
    expect(launchAt(LAUNCH_S + 5)).toEqual({ time: LAUNCH_S, scatter: 1 })
  })
})
