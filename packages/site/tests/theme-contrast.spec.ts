// The site's inks against every ground the docs and the Studio paint, in
// both themes, read from the stylesheets themselves: text at AA (4.5:1),
// the control edge and the focus ring at 3:1 (WCAG 1.4.11). The light
// theme's bone shells, smoke and pressed fills once took the muted ink, a
// field's hairline and the pressed ring under their floors.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { contrast, over, parseColor, type RGBA } from "@/shared/lib/inspect/color"
import { BAND_FLOOR, BAND_INK } from "../src/widgets/site-header/menu"

const root = new URL("../../..", import.meta.url).pathname
const kit = readFileSync(`${root}packages/dither-kit/src/engine/theme.css`, "utf8")
const site = readFileSync(`${root}packages/site/src/app/styles.css`, "utf8")
const landing = readFileSync(`${root}packages/site/src/pages/landing/chapters.css`, "utf8")

/** The custom properties declared in the stylesheet's `selector { ... }` block. */
function tokens(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block`)
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const LIGHT = { ...tokens(kit, ":root"), ...tokens(site, ":root"), ...tokens(site, ":root:not(.dark)") }
const DARK = { ...LIGHT, ...tokens(kit, ".dark"), ...tokens(site, ".dark") }

const colour = (value: string): RGBA => {
  const c = parseColor(value)
  if (!c) throw new Error(`not a colour: ${value}`)
  return c
}
const stops = (value: string): RGBA[] =>
  [...value.matchAll(/(?:rgba?|oklch|oklab)\([^)]*\)|#[0-9a-f]{3,8}\b/gi)].map((m) => colour(m[0]))
const mix = (ink: RGBA, amount: number, ground: RGBA): RGBA => over({ ...ink, a: amount }, ground)

/** Every opaque ground text or a control sits on in this theme: the page,
 * the card, each stop of the shell's material, the smoked polymer; with
 * `pressed`, also the pressed segment's fill in a track on each (where the
 * ink and the ring sit, never the muted ink). */
function grounds(t: Record<string, string>, pressed: boolean): [string, RGBA][] {
  const page = colour(t.background)
  const fg = colour(t.foreground)
  const out: [string, RGBA][] = [
    ["background", page],
    ["card", colour(t.card)],
    ["muted", colour(t.muted)],
    ["smoke", over(colour(t.smoke), page)],
  ]
  stops(t["shell-ground"]).forEach((s, i) => out.push([`shell stop ${i}`, over(s, page)]))
  if (pressed)
    for (const [name, g] of [...out]) {
      const track = mix(fg, 0.03, g)
      out.push([`pressed on ${name}`, mix(fg, 0.06, track)])
    }
  return out
}

/** A token's value, following `var(--other)` to the token it names. */
const resolve = (t: Record<string, string>, value: string): string => {
  const ref = value.match(/^var\(--([\w-]+)\)$/)
  return ref ? resolve(t, t[ref[1]]) : value
}

const floor = (t: Record<string, string>, ink: string, min: number, pressed = true) =>
  grounds(t, pressed)
    .map(([name, g]) => [name, Math.round(contrast(colour(resolve(t, t[ink])), g) * 100) / 100] as const)
    .filter(([, r]) => r < min)

describe("theme contrast", () => {
  for (const [theme, t] of [
    ["light", LIGHT],
    ["dark", DARK],
  ] as const) {
    it(`${theme}: text inks hold 4.5:1 on every ground`, () => {
      expect(floor(t, "foreground", 4.5)).toEqual([])
      for (const ink of ["muted-foreground", "destructive"])
        expect({ ink, under: floor(t, ink, 4.5, false) }).toEqual({ ink, under: [] })
    })
    it(`${theme}: the control edge and the focus ring hold 3:1`, () => {
      for (const ink of ["edge", "ring"]) expect({ ink, under: floor(t, ink, 3) }).toEqual({ ink, under: [] })
    })
    it(`${theme}: chrome type holds 4.5:1 on the page at every stop`, () => {
      const page = colour(t.background)
      const worst = Math.min(...stops(t.chrome).map((s) => contrast(s, page)))
      expect(worst).toBeGreaterThanOrEqual(4.5)
    })
  }
  // The header's menu writes the ground's own colour on its bands: each a
  // step of the ink toward the ground, the foot the ember. Every ground the
  // header stands on: the docs and the landing in their own darks too.
  for (const [theme, t] of [
    ["light", LIGHT],
    ["dark", DARK],
    ["docs dark", { ...DARK, ...tokens(site, ':root.dark[data-page="docs"]') }],
    ["landing", { ...DARK, ...tokens(landing, ':root:is([data-page="landing"], [data-page="missing"])') }],
  ] as const)
    it(`${theme}: the menu's bands hold 4.5:1 for the ground's ink`, () => {
      const page = colour(t.background)
      // Every step of every sheet's bands (the menu's, the docs' families)
      // lies between the full ink and the floor.
      const steps = [...BAND_INK, BAND_FLOOR]
      const fills = [...steps.map((p) => mix(colour(t.foreground), p / 100, page)), colour(t["swatch-orange"])]
      const worst = Math.min(...fills.map((f) => contrast(page, f)))
      expect(worst).toBeGreaterThanOrEqual(4.5)
    })

  // A field's placeholder sits only in a field, the page at 60% over what
  // it stands on: AA there, and a step under the muted ink (as dim as AA
  // allows: under 5:1 on the page).
  for (const [theme, t] of [
    ["light", LIGHT],
    ["dark", DARK],
    ["docs dark", { ...DARK, ...tokens(site, ':root.dark[data-page="docs"]') }],
    ["landing", { ...DARK, ...tokens(landing, ':root:is([data-page="landing"], [data-page="missing"])') }],
  ] as const)
    it(`${theme}: a field's placeholder holds 4.5:1 in a field on every ground, under the muted ink`, () => {
      const page = colour(t.background)
      const ink = colour(t.placeholder)
      const under = grounds(t, false)
        .map(([name, g]) => [name, Math.round(contrast(ink, over({ ...page, a: 0.6 }, g)) * 100) / 100] as const)
        .filter(([, r]) => r < 4.5)
      expect(under).toEqual([])
      expect(contrast(ink, page)).toBeLessThan(contrast(colour(t["muted-foreground"]), page))
      expect(contrast(ink, page)).toBeLessThan(5)
    })

  // A picked chip on the accent: its foreground on the full accent, never a
  // fade of it (white on the light accent at 80% measured 3.86:1 in a walk).
  it("the accent's foreground stands on the full accent, at 4.5:1 in both themes", () => {
    for (const t of [LIGHT, DARK])
      expect(contrast(colour(resolve(t, t["accent-foreground"])), colour(resolve(t, t.accent)))).toBeGreaterThanOrEqual(
        4.5,
      )
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const path = `${dir}/${f}`
        return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(f) ? [path] : []
      })
    const faded = files(`${root}packages/site/src`).flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/"[^"\n]*text-accent-foreground[^"\n]*"/g)]
        .filter((m) => /\bbg-accent\/\d+/.test(m[0]))
        .map((m) => `${f.slice(root.length)}: ${m[0]}`),
    )
    expect(faded).toEqual([])
  })

  // Words the docs' demos print over what moves or what stays dark (a walk
  // measured each under 4.5:1 in light): the step timing's names over its
  // sweeping probe take the full ink, the container query's bucket the blue
  // swatch (each theme's own), the heat trail's black stage the dark inks.
  it("the docs' demos print their words in inks that hold on their grounds", () => {
    const animations = readFileSync(`${root}packages/site/src/pages/docs/animations/AnimationsDocs.css`, "utf8")
    const rule = (selector: string) => animations.slice(animations.indexOf(`${selector} {`)).split("}")[0]
    expect(rule(".animations-docs-scope .timing-tag")).toMatch(/color: var\(--color-foreground\);/)
    expect(rule(".animations-docs-scope .cq-bucket")).toMatch(/color: var\(--swatch-blue\);/)
    for (const t of [LIGHT, DARK])
      expect(contrast(colour(resolve(t, t["swatch-blue"])), colour(t.background))).toBeGreaterThanOrEqual(4.5)
    const backgrounds = readFileSync(`${root}packages/site/src/pages/docs/backgrounds/BackgroundsDocs.tsx`, "utf8")
    expect(backgrounds).toMatch(/<div class="dark [^"]*bg-black">\s*<DitherHeatTrail/)
    const dark = colour(resolve(DARK, DARK["muted-foreground"]))
    expect(contrast(dark, colour("#000000"))).toBeGreaterThanOrEqual(4.5)
  })

  it("the pressed ring is the control edge", () => {
    const rule = site.match(/\.ring-on \{([^}]*)\}/)?.[1] ?? ""
    expect(rule).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--edge\);/)
  })
})
