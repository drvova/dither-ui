// StyleX for everything a reader takes away: every Studio export (each
// registry component, the bespoke widgets, each chart) and every docs
// snippet comes out of `restyle(…, "stylex")` with no Tailwind class left.
// The only classes allowed to stay are the snippets' own hooks, which their
// hand-written CSS styles (the kit stylesheet's scope, a class handed to a
// component, the container-query routes).
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { chartCode, createChart } from "../src/entities/chart"
import { COMPONENT_REGISTRY, createComponent, createWidget, widgetCode } from "../src/entities/widget"
import { CHART_TYPES } from "../src/shared/config"
import { restyle } from "../src/shared/lib/restyle"

const OWN_CLASSES = new Set(["dither-kit", "cta", "cq-card", "cq-grid", "readout", "cell"])

/** The class attributes and bindings a StyleX rewrite left behind. */
function leftovers(code: string): string[] {
  const out = restyle(code, "stylex")
  const left: string[] = []
  for (const m of out.matchAll(/(?:^|\s)class="([^"]*)"/g))
    for (const c of m[1].split(/\s+/)) if (c && !OWN_CLASSES.has(c)) left.push(c)
  for (const m of out.matchAll(/(?:^|\s):class="([^"]*)"/g)) left.push(`:class="${m[1]}"`)
  return left
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : /\.(vue|ts)$/.test(n) ? [p] : []
  })
}

describe("StyleX coverage", () => {
  it("writes every Studio export as StyleX", () => {
    const left: string[] = []
    const check = (what: string, code: string) => left.push(...leftovers(code).map((c) => `${what}: ${c}`))
    for (const e of COMPONENT_REGISTRY) check(e.is, widgetCode(createComponent(e), { w: 480, h: 320 }))
    for (const k of ["avatar", "button", "image", "gradient"] as const)
      check(k, widgetCode(createWidget(k), { w: 480, h: 320 }))
    for (const t of CHART_TYPES) check(t, chartCode(createChart(t)))
    expect(left).toEqual([])
  })

  it("writes every docs snippet as StyleX", () => {
    const left: string[] = []
    let snippets = 0
    for (const f of files("src/pages/docs"))
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
