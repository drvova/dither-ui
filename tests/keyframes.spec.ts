import { describe, expect, it } from "vitest"
import { compileTrack, keyframeTransform, lerpTerms, parseAngle, parseLength, resolveSample, sampleKeyframes, termsToCss, termsToPx } from "../dither-kit/keyframes"
import { steps } from "../dither-kit/timing"

const box = { width: 400, height: 200 }

describe("lengths", () => {
  it("parses numbers as px, strings by unit, calc sums term by term", () => {
    expect(parseLength(12)).toEqual({ px: 12 })
    expect(parseLength("-4cqw")).toEqual({ cqw: -4 })
    expect(parseLength("50%")).toEqual({ "%": 50 })
    expect(parseLength("calc(20cqw - 4px)")).toEqual({ cqw: 20, px: -4 })
    expect(parseLength("calc(1cqw + 1cqw)")).toEqual({ cqw: 2 })
    expect(parseLength("0")).toEqual({})
    expect(parseLength("")).toEqual({})
    expect(parseLength("2s")).toEqual({})
    expect(parseLength(undefined)).toEqual({})
  })

  it("interpolates per unit and prints a plain value or a calc()", () => {
    expect(termsToCss(lerpTerms(parseLength("10cqw"), parseLength("30cqw"), 0.5))).toBe("20cqw")
    expect(termsToCss(lerpTerms(parseLength("10px"), parseLength("50cqw"), 0.5))).toBe("calc(5px + 25cqw)")
    expect(termsToCss(lerpTerms({ cqw: 20 }, { px: -4 }, 0.5))).toBe("calc(-2px + 10cqw)")
    expect(termsToCss(lerpTerms({ cqw: 20 }, { px: -4 }, 1))).toBe("-4px")
    expect(termsToCss({})).toBe("0px")
    expect(termsToCss({ px: 1 / 3 })).toBe("0.333px")
  })

  it("resolves against a box: container units, percentages by axis, viewport and font from an env", () => {
    expect(termsToPx({ cqw: 10 }, box)).toBe(40)
    expect(termsToPx({ cqh: 10, px: 5 }, box)).toBe(25)
    expect(termsToPx({ "%": 50 }, box, "x")).toBe(200)
    expect(termsToPx({ "%": 50 }, box, "y")).toBe(100)
    expect(termsToPx({ cqmin: 10, cqmax: 10, cqi: 10, cqb: 10 }, box)).toBe(20 + 40 + 40 + 20)
    expect(termsToPx({ vw: 10, rem: 2 }, box, "x", { viewport: { width: 1000, height: 500 }, font: 10 })).toBe(120)
  })

  it("reads angles in any unit as degrees", () => {
    expect(parseAngle("0.5turn")).toBe(180)
    expect(parseAngle(`${Math.PI}rad`)).toBeCloseTo(180)
    expect(parseAngle("100grad")).toBe(90)
    expect(parseAngle("-30deg")).toBe(-30)
    expect(parseAngle(45)).toBe(45)
    expect(parseAngle("x")).toBe(0)
  })
})

describe("keyframes", () => {
  const track = { keyframes: [{ x: "10cqw", opacity: 0 }, { at: "50%", x: "30cqw" }, { x: "50cqw", opacity: 1 }], duration: 2 }

  it("spreads unplaced keys evenly and interpolates each property across the keys that define it", () => {
    const s = sampleKeyframes(track, 0.5)
    expect(s).toMatchObject({ state: "active", cycle: 0, progress: 0.25 })
    expect(termsToCss(s.lengths.x)).toBe("20cqw")
    expect(s.numbers.opacity).toBeCloseTo(0.25)
    expect(keyframeTransform(s)).toBe("translate(20cqw, 0px)")
    expect(resolveSample(s, { width: 300, height: 100 }).x).toBe(60)
    expect(termsToCss(sampleKeyframes(track, 1.5).lengths.x)).toBe("40cqw")
  })

  it("holds before the delay and after the end, loops, yoyos, eases per segment", () => {
    const t = { keyframes: [{ x: 0 }, { x: 100, easing: "linear" as const }], duration: 1, delay: 1, loop: 2, yoyo: true }
    expect(sampleKeyframes(t, 0.5)).toMatchObject({ state: "before", progress: 0 })
    expect(resolveSample(sampleKeyframes(t, 1.25), box).x).toBe(25)
    expect(resolveSample(sampleKeyframes(t, 2.25), box).x).toBe(75)
    expect(sampleKeyframes(t, 3.5)).toMatchObject({ state: "done", cycle: 2, progress: 0 })
    expect(sampleKeyframes({ ...t, loop: 1 }, 9)).toMatchObject({ state: "done", cycle: 1, progress: 1 })
    expect(sampleKeyframes({ keyframes: [{ x: 0 }, { x: 100 }], duration: 1, loop: true }, 7.5)).toMatchObject({ state: "active", cycle: 7, progress: 0.5 })
    expect(sampleKeyframes({ keyframes: [{ x: 0 }, { x: 100 }], duration: 1, loop: true }, Infinity)).toMatchObject({ state: "done", progress: 1 })
    const eased = sampleKeyframes({ keyframes: [{ x: 0, easing: "ease-in-out" }, { x: 100 }], duration: 1 }, 0.25)
    expect(resolveSample(eased, box).x).toBeLessThan(25)
    const stepped = sampleKeyframes({ keyframes: [{ x: 0 }, { x: 100 }], duration: 1, easing: steps(4) }, 0.3)
    expect(resolveSample(stepped, box).x).toBe(25)
  })

  it("places keys in seconds when the duration is theirs, takes custom keys as numbers, angles or lengths", () => {
    const s = sampleKeyframes({ keyframes: [{ at: 0, glow: 0, cx: "0px", tilt: "0deg" }, { at: 4, glow: 2, cx: "40cqw", tilt: "1turn" }] }, 2)
    expect(s.numbers).toMatchObject({ glow: 1, tilt: 180 })
    expect(termsToCss(s.lengths.cx)).toBe("20cqw")
    expect(resolveSample(s, { width: 100, height: 50 })).toMatchObject({ glow: 1, cx: 20, tilt: 180 })
    // vertical names resolve percentages against the height
    expect(resolveSample(sampleKeyframes({ keyframes: [{ cy: "50%", top: "10%" }] }, 0), { width: 100, height: 50 })).toEqual({ cy: 25, top: 5 })
  })

  it("prints every transform part, in units or in px against a box, and samples a compiled track alike", () => {
    const s = sampleKeyframes({ keyframes: [{ x: "10px", y: "-2cqh", rotate: "0.25turn", scale: 2, skewX: 10 }] }, 0)
    expect(keyframeTransform(s)).toBe("translate(10px, -2cqh) rotate(90deg) scale(2, 2) skew(10deg, 0deg)")
    expect(keyframeTransform(s, { width: 100, height: 50 })).toBe("translate(10px, -1px) rotate(90deg) scale(2, 2) skew(10deg, 0deg)")
    expect(keyframeTransform(sampleKeyframes({ keyframes: [{ scaleX: 2 }] }, 0))).toBe("scale(2, 1)")
    expect(keyframeTransform(sampleKeyframes({ keyframes: [{ opacity: 1 }] }, 0))).toBe("none")
    expect(sampleKeyframes({ keyframes: [] }, 0.5)).toMatchObject({ state: "active", lengths: {}, numbers: {} })
    expect(sampleKeyframes({ keyframes: [] }, 1)).toMatchObject({ state: "done" })
    expect(sampleKeyframes(compileTrack(track), 0.5)).toEqual(sampleKeyframes(track, 0.5))
  })
})
