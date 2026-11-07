// The Svelte site never imports from the Vue site (the two apps stay apart),
// so what it shares with it is copied: the tool marks, the display face and
// the Vue landing's pure modules. Every copy is byte for byte its original
// (its Svelte-specific glue lives in modules of its own), so a change on one
// side fails here until it is copied across.
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { GROUPS } from "../svelte-site/src/docs/nav"

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url))

/** Each copy in `svelte-site/` and the Vue original it mirrors. */
const COPIES: readonly (readonly [copy: string, original: string])[] = [
  ["svelte-site/src/shared/marks.ts", "src/shared/ui/marks.ts"],
  ["svelte-site/src/fonts/display.css", "src/shared/fonts/display.css"],
  ["svelte-site/src/fonts/michroma-latin.woff2", "src/shared/fonts/michroma-latin.woff2"],
  ["svelte-site/src/fonts/OFL.txt", "src/shared/fonts/OFL.txt"],
  ...["menu.ts", "site-header.css"].map(
    (f) => [`svelte-site/src/landing/${f}`, `src/widgets/site-header/${f}`] as const,
  ),
  ...["rise.ts", "rise-wait.ts"].map((f) => [`svelte-site/src/landing/${f}`, `src/shared/lib/${f}`] as const),
  ...["brand.ts", "close.ts", "pixel-type.ts", "plate.ts", "spotlight.ts", "stat.ts", "story.ts"].map(
    (f) => [`svelte-site/src/landing/${f}`, `src/pages/landing/${f}`] as const,
  ),
]

// The `{ id, name }` rows of a HARNESSES array, read from its source.
const rows = (src: string) => {
  const from = src.indexOf("export const HARNESSES")
  const block = src.slice(from, src.indexOf("\n]", from))
  return [...block.matchAll(/id: "([\w-]+)",\s*name: "([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2] }))
}

describe("svelte-site copies", () => {
  for (const [copy, original] of COPIES) {
    it(`${copy} is ${original}, byte for byte`, () => {
      expect(read(copy).equals(read(original))).toBe(true)
    })
  }

  it("links only to sections the Svelte docs render", () => {
    // `docsHref` throws on a dead id at runtime, which takes the whole
    // landing down: a bento card once linked to a section only Vue had.
    const sections = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.id)))
    const dir = "svelte-site/src/landing"
    const ids = readdirSync(dir).flatMap((f) => {
      const src = read(`${dir}/${f}`).toString("utf8")
      const linked = [...src.matchAll(/docsHref\("([\w-]+)"\)/g)].map((m) => m[1])
      // the bento's cards, each linked through docsHref(t.id)
      const bento = src.includes("href: docsHref(t.id)")
        ? [...src.slice(src.indexOf("const BENTO"), src.indexOf("docsHref(t.id)")).matchAll(/id: "([\w-]+)"/g)].map(
            (m) => m[1],
          )
        : []
      return [...linked, ...bento]
    })
    expect(ids.length).toBeGreaterThan(8)
    expect(ids.filter((id) => !sections.has(id))).toEqual([])
  })

  it("lists the bridge's harnesses on the Svelte landing, in its order", () => {
    const bridge = rows(read("bridge/dither-bridge.mjs").toString("utf8"))
    expect(bridge.length).toBeGreaterThan(0)
    expect(rows(read("svelte-site/src/landing/facts.ts").toString("utf8"))).toEqual(bridge)
  })
})
