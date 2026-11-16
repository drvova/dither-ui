// What each browser chunk of the build is made of: `.vite/chunks.json` beside
// Vite's manifest, every chunk's file and the source modules Rollup put in
// it (paths from the repository's root, sorted). A chunk is named after one
// of its modules, so a check by name misses a module that lands in a chunk
// named after another; the first-load budget
// (`tests/site/budget.spec.ts`) reads this record instead.
import { relative, resolve } from "node:path"
import type { Plugin } from "vite"

/** The record's path in the browser's output. */
export const CHUNK_MODULES = ".vite/chunks.json"

/** Every chunk's source modules: Rollup's ids, a virtual module's kept as
 * it is named, a query taken off. */
export function chunkModules(): Plugin {
  return {
    name: "dither-chunk-modules",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    generateBundle(_, bundle) {
      const chunks: Record<string, string[]> = {}
      // the repository's root, two folders over the site's
      const repo = resolve(this.environment.config.root, "../..")
      const source = (id: string) => (id.startsWith("/") ? relative(repo, id.split("?")[0]) : id.replace(/^\0/, ""))
      for (const file of Object.values(bundle).sort((a, b) => a.fileName.localeCompare(b.fileName)))
        if (file.type === "chunk") chunks[file.fileName] = [...new Set(file.moduleIds.map(source))].sort()
      this.emitFile({ type: "asset", fileName: CHUNK_MODULES, source: JSON.stringify(chunks) })
    },
  }
}
