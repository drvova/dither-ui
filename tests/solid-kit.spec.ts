// The kit's Solid layer and the framework-free code under it, held by
// construction: every component file is in the layer's index, the index
// hands on the engine's API instead of listing it again, the engine imports
// no framework at all, and nothing in the kit or either half of the site
// imports Vue (the kit and the site were Vue's before they were Solid's).
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"

const ROOT = join(import.meta.dirname, "..")
const KIT = join(ROOT, "dither-kit")
const read = (path: string) => readFileSync(join(KIT, path), "utf8")
const walk = (dir: string, from = KIT): string[] =>
  readdirSync(join(from, dir), { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules" || e.name.startsWith(".")
      ? []
      : e.isDirectory()
        ? walk(`${dir}/${e.name}`, from)
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

describe("no Vue", () => {
  it("is imported by the kit or by either half of the site, anywhere", () => {
    const offenders: string[] = []
    let read = 0
    for (const tree of ["dither-kit", "solid-site", "src"])
      for (const file of walk(tree, ROOT)) {
        if (!/\.(tsx?|mts|mjs|js)$/.test(file) || file.startsWith("solid-site/.")) continue
        read++
        for (const from of importsOf(readFileSync(join(ROOT, file), "utf8")))
          if (
            /^(vue|@vue\/.*|vue\/.*|vue-.*|@vitejs\/plugin-vue.*|@rsbuild\/plugin-vue)$/.test(from) ||
            from.endsWith(".vue")
          )
            offenders.push(`${file} imports ${from}`)
      }
    expect(read).toBeGreaterThan(900)
    expect(offenders).toEqual([])
  })

  it("is a dependency of no package here", () => {
    for (const manifest of ["package.json", "solid-site/package.json", "dither-kit/package.json"]) {
      const pkg = JSON.parse(readFileSync(join(ROOT, manifest), "utf8")) as Record<string, Record<string, string>>
      const named = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((k) =>
        Object.keys(pkg[k] ?? {}).filter((n) => /^(vue|@vue\/.*|vue-.*|.*plugin-vue.*)$/.test(n)),
      )
      expect({ manifest, named }).toEqual({ manifest, named: [] })
    }
  })
})
