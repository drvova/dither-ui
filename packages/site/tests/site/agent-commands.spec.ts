// The command table (`features/agent/commands.ts`) and what is read off it:
// the skill's command table (written by this spec with
// `WRITE_SKILL=1 npx vitest run tests/site/agent-commands.spec.ts`, failing
// while the committed one differs), the Studio's actions and the composer's
// steps; and every command's malformed input refused with the store as it
// was, nothing half done.
import { readFileSync, writeFileSync } from "node:fs"
import { beforeEach, describe, expect, it } from "vitest"
import { editor } from "@/entities/editor"
import { COMMANDS, type CommandType, registrySchema, runCommand, skillTable } from "@/features/agent/commands"
import { STUDIO_TOOLS } from "@/features/agent/tools"
import { STEPS } from "@/widgets/agent/model/steps"

const SKILL = "public/agent/SKILL.md"
const HEADER = "| type | fields |"

beforeEach(() => {
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
})

describe("the command table", () => {
  it("writes the skill's command table, every command once", () => {
    const text = readFileSync(SKILL, "utf8")
    const lines = text.split("\n")
    const start = lines.indexOf(HEADER)
    expect(start, "the skill's command table").toBeGreaterThan(0)
    let end = start
    while (lines[end + 1]?.startsWith("|")) end++
    const want = [...lines.slice(0, start), skillTable(), ...lines.slice(end + 1)].join("\n")
    if (process.env.WRITE_SKILL && want !== text) writeFileSync(SKILL, want)
    else expect(text).toBe(want)
  })

  it("gives the registry, the actions and the steps from its rows", () => {
    const types = Object.keys(COMMANDS)
    expect(Object.keys(registrySchema().commands)).toEqual(types)
    for (const t of STUDIO_TOOLS) expect(types).toContain(t.command)
    const names = STUDIO_TOOLS.map((t) => t.def.name)
    expect(new Set(names).size).toBe(names.length)
    expect(Object.keys(STEPS).sort()).toEqual([...names, "find", "build"].sort())
  })
})

/** The editor as a reader of it sees it. */
const store = () =>
  JSON.stringify({
    artboards: editor.artboards,
    groups: editor.groups,
    selected: editor.selectedIds,
    primary: editor.selectedArtboardId,
    viewport: editor.viewport,
  })

/** One frame of every kind, the chart grouped with the button. */
function canvas() {
  const id = (r: ReturnType<typeof runCommand>) => (r.ok ? (r.data as { id: string }).id : "")
  const chart = id(runCommand({ type: "chart.add", chart: "bar" }))
  const button = id(runCommand({ type: "widget.add", widget: "button" }))
  const slider = id(runCommand({ type: "component.add", is: "DitherSlider" }))
  const screen = id(runCommand({ type: "screen.add", rows: [{ cells: [{ is: "DitherBadge" }] }] }))
  const reel = id(runCommand({ type: "reel.add", clips: [chart, slider] }))
  runCommand({ type: "group", ids: [chart, button] })
  runCommand({ type: "artboard.select", id: slider })
  return { chart, button, slider, screen, reel }
}
type Canvas = ReturnType<typeof canvas>

/** Every command's malformed input (a command with no fields has none: it
 * ignores what it is not given). A command added to the table needs its row. */
const MALFORMED: Record<CommandType, (c: Canvas) => unknown[]> = {
  "artboard.list": () => [],
  "registry.get": () => [{ is: "DitherNope" }],
  "screen.add": () => [{}, { rows: "x" }, { rows: [{ cells: [] }] }, { rows: [{ cells: [{ is: "DitherNope" }] }] }],
  "component.add": () => [{}, { is: 5 }, { is: "DitherNope", name: "x" }],
  "chart.add": () => [{}, { chart: "donut", name: "x" }, { chart: 5 }],
  "widget.add": () => [{}, { widget: "rocket", name: "x" }],
  "reel.add": (c) => [{}, { clips: [] }, { clips: [5, {}] }, { clips: ["nope"] }, { clips: [c.reel] }],
  "artboard.update": (c) => [
    {},
    { id: 5, patch: {} },
    { id: "nope", patch: { name: "x" } },
    { id: c.chart },
    { id: c.chart, patch: [] },
    { id: c.chart, patch: { name: "x", rows: [] } },
    { id: c.chart, patch: { name: 5 } },
    { id: c.chart, patch: { name: "x", w: "wide" } },
    { id: c.chart, patch: { name: "x", hidden: "yes" } },
    { id: c.chart, patch: { name: "x", chart: 5 } },
    { id: c.chart, patch: { name: "x", widget: { label: "x" } } },
    { id: c.button, patch: { name: "x", chart: { seed: 3 } } },
    { id: c.button, patch: { name: "x", widget: [] } },
    { id: c.button, patch: { name: "x", widget: { label: "Go", kind: "screen" } } },
    { id: c.slider, patch: { name: "x", widget: { props: { max: 1 }, is: "DitherInput" } } },
    { id: c.slider, patch: { name: "x", widget: { props: { max: 1 }, rows: [] } } },
    { id: c.slider, patch: { name: "x", widget: { props: 5 } } },
    { id: c.slider, patch: { name: "x", widget: { props: { max: 1 }, slotText: 5 } } },
    { id: c.screen, patch: { name: "x", widget: { rows: 5 } } },
    { id: c.screen, patch: { name: "x", widget: { rows: [], gap: "wide" } } },
    { id: c.screen, patch: { name: "x", widget: { rows: [], value: 1 } } },
    { id: c.reel, patch: { name: "x", widget: { clips: "x" } } },
    { id: c.reel, patch: { name: "x", widget: { score: true, props: {} } } },
  ],
  "artboard.remove": () => [{}, { id: 5 }, { id: "nope" }],
  "artboard.select": () => [{}, { id: "nope" }, { ids: [5, "nope"] }],
  evolve: () => [{ id: "nope" }],
  "artboard.duplicate": () => [{ id: "nope" }, { ids: ["nope", 5] }],
  group: () => [{ id: "nope", name: "x" }],
  ungroup: () => [{}, { id: "nope" }],
  replay: () => [],
  view: () => [{ id: "nope" }, { zoom: -1 }, { zoom: "x" }, { to: "side" }],
  inspect: () => [{ id: "nope" }],
  "image.export": (c) => [{ id: "nope" }, { id: c.chart, scale: 5 }, { id: c.chart, scale: "2" }],
  "code.get": (c) => [{}, { id: "nope" }, { id: c.chart, styling: "sass" }],
  "document.get": () => [],
  "document.set": () => [{}, { document: 7 }, { document: { artboards: [] } }, { document: { artboards: "x" } }],
  "clock.seek": () => [{ seconds: -1 }, { seconds: "x" }],
  "clock.release": () => [],
  "video.export": () => [{ id: "nope" }],
}

