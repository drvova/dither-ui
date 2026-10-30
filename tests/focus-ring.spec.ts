// One focus colour: wherever the kit, its Svelte port or the site draws a
// focus indicator (a ring or a field's border), it is the theme's ring ink,
// which holds full contrast on either ground. A tinted accent or a faded
// foreground once let six rings drift apart, and the faint ones vanished on
// the landing's paper.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const ROOTS = ["dither-kit/tailwind", "dither-kit-svelte", "src", "svelte-site/src"]
const root = new URL("..", import.meta.url).pathname

function* sources(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* sources(path)
    else if (/\.(vue|ts|svelte)$/.test(name)) yield path
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
})
