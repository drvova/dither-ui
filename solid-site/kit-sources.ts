// The kit's own source, served beside the site: what the docs' source panel
// shows, runs and zips is the file in this repo, never a copy kept by hand.
// `KIT_SRC` holds the kit as its files import each other (its Solid layer
// under `solid/`, the engine under `engine/`, the Tailwind layer's
// framework-free modules under `tailwind/`) and a `files.json` listing
// them. Served in dev, emitted with the browser's assets in a build.
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Plugin } from "vite"
import { isKitSource, KIT_SRC } from "../src/shared/lib/kit-sources.ts"

// (the folder by name: a spec that imports this file is not a file URL)
const at = (path: string) => join(import.meta.dirname, "..", path)

/** The kit's folders in the repo: where each is read, the folder it is
 * served under, and whether its subfolders come too. */
const FOLDERS = [
  { dir: "dither-kit/solid", under: "solid/", deep: true },
  { dir: "dither-kit/engine", under: "engine/", deep: true },
  { dir: "dither-kit/tailwind", under: "tailwind/", deep: false },
] as const

/** The kit's sources: each one's served path (what `files.json` lists) and
 * where it is on disk. A folder taken without its subfolders gives its
 * framework-free modules only. */
export async function kitFiles(): Promise<{ file: string; path: string }[]> {
  const out: { file: string; path: string }[] = []
  for (const { dir, under, deep } of FOLDERS) {
    const names = (await readdir(at(dir), { recursive: deep }))
      .map((f) => f.split("\\").join("/"))
      .filter((f) => isKitSource(f) && (deep || f.endsWith(".ts")))
    for (const f of names) out.push({ file: `${under}${f}`, path: at(`${dir}/${f}`) })
  }
  return out.sort((a, b) => (a.file < b.file ? -1 : 1))
}

const TYPES: Record<string, string> = { css: "text/css", json: "application/json" }

export function kitSources(): Plugin {
  let base = "/"
  return {
    name: "kit-sources",
    // before the app's own handler, which would answer a dev request with its 404
    enforce: "pre",
    // The kit sits beside this app: the dev server may read it.
    config: () => ({ server: { fs: { allow: [at("dither-kit")] } } }),
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0]
        if (!url.startsWith(`${base}${KIT_SRC}`)) return next()
        const file = url.slice(base.length + KIT_SRC.length)
        const files = await kitFiles()
        const hit = files.find((f) => f.file === file)
        if (file !== "files.json" && !hit) return next()
        res.setHeader("Content-Type", `${TYPES[file.split(".").pop()!] ?? "text/plain"}; charset=utf-8`)
        res.end(hit ? await readFile(hit.path, "utf8") : JSON.stringify(files.map((f) => f.file)))
      })
    },
    async generateBundle() {
      if (this.environment.name !== "client") return
      const files = await kitFiles()
      for (const f of files)
        this.emitFile({ type: "asset", fileName: `${KIT_SRC}${f.file}`, source: await readFile(f.path, "utf8") })
      this.emitFile({
        type: "asset",
        fileName: `${KIT_SRC}files.json`,
        source: JSON.stringify(files.map((f) => f.file)),
      })
    },
  }
}
