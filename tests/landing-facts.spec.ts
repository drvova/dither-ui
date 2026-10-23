import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { resolveMatrix } from "@dither-kit"
import { FACTS } from "../src/pages/landing/facts"
import { BACKGROUNDS_NAV } from "../src/pages/docs/backgrounds/backgrounds-nav"

const fact = (label: string) => FACTS.find((f) => f.label === label)?.value
const index = readFileSync(new URL("../dither-kit/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])

describe("landing facts", () => {
  it("counts the kit's public Dither components", () => {
    expect(fact("components")).toBe(components.filter((n) => n.startsWith("Dither")).length)
  })

  it("counts the chart types", () => {
    const charts = ["Area", "Line", "Bar", "Pie", "Radar", "Sparkline"]
    expect(charts.every((c) => components.includes(c))).toBe(true)
    expect(fact("chart types")).toBe(charts.length)
  })

  it("counts the background surfaces the docs list", () => {
    expect(fact("surfaces")).toBe(BACKGROUNDS_NAV.length)
  })

  it("names the matrix every surface thresholds against", () => {
    expect(resolveMatrix("gradient").length).toBe(fact("matrix"))
  })
})
