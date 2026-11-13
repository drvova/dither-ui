import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

// `text-destructive` is the ink of delete, remove and a failed read. A
// component's own rule that colours a class outranks the utility (a class
// under the component's scope hook against one class), so an element wearing
// both shows the component's colour unless the component says otherwise:
// every such pairing needs its own `.class.text-destructive` rule
// (`&.text-destructive` nested under the class).
const ROOT = new URL("../src", import.meta.url).pathname
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".tsx") ? [p] : []
  })

describe("destructive ink", () => {
  it("survives every component's own colour rule on the same element", () => {
    const misses: string[] = []
    let paired = 0
    for (const file of files(ROOT)) {
      // a component's own styles stand beside it, under its scope hook
      const sheet = file.replace(/\.tsx$/, ".css")
      if (!existsSync(sheet)) continue
      const src = readFileSync(file, "utf8")
      const style = readFileSync(sheet, "utf8")
      // Classes whose own rule sets a colour.
      const coloured = new Set(
        [...style.matchAll(/\.([\w-]+)(?::[\w-]+(?:\([^)]*\))?)*\s*(?:,[^{]*)?\{[^}]*\bcolor\s*:/g)].map((m) => m[1]),
      )
      const keeps = (cls: string) =>
        style.includes(`.${cls}.text-destructive`) ||
        new RegExp(`\\.${cls}\\b[^{}]*\\{[^}]*&\\.text-destructive`).test(style)
      for (const m of src.matchAll(/["'`]([^"'`\n]*\btext-destructive\b[^"'`\n]*)["'`]/g))
        for (const cls of m[1].split(/\s+/))
          if (cls !== "text-destructive" && coloured.has(cls)) {
            paired++
            if (!keeps(cls)) misses.push(`${file.slice(ROOT.length + 1)}: .${cls}`)
          }
    }
    expect(misses).toEqual([])
    expect(paired).toBeGreaterThan(0)
  })
})
