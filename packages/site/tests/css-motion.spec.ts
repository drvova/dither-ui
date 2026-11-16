// The site's motion is its stylesheets' (the user's call: "no animations in
// JS; class names"): each motion a class's rule, a transition, keyframes or
// a scroll-driven animation, every one inside a welcome for motion
// (`prefers-reduced-motion: no-preference`), the scroll-driven ones also
// inside `@supports`, so a browser without scroll timelines, a reader who
// asks for less motion and a page with no script all see the end state.
// The scripts that once moved these are gone (`tests/no-js-motion.spec.ts`).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { BAYER4 } from "@dither-ui/kit/engine/pixel.ts"
import { THEME_TURN } from "@/shared/lib/useTheme"
import { MASCOT_ROTOR_STEPS } from "@/shared/ui/mascot"
import { WHEEL_STEPS } from "@/shared/ui/car"
import { SHEET_OUT } from "@/widgets/site-header/menu"

const root = new URL("../../..", import.meta.url).pathname
const SRC = join(root, "packages/site/src")
const read = (p: string) => readFileSync(join(SRC, p), "utf8")
const STYLES = read("app/styles.css")

/** Every at-rule that opens with `prelude` in `css`: where it starts, where
 * its body starts and where it ends. */
function blocks(css: string, prelude: string): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let at = css.indexOf(`${prelude} {`); at >= 0; at = css.indexOf(`${prelude} {`, at + 1)) {
    let depth = 0
    let i = css.indexOf("{", at)
    const start = i + 1
    do {
      if (css[i] === "{") depth++
      else if (css[i] === "}") depth--
      i++
    } while (depth > 0 && i < css.length)
    out.push([at, start, i])
  }
  return out
}
/** The bodies of every at-rule `prelude` opens. */
const within = (css: string, prelude: string) =>
  blocks(css, prelude)
    .map(([, start, end]) => css.slice(start, end - 1))
    .join("\n")
/** `css` with every at-rule `prelude` opens taken out. */
const without = (css: string, prelude: string) =>
  blocks(css, prelude)
    .reverse()
    .reduce((rest, [at, , end]) => rest.slice(0, at) + rest.slice(end), css)
const WELCOME = "@media (prefers-reduced-motion: no-preference)"
const welcomed = (css: string) => within(css, WELCOME)
const timelined = (css: string) => within(welcomed(css), "@supports (animation-timeline: view())")

/** Every innermost rule of `css` but a keyframe: its selector and its
 * declarations. */
const rules = (css: string) =>
  [
    ...css
      .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/([^{};]+)\{([^{}]*)\}/g),
  ].map((m) => ({
    selector: m[1].trim().replace(/\s+/g, " "),
    body: m[2],
  }))

function* sheets(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* sheets(path)
    else if (name.endsWith(".css")) yield path
  }
}

describe("the press", () => {
  it("gives a key while it is held, on the glide, and lets it back on the spring, only where motion is welcome", () => {
    expect(STYLES).toContain(`:where(.key, .key-chrome, .nav-a, .seg > button, [data-press]) {
    --press-t: var(--spring-time) var(--ease-spring);
    transition: scale var(--press-t);
  }`)
    const pressed = rules(welcomed(STYLES)).find((r) => r.selector.includes(":active"))
    expect(pressed?.selector).toContain(':is(.key, .key-chrome, .nav-a, .seg > button, [data-press="key"]):active')
    // a card gives only where none of its controls, links or canvases took the press
    expect(pressed?.selector).toMatch(
      /\[data-press="card"\]:active:not\(\s*:has\(\s*:is\(\s*a,\s*button,[^)]*canvas[^)]*\):active\s*\)\s*\)/,
    )
    expect(pressed?.body).toContain("--press-t: var(--press-time) var(--ease-settle);")
    expect(pressed?.body).toContain("scale: var(--press-scale, 0.97);")
    // the scale moves only there: no press outside the welcome
    const outside = without(STYLES, WELCOME)
    expect(outside).not.toMatch(/scale: var\(--press-scale/)
  })

  it("carries the press's scale in every pressable's own transition, so a key's other transitions stay", () => {
    const PRESSABLE = /(^|[\s>(,])(\.nav-a|\.key-chrome|\.key|\.seg > button|\[data-press[^\]]*\])$/
    const off: string[] = []
    let seen = 0
    for (const file of sheets(SRC))
      for (const r of rules(readFileSync(file, "utf8"))) {
        if (!/(^|\s|;)transition:/.test(r.body) || /transition: none/.test(r.body)) continue
        // the selector's subject, each of a list
        for (const sel of r.selector.split(/,(?![^(]*\))/).map((s) => s.trim())) {
          if (!PRESSABLE.test(sel)) continue
          seen++
          if (!r.body.includes("scale var(--press-t)")) off.push(`${file.slice(SRC.length)}: ${sel}`)
        }
      }
    expect(off).toEqual([])
    expect(seen).toBeGreaterThan(4)
  })
})

