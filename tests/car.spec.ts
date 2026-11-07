// The mascot's car: on its grid, each cell once; an ember stripe, the
// brand's diamond on the door and its lights; wheels that turn; the driver
// showing only over the door line, the rest of it behind the body.
import { describe, expect, it } from "rstack/test"
import { CAR_H, CAR_W, carCells, drivenCells, SEAT, toRuns, WHEEL_STEPS } from "@/shared/ui/car"

const key = (c: { x: number; y: number }) => `${c.x},${c.y}`

describe("the car", () => {
  it("stays on its grid, each cell once, at every wheel turn", () => {
    for (let t = 0; t < WHEEL_STEPS; t++) {
      const cells = carCells(t)
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.x).toBeLessThan(CAR_W)
        expect(c.y).toBeGreaterThanOrEqual(0)
        expect(c.y).toBeLessThan(CAR_H)
      }
      expect(new Set(cells.map(key)).size).toBe(cells.length)
    }
  })
  it("wears the livery: an ember stripe its length, the door's diamond and its lights", () => {
    const cells = carCells()
    const ember = cells.filter((c) => c.ink === "ember")
    const stripe = ember.filter((c) => c.y === 11)
    expect(Math.max(...stripe.map((c) => c.x)) - Math.min(...stripe.map((c) => c.x))).toBeGreaterThan(50)
    // the diamond: an ember core with light on its four sides
    const at = (x: number, y: number) => cells.find((c) => c.x === x && c.y === y)?.ink
    expect(at(35, 13)).toBe("ember")
    for (const [x, y] of [
      [35, 12],
      [34, 13],
      [36, 13],
      [35, 14],
    ])
      expect(at(x, y)).toBe("light")
    expect(at(3, 10)).toBe("ember") // the tail light
    expect(at(70, 13)).toBe("light") // the headlight
  })
  it("turns its wheels: each step lights other cells of the rims", () => {
    const rims = (t: number) =>
      carCells(t)
        .filter((c) => c.ink === "light" && c.y >= 14)
        .map(key)
        .sort()
    expect(rims(0)).not.toEqual(rims(1))
    expect(rims(0)).toEqual(rims(WHEEL_STEPS))
  })
})

describe("the driver", () => {
  it("shows over the door line, ember heart and antennae and all, never through the body", () => {
    const cells = drivenCells()
    const driver = cells.filter((c) => "driver" in c)
    expect(driver.length).toBeGreaterThan(20)
    expect(Math.max(...driver.map((c) => c.y))).toBeLessThan(10)
    expect(driver.some((c) => c.ink === "ember")).toBe(true)
    // seated in the cockpit, between the engine deck and the windscreen
    for (const c of driver) {
      expect(c.x).toBeGreaterThanOrEqual(SEAT.x)
      expect(c.x).toBeLessThan(SEAT.x + 11)
    }
    expect(new Set(cells.map(key)).size).toBe(cells.length)
  })
})

describe("the drawing", () => {
  it("merges each row's same-paint neighbours into runs that cover exactly the cells", () => {
    const cells = drivenCells()
    const paint = (c: (typeof cells)[number]) => ("driver" in c ? "d" + c.ink : c.ink)
    const runs = toRuns(cells, paint)
    expect(runs.length).toBeLessThan(cells.length / 3)
    const covered = runs.flatMap((r) => Array.from({ length: r.w }, (_, i) => `${r.x + i},${r.y},${r.paint}`)).sort()
    expect(covered).toEqual(cells.map((c) => `${c.x},${c.y},${paint(c)}`).sort())
  })
})
