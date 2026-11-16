// What the build makes once its pages stand (`npm run build`, after
// `vite build`), into the same `.output/public`: the share card renderer (og/index.html),
// every share card drawn in headless Chromium (og/<id>.png + .gif for the
// three routes and each docs section), each section's Discord embed saying
// its own lede, and the agent registry read off the mounted Studio
// (agent/registry.json), then each page's kit canvases baked into it (the
// frame the engine paints them, shown before any script). The pages
// themselves are SolidStart's. It needs a
// Chromium (`CHROME_PATH` or a standard install) and fails loudly without
// one, or when a card or the registry fails. Each card is kept in
// `node_modules/.cache/dither-ui/og/` under a hash of what it is drawn from
// (`cardKey` in the tasks' cards.ts), so a build that changed nothing a card
// shows copies it instead of drawing it. Every step prints its time.
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"
import {
  bakeFrames,
  bakePrintFiles,
  findChromium,
  listen,
  refineEmbed,
  renderOgCards,
  writeAgentRegistry,
} from "@dither-ui/tasks"
import { ROUTE_CARDS, sectionsManifest } from "../src/pages/docs/crawler-files.ts"
import { buildOgPage } from "./og-page.ts"

// The build's output, or the folder named on the command line (a copy of it).
const OUT = resolve(process.argv[2] ?? fileURLToPath(new URL("../.output/public", import.meta.url)))
const BASE = process.env.BASE_PATH ?? "/"
const CARD_CACHE = fileURLToPath(new URL("../../../node_modules/.cache/dither-ui/og", import.meta.url))
const BAKE_CACHE = fileURLToPath(new URL("../../../node_modules/.cache/dither-ui/bake", import.meta.url))

/** Runs one step of the post-build and prints how long it took. */
async function step(name, run) {
  const started = performance.now()
  const out = await run()
  console.log(`postbuild: ${name} ${((performance.now() - started) / 1000).toFixed(1)}s`)
  return out
}

if (!existsSync(join(OUT, "index.html"))) throw new Error(`postbuild: no pages in ${OUT} — run vite build first`)

// Before anything is drawn: a build with no browser stops here.
const executablePath = findChromium()

// The renderer and its data: the section manifest is the crawler plugin's
// file, written here from the same builder when a build has not made it.
await step("card renderer", () => buildOgPage(OUT))
const manifest = join(OUT, "og", "sections.json")
if (!existsSync(manifest)) await writeFile(manifest, sectionsManifest())
const sections = JSON.parse(await readFile(manifest, "utf8"))

const server = await listen(OUT, BASE)
const origin = server.origin + BASE.replace(/\/$/, "")
const browser = await chromium.launch({ executablePath })
try {
  const page = await browser.newPage()

  // Each section's lede: the first paragraph of its section on its own
  // page, as the build rendered it.
  await page.goto(`${origin}/og/index.html`, { waitUntil: "load" })
  const ledes = await step("section ledes", () =>
    page.evaluate(
      async ([root, ids]) => {
        const out = {}
        const parser = new DOMParser()
        const queue = [...ids]
        const work = async () => {
          for (let id = queue.shift(); id; id = queue.shift()) {
            const res = await fetch(`${root}/docs/${id}/index.html`)
            if (!res.ok) throw new Error(`no page for the section ${id}`)
            const doc = parser.parseFromString(await res.text(), "text/html")
            const section = [...doc.querySelectorAll(".docs-flow > section")].find((s) => s.id === id)
            const lede = section?.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? ""
            if (lede) out[id] = lede
          }
        }
        await Promise.all([1, 2, 3, 4, 5, 6].map(work))
        return out
      },
      [origin, sections.map((s) => s.id)],
    ),
  )
  // In the manifest's order, so the same build writes the same bytes.
  const ordered = Object.fromEntries(sections.filter((s) => ledes[s.id]).map((s) => [s.id, ledes[s.id]]))
  console.log(`og: read ${Object.keys(ordered).length}/${sections.length} section ledes`)

  await step("share cards", () => renderOgCards({ browser, origin, dist: OUT, ledes: ordered, cache: CARD_CACHE }))
  for (const id of [...ROUTE_CARDS.map((r) => r.id), ...sections.map((s) => s.id)])
    for (const ext of ["png", "gif"])
      if (!existsSync(join(OUT, "og", `${id}.${ext}`))) throw new Error(`og: no card og/${id}.${ext}`)

  let refined = 0
  for (const s of sections) if (await refineEmbed(OUT, s, ordered[s.id] ?? "")) refined++
  console.log(`embed: ${refined} section embeds say their own lede`)

  const components = await step("agent registry", async () => {
    await page.goto(`${origin}/studio/`, { waitUntil: "networkidle" })
    await page.waitForSelector("[data-artboard-surface]", { timeout: 30_000 })
    return writeAgentRegistry(page, OUT)
  })
  if (!components) throw new Error("agent: the mounted Studio exposed no registry")
  console.log(`agent: wrote ${components} components -> agent/registry.json`)

  // Last, once nothing else reads the pages: each page's kit canvases with
  // the frame the engine paints them, in the HTML (packages/tasks'
  // bake-frames.ts), kept by the page's bytes between builds.
  // First every page's chart prints, a pure rewrite (the Studio's and the
  // player's too): the PNG past 1.5 kB a file beside the pages.
  const pagesBuilt = [
    "index.html",
    "404.html",
    "docs/index.html",
    "studio/index.html",
    "play/index.html",
    ...sections.map((s) => `docs/${s.id}/index.html`),
  ]
  const prints = await step("chart prints", () => bakePrintFiles({ base: BASE, dist: OUT, pages: pagesBuilt }))
  const baked = await step("baked frames", () =>
    bakeFrames({
      browser,
      origin,
      base: BASE,
      dist: OUT,
      pages: ["index.html", "404.html", "docs/index.html", ...sections.map((s) => `docs/${s.id}/index.html`)],
      cache: BAKE_CACHE,
    }),
  )
  const sum = (k) => baked.reduce((s, p) => s + p[k], 0)
  console.log(
    `bake: ${baked.length} pages (${baked.filter((p) => p.cached).length} cached), ${sum("canvases")} canvases: ` +
      `${sum("settled")} settled, ${sum("first")} first frames, ${sum("live")} live, ${sum("refused")} refused; ` +
      `${prints} chart prints moved to files`,
  )
} finally {
  await browser.close()
  server.close()
}