describe("the rise", () => {
  const css = read("pages/landing/RiseWords.css")

  it("rises each riser 24px on the glide, in step with the scroll where the browser has scroll timelines", () => {
    expect(css).toMatch(/@keyframes rise \{\s*from \{\s*opacity: 0;\s*translate: 0 24px;/)
    const scrolled = rules(timelined(css)).find((r) => r.selector === ".rise [data-rise]")
    expect(scrolled?.body).toContain("animation: rise auto var(--ease-settle) both;")
    expect(scrolled?.body).toContain("animation-timeline: view();")
    expect(scrolled?.body).toMatch(/animation-range: entry var\(--rise-lag\) entry calc\(25vh \+ var\(--rise-lag\)\);/)
  })

  it("plays the first screen's as the page opens: 900ms, the words 60ms apart, the blocks 90ms apart after them", () => {
    const open = rules(welcomed(css))
    const all = open.find((r) => r.selector === ".rise-open [data-rise]")
    expect(all?.body).toContain("animation: rise 900ms var(--ease-settle) backwards;")
    expect(all?.body).toContain("var(--rise-n, 0) * 90ms")
    expect(open.find((r) => r.selector === '.rise-open [data-rise="word"]')?.body).toContain(
      "calc(var(--rise-word, 0) * 60ms)",
    )
  })

  it("stands everything up when focus comes in, and nothing ever hides without the welcome", () => {
    expect(rules(welcomed(css)).find((r) => r.selector.includes(":focus-within"))?.body).toContain("animation: none;")
    // outside the welcome, nothing is held out of sight: no script needed to show it
    for (const r of rules(without(css, WELCOME)))
      expect(r.body, r.selector).not.toMatch(/opacity: 0|visibility: hidden/)
    expect(STYLES).not.toContain("rise-wait")
  })
})

describe("the scroll scenes", () => {
  it("ease the hero back on its own view timeline as the page leaves it", () => {
    const css = timelined(read("pages/landing/Showcase.css"))
    expect(css).toContain("view-timeline: --hero block;")
    expect(css).toContain("animation-timeline: --hero;")
    expect(css).toContain("animation-range: exit 0% exit 100%;")
  })

  it("slide the bento's cards up from the window's foot through six tenths of it, from 1024px", () => {
    const sheet = read("pages/landing/Examples.css")
    const grid = within(within(sheet, `${WELCOME} and (min-width: 1024px)`), "@supports (animation-timeline: view())")
    expect(grid).toContain("animation: tile-in auto var(--ease-settle) both;")
    expect(grid).toContain("animation-range: entry 0% entry 60vh;")
  })

  it("hold each plate pinned through its hold, scaling into place over exactly that span", () => {
    const css = timelined(read("pages/landing/Plate.css"))
    expect(css).toContain("view-timeline: --plate block;")
    expect(css).toContain("position: sticky;")
    expect(css).toContain(
      "animation-range: cover calc(100svh - var(--pin-top)) cover calc(100svh - var(--pin-top) + var(--hold));",
    )
    // without the timeline there is no pin and no hold: the plate simply stands
    const outside = without(read("pages/landing/Plate.css"), WELCOME)
    expect(outside).not.toMatch(/position: sticky|height: var\(--hold\)/)
  })

  it("light the rail's dot by the rail's own scroll timeline, each dot its share of the travel", () => {
    const css = within(
      read("pages/landing/Examples.css"),
      "@supports (animation-timeline: scroll()) and (timeline-scope: --rail)",
    )
    expect(css).toContain("timeline-scope: --rail;")
    expect(css).toContain("scroll-timeline: --rail inline;")
    expect(css).toContain("animation-timeline: --rail;")
    expect(read("pages/landing/Examples.tsx")).toMatch(/<a href=\{`#\$\{cardId\(t\.id\)\}`\}/)
  })
})

describe("the page and the theme", () => {
  const css = welcomed(STYLES)

  it("turns pages by a typed cross-document view transition, and the theme by its own type", () => {
    expect(css).toMatch(/@view-transition \{\s*navigation: auto;\s*types: page;\s*\}/)
    expect(css).toContain(":root:active-view-transition-type(page)::view-transition-new(root)")
    expect(css).toContain(`:root:active-view-transition-type(${THEME_TURN})::view-transition-new(root)`)
    expect(without(STYLES, WELCOME)).not.toContain("@view-transition")
  })

  it("prints both through the kit's Bayer ranks", () => {
    const cell = 8
    for (let k = 1; k < 16; k++) {
      const d = BAYER4.flatMap((row, y) =>
        row.flatMap((v, x) => (v * 16 - 0.5 < k ? [`M${x * cell} ${y * cell}h${cell}v${cell}h-${cell}z`] : [])),
      ).join("")
      expect(css, `rank ${k}`).toContain(
        `--bayer-${k}: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='${d}'/%3E%3C/svg%3E");`,
      )
    }
    for (let k = 1; k < 16; k++) expect(STYLES).toContain(`mask-image: var(--bayer-${k});`)
  })
})

describe("the header's sheet and the mascot", () => {
  it("slides the sheet up and down by the dialog's phase, the menu shutting after the slide down", () => {
    const css = read("widgets/site-header/site-header.css")
    expect(css).toContain(`@keyframes ${SHEET_OUT} {`)
    const moving = rules(welcomed(css))
    expect(moving.find((r) => r.selector === '.site-menu[data-phase="leaving"] .menu-sheet')?.body).toContain(
      `animation: ${SHEET_OUT} 500ms var(--ease-settle) forwards;`,
    )
    expect(moving.find((r) => r.selector === '.site-menu[data-phase="open"] .menu-sheet')?.body).toContain("500ms")
    // nothing drags it
    expect(css).not.toMatch(/touch-action: none|cursor: grab/)
  })

  it("steps the rotor and the wheels in quarters, as many as their turns", () => {
    expect([MASCOT_ROTOR_STEPS, WHEEL_STEPS]).toEqual([4, 4])
    const mascot = read("shared/ui/Mascot.css")
    expect(mascot).toMatch(/@keyframes mascot-turn \{\s*0% \{\s*visibility: visible;\s*\}\s*25%,/)
    expect(welcomed(mascot)).toContain(`calc(var(--turn) * 60ms - ${MASCOT_ROTOR_STEPS * 60}ms)`)
    const car = read("shared/ui/MascotCar.css")
    expect(car).toMatch(/@keyframes car-turn \{\s*0% \{\s*visibility: visible;\s*\}\s*25%,/)
    expect(welcomed(car)).toContain(`calc(var(--turn) * 70ms - ${WHEEL_STEPS * 70}ms)`)
    // only while it drives
    expect(welcomed(car)).toContain("&[data-driving] .car-turn {")
  })
})
