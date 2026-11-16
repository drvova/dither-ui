// Every built page, read from its bytes as a screen reader reads it, by the
// walk's own audit (`@dither-ui/tasks/walk-checks`, `auditA11y`): each
// operable element named, ids once and every reference standing, one h1 and
// no level skipped inside main, one main and every landmark of a kind there
// are several of named. The walk holds the same rules over the pages as they
// run, demos and dialogs included (`npm run walk`); this holds what the
// prerender prints, in the gate. And what a reader without a script sees:
// no art the bytes print is masked shut until a script reveals it (a
// reveal's hidden mask is its stylesheet's, under `scripting: enabled`),
// and every chart's print is in the page, styled, its large cell images
// files beside it rather than its markup. Checked when a build stands.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { auditA11y } from "@dither-ui/tasks/walk-checks"

const OUT = join(__dirname, "../../.output/public")
const RULES = ["names", "ids", "refs", "headings", "landmarks", "images"] as const

/** The site's pages, the player and the first section of each docs family
 * (the sections share their shell; a family shares its parts). */
function pages(): string[] {
  const sections = JSON.parse(readFileSync(join(OUT, "og/sections.json"), "utf8")) as { id: string; group: string }[]
  const firsts = [...new Map(sections.map((s) => [s.group, s.id] as const).reverse()).values()]
  return [
    "index.html",
    "docs/index.html",
    "studio/index.html",
    "play/index.html",
    "404.html",
    ...firsts.map((id) => `docs/${id}/index.html`),
  ]
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe.skipIf(!existsSync(join(OUT, "index.html")))("every built page, as a screen reader reads it", () => {
  it("names what it offers, holds its ids once, outlines its headings and names its landmarks", () => {
    const found: string[] = []
    const list = pages()
    for (const file of list) {
      const html = readFileSync(join(OUT, file), "utf8")
      document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML
      const read = auditA11y(document)
      for (const rule of RULES) for (const f of read[rule]) found.push(`${file} ${rule}: ${f}`)
    }
    expect(found).toEqual([])
  }, 60_000)
})

/** A chart print's data URI past this many bytes is a file beside the page
 * (`@dither-ui/tasks`' `bakePrints`, `INLINE_BYTES`). */
const INLINE_BYTES = 1536

describe.skipIf(!existsSync(join(OUT, "index.html")))("every built page, read without a script", () => {
  it("prints no art masked shut, and every chart's print styled, its large images beside the page", () => {
    const found: string[] = []
    for (const file of pages()) {
      const doc = new DOMParser().parseFromString(readFileSync(join(OUT, file), "utf8"), "text/html")
      for (const el of doc.querySelectorAll<HTMLElement>("[style*='mask']")) {
        const style = el.getAttribute("style") ?? ""
        if (el.getAttribute("data-reveal") === "hidden" || /width%3D%221%22%20height%3D%221%22/.test(style))
          found.push(`${file}: <${el.localName} class="${el.className}"> masked shut in the bytes`)
      }
      const charts = [...doc.querySelectorAll("svg.dk-chart")]
      if (charts.length && !doc.querySelector("link[rel=stylesheet][href*='chart']"))
        found.push(`${file}: ${charts.length} charts and no chart stylesheet linked`)
      for (const chart of charts)
        if (!chart.querySelector(".dk-chart-print image, .dk-chart-print path, image[aria-hidden]"))
          found.push(`${file}: a chart with no print (${chart.getAttribute("aria-label")})`)
      for (const image of doc.querySelectorAll("image[data-dk-print]")) {
        const href = image.getAttribute("href") ?? ""
        if (href.startsWith("data:") && ((href.length - 22) * 3) / 4 > INLINE_BYTES)
          found.push(`${file}: a chart print of ${href.length} bytes in the markup`)
      }
    }
    expect(found).toEqual([])
  }, 60_000)
})
