// What the hand moves (the user's lift of the glide, for direct
// manipulation only): one spring, a response and a bounce, that passes its
// mark a little and settles; its CSS copy in the site's stylesheet; the
// press it moves (marked by `shared/lib/press.ts`, moved only where motion
// is welcome); and the menu's sheet let go under a finger.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { PRESSABLE, PRESS_DOWN_MS } from "@/shared/lib/press"
import {
  HAND_SPRING,
  SPRING_MS,
  SPRING_OVERSHOOT,
  springAt,
  springEase,
  springLinear,
  springPhysics,
} from "@/shared/lib/spring"
import { SHEET_DRAG, SHEET_SLIDE, pullOf, releaseOf, velocityOf } from "@/widgets/site-header/sheet"

const root = new URL("../../..", import.meta.url).pathname
const css = readFileSync(join(root, "packages/site/src/app/styles.css"), "utf8")

/** The rule blocks of `text` under `@media (prefers-reduced-motion: no-preference)`. */
const welcomed = (text: string) => {
  const out: string[] = []
  const open = "@media (prefers-reduced-motion: no-preference) {"
  for (let at = text.indexOf(open); at >= 0; at = text.indexOf(open, at + 1)) {
    let depth = 0
    let i = at + open.length - 1
    do {
      if (text[i] === "{") depth++
      else if (text[i] === "}") depth--
      i++
    } while (depth > 0)
    out.push(text.slice(at, i))
  }
  return out.join("\n")
}

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

describe("the press", () => {
  it("names the site's keys and what opts in", () => {
    for (const key of [".key", ".key-chrome", ".nav-a", "[data-press]"]) expect(PRESSABLE.split(", ")).toContain(key)
    expect(css).toContain(`--press-time: ${PRESS_DOWN_MS}ms;`)
  })

  it("moves a key down on the glide and back on the spring, only where motion is welcome", () => {
    const moving = welcomed(css)
    expect(moving).toContain(`[data-pressed="down"] {
      animation: press-down var(--press-time) var(--ease-settle) both;`)
    expect(moving).toContain(`[data-pressed="up"] {
      animation: press-up var(--spring-time) var(--ease-spring) both;`)
    // every press rule is inside the welcome, none outside it
    expect(css.match(/\[data-pressed=/g)).toHaveLength(moving.match(/\[data-pressed=/g)!.length)
    expect(css).toMatch(/@keyframes press-down \{[^@]*scale: var\(--press-scale, 0\.97\)/)
    expect(css).toMatch(/@keyframes press-up \{[^@]*scale: 1;/)
  })
})

describe("the sheet under the hand", () => {
  it("follows a pull down whole and a pull up only a little", () => {
    expect(pullOf(140)).toBe(140)
    expect(pullOf(-50)).toBe(-50 * SHEET_DRAG.give)
    expect(pullOf(-1000)).toBe(-SHEET_DRAG.reach)
  })

  it("closes past its share or on a throw down, else stays", () => {
    const h = 400
    expect(releaseOf(h * SHEET_DRAG.close, 0, h)).toBe("close")
    expect(releaseOf(h * SHEET_DRAG.close - 1, 0, h)).toBe("stay")
    expect(releaseOf(10, SHEET_DRAG.flick, h)).toBe("close")
    expect(releaseOf(h * 0.9, -SHEET_DRAG.flick, h)).toBe("stay")
  })

  it("reads the pointer's velocity over its last stretch", () => {
    expect(velocityOf([])).toBe(0)
    expect(velocityOf([{ t: 0, y: 0 }])).toBe(0)
    // an early pause is forgotten: only the last 80ms count
    expect(
      velocityOf([
        { t: 0, y: 0 },
        { t: 500, y: 10 },
        { t: 540, y: 30 },
        { t: 580, y: 50 },
      ]),
    ).toBe(0.5)
  })

  it("comes and goes on the glide in a sheet's time", () => {
    expect(SHEET_SLIDE.duration).toBe(500)
    expect(SHEET_SLIDE.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)")
  })
})
