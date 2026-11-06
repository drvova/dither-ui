// @rstest-environment jsdom
// The mascot: the brand's diamond come alive, one table for every place it
// stands. Its shape holds: in its grid, every cell once, two eyes open (shut
// when it blinks), the mark's ember heart, ember antenna tips, feet on the
// ground row standing and off it hopping or flying, a rotor that turns in
// flight, and a body printed solid on the lit side and through the Bayer
// thresholds on the shaded one.
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "rstack/test"
import { MASCOT_H, MASCOT_ROTOR_STEPS, MASCOT_W, type MascotPose, mascotCells } from "@/shared/ui/mascot"
import Mascot from "@/shared/ui/Mascot.vue"

const POSES: MascotPose[] = ["idle", "blink", "hop", "wave", "fly"]
const at = (pose: MascotPose, x: number, y: number) => mascotCells(pose).find((c) => c.x === x && c.y === y)

describe("the mascot", () => {
  it("stays in its grid, each cell once, in every pose", () => {
    for (const pose of POSES) {
      const cells = mascotCells(pose)
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.x).toBeLessThan(MASCOT_W)
        expect(c.y).toBeGreaterThanOrEqual(0)
        expect(c.y).toBeLessThan(MASCOT_H)
      }
      expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(cells.length)
    }
  })

  it("has two eyes open, shut when it blinks", () => {
    for (const [x, y] of [
      [3, 7],
      [7, 7],
    ]) {
      expect(at("idle", x, y)).toBeUndefined()
      expect(at("blink", x, y)?.ink).toBe("body")
    }
  })

  it("carries the mark's ember: its heart and its antenna tips, nothing else", () => {
    const ember = mascotCells("idle").filter((c) => c.ink === "ember")
    expect(ember.map((c) => `${c.x},${c.y}`).sort()).toEqual(["3,1", "5,9", "7,1"])
  })

  it("stands on the ground row, and leaves it to hop", () => {
    const lowest = (pose: MascotPose) => Math.max(...mascotCells(pose).map((c) => c.y))
    expect(lowest("idle")).toBe(MASCOT_H - 1)
    expect(lowest("hop")).toBeLessThan(MASCOT_H - 2)
  })

  it("flies on a rotor that turns: its antennae folded into one blade over a stem, its feet hanging", () => {
    const blade = (turn: number) =>
      mascotCells("fly", turn)
        .filter((c) => c.y === 0)
        .map((c) => c.x)
    const spans = Array.from({ length: MASCOT_ROTOR_STEPS }, (_, t) => blade(t).length)
    // full, half, edge on, half: a turn, and the next turn the same
    expect(spans).toEqual([9, 5, 1, 5])
    expect(blade(MASCOT_ROTOR_STEPS)).toEqual(blade(0))
    expect(at("fly", 5, 1)?.ink).toBe("body")
    // ember only at the blade's ends and the heart
    for (let t = 0; t < MASCOT_ROTOR_STEPS; t++) {
      const ember = mascotCells("fly", t).filter((c) => c.ink === "ember")
      const xs = blade(t)
      expect(ember.filter((c) => c.y === 0).map((c) => c.x)).toEqual([...new Set([xs[0], xs.at(-1)])])
      expect(ember.filter((c) => c.y !== 0).map((c) => `${c.x},${c.y}`)).toEqual(["5,8"])
    }
    // airborne, its feet hanging under it
    const low = Math.max(...mascotCells("fly").map((c) => c.y))
    expect(low).toBe(MASCOT_H - 2)
    expect(at("fly", 4, low)).toBeDefined()
  })

  it("is solid on its lit side and dithered on its shaded flank", () => {
    // the upper left of the body, the eyes aside, is whole
    for (const [x, y] of [
      [4, 6],
      [2, 8],
      [5, 6],
    ])
      expect(at("idle", x, y)).toBeDefined()
    // the lower right shows the threshold's holes
    const flank = [
      [7, 9],
      [8, 9],
      [6, 10],
      [7, 10],
      [6, 11],
    ].filter(([x, y]) => !at("idle", x, y))
    expect(flank.length).toBeGreaterThan(0)
  })

  it("draws as a decorative SVG, the size its height", () => {
    const w = mount(Mascot, { props: { size: 30 } })
    const svg = w.get("svg")
    expect(svg.attributes("aria-hidden")).toBe("true")
    expect(svg.attributes("height")).toBe("30")
    expect(w.findAll("rect")).toHaveLength(mascotCells("idle").length)
  })
})
