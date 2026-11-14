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
    // the build's own record: each chunk's name (its first module's) and
    // each route's chunk
    const manifest: Record<string, { file: string; name?: string }> = JSON.parse(
      readFileSync(join(OUT, ".vite/manifest.json"), "utf8"),
    )
    const chunks = Object.entries(manifest)
    const route = (path: string) => chunks.find(([src]) => src.startsWith(`src/routes/${path}?pick=default`))![1].file
    const named = (files: string[]) => files.map((f) => chunks.find(([, c]) => c.file === f)?.[1].name ?? f)
    const landing = firstLoad("index.html")
    const docs = firstLoad("docs/button/index.html")
    expect(landing).not.toContain(route("docs/[section].tsx"))
    expect(named(landing).filter((n) => ["DocsPage", "DemoCard", "restyle", "pack-loaders"].includes(n))).toEqual([])
    expect(docs).not.toContain(route("index.tsx"))
    for (const files of [landing, docs])
      expect(
        named(files).filter((n) => ["models", "world", "DitherWorld", "chart-context", "area-chart"].includes(n)),
      ).toEqual([])
  })
})
