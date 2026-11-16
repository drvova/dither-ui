// A docs example carries a file the reader reads as written (a model, a
// shader) where the kit or the site makes that file: the copy is pinned here
// to its maker, so the two never drift.
import { describe, expect, it } from "vitest"
import { sampleShader, sampleWorld } from "@dither-ui/kit"
import { ROCKET } from "@/pages/docs/components/rocket"
import world from "@/pages/docs/components/examples/world.tsx?raw"
import rocket from "@/pages/docs/components/examples/world-2.tsx?raw"
import shader from "@/pages/docs/components/examples/shader.tsx?raw"

/** The text of the template literal a module declares as `name`. */
function literal(source: string, name: string): string {
  const m = new RegExp("^const " + name + " = `([\\s\\S]*?)`$", "m").exec(source)
  if (!m) throw new Error(`no ${name}`)
  return m[1].replace(/\\([`\\$])/g, "$1")
}

describe("the files the docs' examples carry", () => {
  it("are the kit's seeded world and shader, and the site's rocket, as written", () => {
    expect(literal(world, "WORLD")).toBe(sampleWorld(7))
    expect(literal(shader, "SHADER")).toBe(sampleShader(3))
    expect(literal(rocket, "ROCKET")).toBe(ROCKET)
  })
})
