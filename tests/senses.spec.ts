import { describe, expect, it } from "vitest"
import { seedFor, SITE_SEED } from "@/pages/landing/genome"
import {
  createGovernor,
  createSenses,
  daylight,
  DROWSY_RAMP,
  IDLE_AFTER,
  QUALITY_TIERS,
  stepHormones,
} from "@/pages/landing/senses"

describe("genome", () => {
  it("derives stable, distinct seeds from one site seed", () => {
    expect(seedFor("sky")).toBe(seedFor("sky"))
    expect(seedFor("sky")).not.toBe(seedFor("band"))
    expect(seedFor("sky", SITE_SEED + 1)).not.toBe(seedFor("sky"))
    for (const s of [seedFor("sky"), seedFor("band"), seedFor("")]) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(2 ** 31)
    }
  })
})

describe("endocrine", () => {
  it("daylight peaks at noon and bottoms at midnight", () => {
    expect(daylight(0)).toBeCloseTo(0)
    expect(daylight(12)).toBeCloseTo(1)
    expect(daylight(6)).toBeCloseTo(0.5)
    expect(daylight(24)).toBeCloseTo(0)
  })

  it("arousal rises with movement and decays, drowsiness ramps after idle", () => {
    let h = { arousal: 0, drowsy: 0, daylight: 0.5 }
    h = stepHormones(h, 16, 120, 0)
    expect(h.arousal).toBeGreaterThan(0.4)
    const peak = h.arousal
    h = stepHormones(h, 4000, 0, 4000)
    expect(h.arousal).toBeLessThan(peak * 0.5)
    expect(h.drowsy).toBe(0)
    h = stepHormones(h, 16, 0, IDLE_AFTER + DROWSY_RAMP / 2)
    expect(h.drowsy).toBeCloseTo(0.5)
    h = stepHormones(h, 16, 0, IDLE_AFTER + DROWSY_RAMP * 3)
    expect(h.drowsy).toBe(1)
    expect(stepHormones(h, 16, 0, 0).drowsy).toBe(0)
  })
})

describe("metabolic governor", () => {
  it("steps quality down under sustained load and back up with headroom", () => {
    const g = createGovernor({ over: 9, under: 3, downAfter: 10, upAfter: 20 })
    expect(g.quality).toBe(QUALITY_TIERS[0])
    let q = 1
    for (let i = 0; i < 200; i++) q = g.sample(20)
    expect(q).toBe(QUALITY_TIERS[2])
    for (let i = 0; i < 400; i++) q = g.sample(0.5)
    expect(q).toBe(QUALITY_TIERS[0])
    // One slow frame is not a trend.
    g.sample(40)
    expect(g.quality).toBe(QUALITY_TIERS[0])
  })
})

describe("sensorium", () => {
  it("subscribes organisms and stops the heartbeat when the last one leaves", () => {
    const s = createSenses()
    const ticks: number[] = []
    const off = s.subscribe({ tick: (dt) => ticks.push(dt) })
    expect(s.quality).toBe(1)
    expect(s.hormones.daylight).toBeGreaterThanOrEqual(0)
    off()
    s.destroy()
    expect(typeof s.pointer.x).toBe("number")
  })
})
