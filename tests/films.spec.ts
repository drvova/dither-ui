// The landing's Clayzo films. This spec is also their generator: each
// document is built from its TypeScript builder, validated, and compared
// with the committed public/films/<id>.json — `npm run films` rewrites
// those files (`npm run films`, rs test -u), and a builder edit without them fails here.
import { describe, expect, it } from "rstack/test"
import { resolveMatrix } from "@dither-kit"
import { FILMS } from "../src/pages/landing/films"
import { FAMILIES, SHELVES } from "../src/pages/landing/hub"
import { kitDitherSksl, THRESHOLDS } from "../src/pages/landing/films/kit-dither"
import { SKY, SUN } from "../src/pages/landing/plates"

describe("kit dither shader", () => {
  const sksl = kitDitherSksl()

  it("thresholds against the kit's own 4x4 matrix", () => {
    expect(THRESHOLDS).toEqual(resolveMatrix("gradient").flat())
    // The unrolled lookup is plain ternaries, so it evaluates as JS too.
    const expr = sksl.match(/float threshold[\s\S]*?return (.*);/)?.[1]
    expect(expr).toBeTruthy()
    const lookup = new Function("k", `return ${expr}`) as (k: number) => number
    THRESHOLDS.forEach((t, k) => expect(lookup(k)).toBe(t))
  })

  it("declares one colour uniform per ramp level, in ramp order", () => {
    const uniforms = [...sksl.matchAll(/uniform half4 (\w+);/g)].map((m) => m[1])
    expect(uniforms).toEqual([...SKY.map((_, i) => `k${i}`), ...SUN.map((_, i) => `h${i}`)])
    expect(sksl.trim().split("\n").at(-1)).toBe("}")
    expect(sksl).toContain("uniform float2 renderScale;")
  })

  it("binds its uniforms in the order the effect declares its parameters", () => {
    const declared = [...sksl.matchAll(/uniform (?:float|float2|half4) (\w+);/g)].map((m) => m[1])
    const node = FILMS.hero().compositions.main.nodes.pixels
    if (node.type !== "effect") throw new Error("pixels is not an effect")
    // The engine appends renderScale after the declared parameters.
    expect(declared).toEqual([...node.parameters.map((p) => p.name), "renderScale"])
  })
})

describe.each(Object.entries(FILMS))("film %s", (id, build) => {
  it("builds a valid, deterministic document", () => {
    const a = build()
    const b = build()
    expect(a.revision).toMatch(/^sha256:/)
    expect(a.revision).toBe(b.revision)
    expect(a.id).toBe(id)
  })

  it("marks the resting frame reduced motion holds", () => {
    const doc = build()
    const still = doc.markers.find((m) => m.id === "still")
    expect(still).toBeDefined()
    expect(still!.tick).toBeGreaterThanOrEqual(0)
    expect(still!.tick).toBeLessThan(doc.timing.durationTicks)
  })

  it("closes its loop on the frame it opens on", () => {
    const doc = build()
    const fps = doc.timing.frameRate.numerator / doc.timing.frameRate.denominator
    expect(doc.timing.durationTicks % (doc.timing.ticksPerSecond / fps)).toBe(0)
  })

  it("matches its committed document", async () => {
    await expect(JSON.stringify(build())).toMatchFileSnapshot(`../public/films/${id}.json`)
  })
})

// What the page drives by name: the directory feeds the picked family's
// index and reads clicks off `tower<i>-hit` (a pointer only where a shelf
// answers), and the close raises the dawn's `glow`.
describe("the page's handles", () => {
  const inputs = (doc: ReturnType<typeof FILMS.hero>) => doc.interaction?.inputs.map((i) => i.name) ?? []

  it("gives the catalog a family input and one target per family", () => {
    const doc = FILMS.catalog()
    expect(inputs(doc)).toContain("family")
    const hits = doc.interaction?.hitAreas ?? []
    expect(hits.map((h) => h.id)).toEqual(FAMILIES.map((_, i) => `tower${i}-hit`))
    const shelved = SHELVES.filter((s) => s.value !== "explore").map((s) => s.label)
    expect(FAMILIES.filter((_, i) => hits[i].cursor === "pointer").map((f) => f.title)).toEqual(
      FAMILIES.map((f) => f.title).filter((t) => shelved.includes(t)),
    )
  })

  it("gives the dawn a glow input", () => {
    expect(inputs(FILMS.dawn())).toContain("glow")
  })
})
