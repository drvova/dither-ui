import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

// `text-destructive` is the ink of delete, remove and a failed read. A
// component's scoped rule that colours a class outranks the utility (a class
// and the scope's attribute against one class), so an element wearing both
// shows the scoped colour unless the component says otherwise: every such
// pairing needs its own `.class.text-destructive` rule.
const ROOT = new URL("../src", import.meta.url).pathname
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".vue") ? [p] : []
  })

describe("destructive ink", () => {
  it("survives every scoped colour rule on the same element", () => {
    const misses: string[] = []
    for (const file of files(ROOT)) {
      const src = readFileSync(file, "utf8")
      const style = src.match(/<style scoped>([\s\S]*?)<\/style>/)?.[1]
      if (!style) continue
      // Classes whose own scoped rule sets a colour.
      const coloured = new Set(
        [...style.matchAll(/\.([\w-]+)(?::[\w-]+(?:\([^)]*\))?)*\s*(?:,[^{]*)?\{[^}]*\bcolor\s*:/g)].map((m) => m[1]),
      )
      for (const m of src.matchAll(/class="([^"]*\btext-destructive\b[^"]*)"/g))
        for (const cls of m[1].split(/\s+/))
          if (cls !== "text-destructive" && coloured.has(cls) && !style.includes(`.${cls}.text-destructive`))
            misses.push(`${file.slice(ROOT.length + 1)}: .${cls}`)
    }
    expect(misses).toEqual([])
  })
})
