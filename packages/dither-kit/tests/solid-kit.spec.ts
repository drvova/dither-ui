// The kit's Solid layer and the framework-free code under it, held by
// construction: every component file is in the layer's index, the index
// hands on the engine's API instead of listing it again, and the engine
// imports no framework at all.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"

const KIT = join(import.meta.dirname, "../src")
const read = (path: string) => readFileSync(join(KIT, path), "utf8")
const walk = (dir: string): string[] =>
  readdirSync(join(KIT, dir), { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules" || e.name.startsWith(".")
      ? []
      : e.isDirectory()
        ? walk(`${dir}/${e.name}`)
        : [`${dir}/${e.name}`],
  )

/** The files a layer's index exports from. */
const exportedFrom = (index: string) =>
  new Set([...read(index).matchAll(/export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+"([^"]+)"/g)].map((m) => m[1]))

/** What a module imports, as its parser reads it (a snippet's `from "vue"`
 * inside a string is text, not an import). */
const importsOf = (text: string) => ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName)

const solidFiles = walk("solid")
// the layer's own files; `runtime/` is its bindings, which components reach
const components = solidFiles
  .filter((f) => f.endsWith(".tsx") && !f.startsWith("solid/runtime/"))
  .map((f) => f.slice("solid/".length, -".tsx".length))

describe("the Solid layer", () => {
  it("holds components", () => {
    expect(components.length).toBeGreaterThan(250)
  })

  it("exports every component file from its index, or builds one that is with it", () => {
    const exported = exportedFrom("solid/index.ts")
    // a part two exported components share (a series under Area and Line)
    const parts = new Set(
      components.flatMap((c) => importsOf(read(`solid/${c}.tsx`)).filter((from) => /^\.\/[A-Z]/.test(from))),
    )
    const unreached = components.filter((c) => !exported.has(`./${c}`) && !parts.has(`./${c}`))
    expect(unreached).toEqual([])
    expect(components.filter((c) => !exported.has(`./${c}`))).toEqual(["CartesianSeries"])
  })

  it("hands on the engine's API whole instead of listing it again", () => {
    expect(read("solid/index.ts")).toContain('export * from "../engine/api"')
    expect([...exportedFrom("solid/index.ts")].filter((from) => from.startsWith("../engine/"))).toEqual([
      "../engine/api",
    ])
  })
})

describe("the engine", () => {
  it("imports no framework: every module of it is shared by the kits", () => {
    const framed = [...walk("engine"), "tailwind/lib.ts", "tailwind/control.ts"]
      .filter((f) => f.endsWith(".ts"))
      .flatMap((f) =>
        importsOf(read(f))
          .filter((from) => /^(vue|@vue\/|solid-js|svelte)(\/|$)/.test(from) || /\.(vue|svelte|tsx)$/.test(from))
          .map((from) => `${f} imports ${from}`),
      )
    expect(framed).toEqual([])
  })

  it("reaches no deleted module through its public API", () => {
    const missing = importsOf(read("engine/api.ts")).filter(
      (from) => !walk("engine").includes(`engine/${from.slice(2)}.ts`),
    )
    expect(missing).toEqual([])
  })
})
