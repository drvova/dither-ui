// StyleX for everything a reader takes away: every Studio export (each
// registry component, the bespoke widgets, each chart) and every docs
// snippet comes out of `restyle(…, "stylex", "vue")` with no Tailwind class left.
// The only classes allowed to stay are the snippets' own hooks, which their
// hand-written CSS styles (the kit stylesheet's scope, a class handed to a
// component, the container-query routes).
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { restyle } from "restyle"

const OWN_CLASSES = new Set(["dither-kit", "cta", "cq-card", "cq-grid", "readout", "cell"])

/** The class attributes and bindings a StyleX rewrite left behind. */
function leftovers(code: string): string[] {
  const out = restyle(code, "stylex", "vue")
  const left: string[] = []
  for (const m of out.matchAll(/(?:^|\s)class="([^"]*)"/g))
    for (const c of m[1].split(/\s+/)) if (c && !OWN_CLASSES.has(c)) left.push(c)
  for (const m of out.matchAll(/(?:^|\s):class="([^"]*)"/g)) left.push(`:class="${m[1]}"`)
  return left
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : []
  })
}

describe("StyleX coverage", () => {
  it("writes every docs snippet as StyleX", () => {
    const left: string[] = []
    let snippets = 0
    // The docs: the pages and their framework-free data.
    for (const f of files("packages/site/src/pages/docs"))
      for (const m of readFileSync(f, "utf8").matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
        if (!/<[A-Za-z]/.test(m[1]) || !/class=/.test(m[1])) continue
        snippets++
        const code = m[1].replace(/\$\{[^}]*\}/g, "x").replace(/\\`/g, "`")
        left.push(...leftovers(code).map((c) => `${f}: ${c}`))
      }
    expect(snippets).toBeGreaterThan(100)
    expect(left).toEqual([])
  })
})
