// Every built page, read from its bytes as a screen reader reads it, by the
// walk's own audit (`@dither-ui/tasks/walk-checks`, `auditA11y`): each
// operable element named, ids once and every reference standing, one h1 and
// no level skipped inside main, one main and every landmark of a kind there
// are several of named. The walk holds the same rules over the pages as they
// run, demos and dialogs included (`npm run walk`); this holds what the
// prerender prints, in the gate. Checked when a build stands.
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
