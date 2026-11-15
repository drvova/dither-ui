// What a page's first load costs a phone, read off the built site: the
// scripts its HTML starts (the entry and every module it preloads) and every
// module they import in turn, gzipped as a host serves them. The landing and
// a docs section once carried each other's pages and the docs' whole table
// into their first load (a barrel's stylesheet kept its every export), and
// the kit's world engine, model parsers and chart scales came with them for
// art below the first screen. Counted here, the landing's first load went
// from 248 KB of gzipped script to 132 and a docs section's from 248 to 136
// (measured on a 4x-throttled phone over slow 4G: loaded 0.5 to 1.3s
// sooner, a third to half less blocking time). A budget a little above each
// holds it there: a page that grows past it pulled into its first load
// something it does not show at first.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { CHUNK_MODULES } from "../../build/chunk-modules"

const OUT = join(__dirname, "../../.output/public")

/** KB of gzipped script each page may start with. */
const BUDGET_KB: Record<string, number> = {
  "index.html": 138,
  "docs/button/index.html": 144,
  "docs/area/index.html": 144,
}

/** Every script a page's first load runs: the module scripts and preloads
 * its HTML names, and what they import statically, transitively. A dynamic
 * `import()` is a chunk loaded later, never counted. */
function firstLoad(page: string): string[] {
  const html = readFileSync(join(OUT, page), "utf8")
  const named = [
    ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+href="([^"]+\.js)"[^>]+rel="modulepreload"/g),
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g),
  ].map((m) => m[1].replace(/^\//, ""))
  const seen = new Set<string>()
  const visit = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    const code = readFileSync(join(OUT, file), "utf8")
    const dir = file.slice(0, file.lastIndexOf("/") + 1)
    for (const [, spec] of code.matchAll(/(?:^|[;}\s])import\s*(?:[\w${},*\s]+from\s*)?["'](\.\/[^"']+)["']/g))
      visit(dir + spec.slice(2))
  }
  named.forEach(visit)
  return [...seen]
}

/** Each chunk's source modules, by its file (`build/chunk-modules.ts`). */
type Chunks = Record<string, string[]>

/** What the landing never loads first: the docs' page, its cards, the
 * styling rewriter and the pack table. */
const DOCS_ONLY = [
  /^packages\/site\/src\/pages\/docs\/(DocsPage|DemoCard)\.tsx$/,
  /^packages\/site\/src\/pages\/docs\/pack-loaders\.ts$/,
  /^packages\/restyle\/src\//,
]

/** What neither first load carries, its art being below the first screen:
 * the kit's world engine in every file it is split into, its model and
 * splat parsers, the assembly, DitherWorld, and the charts. */
const BELOW_THE_FOLD = [
  /^packages\/dither-kit\/src\/engine\/(world[\w-]*|models|splats|assemble)\.ts$/,
  /^packages\/dither-kit\/src\/engine\/models\//,
  /^packages\/dither-kit\/src\/solid\/(DitherWorld\.tsx|area-chart\.ts|runtime\/chart-context\.ts)$/,
]

/** The heavy modules a page's first load carries, as `<chunk>: <module>`,
 * read by what each chunk holds, never by its name. */
function heavyIn(files: string[], chunks: Chunks, heavy: RegExp[]): string[] {
  return files.flatMap((f) => (chunks[f] ?? []).filter((m) => heavy.some((h) => h.test(m))).map((m) => `${f}: ${m}`))
}

const gzipKB = (files: string[]) =>
  files.reduce((n, f) => n + gzipSync(readFileSync(join(OUT, f)), { level: 9 }).length, 0) / 1024

describe.skipIf(!existsSync(join(OUT, "index.html")))("a page's first load", () => {
  for (const [page, budget] of Object.entries(BUDGET_KB))
    it(`${page} starts with at most ${budget} KB of gzipped script`, () => {
      const files = firstLoad(page)
      expect(files.length).toBeGreaterThan(1)
      expect(gzipKB(files)).toBeLessThanOrEqual(budget)
    })

  it("holds neither the other page nor the kit's heavy engines", () => {
    // the build's own record: each route's chunk (Vite's manifest) and the
    // modules in every chunk (`build/chunk-modules.ts`)
    const manifest: Record<string, { file: string }> = JSON.parse(
      readFileSync(join(OUT, ".vite/manifest.json"), "utf8"),
    )
    const chunks: Chunks = JSON.parse(readFileSync(join(OUT, CHUNK_MODULES), "utf8"))
    const route = (path: string) =>
      Object.entries(manifest).find(([src]) => src.startsWith(`src/routes/${path}?pick=default`))![1].file
    const landing = firstLoad("index.html")
    const docs = firstLoad("docs/button/index.html")
    expect(landing).not.toContain(route("docs/[section].tsx"))
    expect(docs).not.toContain(route("index.tsx"))
    // every chunk a first load runs is in the record
    expect([...landing, ...docs].filter((f) => !chunks[f])).toEqual([])
    expect(heavyIn(landing, chunks, [...DOCS_ONLY, ...BELOW_THE_FOLD])).toEqual([])
    expect(heavyIn(docs, chunks, BELOW_THE_FOLD)).toEqual([])
  })
})

describe("the first load's guard", () => {
  // The kit's world engine split into files of their own (world-math,
  // world-scene, ...): a chunk Rollup names after one of them carries the
  // engine all the same, and a guard by the chunk's name let it through.
  const chunks: Chunks = {
    "_build/assets/index-a1.js": ["packages/site/src/entry-client.tsx"],
    "_build/assets/world-math-b2.js": [
      "packages/dither-kit/src/engine/world-math.ts",
      "packages/dither-kit/src/engine/world.ts",
    ],
    "_build/assets/obj-c3.js": ["packages/dither-kit/src/engine/models/obj.ts"],
  }

  it("finds a heavy module in a chunk named after another", () => {
    expect(heavyIn(Object.keys(chunks), chunks, BELOW_THE_FOLD)).toEqual([
      "_build/assets/world-math-b2.js: packages/dither-kit/src/engine/world-math.ts",
      "_build/assets/world-math-b2.js: packages/dither-kit/src/engine/world.ts",
      "_build/assets/obj-c3.js: packages/dither-kit/src/engine/models/obj.ts",
    ])
    expect(heavyIn(["_build/assets/index-a1.js"], chunks, BELOW_THE_FOLD)).toEqual([])
  })
})
