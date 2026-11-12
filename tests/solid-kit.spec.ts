// The Solid layer grows beside the Vue kit until it holds all of it
// (`dither-kit/AGENTS.md`, the Solid layer). While both stand, the port
// keeps to its contract by construction: a Solid component is a Vue
// component's twin, under the same file name and the same public name, and
// it reaches the engine and the layer's class constants, never Vue and
// never a copy of either.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const KIT = join(import.meta.dirname, "../dither-kit")
const read = (path: string) => readFileSync(join(KIT, path), "utf8")
const walk = (dir: string): string[] =>
  readdirSync(join(KIT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  )

/** The names a layer's index exports under each file it reads. */
function exportsOf(index: string): Map<string, string[]> {
  const byFile = new Map<string, string[]>()
  for (const m of read(index).matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/g)) {
    const names = m[1]
      .split(",")
      .map((n) => n.trim().replace(/^type\s+/, ""))
      .filter(Boolean)
      .map((n) => n.split(/\s+as\s+/).at(-1)!)
    byFile.set(m[2], [...(byFile.get(m[2]) ?? []), ...names])
  }
  return byFile
}

const solidFiles = walk("solid")
// the layer's own files; `runtime/` is its bindings, twins of nothing
const components = solidFiles
  .filter((f) => f.endsWith(".tsx") && !f.startsWith("solid/runtime/"))
  .map((f) => f.slice("solid/".length, -".tsx".length))

describe("the Solid layer", () => {
  it("holds components", () => {
    expect(components.length).toBeGreaterThan(0)
  })

  it("names every component file as its Vue twin is named", () => {
    // a component file's, or a module's that builds components (a chart root)
    const vue = new Set(readdirSync(join(KIT, "tailwind")))
    expect(components.filter((c) => !vue.has(`${c}.vue`) && !vue.has(`${c}.ts`))).toEqual([])
  })

  it("exports each component under the names the Vue kit gives it", () => {
    const vue = exportsOf("tailwind/index.ts")
    const solid = exportsOf("solid/index.ts")
    for (const c of components) {
      const theirs = new Set(vue.get(`./${c}.vue`) ?? vue.get(`./${c}`) ?? [])
      const ours = solid.get(`./${c}`) ?? []
      // its own props type is the one name a Solid file adds
      const added = ours.filter((n) => !theirs.has(n) && !n.endsWith("Props"))
      expect({ component: c, added }).toEqual({ component: c, added: [] })
      const missing = [...theirs].filter((n) => !ours.includes(n))
      expect({ component: c, missing }).toEqual({ component: c, missing: [] })
    }
  })

  it("shares the engine's API with the Vue kit instead of listing it again", () => {
    for (const index of ["tailwind/index.ts", "solid/index.ts"])
      expect(read(index)).toContain('export * from "../engine/api"')
    expect([...exportsOf("solid/index.ts").keys()].filter((from) => from.startsWith("../engine/"))).toEqual([])
  })

  it("never imports Vue, a Vue component, or a Vue-bound engine module", () => {
    const vueBound = readdirSync(join(KIT, "engine"))
      .filter((f) => f.endsWith(".ts") && /from "vue"/.test(read(`engine/${f}`)))
      .map((f) => f.slice(0, -3))
    const offenders: string[] = []
    for (const file of solidFiles) {
      for (const m of read(file).matchAll(/from\s+"([^"]+)"/g)) {
        const from = m[1]
        const engine = /\/engine\/([\w-]+)$/.exec(from)?.[1]
        if (from === "vue" || from.endsWith(".vue") || (engine && vueBound.includes(engine)))
          offenders.push(`${file} imports ${from}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it("reaches no Vue through anything it imports, however far down", () => {
    const seen = new Set<string>()
    const reached: string[] = []
    const visit = (file: string) => {
      if (seen.has(file)) return
      seen.add(file)
      const text = readFileSync(file, "utf8")
      if (/from "vue"/.test(text)) reached.push(file.slice(KIT.length + 1))
      // a whole `import type` is erased, so it reaches nothing
      for (const m of text
        .replace(/import type [^;]*?from\s+"[^"]+"/g, "")
        .matchAll(/(?:from|import)\s+"(\.[^"]+)"/g)) {
        const base = join(file, "..", m[1])
        const next = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find(
          (f) => /\.tsx?$/.test(f) && existsSync(f),
        )
        if (next) visit(next)
      }
    }
    visit(join(KIT, "solid/index.ts"))
    expect(seen.size).toBeGreaterThan(20)
    expect(reached).toEqual([])
  })

  it("keeps the engine's shared cores free of any framework", () => {
    for (const core of ["engine/surface-loop.ts", "engine/visibility.ts", "engine/api.ts"])
      expect(read(core)).not.toMatch(/from "(vue|solid-js|svelte)[/"]/)
  })
})
