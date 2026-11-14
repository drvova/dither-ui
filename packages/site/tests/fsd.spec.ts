// The app's layers, held by construction (`src/AGENTS.md`): imports flow
// down, pages → widgets → features → entities → shared, never up, never
// sideways into another slice of the same layer, and no module reaches
// itself again through what it imports. Read the way the workspace's spec
// reads every package's imports (TypeScript's own pre-processor), so an
// `import` inside a snippet's string is text.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"

const SRC = join(import.meta.dirname, "../src")

/** The layers, highest first. `app` is one slice; `shared` is segments, not
 * slices, so its parts may use each other. What stands at the tree's top
 * (the entries, the shell, `app.tsx`, `app.css`, `routes/`) is above them all. */
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"] as const
type Layer = (typeof LAYERS)[number]

/** Where one slice of a layer stands on others of the same layer, lowest
 * first: a slice may import a slice of a LOWER rank, and every slice a
 * layer does not name stands at its top. Each rank is a real dependency of
 * the domain, not an exemption. */
const RANKS: Partial<Record<Layer, readonly (readonly string[])[]>> = {
  // A chart and a widget are a frame's two contents; a frame (artboard)
  // holds one; the editor holds the frames; a video is a frame of the
  // editor's document with the frames its reel cuts to.
  entities: [["chart", "widget"], ["artboard"], ["editor"], ["video"]],
  // The frame renderer draws a frame wherever one stands (the canvas, the
  // player, a reel's clip): the one widget the others draw with.
  widgets: [["frame-renderer"]],
}

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  )
const FILES = walk(SRC)

/** The file an import names inside `src/`, its extension or index found as
 * the bundler finds it; null for a package, or a file outside the tree (the
 * package's own manifest, read for its version, is no layer's). */
function target(from: string, written: string): string | null {
  const spec = written.split("?")[0]
  const base = spec.startsWith("@/")
    ? join(SRC, spec.slice(2))
    : spec.startsWith(".")
      ? resolve(dirname(from), spec)
      : null
  if (!base || relative(SRC, base).startsWith("..")) return null
  for (const f of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")])
    if (existsSync(f) && statSync(f).isFile()) return f
  throw new Error(`${relative(SRC, from)}: ${spec} names no file`)
}

/** What a module takes for its types alone (`import type`, `export type`):
 * erased before it runs, so it orders no module's loading. */
const typesOnly = (text: string) =>
  new Set([...text.matchAll(/^\s*(?:import|export) type\b[^;]*?\bfrom\s+"([^"]+)"/gm)].map((m) => m[1]))

/** Every import of every module of the tree: where it is written, the file
 * it names and whether it brings a value. */
const IMPORTS = FILES.flatMap((file) => {
  const text = readFileSync(file, "utf8")
  const types = typesOnly(text)
  const specs = ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName)
  return specs.flatMap((spec) => {
    const to = target(file, spec)
    // a specifier imported for types and for values too brings a value
    const value = !types.has(spec) || specs.filter((s) => s === spec).length > 1
    return to ? [{ file, spec, to, value, at: `${relative(SRC, file)}: ${spec}` }] : []
  })
})

/** The layer and slice a file stands in, or null above the layers. */
function sliceOf(file: string): { layer: Layer; slice: string; rank: number } | null {
  const [top, slice] = relative(SRC, file).split("/")
  const layer = LAYERS.find((l) => l === top)
  if (!layer || (!slice && layer !== "app")) return null
  const name = layer === "app" || layer === "shared" ? layer : slice
  const ranks = RANKS[layer] ?? []
  const rank = ranks.findIndex((r) => r.includes(name))
  return { layer, slice: name, rank: rank < 0 ? ranks.length : rank }
}

describe("the app's layers", () => {
  it("reads every module of the tree and what it imports", () => {
    expect(FILES.length).toBeGreaterThan(300)
    expect(IMPORTS.length).toBeGreaterThan(1000)
    // every slice a rank names stands
    for (const [layer, ranks] of Object.entries(RANKS))
      for (const slice of ranks.flat()) expect(existsSync(join(SRC, layer, slice)), `${layer}/${slice}`).toBe(true)
  })

  it("imports downward only: never a higher layer, nor the files above the layers", () => {
    const up = IMPORTS.filter((i) => {
      const from = sliceOf(i.file)
      if (!from) return false
      const to = sliceOf(i.to)
      return !to || LAYERS.indexOf(to.layer) < LAYERS.indexOf(from.layer)
    })
    expect(up.map((i) => i.at)).toEqual([])
  })

  it("never imports sideways: another slice of its layer only where it stands lower", () => {
    const sideways = IMPORTS.filter((i) => {
      const from = sliceOf(i.file)
      const to = sliceOf(i.to)
      return from && to && from.layer === to.layer && from.slice !== to.slice && to.rank >= from.rank
    })
    expect(sideways.map((i) => i.at)).toEqual([])
  })

  it("has no cycle: no module reaches itself through the values it imports", () => {
    const next = new Map<string, string[]>()
    for (const i of IMPORTS) if (i.value) next.set(i.file, [...(next.get(i.file) ?? []), i.to])
    const done = new Set<string>()
    const path: string[] = []
    const cycles: string[] = []
    const visit = (f: string) => {
      const at = path.indexOf(f)
      if (at >= 0) return void cycles.push([...path.slice(at), f].map((p) => relative(SRC, p)).join(" -> "))
      if (done.has(f)) return
      path.push(f)
      for (const t of next.get(f) ?? []) visit(t)
      path.pop()
      done.add(f)
    }
    for (const f of FILES) visit(f)
    expect(cycles).toEqual([])
  })
})
