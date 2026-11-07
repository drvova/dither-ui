// The glide everywhere (the user's call): one curve eases every transition
// and every driven wipe on the site, full speed from the first frame and a
// long soft settle, never past its mark. The kit's "glide" easing is the
// source (`GLIDE_BEZIER`); both stylesheets carry that bezier, and no other
// curve or linear wipe is left in the site's own motion. The kit's spring
// stays the kit's (its "spring" easing), held here too.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { GLIDE_BEZIER, glide, resolveEasing } from "../dither-kit/engine/dither-paint"
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
  "src/shared/lib/rise.ts",
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

  it("has its linear() copy for a kit user's stylesheet", () => {
    expect(springLinear()).toMatch(/^linear\(0, .*, 1\)$/)
  })
})

describe("the glide", () => {
  it("leaves at full speed, lands on its mark and never passes it", () => {
    expect(glide(0)).toBe(0)
    expect(Math.abs(glide(1) - 1)).toBeLessThan(1e-6)
    // decisive: a tenth of the time covers more than a third of the way
    expect(glide(0.1)).toBeGreaterThan(0.33)
    // the spring, from rest, has covered under a quarter by then
    expect(glide(0.1)).toBeGreaterThan(spring(0.1) * 1.6)
    let last = 0
    for (let i = 1; i <= 200; i++) {
      const v = glide(i / 200)
      expect(v).toBeGreaterThanOrEqual(last - 1e-9)
      expect(v).toBeLessThanOrEqual(1 + 1e-6)
      last = v
    }
    expect(resolveEasing("glide")).toBe(resolveEasing("glide"))
    expect(resolveEasing("glide")(0.5)).toBeCloseTo(glide(0.5))
  })

  it("is what both sites' stylesheets carry", () => {
    for (const sheet of ["src/app/styles.css", "svelte-site/src/landing/landing.css"]) {
      const css = read(sheet)
      expect(css).toContain(`--ease-settle: cubic-bezier(${GLIDE_BEZIER.join(", ")});`)
      expect(css).not.toContain("--ease-settle: linear(")
    }
    expect(read("src/app/styles.css")).toContain("--default-transition-timing-function: var(--ease-settle);")
  })

  it("carries an in-page link on both landings, and never under reduced motion", () => {
    const rule = `@media (prefers-reduced-motion: no-preference) {
  html:has(.landing) {
    scroll-behavior: smooth;
  }
}`
    for (const sheet of ["src/pages/landing/chapters.css", "svelte-site/src/landing/landing.css"]) {
      const css = read(sheet)
      expect(css).toContain(rule)
      expect(css.match(/scroll-behavior/g)).toHaveLength(1)
    }
    expect(read("src/app/styles.css")).not.toContain("scroll-behavior")
  })

  it("moves everything on the site: no other curve, no linear wipe", () => {
    const off: string[] = []
    for (const file of [...MOTION_ROOTS.flatMap((d) => [...files(d)]), ...MOTION_FILES]) {
      const text = read(file)
      // a curve written out, or the glide's own (`GLIDE_BEZIER` joined in)
      for (const m of text.matchAll(/cubic-bezier\((\$\{GLIDE_BEZIER\.join\(", "\)\}|[^)]*)\)/g))
        if (m[1] !== GLIDE_BEZIER.join(", ") && !m[1].startsWith("${GLIDE_BEZIER")) off.push(`${file}: ${m[0]}`)
      for (const m of text.matchAll(/easing(?:=|: )"(linear|spring)"/g)) off.push(`${file}: ${m[0]}`)
    }
    expect(off).toEqual([])
    expect(SHEET_WIPE.easing).toBe("glide")
  })
})
