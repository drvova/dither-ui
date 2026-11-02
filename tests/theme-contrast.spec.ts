// The site's inks against every ground the docs and the Studio paint, in
// both themes, read from the stylesheets themselves: text at AA (4.5:1),
// the control edge and the focus ring at 3:1 (WCAG 1.4.11). The light
// theme's bone shells, smoke and pressed fills once took the muted ink, a
// field's hairline and the pressed ring under their floors.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { contrast, over, parseColor, type RGBA } from "../src/widgets/workbench/model/color"
import { BAND_FLOOR, BAND_INK } from "../src/widgets/site-header/menu"

const root = new URL("..", import.meta.url).pathname
const kit = readFileSync(`${root}dither-kit/engine/theme.css`, "utf8")
const site = readFileSync(`${root}src/app/styles.css`, "utf8")
const landing = readFileSync(`${root}src/pages/landing/chapters.css`, "utf8")

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

const floor = (t: Record<string, string>, ink: string, min: number, pressed = true) =>
  grounds(t, pressed)
    .map(([name, g]) => [name, Math.round(contrast(colour(t[ink]), g) * 100) / 100] as const)
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
    ["docs dark", { ...DARK, ...tokens(site, ":root.dark:has(.docs-root)") }],
    ["landing", { ...DARK, ...tokens(landing, ":root:has(.landing)") }],
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

  it("the pressed ring is the control edge", () => {
    const rule = site.match(/\.ring-on \{([^}]*)\}/)?.[1] ?? ""
    expect(rule).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--edge\);/)
  })
})
