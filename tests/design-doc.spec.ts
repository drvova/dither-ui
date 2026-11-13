// DESIGN.md, the look in one readable place, states values that live in
// the code. Each is read here from its source and must appear in the doc as
// it is, so the doc cannot drift: a design change touches both.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { GLIDE_BEZIER } from "@dither-ui/kit/engine/dither-paint.ts"
import { FRAME_BUDGET_MS } from "@dither-ui/kit/engine/frame-budget.ts"

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const doc = read("DESIGN.md")

/** The custom properties a CSS block declares, from its selector line. */
function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block`)
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

describe("DESIGN.md", () => {
  it("names the one motion curve as the kit and the site define it", () => {
    const curve = `cubic-bezier(${GLIDE_BEZIER.join(", ")})`
    expect(doc).toContain(curve)
    expect(read("packages/site/src/app/styles.css")).toContain(`--ease-settle: ${curve};`)
  })

  it("gives the print's ground, inks and placeholder as the landing sets them", () => {
    const print = block(
      read("packages/site/src/pages/landing/chapters.css"),
      ':root:is([data-page="landing"], [data-page="missing"])',
    )
    for (const token of ["--background", "--foreground", "--muted-foreground", "--placeholder"])
      expect(doc.toLowerCase(), token).toContain(`\`${print[token].toLowerCase()}\``)
  })

  it("gives the docs' hairline and card as the docs set them", () => {
    const docs = block(read("packages/site/src/app/styles.css"), ':root.dark[data-page="docs"]')
    for (const token of ["--border", "--card"]) expect(doc, token).toContain(`\`${docs[token]}\``)
  })

  it("gives the kit's dark swatches as the kit sets them", () => {
    const dark = block(read("packages/dither-kit/src/engine/theme.css"), ".dark")
    for (const name of ["green", "blue", "purple", "pink", "orange", "grey"])
      expect(doc, name).toContain(`\`${dark[`--swatch-${name}`]}\``)
  })

  it("gives the landing's page width, rhythm and header as the landing sets them", () => {
    const page = read("packages/site/src/pages/landing/LandingPage.css")
    for (const token of ["--page", "--rhythm", "--head"]) {
      const value = page.match(new RegExp(`${token}: ([^;]+);`))?.[1]
      expect(value, token).toBeTruthy()
      expect(doc, token).toContain(`\`${token}: ${value}\``)
    }
  })

  it("gives the section title's size as the landing sets it", () => {
    const title = read("packages/site/src/pages/landing/chapters.css").match(
      /\.landing \.section-title \{[^}]*font-size: ([^;]+);/,
    )?.[1]
    expect(title).toBeTruthy()
    expect(doc).toContain(`\`${title}\``)
  })

  it("gives the paint budget the runtime keeps", () => {
    expect(doc).toContain(`(${FRAME_BUDGET_MS}ms)`)
  })
})
