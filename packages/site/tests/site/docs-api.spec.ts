// The docs' API tables, held to the Solid kit: every row of every table
// names a prop its component really takes (by the type checker, off the
// component's own parameter), in Solid's words. What a table says that is
// not a prop of its component is listed below, with the reason.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { DOCS, docsTables, kitProps } from "./docs-api"

/** A table's component is `Dither<Key>` unless it is named here; `null`
 * marks a table that documents functions or options, not a component. */
const COMPONENT: Record<string, Record<string, string | null>> = {
  "DocsPage.tsx": {
    // the charts' roots carry no prefix; the three cartesian ones share a table
    cartesian: "AreaChart",
    motion: "LineChart",
    pie: "PieChart",
    radar: "RadarChart",
    sparkline: "Sparkline",
    // the palette's functions and its colour type
    palette: null,
  },
  "animations/AnimationsDocs.tsx": {
    ditherReveal: "DitherReveal",
    sequences: "DitherSequence",
    containerQueries: "DitherContainer",
    // the timing engine's functions
    stepTiming: null,
  },
  // `ditherTransition`'s options
  "animations/TransitionSection.tsx": { API: null },
  "backgrounds/PosterSection.tsx": { API: "DitherPoster" },
  "utils/ScreensSection.tsx": { API: "DitherScreen" },
  "components/LayoutDocs.tsx": { infinite: "DitherInfiniteCanvas" },
  "components/MediaDocs.tsx": { video: "DitherVideoPlayer" },
  "components/SelectionDocs.tsx": { radio: "DitherRadioGroup" },
  // the `toast()` function's arguments
  "components/SurfaceDocs.tsx": { toast: null },
}

/** A row that ends in `(Part)` is a prop of a component of the family. */
const PART: Record<string, string[]> = {
  series: ["Area", "Line", "Bar"],
  TabPanel: ["DitherTabPanel"],
  Sidebar: ["DitherSidebar"],
  Group: ["DitherSidebarGroup"],
  Item: ["DitherSidebarItem"],
  Sub: ["DitherSidebarSub"],
}

/** Rows of a component's table that are not its props, by `file key`. */
const NOT_A_PROP: Record<string, string[]> = {
  "animations/AnimationsDocs.tsx sequences": [
    // the engine's functions, for a timeline of your own
    "planSequence(node | node[])",
    "sampleSequence(plan, t)",
    "staggerDelay(i, count, each, from)",
  ],
  "animations/AnimationsDocs.tsx containerQueries": [
    // the resolver's functions
    "resolveCq(width, scale?)",
    "quantize(value, step)",
    // what the host publishes for CSS, and the keyframes it ships
    "data-cq / --cq-w / --cq-h / --cq-i",
    "dither-cq-traverse / dither-cq-rise",
  ],
  // what the stage publishes for CSS
  "animations/AnimationsDocs.tsx stage": ["data-stage / --cq-w / --cq-h"],
  "animations/AnimationsDocs.tsx layer": [
    // what the layer writes on its element
    "style / data-layer",
    // the engine's functions
    "sampleKeyframes(track, t), keyframeTransform(sample, box?), resolveSample(sample, box), parseLength / termsToCss / termsToPx",
  ],
  // the player's keys
  "components/MediaDocs.tsx video": ["keyboard"],
  // what a shader's source may read
  "components/MediaDocs.tsx shader": ["uniforms"],
  // how a sprite of the set is drawn
  "primitives/PrimitivesDocs.tsx iconSet": ["use"],
}

/** Rows that name what the Solid component does not take: owed by the kit
 * (or by the table), never papered over here. */
const OWED: Record<string, string[]> = {
  // the pad only reports (`onUpdateModelValue`, `onChange`): it reads no value
  "forms/FormsDocs.tsx signaturePad": ["modelValue"],
}

