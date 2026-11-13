// The two scripts the site ships that stand alone, each one classic file
// built on its own beside the client's chunks (the same files, at the same
// paths, as the `sw` and `player` environments of `../rstack.config.ts`):
//
// `sw.js`, the Studio's service worker (`../src/app/sw.ts`, the rules of
// `../src/app/offline.ts`), with the list of what the Studio loads drawn
// from this build's own chunks: the page's HTML names only what it
// preloads, and the Studio imports the rest as it runs.
//
// `play/player.js` and `play/player.css`, the player (`src/pages/play`) as
// one script and one stylesheet, every asset a data URI: a HyperFrames
// composition the Studio exports carries them inline and renders with no
// network. The `/play/` route serves the same player as a page.
import { join } from "node:path"
import type { Plugin, PluginOption } from "vite"
import { KEEP_DEFINE, OFFLINE } from "../src/app/offline.ts"

// (the folder by name: a spec that imports this file is not a file URL)
const at = (path: string) => join(import.meta.dirname, path)

/** The player's page, a real file of the build like every other route
 * (nothing links to it, so the prerender is told). */
export const PLAYER_ROUTE = "/play"

/** What of a built chunk the Studio's list reads. */
export type BuiltChunk = {
  fileName: string
  isEntry: boolean
  moduleIds: string[]
  imports: string[]
  dynamicImports: string[]
  /** The stylesheets and files (fonts, images) the chunk brings. */
  assets: string[]
}

/** The files the Studio needs to open and work with no network: the
 * client's entry with what it imports outright (its own lazy imports are
 * the other pages), and the Studio's route with everything it reaches,
 * lazily or not. `route` ends the route's module id. */
export function studioFiles(chunks: BuiltChunk[], route: string): string[] {
  const byName = new Map(chunks.map((c) => [c.fileName, c]))
  const kept = new Set<string>()
  const walk = (name: string, lazy: boolean) => {
    const chunk = byName.get(name)
    if (!chunk || kept.has(name)) return
    kept.add(name)
    for (const asset of chunk.assets) kept.add(asset)
    for (const next of chunk.imports) walk(next, lazy)
    if (lazy) for (const next of chunk.dynamicImports) walk(next, lazy)
  }
  const studio = chunks.filter((c) => c.moduleIds.some((id) => id.split("?")[0].endsWith(route)))
  if (!studio.length) throw new Error(`No built chunk holds the Studio's route (${route}).`)
  for (const chunk of chunks) if (chunk.isEntry) walk(chunk.fileName, false)
  for (const chunk of studio) walk(chunk.fileName, true)
  return [...kept].sort()
}

type Built = { fileName: string; body: string | Uint8Array }

/** One entry built alone into one classic script (and, when it has styles,
 * one stylesheet), nothing written: what came out, by file name. */
async function alone(options: {
  entry: string
  name: string
  base: string
  define?: Record<string, string>
  plugins?: PluginOption[]
}): Promise<Built[]> {
  // Loaded as a build asks: a spec reads this file's rules without them.
  const { build } = await import("vite")
  const { ALIASES, ONE_SOLID } = await import("./aliases.ts")
  const result = await build({
    configFile: false,
    root: at("."),
    base: options.base,
    publicDir: false,
    logLevel: "warn",
    define: options.define,
    plugins: options.plugins,
    resolve: { alias: ALIASES, dedupe: ONE_SOLID },
    build: {
      write: false,
      cssCodeSplit: false,
      // Every font and image rides in the file that asks for it.
      assetsInlineLimit: () => true,
      rollupOptions: {
        input: { [options.name]: options.entry },
        output: {
          format: "iife",
          entryFileNames: "[name].js",
          assetFileNames: `${options.name}[extname]`,
        },
      },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  return outputs.flatMap((o) =>
    "output" in o ? o.output.map((f) => ({ fileName: f.fileName, body: f.type === "chunk" ? f.code : f.source })) : [],
  )
}

/** The player's entry: the page's mount, called as the script loads. */
const PLAYER_ENTRY = "virtual:dither-player"
const PLAYER_SOURCE = `import { mountPlayer } from ${JSON.stringify(at("src/pages/play/main.ts"))}\nmountPlayer()\n`
const playerEntry = (): Plugin => ({
  name: "player-entry",
  resolveId: (id) => (id === PLAYER_ENTRY ? `\0${PLAYER_ENTRY}` : null),
  load: (id) => (id === `\0${PLAYER_ENTRY}` ? PLAYER_SOURCE : null),
})

export function standaloneScripts(): Plugin {
  let base = "/"
  return {
    name: "standalone-scripts",
    // After Vite has dropped the chunks that held only styles: the list
    // names files the build writes.
    enforce: "post",
    configResolved(config) {
      base = config.base
    },
    async generateBundle(_, bundle) {
      if (this.environment.name !== "client") return
      const chunks: BuiltChunk[] = Object.values(bundle).flatMap((f) =>
        f.type === "chunk"
          ? [
              {
                fileName: f.fileName,
                isEntry: f.isEntry,
                moduleIds: f.moduleIds,
                imports: f.imports,
                dynamicImports: f.dynamicImports,
                assets: [...(f.viteMetadata?.importedCss ?? []), ...(f.viteMetadata?.importedAssets ?? [])],
              },
            ]
          : [],
      )
      const keep = studioFiles(chunks, `/src/routes/${OFFLINE.app.replace(/\/$/, "")}.tsx`)
      const worker = await alone({
        entry: at("../src/app/sw.ts"),
        name: "sw",
        base,
        define: { [KEEP_DEFINE]: JSON.stringify(keep) },
      })
      for (const f of worker) this.emitFile({ type: "asset", fileName: f.fileName, source: f.body })

      const { default: solid } = await import("vite-plugin-solid")
      const { default: tailwindcss } = await import("@tailwindcss/vite")
      const { utilityMap } = await import("./utilities.ts")
      const player = await alone({
        entry: PLAYER_ENTRY,
        name: "player",
        base,
        plugins: [playerEntry(), solid(), tailwindcss(), utilityMap()],
      })
      // The script and the stylesheet only: a worker the kit would start
      // from a file beside it cannot ride inline, and the kit paints on
      // the page's own thread when none starts.
      for (const f of player)
        if (/^player\.(js|css)$/.test(f.fileName))
          this.emitFile({ type: "asset", fileName: `play/${f.fileName}`, source: f.body })
    },
  }
}
