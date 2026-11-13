// The files the build writes beside the pages, each from the source the app
// itself reads, none kept by hand in `public/`: the crawler files
// (`sitemap.xml`, `robots.txt`, `llms.txt`), the share cards' section
// manifest and each card's Discord component embed and oEmbed photo, the
// install surface (the Studio's manifest and every icon, drawn from the
// brand mark), the mascot's capture the docs' World section prints, and the
// bridge at the path the Studio's setup line fetches. Served in dev,
// emitted with the browser's assets in a build.
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import type { Plugin } from "vite"
import { installFiles } from "../src/app/install-files.ts"
import { BRIDGE_FILE } from "../src/features/agent/bridge-file.ts"
import * as crawl from "../src/pages/docs/crawler-files.ts"
import { CAPTURE_PATH, mascotCapture } from "../src/shared/ui/mascot-capture.ts"

/** The bridge as its own package exports it. */
const BRIDGE_SOURCE = createRequire(import.meta.url).resolve("bridge/dither-bridge.mjs")

/** Every file, by its path in the build. */
export async function siteFileList(): Promise<Record<string, string | Uint8Array>> {
  const files: Record<string, string | Uint8Array> = {
    "sitemap.xml": crawl.sitemapXml(),
    "robots.txt": crawl.robotsTxt(),
    "llms.txt": crawl.llmsTxt(),
    "og/sections.json": crawl.sectionsManifest(),
    ...installFiles(),
    [CAPTURE_PATH]: mascotCapture(),
    // As written, never minified: a file people run on their own machine
    // stays readable.
    [BRIDGE_FILE]: await readFile(BRIDGE_SOURCE, "utf8"),
  }
  for (const card of crawl.shareCards()) {
    files[`embed/${card.id}.json`] = crawl.componentEmbed(card)
    files[`oembed/${card.id}.json`] = crawl.oembed(card)
  }
  return files
}

const TYPES: Record<string, string> = {
  xml: "application/xml",
  txt: "text/plain; charset=utf-8",
  json: "application/json",
  webmanifest: "application/manifest+json",
  svg: "image/svg+xml",
  png: "image/png",
  mjs: "text/javascript",
}

export function siteFiles(): Plugin {
  let base = "/"
  return {
    name: "site-files",
    // ahead of the app's own handler, which answers every address in dev
    enforce: "pre",
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0]
        const body = url.startsWith(base) ? (await siteFileList())[url.slice(base.length)] : undefined
        if (body === undefined) return next()
        res.setHeader("Content-Type", TYPES[url.split(".").pop()!] ?? "application/octet-stream")
        res.end(body)
      })
    },
    async generateBundle() {
      if (this.environment.name !== "client") return
      for (const [fileName, source] of Object.entries(await siteFileList()))
        this.emitFile({ type: "asset", fileName, source })
    },
  }
}
