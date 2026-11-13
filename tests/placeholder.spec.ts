// A field's placeholder: one ink for the whole kit, the
// theme's `--placeholder` (unset, its muted ink), set per theme a step under
// the muted ink and as dim as AA allows on a field's ground. The shared field
// control once took 60% of the muted ink (2.8:1 dark, 2.6:1 light) while ten
// other controls took all of it. The site's, the docs' and the landing's
// values are held by `theme-contrast.spec.ts`.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { contrast, over, parseColor, type RGBA } from "@/shared/lib/inspect/color"

const root = new URL("..", import.meta.url).pathname
const theme = readFileSync(`${root}dither-kit/engine/theme.css`, "utf8")

function tokens(selector: string): Record<string, string> {
  const start = theme.indexOf(`\n${selector} {`)
  const body = theme.slice(start, theme.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}
const colour = (v: string): RGBA => {
  const c = parseColor(v)
  if (!c) throw new Error(`not a colour: ${v}`)
  return c
}

/** Every source file of a folder, recursively, skipping installed packages. */
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules"
      ? []
      : e.isDirectory()
        ? files(join(dir, e.name))
        : /\.ts$/.test(e.name)
          ? [join(dir, e.name)]
          : [],
  )
}

describe("a field's placeholder", () => {
  it("is read through the one token in every kit control", () => {
    const stray = files(`${root}dither-kit/tailwind`).flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/placeholder:[\w/[\]-]+/g)]
        .map((m) => m[0])
        .filter((c) => c !== "placeholder:text-placeholder")
        .map((c) => `${f.slice(root.length)}: ${c}`),
    )
    expect(stray).toEqual([])
    expect(readFileSync(`${root}dither-kit/engine/base.css`, "utf8")).toContain(
      "color: var(--placeholder, var(--muted-foreground));",
    )
    for (const css of ["dither-kit/tailwind/kit.css", "src/app/styles.css"])
      expect(readFileSync(`${root}${css}`, "utf8"), css).toContain(
        "--color-placeholder: var(--placeholder, var(--muted-foreground));",
      )
  })

  it("holds AA on a field in both of the kit's themes, dimmer than the muted ink", () => {
    const light = tokens(":root")
    for (const t of [light, { ...light, ...tokens(".dark") }]) {
      const page = colour(t.background)
      const ink = colour(t.placeholder)
      // A field is the page at 60% over what it sits on: the page, a card, a muted fill.
      for (const under of [t.background, t.card, t.muted])
        expect(contrast(ink, over({ ...page, a: 0.6 }, colour(under)))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(ink, page)).toBeLessThan(contrast(colour(t["muted-foreground"]), page))
      expect(contrast(ink, page)).toBeLessThan(5)
    }
  })
})
