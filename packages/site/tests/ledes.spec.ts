// Two tones: every section lede on the landing reads in the muted ink
// with exactly one clause stepped up to the full ink (`.lede-key`), and
// its stylesheet carries the step.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const root = new URL("../../..", import.meta.url).pathname
const read = (p: string) => readFileSync(join(root, p), "utf8")

describe("the ledes", () => {
  it("each carry one key clause", () => {
    const dir = "packages/site/src/pages/landing"
    const ledes = readdirSync(join(root, dir))
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => [...read(`${dir}/${f}`).matchAll(/<p[^>]*class="sec-lede"[^>]*>([\s\S]*?)<\/p>/g)])
      .map((m) => m[1])
    expect(ledes.length).toBeGreaterThanOrEqual(5)
    for (const l of ledes) expect(l.match(/class="lede-key"/g) ?? [], l.trim().slice(0, 40)).toHaveLength(1)
  })

  it("step the key clause up to the full ink", () => {
    expect(read("packages/site/src/pages/landing/chapters.css")).toMatch(
      /\.landing \.lede-key \{\s*color: var\(--ink\);\s*\}/,
    )
  })
})
