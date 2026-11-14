// What every docs card shows against what its Code tab gives. An example
// written once (`pages/docs/<pack>/examples/<id>.tsx`) is both the demo and
// the code, so it cannot drift. A card whose code is still a string beside
// its demo is held here: the string is compiled and run the way Run runs it
// (`widgets/source/model/run.ts`), rendered beside the demo, and its DOM
// must stand inside the demo's (each node of the snippet on a node of the
// demo, in order, its classes among the demo's; a demo may wrap it and add
// what the page shows around it). Where the two say different things the
// difference is pinned, by the snippet's first node the demo does not hold,
// in `DIFFERS`: a change to either side that moves it fails here.
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { describe, expect, it, vi } from "vitest"
import { world } from "@dither-ui/kit/testing/world.ts"
import { kitFiles } from "../../build/kit-sources"
import { SHOWN_SECTION } from "../../src/pages/docs/DocSection"
import { PACK_LOADERS } from "../../src/pages/docs/pack-loaders"
import { PACK_NAMES, PACKS } from "../../src/pages/docs/packs"
import { loadKitIndex } from "../../src/widgets/source/model/files"
import { run } from "../../src/widgets/source/model/run"
import { asTsx, snippetKind } from "../../src/widgets/source/model/snippet"
import { DIFFERS } from "./docs-drift"

// No GPU in jsdom: a shader says so, a world keeps to its CPU engine.
vi.mock("@dither-ui/kit/engine/gl.ts", async (original) => ({
  ...(await original<typeof import("@dither-ui/kit/engine/gl.ts")>()),
  createGl: () => null,
}))

// A DemoCard stands as its demo alone, and keeps the code it is given.
const cards = vi.hoisted(() => ({ codes: [] as string[] }))
vi.mock("../../src/pages/docs/DemoCard", async (original) => {
  const real = await original<typeof import("../../src/pages/docs/DemoCard")>()
  const Card = (props: Parameters<typeof real.default>[0]) => (
    <div data-card={cards.codes.push(props.code) - 1}>{props.children}</div>
  )
  return { ...real, default: Card }
})

