// The docs' API tables: each one printed off the kit's own props types
// (`kitTable` over `virtual:dither-props/<Component>`, `build/props.ts`), so a
// prop the kit adds is in its table with no other edit, in Solid's words.
// What a table adds that is not a prop is said where it is added, and a row
// added that the kit declares fails the page (`kitTable`).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import ts from "typescript"
import { describe, expect, it, vi } from "vitest"
import { kitPropRows } from "../../build/props"
import { API as TRANSITION } from "../../src/pages/docs/animations/TransitionSection"
import { API as POSTER } from "../../src/pages/docs/backgrounds/PosterSection"
import type { PropRow } from "../../src/pages/docs/PropsTable"
import { API as SCREENS } from "../../src/pages/docs/utils/ScreensSection"
import { DOCS } from "./docs-api"

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sources(path) : path.endsWith(".tsx") ? [path] : []
  })

/** Every docs file that prints a table, and the keys of `API` it prints. */
const PRINTS = new Map(
  sources(DOCS)
    .map((path) => [relative(DOCS, path), readFileSync(path, "utf8")] as const)
    .filter(([, text]) => text.includes("<PropsTable"))
    .map(([file, text]) => [
      file,
      [...text.matchAll(/<PropsTable rows=\{API(?:\.(\w+))?\} \/>/g)].map((m) => m[1] ?? ""),
    ]),
)

/** The sections a pack imports whole: their one table each (a pack's own
 * tables are read off the pack, which nothing imports by name). */
const SECTIONS: Partial<Record<string, PropRow[]>> = {
  "animations/TransitionSection.tsx": TRANSITION,
  "backgrounds/PosterSection.tsx": POSTER,
  "utils/ScreensSection.tsx": SCREENS,
}

/** Each file's `API`: one table, or its tables by key. */
async function tables(): Promise<Map<string, PropRow[]>> {
  const out = new Map<string, PropRow[]>()
  for (const file of PRINTS.keys()) {
    const API =
      SECTIONS[file] ?? ((await import(join(DOCS, file))) as { API: PropRow[] | Record<string, PropRow[]> }).API
    if (Array.isArray(API)) out.set(`${file} API`, API)
    else for (const [key, rows] of Object.entries(API)) out.set(`${file} ${key}`, rows)
  }
  return out
}

/** Vue's words for what a Solid reader types otherwise (CSS's own at-rules,
 * selectors and properties set aside). */
const VUE_WORDS = /v-model|v-for|v-if|(^|[\s(])[@#:][a-z]|\bslot\b|\bscoped\b|\bemit|teleport|\btemplate\b/i
const sansCss = (text: string) => text.replace(/@(container|keyframes)\b|:focus-visible\b|\bgrid-template-\w+/g, "")

describe("the docs' API tables", () => {
  it("prints every table it names, each row a prop, its type and its default", async () => {
    const all = await tables()
    expect(all.size).toBeGreaterThan(250)
    for (const [file, keys] of PRINTS)
      for (const key of keys) expect(all.has(`${file} ${key || "API"}`), `${file} API.${key}`).toBe(true)
    for (const [id, rows] of all) {
      expect(rows.length, id).toBeGreaterThan(0)
      for (const row of rows) expect(Object.keys(row).sort(), id).toEqual(["default", "prop", "type"])
    }
  }, 60_000)

  it("says it in Solid's words: no v-model, event or slot", async () => {
    for (const [id, rows] of await tables())
      for (const row of rows)
        for (const cell of [row.prop, row.type, row.default])
          expect(VUE_WORDS.test(sansCss(cell)), `${id}: ${cell}`).toBe(false)
  }, 60_000)

  it("prints a prop the kit adds, with no other edit", async () => {
    const file = join(DOCS, "../../../../dither-kit/src/solid/DitherButton.tsx")
    const text = readFileSync(file, "utf8")
    const edited = text.replace("type Own = {", "type Own = {\n  /** @docs number (px of wobble) */\n  wobble?: number")
    expect(edited).not.toBe(text)
    const button = kitPropRows(new Map([[file, edited]])).get("DitherButton")!
    expect(button.rows).toContainEqual({ prop: "wobble", type: "number (px of wobble)", default: "" })
    // the Basics page's table, built over the edited kit as the build builds it
    vi.resetModules()
    vi.doMock("virtual:dither-props/DitherButton", () => ({ default: button }))
    const { API } = (await import(join(DOCS, "components/BasicsDocs.tsx"))) as { API: Record<string, PropRow[]> }
    vi.doUnmock("virtual:dither-props/DitherButton")
    expect(API.button[0]).toEqual({ prop: "wobble", type: "number (px of wobble)", default: "" })
  }, 60_000)
})

describe("the docs' prose", () => {
  /** What a demo itself shows, as its authored snippet has it. */
  const DEMO_TEXT = ["teleported out"]

  it("describes the kit in Solid's words", () => {
    const said: string[] = []
    for (const file of PRINTS.keys()) {
      const text = readFileSync(join(DOCS, file), "utf8")
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const visit = (node: ts.Node): void => {
        if (ts.isJsxText(node)) {
          const words = node.text.replace(/\s+/g, " ").trim()
          // a mention (`@ada`) or a channel (`#dither-dev`) is a demo's content
          if (VUE_WORDS.test(sansCss(words).replace(/(^|\s)[@#][\w-]+/g, "")) && !DEMO_TEXT.includes(words))
            said.push(`${file}: ${words}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
    expect(said).toEqual([])
  })
})
