import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { COMPONENT_COUNT } from "../src/pages/landing/facts"

const index = readFileSync(new URL("../dither-kit/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])

describe("landing facts", () => {
  it("counts the kit's public Dither components", () => {
    expect(COMPONENT_COUNT).toBe(components.filter((n) => n.startsWith("Dither")).length)
  })
})