/** The examples written once: their text is the code their card is given. */
const EXAMPLES = new Set(
  Object.values(
    import.meta.glob<string>("../../src/pages/docs/*/examples/*.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ),
)

const SOLID = await kitFiles()
const solidFiles = SOLID.map((f) => f.file)
const read = (file: string) => readFileSync(SOLID.find((f) => f.file === file)!.path, "utf8")
const INDEX = await loadKitIndex(async (f) => read(f), solidFiles, "solid/index.ts")
const KIT_NAMES = new Set(INDEX.keys())

/** A tree as both sides are compared: ids a render made up stand as one,
 * and what a surface sets as it runs (an inline style, a canvas's size, a
 * loading state) is left out. */
function normal(el: Element): Element {
  const copy = el.cloneNode(true) as Element
  for (const e of copy.querySelectorAll("*"))
    for (const a of [...e.attributes])
      if (/^(id|for|aria-(labelledby|describedby|controls|owns|activedescendant))$/.test(a.name))
        e.setAttribute(a.name, "#")
      else if (a.name === "style" || a.name === "data-state" || (e.tagName === "CANVAS" && a.name !== "class"))
        e.removeAttribute(a.name)
  return copy
}
const words = (n: Node) => (n.nodeType === Node.TEXT_NODE ? (n.textContent ?? "").replace(/\s+/g, " ").trim() : "")
const nodes = (n: Node) => [...n.childNodes].filter((k) => k.nodeType === Node.ELEMENT_NODE || words(k))
function sameTag(s: Element, d: Element) {
  if (s.tagName !== d.tagName) return false
  for (const a of s.attributes) {
    if (a.name !== "class") {
      if (d.getAttribute(a.name) !== a.value) return false
      continue
    }
    const have = new Set((d.getAttribute("class") ?? "").split(/\s+/))
    if (!a.value.split(/\s+/).every((c) => !c || have.has(c))) return false
  }
  return true
}
/** Whether a snippet's nodes stand, in order, on the demo's nodes under
 * `d`: each on a node of its own, or a run of them inside one the demo wraps
 * them in. */
function within(snippet: Node[], d: Node): boolean {
  let i = 0
  for (const k of nodes(d)) {
    if (i === snippet.length) break
    if (matches(snippet[i], k)) i++
    else if (k.nodeType === Node.ELEMENT_NODE)
      for (let j = snippet.length; j > i; j--)
        if (within(snippet.slice(i, j), k)) {
          i = j
          break
        }
  }
  return i === snippet.length
}
function matches(s: Node, d: Node): boolean {
  if (s.nodeType === Node.TEXT_NODE) return d.nodeType === Node.TEXT_NODE && words(s) === words(d)
  return d.nodeType === Node.ELEMENT_NODE && sameTag(s as Element, d as Element) && within(nodes(s), d)
}
const html = (n: Node) => (n.nodeType === Node.TEXT_NODE ? words(n) : (n as Element).outerHTML).replace(/\s+/g, " ")

/** A difference as it is pinned: both sides' DOM as one short hash (any
 * change to either moves it), then the snippet's first node the demo does
 * not hold, cut short, for the reader of the table. */
function difference(snippet: Node[], demo: Element): string {
  const hash = createHash("sha256")
    .update(snippet.map(html).join(""))
    .update("\0")
    .update(demo.innerHTML.replace(/\s+/g, " "))
    .digest("hex")
    .slice(0, 10)
  const lost = snippet.find((s) => !within([s], demo))
  return `${hash} ${lost ? html(lost).slice(0, 72) : "(each node held, not in one order)"}`
}

/** The pinned table as its module writes it. */
const table = (found: Record<string, string>) =>
  `// Generated by docs-drift.spec.tsx (WRITE_DRIFT=1, then rs fmt): every docs card
// whose code is a string that says something its demo does not show, by
// \`<section>:<n>\`. Each entry is a debt: write the example once
// (\`pages/docs/<pack>/examples/<id>.tsx\`) or make the two agree, and the
// spec asks for the entry to go.
export const DIFFERS: Record<string, string> = {
${Object.entries(found)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n")}
}
`

describe("the docs' examples against their demos", () => {
  it("holds every code string a card still keeps to the demo beside it", async () => {
    const w = world()
    // a 2D context that answers every call, for the demos that measure text
    const recorded = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string) {
      if (kind !== "2d") return null
      const base = recorded.call(this, "2d") as unknown as Record<string, unknown>
      const measure = () => ({ width: 10 })
      const blank = () => ({
        data: new Uint8ClampedArray(4),
        addColorStop() {},
      })
      return new Proxy(base, {
        get(t, k) {
          if (typeof k === "string" && k in t) return t[k]
          return k === "measureText" ? measure : blank
        },
        set: () => true,
      })
    } as never
    vi.stubGlobal("scrollTo", vi.fn())
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))
    const roots: HTMLElement[] = []
    for (const name of PACK_NAMES) {
      const Pack = (await PACK_LOADERS[name]()).default
      const [shown, show] = createSignal("")
      roots.push(
        render(() => (
          <SHOWN_SECTION.Provider value={shown}>
            <Pack />
          </SHOWN_SECTION.Provider>
        )).container,
      )
      for (const { id } of PACKS[name]) show(id)
    }
    w.show()
    const seen = new Map<string, number>()
    const strings: { key: string; demo: Element; tsx: string }[] = []
    let once = 0
    for (const root of roots)
      for (const card of root.querySelectorAll<HTMLElement>("[data-card]")) {
        const code = cards.codes[Number(card.dataset.card)]
        const section = card.closest("section[id]")?.id ?? "?"
        const n = (seen.get(section) ?? 0) + 1
        seen.set(section, n)
        if (EXAMPLES.has(code)) once++
        else if (["file", "fragment"].includes(snippetKind(code)))
          strings.push({
            key: `${section}:${n}`,
            demo: normal(card),
            tsx: asTsx(code, KIT_NAMES),
          })
      }
    cleanup()
    const found: Record<string, string> = {}
    for (const { key, demo, tsx } of strings) {
      const result = await run({
        scope: key,
        example: { path: "Example.tsx", text: tsx },
        kit: [],
        index: INDEX,
        files: solidFiles,
        source: async (f) => read(f),
      })
      const host = render(() => <result.component />).container
      w.show()
      const snippet = nodes(normal(host))
      if (!within(snippet, demo)) found[key] = difference(snippet, demo)
      cleanup()
    }
    w.restore()
    HTMLCanvasElement.prototype.getContext = recorded
    vi.unstubAllGlobals()
    expect(once).toBeGreaterThan(60)
    expect(strings.length).toBeGreaterThan(200)
    // `WRITE_DRIFT=1 npx vitest run tests/site/docs-drift.spec.tsx` rewrites the table
    if (process.env.WRITE_DRIFT) writeFileSync(join(process.cwd(), "tests/site/docs-drift.ts"), table(found))
    else expect(found).toEqual(DIFFERS)
  }, 600000)
})