const tables = docsTables()
const kit = kitProps()
const id = (t: { file: string; key: string }) => `${t.file} ${t.key}`
const componentOf = (t: { file: string; key: string }) => {
  const named = COMPONENT[t.file]
  if (named && t.key in named) return named[t.key]
  return `Dither${t.key[0].toUpperCase()}${t.key.slice(1).replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}`
}

/** Vue's words for what a Solid reader types otherwise (CSS's own at-rules,
 * selectors and properties set aside). */
const VUE_WORDS = /v-model|v-for|v-if|(^|[\s(])[@#:][a-z]|\bslot\b|\bscoped\b|\bemit|teleport|\btemplate\b/i
const sansCss = (text: string) => text.replace(/@(container|keyframes)\b|:focus-visible\b|\bgrid-template-\w+/g, "")

describe("the docs' API tables", () => {
  it("reads every table the docs print", () => {
    expect(tables.length).toBeGreaterThan(250)
    for (const t of tables) {
      for (const row of t.rows) expect(Object.keys(row).sort(), id(t)).toEqual(["default", "prop", "type"])
    }
    // every name the tables below key on is a table
    const known = new Set(tables.map(id))
    for (const [file, keys] of Object.entries(COMPONENT))
      for (const key of Object.keys(keys)) expect(known.has(`${file} ${key}`), `${file} ${key}`).toBe(true)
    for (const key of [...Object.keys(NOT_A_PROP), ...Object.keys(OWED)]) expect(known.has(key), key).toBe(true)
  })

  it("names a component of the kit for each, or says it documents a function", () => {
    for (const t of tables) {
      const component = componentOf(t)
      if (component !== null) expect(kit.has(component), `${id(t)} → ${component}`).toBe(true)
    }
    for (const parts of Object.values(PART)) for (const part of parts) expect(kit.has(part), part).toBe(true)
  })

  it("names only props the component takes, or what is listed as not one", () => {
    const missing: string[] = []
    const listed = new Set<string>()
    for (const t of tables) {
      const component = componentOf(t)
      if (component === null) continue
      const set = [...(NOT_A_PROP[id(t)] ?? []), ...(OWED[id(t)] ?? [])]
      for (const row of t.rows) {
        const part = / \((\w+)\)$/.exec(row.prop)
        const takers = part ? PART[part[1]] : [component]
        const names = row.prop.replace(/ \(\w+\)$/, "").split(" / ")
        const taken = takers !== undefined && takers.every((c) => names.every((name) => kit.get(c)!.has(name)))
        if (set.includes(row.prop)) {
          listed.add(`${id(t)} ${row.prop}`)
          // a listed row that has become a prop leaves the list
          expect(taken, `${id(t)}: ${row.prop} is a prop now`).toBe(false)
        } else if (!taken) missing.push(`${id(t)} (${takers?.join(", ")}): ${row.prop}`)
      }
    }
    expect(missing).toEqual([])
    // and nothing is listed that no table says
    for (const [key, props] of [...Object.entries(NOT_A_PROP), ...Object.entries(OWED)])
      for (const prop of props) expect(listed.has(`${key} ${prop}`), `${key}: ${prop}`).toBe(true)
  })

  it("says it in Solid's words: no v-model, event, slot or kebab-case prop", () => {
    for (const t of tables)
      for (const row of t.rows) {
        for (const cell of [row.prop, row.type, row.default])
          expect(VUE_WORDS.test(sansCss(cell)), `${id(t)}: ${cell}`).toBe(false)
        // a kebab-case name is an attribute or a keyframe the host carries, listed as such
        if (/(^| )[a-z]+-[a-z]/.test(row.prop)) expect(NOT_A_PROP[id(t)] ?? [], id(t)).toContain(row.prop)
      }
  })
})

describe("the docs' prose", () => {
  /** What a demo itself shows, as its authored snippet has it. */
  const DEMO_TEXT = ["teleported out"]

  it("describes the kit in Solid's words", () => {
    const said: string[] = []
    for (const file of new Set(tables.map((t) => t.file))) {
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
