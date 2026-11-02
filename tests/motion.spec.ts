// Apple motion everywhere (the user's call): one smooth spring eases every
// transition and every driven wipe on the site. The kit's spring is the
// source; each stylesheet's `linear()` copy is that function, its fallback
// bezier stays close to it, the kit's "spring" easing is it, and no
// hand-written curve or linear wipe is left in the site's own motion.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { resolveEasing } from "../dither-kit/engine/dither-paint"
import { SPRING_BEZIER, spring, springLinear } from "../dither-kit/engine/spring"
import { cubicBezier } from "../dither-kit/engine/dither-paint"
import { SHEET_WIPE } from "../src/widgets/site-header/menu"

const root = new URL("..", import.meta.url).pathname
const read = (p: string) => readFileSync(join(root, p), "utf8")

/** The site's own motion: its stylesheets, pages and widgets (the docs'
 * content and the Studio's easing editor teach curves; they are not motion). */
const MOTION_ROOTS = ["src/app", "src/pages/landing", "src/widgets/site-header", "svelte-site/src/landing"]
const MOTION_FILES = [
  "src/pages/docs/DocsNav.vue",
  "src/pages/docs/DocsSheet.vue",
  "src/pages/studio/StudioPage.vue",
  "src/widgets/toolbar/Toolbar.vue",
]

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(join(root, dir))) {
    const path = join(dir, name)
    if (statSync(join(root, path)).isDirectory()) yield* files(path)
    else if (/\.(vue|svelte|css|ts)$/.test(name)) yield path
  }
}

describe("the spring", () => {
  it("starts from rest, lands on its mark and never passes it", () => {
    expect(spring(0)).toBe(0)
    expect(spring(1)).toBe(1)
    expect(spring(0.02)).toBeLessThan(0.03)
    let last = 0
    for (let i = 1; i <= 200; i++) {
      const v = spring(i / 200)
      expect(v).toBeGreaterThanOrEqual(last)
      expect(v).toBeLessThanOrEqual(1)
      last = v
    }
  })

  it("is the kit's spring easing, and its fallback bezier stays within 3.5% of it", () => {
    expect(resolveEasing("spring")).toBe(spring)
    const bezier = cubicBezier(...SPRING_BEZIER)
    for (let i = 0; i <= 50; i++) expect(Math.abs(bezier(i / 50) - spring(i / 50))).toBeLessThan(0.035)
  })

  it("is what both sites' stylesheets carry, the bezier where linear() is not supported", () => {
    for (const sheet of ["src/app/styles.css", "svelte-site/src/landing/landing.css"]) {
      // Whitespace aside: the formatter wraps the long value.
      const css = read(sheet).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/,? \)/g, ")")
      expect(css).toContain(`--ease-settle: ${springLinear()};`)
      expect(css).toContain(`--ease-settle: cubic-bezier(${SPRING_BEZIER.join(", ")});`)
      // The linear() copy comes after the fallback, so it wins where supported.
      expect(css.indexOf("--ease-settle: linear(")).toBeGreaterThan(css.indexOf("--ease-settle: cubic-bezier("))
    }
    expect(read("src/app/styles.css")).toContain("--default-transition-timing-function: var(--ease-settle);")
  })

  it("moves everything on the site: no hand-written curve, no linear wipe", () => {
    const off: string[] = []
    for (const file of [...MOTION_ROOTS.flatMap((d) => [...files(d)]), ...MOTION_FILES]) {
      const text = read(file)
      for (const m of text.matchAll(/cubic-bezier\(([^)]*)\)/g))
        if (m[1] !== SPRING_BEZIER.join(", ")) off.push(`${file}: ${m[0]}`)
      for (const m of text.matchAll(/easing(?:=|: )"linear"/g)) off.push(`${file}: ${m[0]}`)
    }
    expect(off).toEqual([])
    expect(SHEET_WIPE.easing).toBe("spring")
  })
})
