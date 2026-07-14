import { describe, expect, it } from "vitest"
import {
  BORDER_ALPHA,
  cubicBezier,
  EASINGS,
  OFF_TIER,
  resolveEasing,
  resolveTexture,
} from "../dither-kit/dither-paint"

describe("cubicBezier", () => {
  it("pins the endpoints", () => {
    const f = cubicBezier(0.4, 0, 0.6, 1)
    expect(f(0)).toBe(0)
    expect(f(1)).toBe(1)
  })
  it("linear control points give the identity", () => {
    const f = cubicBezier(0.25, 0.25, 0.75, 0.75)
    for (const t of [0.1, 0.3, 0.5, 0.8]) expect(f(t)).toBeCloseTo(t, 3)
  })
  it("supports overshoot (y beyond 1)", () => {
    const back = cubicBezier(0.34, 1.56, 0.64, 1)
    let peak = 0
    for (let t = 0; t <= 1; t += 0.02) peak = Math.max(peak, back(t))
    expect(peak).toBeGreaterThan(1.02)
  })
  it("clamps input outside [0,1]", () => {
    const f = cubicBezier(0.3, 0.1, 0.7, 0.9)
    expect(f(-1)).toBe(0)
    expect(f(2)).toBe(1)
  })
})

describe("resolveEasing", () => {
  it("resolves names to the EASINGS map", () => {
    expect(resolveEasing("linear")).toBe(EASINGS.linear)
    expect(resolveEasing("ease-out")).toBe(EASINGS["ease-out"])
  })
  it("memoizes the same bezier points", () => {
    const pts = [0.4, 0.68, 0.3, 1] as const
    expect(resolveEasing(pts)).toBe(resolveEasing(pts))
  })
  it("bezier resolution evaluates correctly", () => {
    const f = resolveEasing([0.25, 0.25, 0.75, 0.75])
    expect(f(0.5)).toBeCloseTo(0.5, 3)
  })
})

describe("resolveTexture", () => {
  it("gradient preset", () => {
    // toMatchObject: the texture config may gain fields (e.g. seed-driven
    // luminance coefficients) — these core mappings must hold regardless.
    expect(resolveTexture("gradient")).toMatchObject({
      ramp: 1, density: 0, gaps: false, hatch: 0, offTier: OFF_TIER, edge: BORDER_ALPHA,
    })
  })
  it("dotted = density bias + real gaps", () => {
    const t = resolveTexture("dotted")
    expect(t.density).toBeCloseTo(0.12)
    expect(t.gaps).toBe(true)
  })
  it("hatched = stripe period 4", () => {
    expect(resolveTexture("hatched").hatch).toBe(4)
  })
  it("solid outbids every threshold shift (density 2)", () => {
    // density 2 preserves the old always-lit solid branch even under
    // stacked (+0.2) and sparse (-0.28) bias shifts. BAYER max ~0.97.
    expect(resolveTexture("solid").density).toBe(2)
  })
  it("custom config merges over gradient defaults", () => {
    const t = resolveTexture({ ramp: 0.3, hatch: 6 })
    expect(t.ramp).toBe(0.3)
    expect(t.hatch).toBe(6)
    expect(t.gaps).toBe(false)
    expect(t.edge).toBe(BORDER_ALPHA)
  })
})
