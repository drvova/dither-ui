// The kits' own source, served beside the site: what the docs' source panel
// shows, runs and zips is the file in this repo, never a copy kept by hand.
// `kit/src/solid/` holds the Solid kit as its files import each other (its
// layer under `solid/`, the engine under `engine/`, the Tailwind layer's
// framework-free modules under `tailwind/`), `kit/src/svelte/` the Svelte
// kit, and each a `files.json` listing them. Served in dev, emitted with the
// browser's assets in a build. The same URL contract as the Vue site's
// build (`kitSources` in `../rstack.config.ts`).
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Plugin } from "vite"
import { isKitSource } from "../src/shared/lib/kit-sources.ts"

// (the folder by name: a spec that imports this file is not a file URL)
const at = (path: string) => join(import.meta.dirname, "..", path)

/** Each flavor's folders in the repo: where it is read, the folder it is
 * served under, and whether its subfolders come too. */
const KITS = {
  solid: [
    { dir: "dither-kit/solid", under: "solid/", deep: true },
    { dir: "dither-kit/engine", under: "engine/", deep: true },
    { dir: "dither-kit/tailwind", under: "tailwind/", deep: false },
  ],
  svelte: [{ dir: "dither-kit-svelte", under: "", deep: true }],
} as const
export type KitFlavor = keyof typeof KITS

/** A flavor's sources: each one's served path (what `files.json` lists) and
 * where it is on disk. A folder taken without its subfolders gives its
 * framework-free modules only. */
export async function kitFiles(flavor: KitFlavor): Promise<{ file: string; path: string }[]> {
  const out: { file: string; path: string }[] = []
  for (const { dir, under, deep } of KITS[flavor]) {
    const names = (await readdir(at(dir), { recursive: deep }))
      .map((f) => f.split("\\").join("/"))
      .filter((f) => isKitSource(f) && (deep || f.endsWith(".ts")))
    for (const f of names) out.push({ file: `${under}${f}`, path: at(`${dir}/${f}`) })
  }
  return out.sort((a, b) => (a.file < b.file ? -1 : 1))
}

const FLAVORS = Object.keys(KITS) as KitFlavor[]
const TYPES: Record<string, string> = { css: "text/css", json: "application/json" }

export function kitSources(): Plugin {
  let base = "/"
  return {
    name: "kit-sources",
    // The kits sit beside this app: the dev server may read them.
    config: () => ({ server: { fs: { allow: [at("dither-kit"), at("dither-kit-svelte")] } } }),
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0]
        const m = url.startsWith(`${base}kit/src/`) ? /^([a-z]+)\/(.+)$/.exec(url.slice(base.length + 8)) : null
        const flavor = FLAVORS.find((f) => f === m?.[1])
        if (!m || !flavor) return next()
        const files = await kitFiles(flavor)
        const hit = files.find((f) => f.file === m[2])
        if (m[2] !== "files.json" && !hit) return next()
        res.setHeader("Content-Type", `${TYPES[m[2].split(".").pop()!] ?? "text/plain"}; charset=utf-8`)
        res.end(hit ? await readFile(hit.path, "utf8") : JSON.stringify(files.map((f) => f.file)))
      })
    },
    async generateBundle() {
      if (this.environment.name !== "client") return
      for (const flavor of FLAVORS) {
        const files = await kitFiles(flavor)
        for (const f of files)
          this.emitFile({
            type: "asset",
            fileName: `kit/src/${flavor}/${f.file}`,
            source: await readFile(f.path, "utf8"),
          })
        this.emitFile({
          type: "asset",
          fileName: `kit/src/${flavor}/files.json`,
          source: JSON.stringify(files.map((f) => f.file)),
        })
      }
    },
  }
}
