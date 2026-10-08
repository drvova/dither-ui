import { describe, expect, it } from "vitest"
import { linear, steps } from "../dither-kit/timing"
import {
  planSequence,
  sampleSequence,
  staggerDelay,
  type SequenceNode,
  type SequencePlan,
} from "../dither-kit/sequence"

const at = (plan: SequencePlan, t: number, id: string) =>
  sampleSequence(plan, t).find((s) => s.id === id)!

const track = (id: string, duration: number, extra: Record<string, unknown> = {}): SequenceNode => ({
  kind: "track",
  id,
  duration,
  ...extra,
} as SequenceNode)

describe("planSequence — serial", () => {
  it("concatenates tracks with an optional gap", () => {
    const plan = planSequence({ kind: "serial", nodes: [track("a", 1), track("b", 2)], gap: 0.5 })
    expect(plan.tracks.map((t) => [t.id, t.t0, t.end])).toEqual([
      ["a", 0, 1],
      ["b", 1.5, 3.5],
    ])
    expect(plan.duration).toBe(3.5)
  })

  it("spreads nested delays into absolute time", () => {
    const plan = planSequence({
      kind: "serial",
      nodes: [track("a", 1, { delay: 0.25 }), track("b", 1)],
    })
    expect(plan.tracks.map((t) => [t.t0, t.end])).toEqual([
      [0.25, 1.25],
      [1.25, 2.25],
    ])
  })
})

describe("planSequence — parallel", () => {
  it("starts everyone together by default", () => {
    const plan = planSequence({ kind: "parallel", nodes: [track("a", 1), track("b", 3)] })
    expect(plan.tracks.map((t) => t.t0)).toEqual([0, 0])
    expect(plan.duration).toBe(3)
  })

  it("align:'end' shifts shorter subtrees so all finish together", () => {
    const plan = planSequence({
      kind: "parallel",
      align: "end",
      nodes: [track("a", 1), track("b", 4)],
    })
    expect(plan.tracks.map((t) => [t.id, t.t0, t.end])).toEqual([
      ["a", 3, 4],
      ["b", 0, 4],
    ])
  })

  it("array input is parallel shorthand", () => {
    const plan = planSequence([track("a", 1), track("b", 2)])
    expect(plan.tracks.map((t) => t.t0)).toEqual([0, 0])
    expect(plan.duration).toBe(2)
  })
})

describe("staggerDelay — the four origins", () => {
  const delays = (from: staggerFrom) =>
    [0, 1, 2, 3, 4].map((i) => staggerDelay(i, 5, 0.1, from))
  type staggerFrom = Parameters<typeof staggerDelay>[3]

  it("start: wave from the first item", () => {
    expect(delays("start")).toEqual([0, 0.1, 0.2, 0.30000000000000004, 0.4])
  })
  it("end: wave from the last item", () => {
    expect(delays("end")).toEqual([0.4, 0.30000000000000004, 0.2, 0.1, 0])
  })
  it("center: first at the middle, spreading outward", () => {
    expect(delays("center")).toEqual([0.2, 0.1, 0, 0.1, 0.2])
  })
  it("edges: first at the rim, converging inward", () => {
    expect(delays("edges")).toEqual([0, 0.1, 0.2, 0.1, 0])
  })
  it("a literal index delays relative to that item", () => {
    expect([0, 1, 2, 3].map((i) => staggerDelay(i, 4, 0.2, 2))).toEqual([0.4, 0.2, 0, 0.2])
  })
  it("a single item never waits", () => {
    expect(staggerDelay(0, 1, 0.5, "center")).toBe(0)
  })
})

describe("planSequence — stagger", () => {
  it("spreads children by origin and runs each for its duration", () => {
    const plan = planSequence({
      kind: "stagger",
      count: 3,
      stagger: 0.5,
      from: "start",
      node: (i) => track(`c${i}`, 2),
    })
    expect(plan.tracks.map((t) => [t.id, t.t0, t.end])).toEqual([
      ["c0", 0, 2],
      ["c1", 0.5, 2.5],
      ["c2", 1, 3],
    ])
    expect(plan.duration).toBe(3)
  })

  it("keeps track order = child order (the driver's index contract)", () => {
    const plan = planSequence({
      kind: "stagger",
      count: 4,
      stagger: 0.1,
      from: "center",
      node: (i) => track(String(i), 1),
    })
    expect(plan.tracks.map((t) => t.id)).toEqual(["0", "1", "2", "3"])
    // count=4 → center sits between 1 and 2 (1.5), so both middle items lead
    expect(plan.tracks.map((t) => t.t0.toFixed(6))).toEqual(["0.150000", "0.050000", "0.050000", "0.150000"])
  })
})

