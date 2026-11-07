// Two tones: every section lede on both landings reads in the muted ink
// with exactly one clause stepped up to the full ink (`.lede-key`), and
// both stylesheets carry the step.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const root = new URL("..", import.meta.url).pathname
const read = (p: string) => readFileSync(join(root, p), "utf8")

describe("the ledes", () => {
  for (const dir of ["src/pages/landing", "svelte-site/src/landing"])
    it(`in ${dir} each carry one key clause`, () => {
      const ledes = readdirSync(join(root, dir))
        .filter((f) => /\.(vue|svelte)$/.test(f))
        .flatMap((f) => [...read(`${dir}/${f}`).matchAll(/<p[^>]*class="sec-lede"[^>]*>([\s\S]*?)<\/p>/g)])
        .map((m) => m[1])
      expect(ledes.length).toBeGreaterThanOrEqual(5)
      for (const l of ledes) expect(l.match(/class="lede-key"/g) ?? [], l.trim().slice(0, 40)).toHaveLength(1)
    })

  it("step the key clause up to the full ink on both sites", () => {
    for (const sheet of ["src/pages/landing/chapters.css", "svelte-site/src/landing/landing.css"])
      expect(read(sheet)).toMatch(/\.landing \.lede-key \{\s*color: var\(--ink\);\s*\}/)
  })
})
