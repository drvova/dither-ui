// StyleX for every docs snippet a reader takes away: written in Solid, each
// comes out of `restyle(…, "stylex")` with no Tailwind
// class left (the Studio's exports are held the same way by
// `tests/site/codegen.spec.tsx`). The only classes allowed to stay are the
// snippets' own hooks, which their hand-written CSS styles (the kit
// stylesheet's scope, a class handed to a component, the container-query
// routes).
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { restyle } from "@dither-ui/restyle"

const OWN_CLASSES = new Set(["dither-kit", "cta", "cq-card", "cq-grid", "readout", "cell"])

/** What a StyleX rewrite of the snippet's Solid left behind: the classes
 * still written as text, and any class expression that is not StyleX's own. */
function leftovers(code: string): string[] {
  const out = restyle(code, "stylex")
  const left: string[] = []
  const text = (classes: string) => left.push(...classes.split(/\s+/).filter((c) => c && !OWN_CLASSES.has(c)))
  const hole = (expr: string) => /^stylex\.props\(.*\)\.className$/s.test(expr) || left.push(`class={${expr}}`)
  for (const m of out.matchAll(/\sclass="([^"]*)"/g)) text(m[1])
  for (const m of out.matchAll(/\sclass=\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
    const tpl = /^`([\s\S]*)`$/.exec(m[1])
    if (!tpl) hole(m[1])
    else {
      text(tpl[1].replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, " "))
      for (const h of tpl[1].matchAll(/\$\{((?:[^{}]|\{[^{}]*\})*)\}/g)) hole(h[1])
    }
  }
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
    for (const f of files("packages/site/src/pages/docs")) {
      // an example module is a snippet whole, as the reader takes it
      if (/\/docs\/[\w-]+\/examples\/[\w-]+\.tsx$/.test(f)) {
        snippets++
        left.push(...leftovers(readFileSync(f, "utf8")).map((c) => `${f}: ${c}`))
        continue
      }
      for (const m of readFileSync(f, "utf8").matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
        if (!/<[A-Za-z]/.test(m[1]) || !/class=/.test(m[1])) continue
        snippets++
        // a hole of the literal stands as a name; what it escapes is the snippet's own
        const code = m[1].replace(/(?<!\\)\$\{[^}]*\}/g, "x").replace(/\\([`$\\])/g, "$1")
        left.push(...leftovers(code).map((c) => `${f}: ${c}`))
      }
    }
    expect(snippets).toBeGreaterThan(100)
    expect(left).toEqual([])
  })
})
