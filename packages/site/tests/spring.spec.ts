// What the hand lets go of (the user's lift of the glide, for a press let
// go only): one spring, a response and a bounce, that passes its mark a
// little and settles, and its CSS copy in the site's stylesheet, which the
// press's way back runs on (`tests/css-motion.spec.ts` holds the press).
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import {
  HAND_SPRING,
  SPRING_MS,
  SPRING_OVERSHOOT,
  springAt,
  springEase,
  springLinear,
  springPhysics,
} from "@/shared/lib/spring"

const root = new URL("../../..", import.meta.url).pathname
const css = readFileSync(join(root, "packages/site/src/app/styles.css"), "utf8")

describe("the hand's spring", () => {
  it("is one response and one bounce, its physics derived from them", () => {
    expect(HAND_SPRING).toEqual({ response: 0.35, bounce: 0.25 })
    const p = springPhysics()
    expect(p.stiffness).toBeCloseTo((2 * Math.PI) ** 2 / 0.35 ** 2, 6)
    expect(p.zeta).toBe(0.75)
  })

  it("starts where and as fast as it was let go, and settles on its mark", () => {
    expect(springAt(0, 120, -800)).toEqual({ x: 120, v: -800 })
    const end = springAt(SPRING_MS / 1000, 1)
    expect(Math.abs(end.x)).toBeLessThan(1 / 400)
    // its velocity is the slope of its travel
    const dt = 1e-5
    const v = (springAt(0.1 + dt, 50, 300).x - springAt(0.1 - dt, 50, 300).x) / (2 * dt)
    expect(springAt(0.1, 50, 300).v).toBeCloseTo(v, 3)
  })

  it("passes its mark a little, never much, and lands on it", () => {
    expect(springEase(0)).toBe(0)
    expect(springEase(1)).toBe(1)
    let peak = 0
    for (let i = 0; i <= 1000; i++) peak = Math.max(peak, springEase(i / 1000))
    expect(peak).toBeGreaterThan(1.01)
    expect(peak).toBeLessThan(1.05)
    expect(peak).toBeCloseTo(1 + SPRING_OVERSHOOT, 3)
  })

  it("is the site stylesheet's spring, gliding where linear() is not supported", () => {
    expect(css).toContain("--ease-spring: var(--ease-settle);")
    expect(css).toContain(`--spring-time: ${SPRING_MS}ms;`)
    // the copy behind `@supports`, however the formatter lays its stops out
    const supported = css.slice(css.indexOf("@supports (transition-timing-function: linear(0, 1)) {"))
    const copy = supported.match(/:root \{\s*--ease-spring:\s*(linear\([^)]*\));/)?.[1]
    expect(copy?.replace(/\s+/g, "")).toBe(springLinear().replace(/\s+/g, ""))
    expect(springLinear()).toMatch(/^linear\(0, .*, 1\)$/)
  })
})
