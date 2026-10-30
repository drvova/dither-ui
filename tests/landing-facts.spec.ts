import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { SCREENS, SCREEN_KINDS } from "../dither-kit/engine/pixel"
import { STYLING_LABELS } from "../src/shared/lib/restyle"
import { COMPONENT_COUNT, RUNTIME_DEPS, SPECS } from "../src/pages/landing/facts"
import { FAMILIES, SECTION_COUNT } from "../src/pages/landing/hub"

const index = readFileSync(new URL("../dither-kit/tailwind/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])
const kit = JSON.parse(readFileSync(new URL("../dither-kit/package.json", import.meta.url), "utf8")) as {
  license: string
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}
const port = JSON.parse(readFileSync(new URL("../dither-kit-svelte/package.json", import.meta.url), "utf8")) as {
  peerDependencies: Record<string, string>
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

  it("keeps a spec sheet the kit bears out", () => {
    const spec = (label: string) => SPECS.find((s) => s.label === label)?.value ?? ""
    expect(spec("Components")).toContain("Vue 3")
    expect(kit.peerDependencies.vue).toMatch(/^\^3\./)
    expect(spec("Components")).toContain("Svelte 5")
    expect(port.peerDependencies.svelte).toMatch(/^\^5\./)
    expect(spec("Engine")).toContain(`${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`)
    expect(spec("Screens")).toBe(SCREEN_KINDS.join(", "))
    for (const name of Object.values(STYLING_LABELS)) expect(spec("Styling")).toContain(name)
    expect(spec("License")).toBe(kit.license)
    for (const s of SPECS) expect(`${s.label} ${s.value}`).not.toMatch(/[—·]/)
  })

  it("names every package the kit needs beside Vue (a styling layer's own, optional, aside)", () => {
    const peers = Object.keys(kit.peerDependencies).filter((p) => p !== "vue" && !kit.peerDependenciesMeta[p]?.optional)
    expect([...RUNTIME_DEPS].sort()).toEqual(peers.sort())
  })
})
