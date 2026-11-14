/**
 * The kit's browser benchmark: real Solid components mounted in Chromium,
 * and the gradient's two painters side by side. It bundles
 * `browser-bench-page.tsx` in memory (Solid's production build, nothing
 * written), serves it to a headless Chromium with the kit's standalone
 * stylesheet, and prints the tables the README carries with the machine
 * they were measured on.
 *
 * Run: npm run bench:browser -w @dither-ui/kit
 *      (node packages/dither-kit/benches/browser-bench.mts [stylesheet])
 *
 * The stylesheet is the built `kit/dither-kit.css`: by default the site
 * build's, else the one `npm run build:css` writes to a path you give.
 * Chromium is `CHROME_PATH` or the one playwright-core finds.
 */
import { existsSync, readFileSync } from "node:fs"
import { cpus } from "node:os"
import { join } from "node:path"
import { chromium } from "playwright-core"
import { build } from "vite"
import solid from "vite-plugin-solid"
import type { MountRow, PainterRow } from "./browser-bench-page"

const HERE = import.meta.dirname
const ORIGIN = "https://dither-bench.test"
const MOUNT_RUNS = 3
const MOUNT_BATCHES = 5
const PAINTER_RUNS = 5

const stylesheet = process.argv[2] ?? join(HERE, "../../site/.output/public/kit/dither-kit.css")
if (!existsSync(stylesheet)) {
  console.error(`No kit stylesheet at ${stylesheet}: build the site, or run npm run build:css and pass its path.`)
  process.exit(1)
}

const built = await build({
  configFile: false,
  root: HERE,
  logLevel: "error",
  plugins: [solid()],
  build: { write: false, lib: { entry: join(HERE, "browser-bench-page.tsx"), formats: ["es"], fileName: "page" } },
})
const script = [built]
  .flat()
  .flatMap((result) => ("output" in result ? result.output : []))
  .find((file) => file.type === "chunk" && file.isEntry)
if (script?.type !== "chunk") throw new Error("The benchmark page did not bundle")

const PAGE = `<!doctype html><html class="dark"><head><meta charset="utf-8"><link rel="stylesheet" href="/kit.css"></head>
<body style="margin:20px;background:#101012"><div id="stage" class="dither-kit" style="position:relative;width:960px;min-height:120px;overflow:hidden"></div>
<script type="module" src="/page.js"></script></body></html>`
// Cross-origin isolated, so the page's clock reads to 5 microseconds
// instead of 100.
const ISOLATED = { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }
const FILES: Record<string, { contentType: string; body: string }> = {
  "/": { contentType: "text/html", body: PAGE },
  "/page.js": { contentType: "text/javascript", body: script.code },
  "/kit.css": { contentType: "text/css", body: readFileSync(stylesheet, "utf8") },
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
await context.route(`${ORIGIN}/**`, (route) => {
  const file = FILES[new URL(route.request().url()).pathname]
  return file ? route.fulfill({ ...file, headers: ISOLATED }) : route.fulfill({ status: 404, body: "" })
})

/** A fresh page with the benchmark loaded. */
async function open() {
  const page = await context.newPage()
  page.on("pageerror", (error) => {
    throw error
  })
  await page.goto(`${ORIGIN}/`)
  await page.waitForFunction(() => "ditherBench" in window)
  return page
}

const mountPage = await open()
const renderer = await mountPage.evaluate(() => window.ditherBench.renderer())
const isolated = await mountPage.evaluate(() => crossOriginIsolated)
const mountRuns: MountRow[][] = await mountPage.evaluate(
  ([runs, batches]) => window.ditherBench.mounts(runs, batches),
  [MOUNT_RUNS, MOUNT_BATCHES],
)
await mountPage.close()

// Each painter run in a page of its own, so the runs are independent.
const painterRuns: PainterRow[][] = []
for (let run = 0; run < PAINTER_RUNS; run++) {
  const page = await open()
  painterRuns.push(await page.evaluate(() => window.ditherBench.painters()))
  await page.close()
}
const version = browser.version()
await browser.close()

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const ms = (value: number, digits = 2) => `${value.toFixed(digits)} ms`

console.log(`Chromium ${version} (headless), renderer: ${renderer}, clock ${isolated ? "5" : "100"} microseconds`)
console.log(`Node ${process.version}, ${cpus().length} x ${cpus()[0]?.model.trim()}`)

console.log(`\nMounts: 3 warmups, mean of ${MOUNT_RUNS} runs x ${MOUNT_BATCHES} batches\n`)
console.log("| Operation | Compute | Full (RAF incl.) | Notes |\n| --- | ---: | ---: | --- |")
mountRuns[0].forEach((row, i) => {
  const runs = mountRuns.map((run) => run[i])
  const unpainted = runs.every((r) => r.painted) ? "" : " (some samples did not paint)"
  const compute = mean(runs.map((r) => r.compute.mean))
  const full = mean(runs.map((r) => r.full.mean))
  console.log(`| ${row.name} | ${ms(compute)} | ${ms(full, 1)} | ${row.notes}${unpainted} |`)
})

console.log(`\nPainters: median of ${PAINTER_RUNS} independent runs, each 6 batches x 2 repetitions\n`)
console.log(
  "| Painter | Mean | Median | p95 | Canvas calls | RGBA allocations |\n| --- | ---: | ---: | ---: | ---: | ---: |",
)
const across = painterRuns[0].map((row, i) => {
  const runs = painterRuns.map((run) => run[i])
  return {
    ...row,
    mean: median(runs.map((r) => r.mean)),
    median: median(runs.map((r) => r.median)),
    p95: median(runs.map((r) => r.p95)),
  }
})
for (const row of across)
  console.log(
    `| ${row.name} | ${ms(row.mean)} | ${ms(row.median)} | ${ms(row.p95)} | ${row.calls.toLocaleString("en-US")} | ${row.allocations} |`,
  )
const [legacy, raster] = across
console.log(
  `\nGradient: ${(legacy.mean / raster.mean).toFixed(1)}x speedup, ${((1 - raster.mean / legacy.mean) * 100).toFixed(1)}% lower`,
)

console.log("\n| Run | Legacy mean | Legacy median | Legacy p95 | Raster mean | Raster median | Raster p95 |")
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |")
painterRuns.forEach(([l, r], i) =>
  console.log(
    `| ${i + 1} | ${ms(l.mean)} | ${ms(l.median)} | ${ms(l.p95)} | ${ms(r.mean)} | ${ms(r.median)} | ${ms(r.p95)} |`,
  ),
)
