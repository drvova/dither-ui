// One focus colour: wherever the kit or the site draws a
// focus indicator (a ring or a field's border), it is the theme's ring ink,
// which holds full contrast on either ground. A tinted accent or a faded
// foreground once let six rings drift apart, and the faint ones vanished on
// the landing's paper.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const ROOTS = ["dither-kit/solid", "dither-kit/tailwind", "src", "solid-site/src"]
const root = new URL("..", import.meta.url).pathname

function* sources(dir: string, kinds = /\.tsx?$/): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* sources(path, kinds)
    else if (kinds.test(name)) yield path
  }
}

// A focus variant, then a ring, border or outline colour.
const FOCUS_COLOUR =
  /\b(?:focus|focus-visible|focus-within|peer-focus-visible|group-focus-visible):(?:ring|border|outline)-([a-z]+(?:-\d+)?(?:\/\d+)?)/g
// Widths, offsets and styles are not colours.
const NOT_A_COLOUR = /^(?:none|offset(?:-\d+)?|inset|solid|dashed|dotted|hidden|ring)$/

describe("focus indicators", () => {
  it("draw in the theme's ring ink everywhere", () => {
    const off: string[] = []
    let seen = 0
    for (const dir of ROOTS)
      for (const file of sources(join(root, dir))) {
        const text = readFileSync(file, "utf8")
        for (const m of text.matchAll(FOCUS_COLOUR)) {
          if (NOT_A_COLOUR.test(m[1])) {
            if (m[1] === "ring") seen++
            continue
          }
          off.push(`${file.slice(root.length)}: ${m[0]}`)
        }
      }
    expect(off).toEqual([])
    expect(seen).toBeGreaterThan(40)
  })

  // The same rule in a stylesheet: a `:focus` rule whose border, outline or
  // shadow is a mix (a faded foreground) or the accent (a tint).
  it("draw in the ring ink in stylesheets too", () => {
    const RULE = /([^{}]*:focus(?:-visible|-within)?\b[^{}]*)\{([^}]*)\}/g
    const INDICATOR = /(?:border(?:-[a-z]+)?(?:-color)?|outline(?:-color)?|box-shadow)\s*:\s*([^;]+)/g
    const off: string[] = []
    for (const dir of ROOTS)
      for (const file of sources(join(root, dir), /\.css$/)) {
        const text = readFileSync(file, "utf8")
        for (const rule of text.matchAll(RULE))
          for (const decl of rule[2].matchAll(INDICATOR))
            if (/color-mix|var\(--(?:color-)?accent\)/.test(decl[1]))
              off.push(`${file.slice(root.length)}: ${rule[1].trim().split("\n").pop()} { ${decl[0].trim()} }`)
      }
    expect(off).toEqual([])
  })
})