describe("sampleSequence — states", () => {
  const plan = planSequence({ kind: "stagger", count: 2, stagger: 1, node: (i) => track(String(i), 1) })

  it("before / active / done across each track's window", () => {
    expect(at(plan, 0, "0").state).toBe("active")
    expect(at(plan, 0, "1").state).toBe("before")
    expect(at(plan, 0.5, "0").progress).toBe(0.5)
    expect(at(plan, 1.5, "0").state).toBe("done")
    expect(at(plan, 1.5, "1").progress).toBe(0.5)
    expect(at(plan, 3, "1").state).toBe("done")
    expect(at(plan, 3, "1").progress).toBe(1)
  })

  it("settles every track at plan.duration", () => {
    const samples = sampleSequence(plan, plan.duration)
    expect(samples.every((s) => s.state === "done")).toBe(true)
    expect(samples.map((s) => s.progress)).toEqual([1, 1])
  })

  it("applies easing to raw progress only", () => {
    const quantized = planSequence(track("q", 1, { easing: steps(4) }))
    const raw = sampleSequence(quantized, 0.3)[0]
    expect(raw.raw).toBeCloseTo(0.3)
    expect(raw.progress).toBe(0.25) // steps(4, jump-end) at 0.3
    expect(sampleSequence(quantized, 0.9)[0].progress).toBe(0.75)
  })
})

describe("loops and yoyo", () => {
  it("multiplies duration by whole cycles", () => {
    const plan = planSequence(track("l", 2, { loop: 3 }))
    expect(plan.duration).toBe(6)
    const mid = sampleSequence(plan, 3)[0]
    expect(mid.cycle).toBe(1)
    expect(mid.state).toBe("active")
  })

  it("yoyo reverses odd cycles so progress ping-pongs", () => {
    const plan = planSequence(track("y", 1, { loop: 4, yoyo: true }))
    expect(sampleSequence(plan, 0.5)[0].progress).toBeCloseTo(0.5) // rising
    expect(sampleSequence(plan, 1.5)[0].progress).toBeCloseTo(0.5) // falling
    expect(sampleSequence(plan, 1.25)[0].progress).toBeCloseTo(0.75) // down-leg
    expect(sampleSequence(plan, 2.25)[0].progress).toBeCloseTo(0.25) // rising again
    expect(sampleSequence(plan, 4)[0].progress).toBe(0) // even loop: last leg reversed → settles at start
  })

  it("an odd yoyo loop ends on its forward leg", () => {
    const plan = planSequence(track("y", 1, { loop: 3, yoyo: true }))
    expect(sampleSequence(plan, 3)[0].state).toBe("done")
    expect(sampleSequence(plan, 3)[0].progress).toBe(1) // last cycle is forward → terminal 1
  })

  it("quantized easing survives yoyo (composition with timing.ts)", () => {
    const plan = planSequence(track("q", 1, { loop: 2, yoyo: true, easing: steps(2) }))
    expect(sampleSequence(plan, 0.75)[0].progress).toBe(0.5) // rising leg, raw 0.75 → jump-end 0.5
    expect(sampleSequence(plan, 1.25)[0].progress).toBe(0.5) // down leg, raw 0.75 → same bucket
    expect(sampleSequence(plan, 1.75)[0].progress).toBe(0) // down leg, raw 0.25 → first bucket
  })
})

describe("degenerate inputs", () => {
  it("empty plan samples empty and measures 0", () => {
    const plan = planSequence({ kind: "stagger", count: 0, stagger: 0, node: () => track("x", 1) })
    expect(plan.tracks).toEqual([])
    expect(plan.duration).toBe(0)
    expect(sampleSequence(plan, 9)).toEqual([])
  })

  it("zero-duration tracks settle instantly at t0", () => {
    const plan = planSequence(track("z", 0, { delay: 2 }))
    expect(at(plan, 1.9, "z").state).toBe("before")
    expect(at(plan, 2, "z").state).toBe("done")
    expect(at(plan, 2, "z").progress).toBe(1)
  })

  it("sub-unit loop values clamp to one cycle", () => {
    const plan = planSequence(track("c", 1, { loop: 0.5 as unknown as number }))
    expect(plan.duration).toBe(1)
  })
})
