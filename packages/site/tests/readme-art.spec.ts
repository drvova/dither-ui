// The README's banner (`.github/readme/brand.svg`) is generated: the hero's
// moment (`choreograph` with the hero's staging, on the landing's 4px grid)
// written as an SVG by `@dither-ui/tasks`'s `brandSvg`, in the install
// surface's inks. This spec writes it (`npm run readme:art`, which is
// `npx rs test -u` on this file) and fails while the committed file differs
// from what the brand's cells give, so the banner never drifts from the
// brand.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { brandSvg, type BrandArt } from "@dither-ui/tasks"
import { choreograph, LOCKUP, LOCKUP_SIZE, MOMENT, STAGINGS } from "../src/pages/landing/brand"
import { INSTALL_INK } from "../src/app/install-files"

/** The landing's grid, the field in its cells and the size a cell is drawn. */
const CELL = 4
const FIELD = { width: 120, height: 40 }
const SCALE = 8
const FILE = "../../../.github/readme/brand.svg"

function art(): BrandArt {
  const box = { width: FIELD.width * CELL, height: FIELD.height * CELL }
  const home = { x: Math.floor((FIELD.width - LOCKUP_SIZE.width) / 2), y: 14 }
  const slots = LOCKUP.map((c) => ({ x: (home.x + c.x) * CELL, y: (home.y + c.y) * CELL }))
  const paths = choreograph(STAGINGS.hero(box.height, home.y * CELL), box, slots, CELL)
  return {
    size: FIELD,
    scale: SCALE,
    end: MOMENT.end,
    inks: INSTALL_INK,
    label: "dither-ui: the brand's diamond and wordmark forming cell by cell out of the open field",
    cells: LOCKUP.map((c, i) => ({
      x: home.x + c.x,
      y: home.y + c.y,
      core: c.core,
      path: paths[i].map((p) => ({ t: p.t, x: p.x / CELL, y: p.y / CELL })),
    })),
  }
}

describe("the README's banner", () => {
  it("plays the hero's moment on whole cells inside the field", () => {
    const { cells, size } = art()
    for (const c of cells)
      for (const p of c.path) {
        expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true)
        expect(p.x >= 0 && p.x < size.width && p.y >= 0 && p.y < size.height).toBe(true)
      }
    expect(cells.every((c) => c.path.at(-1)?.x === c.x && c.path.at(-1)?.y === c.y)).toBe(true)
  })

  it("settles under reduced motion and draws the brand at rest as merged runs", () => {
    const svg = brandSvg(art())
    expect(svg).toContain("@media (prefers-reduced-motion:reduce){*{animation:none!important}}")
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).not.toMatch(/<script/)
  })

  it("is the committed file", async () => {
    await expect(brandSvg(art())).toMatchFileSnapshot(FILE)
  })

  it("is the README's banner", () => {
    const readme = readFileSync(new URL("../../../README.md", import.meta.url), "utf8")
    expect(readme).toContain("(.github/readme/brand.svg)")
  })
})
