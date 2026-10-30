import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "../src/pages/landing/facts"
import { FAMILIES, SECTION_COUNT } from "../src/pages/landing/hub"

const index = readFileSync(new URL("../dither-kit/tailwind/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])
const kit = JSON.parse(readFileSync(new URL("../dither-kit/package.json", import.meta.url), "utf8")) as {
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}

describe("landing facts", () => {
  it("counts the kit's public Dither components", () => {
    expect(COMPONENT_COUNT).toBe(components.filter((n) => n.startsWith("Dither")).length)
  })

  it("is the count every page, card and doc states", () => {
    const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8")
    const stated = ["index.html", "README.md", "public/agent/SKILL.md", "src/pages/docs/crawler-files.ts"].flatMap(
      (f) =>
        [...read(f).matchAll(/\b(\d{3}) (?:Vue |public `Dither\*` )?components\b|\["(\d{3})", "components"\]/g)].map(
          (m) => Number(m[1] ?? m[2]),
        ),
    )
    expect(stated.length).toBeGreaterThanOrEqual(7)
    expect(new Set(stated)).toEqual(new Set([COMPONENT_COUNT]))
    // The Studio's film counts up to the components, the sections and the backgrounds, and names two.
    const film = read("src/features/agent/film.ts")
    const counts = [...film.matchAll(/to: (\d+), duration/g)].map((m) => Number(m[1]))
    expect(counts).toEqual([COMPONENT_COUNT, SECTION_COUNT, FAMILIES.find((f) => f.title === "Backgrounds")?.count])
    expect(film).toContain(`["${COMPONENT_COUNT}", "components"]`)
    expect(film).toContain(`["${SECTION_COUNT}", "docs sections"]`)
  })

  it("names every package the kit needs beside Vue (a styling layer's own, optional, aside)", () => {
    const peers = Object.keys(kit.peerDependencies).filter((p) => p !== "vue" && !kit.peerDependenciesMeta[p]?.optional)
    expect([...RUNTIME_DEPS].sort()).toEqual(peers.sort())
  })
})