describe("malformed commands", () => {
  for (const [type, inputs] of Object.entries(MALFORMED) as [CommandType, (c: Canvas) => unknown[]][])
    it(`${type}: refused, the store as it was`, () => {
      const c = canvas()
      const before = store()
      for (const input of inputs(c)) {
        const r = runCommand({ ...(input as object), type })
        expect(r.ok, JSON.stringify(input)).toBe(false)
        expect(store(), JSON.stringify(input)).toBe(before)
      }
    })

  it("refuses a command that is none", () => {
    for (const input of [null, 5, "x", [], {}, { type: 3 }, { type: "nope" }, { type: "toString" }])
      expect(runCommand(input).ok).toBe(false)
  })
})

describe("artboard.update", () => {
  it("says which field is wrong, and where a frame's own kind stands", () => {
    const c = canvas()
    const error = (patch: unknown, id = c.chart) => {
      const r = runCommand({ type: "artboard.update", id, patch })
      return r.ok ? "" : r.error
    }
    expect(error({ name: 5 })).toBe("patch.name must be a string")
    expect(error({ x: "1" })).toBe("patch.x must be a number")
    expect(error({ widget: { label: "x" } })).toContain("is a chart: patch it under chart")
    expect(error({ chart: { seed: 1 } }, c.button)).toContain("shows a button: patch it under widget")
    expect(error({ widget: { kind: "screen" } }, c.button)).toContain("patch.widget.kind is button")
    expect(error({ widget: { is: "DitherInput" } }, c.slider)).toContain("patch.widget.is is DitherSlider")
    expect(error({ widget: { model: 3 } }, c.slider)).toBe(
      "patch.widget does not take model for a component; it takes props, value, slotText",
    )
  })

  it("keeps a frame's kind and takes what each kind takes", () => {
    const c = canvas()
    const frame = (id: string) => editor.artboards.find((a) => a.id === id)!
    const held = frame(c.screen)
    // A frame echoed back whole keeps its kind and identity.
    const echo = { ...JSON.parse(JSON.stringify(frame(c.slider).widget)), props: { max: 7 } }
    delete echo.model
    delete echo.slotText
    expect(runCommand({ type: "artboard.update", id: c.slider, patch: { widget: echo } })).toMatchObject({ ok: true })
    expect(frame(c.slider).widget).toMatchObject({ kind: "component", is: "DitherSlider", props: { max: 7 } })
    expect(runCommand({ type: "artboard.update", id: c.screen, patch: { widget: { gap: 4, padding: 8 } } }).ok).toBe(
      true,
    )
    expect(frame(c.screen).widget).toMatchObject({ kind: "screen", gap: 4, padding: 8 })
    // The store's own frame is changed in place, so a reader holding it sees it.
    expect(held).toBe(frame(c.screen))
    expect(
      runCommand({ type: "artboard.update", id: c.button, patch: { widget: { label: "Go", kind: "button" } } }),
    ).toMatchObject({ ok: true })
    expect(frame(c.button).widget).toMatchObject({ kind: "button", label: "Go" })
  })
})

describe("evolve", () => {
  it("reads a count that is no number as the default, never as no variants", () => {
    const c = canvas()
    const r = runCommand({ type: "evolve", id: c.chart, count: "x", seed: 2 })
    expect(r.ok && (r.data as unknown[]).length).toBe(4)
  })
})
