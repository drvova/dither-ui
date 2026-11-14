// The Studio's panels: the inspector (with its avatar grid, its spec-driven
// component rows and the reel's cut), the layer tree, the title bar and the
// canvas's bar, each rendered and driven.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { createMutable } from "solid-js/store"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createArtboard } from "@/entities/artboard/model/factory"
import { layersOf } from "@/entities/chart"
import {
  type AvatarModel,
  componentEntry,
  createCell,
  createComponent,
  createReel,
  createRow,
  createScreen,
  SIMPLE_WIDGET_KINDS,
} from "@/entities/widget"
import { CHART_TYPES } from "@/shared/config"
import { createWidget } from "@/entities/widget/model/factory"
import { GLIDE_BEZIER } from "@dither-ui/kit/engine/dither-paint.ts"
import {
  deselect,
  editor,
  groupSelected,
  selectArtboard,
  selectLayer,
  selectMany,
  stopInspecting,
} from "../../src/entities/editor"
import { handoff } from "../../src/features/agent/handoff"
import { STUDIO_TOOLS } from "../../src/features/agent/tools"
import { history, resetHistory, stopHistory } from "../../src/features/history"
import { activeProjectId, projects, stopAutosave } from "../../src/features/persistence"
import { presets } from "../../src/features/presets"
import { LAYER_PANELS, WIDGET_PANELS } from "../../src/widgets/inspector/panels"
import ReelPanel from "../../src/widgets/inspector/panels/ReelPanel"
import AvatarDrawGrid from "../../src/widgets/inspector/ui/AvatarDrawGrid"
import ComponentPropsPanel from "../../src/widgets/inspector/ui/ComponentPropsPanel"
import { Inspector } from "../../src/widgets/inspector"
import { LayerTree } from "../../src/widgets/layer-tree"
import { CanvasBar, Toolbar, type ToolbarApi } from "../../src/widgets/toolbar"

const ZW = "​"
// The specs run from the package: a path is from the repository's root.
const root = "../.."
const read = (path: string) => readFileSync(join(root, path), "utf8")

beforeEach(() => {
  stopHistory()
  stopAutosave()
  stopInspecting()
  localStorage.clear()
  editor.artboards = [createArtboard("bar"), createArtboard("button")]
  editor.groups = []
  editor.dataOpen = false
  editor.viewport = { x: 96, y: 88, zoom: 1 }
  handoff.picking = false
  projects.splice(0, projects.length)
  activeProjectId.value = ""
  presets.splice(0, presets.length)
  deselect()
  resetHistory()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const input = (c: Element, name: string) => c.querySelector<HTMLInputElement>(`[name="${name}"]`)!
const type = (el: HTMLInputElement, value: string) => fireEvent.input(el, { target: { value } })
const key = (c: Element, label: string) => c.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const button = (c: Element, text: string) =>
  [...c.querySelectorAll("button")].find((b) => b.textContent?.trim() === text) as HTMLButtonElement
/** An option of the segmented control named `label`. */
const option = (c: Element, label: string, text: string) =>
  button([...c.querySelectorAll(".prop-name")].find((n) => n.textContent === label)!.parentElement!, text)

describe("the canvas bar", () => {
  const keys = (c: Element) =>
    [...c.querySelectorAll("button")].map((b) => ({
      agent: b.getAttribute("data-agent"),
      name: b.getAttribute("aria-label"),
      off: b.hasAttribute("disabled"),
    }))

  it("keeps every key, in order, whatever is selected", () => {
    const { container } = render(() => <CanvasBar />)
    const [chart, button] = editor.artboards
    const shapes: string[][] = []
    const look = () =>
      shapes.push(
        [...container.querySelectorAll("button")].map(
          (b) => b.getAttribute("data-key") ?? b.getAttribute("aria-label") ?? "",
        ),
      )
    look()
    selectArtboard(chart.id)
    look()
    selectArtboard(button.id)
    look()
    selectMany([chart.id, button.id])
    groupSelected()
    look()
    for (const s of shapes) expect(s).toEqual(shapes[0])
    // Grouped, the group key ungroups; the slot is the same.
    expect(container.querySelector('[data-key="group"]')!.getAttribute("aria-label")).toBe("Ungroup")
  })

  it("disables what needs a selection, and the data key for anything but a chart", () => {
    const { container } = render(() => <CanvasBar />)
    const on = () =>
      keys(container)
        .filter((k) => !k.off)
        .map((k) => k.agent)
    expect(on()).toEqual(["set_view", "set_view", "set_view", "set_view", "replay", "inspect"])
    selectArtboard(editor.artboards[1].id)
    expect(container.querySelector('[data-key="data"]')!.hasAttribute("disabled")).toBe(true)
    selectArtboard(editor.artboards[0].id)
    expect(container.querySelector('[data-key="data"]')!.hasAttribute("disabled")).toBe(false)
  })

  it("names every key and gives each to the agent as one of its actions", () => {
    const { container } = render(() => <CanvasBar />)
    const tools = STUDIO_TOOLS.map((t) => t.def.name)
    for (const k of keys(container)) {
      expect(k.name, String(k.agent)).toMatch(/^[A-Z]/)
      expect(tools, String(k.name)).toContain(k.agent)
    }
  })

  it("steps aside while the workbench inspects", async () => {
    const { container } = render(() => <CanvasBar />)
    fireEvent.click(container.querySelector('[data-key="inspect"]')!)
    expect(editor.inspecting).toBe(true)
    await vi.waitFor(() => expect(container.querySelector('[role="toolbar"]')).toBeNull())
    stopInspecting()
    expect(container.querySelector('[role="toolbar"]')).not.toBeNull()
  })

  it("steps aside while frames are picked for the agent", async () => {
    const { container } = render(() => <CanvasBar />)
    handoff.picking = true
    await vi.waitFor(() => expect(container.querySelector('[role="toolbar"]')).toBeNull())
  })

  it("keeps a key's element as what it does turns, presses the data key, and asks for the exports", () => {
    const onExport = vi.fn()
    const onVideo = vi.fn()
    const { container } = render(() => <CanvasBar onExport={onExport} onVideo={onVideo} />)
    const data = container.querySelector<HTMLButtonElement>('[data-key="data"]')!
    const group = container.querySelector<HTMLButtonElement>('[data-key="group"]')!
    expect(data.hasAttribute("aria-pressed")).toBe(true)
    expect(group.hasAttribute("aria-pressed")).toBe(false)
    selectArtboard(editor.artboards[0].id)
    fireEvent.click(data)
    expect(editor.dataOpen).toBe(true)
    expect(data.getAttribute("aria-pressed")).toBe("true")
    expect(container.querySelector('[role="toolbar"]')!.classList.contains("is-raised")).toBe(true)
    fireEvent.click(group)
    expect(group.getAttribute("title")).toBe("Ungroup (⌘⇧G)")
    expect(container.querySelector('[data-key="data"]')).toBe(data)
    expect(container.querySelector('[data-key="group"]')).toBe(group)
    fireEvent.click(container.querySelector('[data-key="code"]')!)
    fireEvent.click(container.querySelector('[data-key="video"]')!)
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onVideo).toHaveBeenCalledTimes(1)
  })

  it("says what is selected and the zoom, and steps the view", () => {
    const { container } = render(() => <CanvasBar />)
    const what = container.querySelector(".what")!
    expect(what.textContent).toBe("Nothing selected")
    expect(what.classList.contains("is-none")).toBe(true)
    selectArtboard(editor.artboards[0].id)
    expect(what.textContent).toBe(editor.artboards[0].name)
    selectMany(editor.artboards.map((a) => a.id))
    expect(what.textContent).toBe("2 selected")
    expect(key(container, "Zoom to 100%").textContent).toBe("100%")
    fireEvent.click(key(container, "Zoom in"))
    expect(editor.viewport.zoom).toBeGreaterThan(1)
    fireEvent.click(key(container, "Zoom to 100%"))
    expect(editor.viewport.zoom).toBe(1)
  })
})

describe("the inspector's name column", () => {
  it("is the one name width: no row keeps a fixed width of its own beside a control", () => {
    const dir = "packages/site/src/widgets/inspector"
    const files = readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => join(dir, f))
    expect(files.length).toBe(23)
    // A fixed width that will not shrink, on anything but a readout of a value.
    const own = files.flatMap((f) =>
      [...read(f).matchAll(/<span\s+class="([^"]*)"\s*>([^<]+)<\/span>/g)]
        .filter(([, cls]) => /\bw-\d+\b/.test(cls) && /\bshrink-0\b/.test(cls) && !/tabular-nums/.test(cls))
        .map(([, cls, text]) => `${f}: "${text.trim()}" (${cls})`),
    )
    expect(own).toEqual([])
  })

  it("wears it on every property row, long names broken", () => {
    const entry = componentEntry("DitherFaultyTerminal")!
    const props = createMutable(Object.fromEntries(entry.props.map((p) => [p.key, p.def])) as Record<string, unknown>)
    const { container } = render(() => <ComponentPropsPanel entry={entry} target={{ props, slotText: null }} />)
    const names = [...container.querySelectorAll(".prop-name")].map((n) => n.textContent ?? "")
    expect(names).toContain(`chromatic${ZW}Aberration`)
    // Every text, list, number and choice property has its name in the column.
    const rowed = entry.props.filter((p) => ["text", "url", "list", "number", "select"].includes(p.kind))
    expect(names.map((n) => n.replaceAll(ZW, ""))).toEqual(rowed.map((p) => p.key))
    // The field's own name keeps its letters.
    expect(container.querySelector('input[name="chromaticAberration"]')).not.toBeNull()
  })
})

describe("a component's property rows", () => {
  it("writes each kind of property to the model, a list split at its commas", () => {
    const entry = componentEntry("DitherCombobox") ?? componentEntry("DitherSelect")!
    const target = createMutable({
      props: Object.fromEntries(entry.props.map((p) => [p.key, p.def])) as Record<string, unknown>,
      slotText: "Words" as string | null,
    })
    const { container } = render(() => <ComponentPropsPanel entry={entry} target={target} />)
    type(input(container, "component-slot"), "Other words")
    expect(target.slotText).toBe("Other words")
    const list = entry.props.find((p) => p.kind === "list")!
    const field = input(container, `prop-${list.key}`)
    expect(field.value).toBe((list.def as string[]).join(", "))
    field.value = " one, two ,, three "
    fireEvent.change(field)
    expect(target.props[list.key]).toEqual(["one", "two", "three"])
    const flag = entry.props.find((p) => p.kind === "boolean")
    if (flag) {
      fireEvent.click(input(container, flag.key))
      expect(target.props[flag.key]).toBe(!flag.def)
    }
  })

  it("keeps a script out of a url property", () => {
    const entry = {
      ...componentEntry("DitherFaultyTerminal")!,
      props: [{ key: "href", kind: "url", def: "" }] as const,
    }
    const target = createMutable({ props: { href: "" } as Record<string, unknown>, slotText: null })
    const { container } = render(() => (
      <ComponentPropsPanel entry={{ ...entry, props: [...entry.props] }} target={target} />
    ))
    const field = input(container, "prop-href")
    expect(field.type).toBe("url")
    type(field, "https://dither-ui.com/docs")
    expect(target.props.href).toBe("https://dither-ui.com/docs")
    type(field, "javascript:alert(1)")
    expect(target.props.href).toBe("")
  })
})

describe("the avatar's grid", () => {
  const avatar = () => createMutable({ ...(createWidget("avatar") as AvatarModel), grid: 4 })
  const cells = (c: Element) => [...c.querySelectorAll<HTMLButtonElement>('button[aria-label^="Cell"]')]
  const lit = (a: AvatarModel) => a.pattern!.on.filter(Boolean).length

  it("draws a cell a square of the grid, and paints from the seeded pattern", () => {
    const a = avatar()
    const { container } = render(() => <AvatarDrawGrid avatar={a} />)
    expect(cells(container)).toHaveLength(16)
    expect(a.pattern).toBeNull()
    fireEvent.pointerDown(cells(container)[0])
    expect(a.pattern!.on).toHaveLength(16)
    const was = a.pattern!.on[0]
    fireEvent.pointerDown(cells(container)[0])
    expect(a.pattern!.on[0]).toBe(was ? 0 : 1)
  })

  it("paints both sides of the mirror, and drags only with the button held", () => {
    const a = avatar()
    a.mirror = "horizontal"
    const { container } = render(() => <AvatarDrawGrid avatar={a} />)
    fireEvent.click(button(container, "clear"))
    expect(lit(a)).toBe(0)
    fireEvent.pointerDown(cells(container)[0])
    expect([a.pattern!.on[0], a.pattern!.on[3]]).toEqual([1, 1])
    fireEvent.pointerEnter(cells(container)[4], { buttons: 0 })
    expect(a.pattern!.on[4]).toBe(0)
    fireEvent.pointerEnter(cells(container)[4], { buttons: 1 })
    expect([a.pattern!.on[4], a.pattern!.on[7]]).toEqual([1, 1])
    a.mirror = "vertical"
    fireEvent.pointerEnter(cells(container)[1], { buttons: 1 })
    expect([a.pattern!.on[1], a.pattern!.on[13]]).toEqual([1, 1])
  })

  it("clears, fills, inverts and goes back to the seed", () => {
    const a = avatar()
    const { container } = render(() => <AvatarDrawGrid avatar={a} />)
    fireEvent.click(button(container, "fill"))
    expect(lit(a)).toBe(16)
    expect(cells(container)[0].style.backgroundColor).not.toBe("var(--color-background)")
    fireEvent.click(button(container, "invert"))
    expect(lit(a)).toBe(0)
    expect(cells(container)[0].style.backgroundColor).toBe("var(--color-background)")
    fireEvent.click(button(container, "from seed"))
    const seeded = [...a.pattern!.on]
    fireEvent.click(button(container, "clear"))
    fireEvent.click(button(container, "from seed"))
    expect([...a.pattern!.on]).toEqual(seeded)
  })
})

describe("the reel's cut", () => {
  function cut() {
    const [chart, plain] = editor.artboards
    const frame = createArtboard("button")
    frame.widget = createReel([chart.id, plain.id])
    editor.artboards.push(frame)
    const held = editor.artboards[2]
    const reel = held.widget as ReturnType<typeof createReel>
    const view = render(() => <ReelPanel widget={reel} artboard={held} />)
    const clips = () => [...view.container.querySelectorAll<HTMLElement>("[data-reel-clip]")]
    return { ...view, reel, chart, plain, clips }
  }

  it("lists the clips by their frames' names, in order, with the cut's length", () => {
    const { container, reel, chart, plain, clips } = cut()
    expect(clips().map((c) => c.getAttribute("data-reel-clip"))).toEqual([chart.id, plain.id])
    expect(clips()[0].textContent).toContain(chart.name)
    expect(container.querySelector(".tabular-nums")!.textContent).toBe("6s")
    expect(key(clips()[0], "Move clip earlier").disabled).toBe(true)
    expect(key(clips()[1], "Move clip later").disabled).toBe(true)
    reel.clips[0].seconds = 1.5
    expect(container.querySelector(".tabular-nums")!.textContent).toBe("4.5s")
  })

  it("reorders, drops and adds clips; a reel is never offered as a clip", () => {
    const { container, reel, chart, plain, clips } = cut()
    fireEvent.click(key(clips()[0], "Move clip later"))
    expect(reel.clips.map((c) => c.id)).toEqual([plain.id, chart.id])
    expect(clips().map((c) => c.getAttribute("data-reel-clip"))).toEqual([plain.id, chart.id])
    fireEvent.click(key(clips()[0], "Remove clip"))
    expect(reel.clips.map((c) => c.id)).toEqual([chart.id])
    const add = container.querySelector<HTMLSelectElement>('select[name="add-clip"]')!
    expect([...add.options].map((o) => o.value)).toEqual(["", chart.id, plain.id])
    add.value = plain.id
    fireEvent.change(add)
    expect(reel.clips.map((c) => c.id)).toEqual([chart.id, plain.id])
    expect(add.value).toBe("")
    reel.clips.splice(0, 2)
    expect(container.textContent).toContain("No clips yet")
  })

  it("sets how a clip comes in, its move, its chapter and its callouts", () => {
    const { reel, clips } = cut()
    const first = clips()[0]
    const by = first.querySelector<HTMLSelectElement>('select[name="clip-0-in"]')!
    expect(by.value).toBe(reel.clips[0].transition.kind)
    by.value = "cut"
    fireEvent.change(by)
    expect(reel.clips[0].transition.kind).toBe("cut")
    expect(input(first, "over")).toBeNull()
    by.value = "wipe"
    fireEvent.change(by)
    expect(input(first, "over")).not.toBeNull()

    const camera = first.querySelector<HTMLSelectElement>('select[name="clip-0-camera"]')!
    const move = [...camera.options].map((o) => o.value).find((v) => v !== camera.value && v !== "custom")!
    camera.value = move
    fireEvent.change(camera)
    expect(camera.value).toBe(move)

    expect(input(first, "clip-0-spec-0-figure")).toBeNull()
    type(input(first, "clip-0-chapter"), "A line")
    expect(reel.clips[0].chapter).toEqual({ line: "A line", spec: [] })
    type(input(first, "clip-0-spec-1-words"), "components")
    expect(reel.clips[0].chapter!.spec).toEqual([
      ["", ""],
      ["", "components"],
    ])
    type(input(first, "clip-0-chapter"), "  ")
    expect(reel.clips[0].chapter).toBeNull()

    fireEvent.click(button(first, "Add a callout"))
    expect(reel.clips[0].callouts).toHaveLength(1)
    expect(first.querySelector("summary")!.textContent).toBe("callouts 1")
    type(input(first, "clip-0-callout-0-label"), "Here")
    expect(reel.clips[0].callouts[0].label).toBe("Here")
    fireEvent.click(key(first, "Remove callout 1"))
    expect(reel.clips[0].callouts).toHaveLength(0)
  })

  it("scores the cut by a seed, and offers the preview only with a score and a clip", () => {
    const { container, reel } = cut()
    reel.score = null
    expect(input(container, "seed")).toBeNull()
    expect(button(container, "Play with score")).toBeUndefined()
    fireEvent.click(input(container, "score"))
    expect(reel.score).toEqual({ seed: 1 })
    type(input(container, "seed"), "7.6")
    expect(reel.score).toEqual({ seed: 8 })
    expect(button(container, "Play with score").getAttribute("aria-pressed")).toBe("false")
  })
})

describe("the inspector", () => {
  it("asks for a selection when there is none", () => {
    const { container } = render(() => <Inspector />)
    expect(container.textContent).toBe("Select an artboard to edit its properties.")
  })

  it("edits the selected frame: its name, its box and its chart's type", () => {
    const { container } = render(() => <Inspector />)
    const chart = editor.artboards[0]
    selectArtboard(chart.id)
    expect(container.querySelector(".truncate")!.textContent).toBe("BarChart")
    type(input(container, "artboard-name"), "Sales")
    expect(chart.name).toBe("Sales")
    type(input(container, "W"), "100")
    expect(chart.w).toBe(260)
    const pressed = () => container.querySelector('button[aria-pressed="true"]')!.textContent?.trim()
    expect(pressed()).toBe("bar")
    expect(input(container, "bar-gap")).not.toBeNull()
    fireEvent.click(button(container, "pie"))
    expect(chart.chart.type).toBe("pie")
    expect(pressed()).toBe("pie")
    expect(input(container, "bar-gap")).toBeNull()
    expect(input(container, "pie-pop")).not.toBeNull()
    // Margins and the stack belong to the cartesian family.
    expect(input(container, "top")).toBeNull()
  })

  it("writes a slider as a number and shows its reading, the slider held to its own range", () => {
    const { container } = render(() => <Inspector />)
    const chart = editor.artboards[0]
    selectArtboard(chart.id)
    const gap = input(container, "bar-gap")
    expect([gap.min, gap.max, gap.step]).toEqual(["0", "0.7", "0.02"])
    expect(Number(gap.value)).toBe(chart.chart.barGap)
    type(gap, "0.5")
    expect(chart.chart.barGap).toBe(0.5)
    expect(gap.parentElement!.lastElementChild!.textContent).toBe("0.50")
    type(input(container, "cell"), "4")
    expect(chart.chart.cell).toBe(4)
    expect(input(container, "cell").parentElement!.lastElementChild!.textContent).toBe("4px")
  })

  it("rolls and clears the seed, and opens the curve for a custom easing", () => {
    const { container } = render(() => <Inspector />)
    const chart = editor.artboards[0]
    selectArtboard(chart.id)
    fireEvent.click(button(container, "Roll"))
    expect(chart.chart.seed).toBeTypeOf("number")
    fireEvent.click(button(container, "clear"))
    expect(chart.chart.seed).toBeUndefined()
    expect(button(container, "clear")).toBeUndefined()
    chart.chart.easing = "ease-out"
    fireEvent.click(option(container, "easing", "custom"))
    expect(chart.chart.easing).toEqual([0.33, 1, 0.68, 1])
    fireEvent.click(option(container, "easing", "linear"))
    expect(chart.chart.easing).toBe("linear")
  })

  it("holds a locked frame's fields until it is unlocked", () => {
    const { container } = render(() => <Inspector />)
    const chart = editor.artboards[0]
    selectArtboard(chart.id)
    expect(button(container, "Unlock")).toBeUndefined()
    chart.locked = true
    const fields = input(container, "artboard-name").closest(".overflow-y-auto")!
    expect(fields.className).toContain("pointer-events-none")
    fireEvent.click(button(container, "Unlock"))
    expect(chart.locked).toBe(false)
    expect(fields.className).not.toContain("pointer-events-none")
  })

  it("edits a series, the grid and the legend by the layer picked", () => {
    const { container } = render(() => <Inspector />)
    const chart = editor.artboards[0]
    selectArtboard(chart.id)
    const series = chart.chart.series[0]
    selectLayer(`${chart.id}:series:${series.key}`)
    type(input(container, "series-label"), "Revenue")
    expect(series.label).toBe("Revenue")
    const dots = series.dots.on
    fireEvent.click(input(container, "dots at every point"))
    expect(series.dots.on).toBe(!dots)
    selectLayer(`${chart.id}:grid`)
    type(input(container, "grid-dash"), "2 4")
    expect(chart.chart.grid.dash).toBe("2 4")
    selectLayer(`${chart.id}:legend`)
    fireEvent.click(button(container, "right"))
    expect(chart.chart.legend.align).toBe("right")
  })

  it("builds a widget frame by its kind: a button, a screen's rows and cells, a reel", () => {
    const { container } = render(() => <Inspector />)
    const frame = editor.artboards[1]
    selectArtboard(frame.id)
    expect(container.querySelector(".shrink-0.rounded")!.textContent).toBe("button")
    type(input(container, "button-label"), "Go")
    expect(frame.widget).toMatchObject({ kind: "button", label: "Go" })
    // No chart sections on a widget frame.
    expect(container.textContent).not.toContain("Margins")

    const screen = createScreen()
    screen.rows = [createRow([createCell(componentEntry("DitherSwitch")!)])]
    frame.widget = screen
    const held = (editor.artboards[1].widget as typeof screen).rows[0]
    expect(input(container, "row gap")).not.toBeNull()
    fireEvent.click(button(container, "+ row"))
    expect((editor.artboards[1].widget as typeof screen).rows).toHaveLength(2)
    selectLayer(`${frame.id}:row:${held.id}`)
    fireEvent.click(button(container, "end"))
    expect(held.align).toBe("end")
    const add = container.querySelector<HTMLSelectElement>('select[name="add-cell"]')!
    add.value = "DitherSwitch"
    fireEvent.change(add)
    expect(held.cells).toHaveLength(2)
    // The new cell is picked: its own rows show.
    expect(editor.selectedLayerId).toBe(`${frame.id}:cell:${held.cells[1].id}`)
    fireEvent.click(input(container, "grow (fill row)"))
    expect(held.cells[1].grow).toBe(!createCell(componentEntry("DitherSwitch")!).grow)
    fireEvent.click(button(container, "Move left"))
    expect(editor.selectedLayerId).toBe(`${frame.id}:cell:${held.cells[0].id}`)
    fireEvent.click(button(container, "delete"))
    expect(held.cells).toHaveLength(1)

    frame.widget = createReel([editor.artboards[0].id])
    selectArtboard(frame.id)
    expect(container.querySelector("[data-reel-clip]")).not.toBeNull()
  })

  it("has a panel for every layer kind and every widget kind, and shows it", () => {
    const charts = CHART_TYPES.map((t) => createArtboard(t))
    const parts = [createComponent(componentEntry("DitherSwitch")!), createScreen(), createReel([charts[0].id])]
    const widgets = [
      ...SIMPLE_WIDGET_KINDS.map((k) => createArtboard(k)),
      ...parts.map((widget) => ({ ...createArtboard("button"), widget })),
    ]
    editor.artboards = [...charts, ...widgets]
    // Every kind a frame's layers come in has its panel, and every panel is reached.
    const layers = charts.flatMap((a) => layersOf(a.chart, a.id))
    expect([...new Set(layers.map((l) => l.kind))].sort()).toEqual(Object.keys(LAYER_PANELS).sort())
    expect(widgets.map((a) => a.widget!.kind).sort()).toEqual(Object.keys(WIDGET_PANELS).sort())

    const { container } = render(() => <Inspector />)
    const panel = () => container.querySelector(".overflow-y-auto")!
    for (const l of layers) {
      selectArtboard(l.id.split(":")[0])
      selectLayer(l.id)
      expect(panel().childElementCount, l.id).toBeGreaterThan(0)
    }
    // A widget frame's panel stands under the frame's name and box.
    for (const a of widgets) {
      selectArtboard(a.id)
      expect(panel().childElementCount, a.widget!.kind).toBeGreaterThan(2)
    }
  })

  it("builds an avatar from a seed, a drawing or an image", () => {
    const { container } = render(() => <Inspector />)
    const frame = editor.artboards[1]
    frame.widget = createWidget("avatar")
    selectArtboard(frame.id)
    const avatar = editor.artboards[1].widget as AvatarModel
    type(input(container, "avatar-seed"), "Ada")
    expect(avatar.name).toBe("Ada")
    fireEvent.click(button(container, "draw"))
    expect(avatar.source).toBe("draw")
    expect(input(container, "avatar-seed")).toBeNull()
    expect(container.querySelector('button[aria-label="Cell 1"]')).not.toBeNull()
    fireEvent.click(button(container, "image"))
    expect(input(container, "avatar-image-file").type).toBe("file")
    fireEvent.click(button(container, "seed"))
    expect(avatar.pattern).toBeNull()
    type(input(container, "avatar-grid"), "8")
    expect(avatar.grid).toBe(8)
  })
})

describe("the layer tree", () => {
  const rows = (c: Element) => [...c.querySelectorAll<HTMLElement>('[role="option"]')]
  const row = (c: Element, label: string) => c.querySelector<HTMLElement>(`[role="option"][aria-label="${label}"]`)!

  it("lists every frame with its chart's layers under it, and picks what is clicked", () => {
    const { container } = render(() => <LayerTree />)
    const [chart, plain] = editor.artboards
    expect(container.firstElementChild!.getAttribute("role")).toBe("listbox")
    expect(row(container, chart.name).textContent).toContain("bar")
    expect(row(container, "Grid")).not.toBeNull()
    fireEvent.click(row(container, plain.name))
    expect(editor.selectedIds).toEqual([plain.id])
    expect(row(container, plain.name).getAttribute("aria-selected")).toBe("true")
    fireEvent.click(row(container, chart.name), { shiftKey: true })
    expect(editor.selectedIds).toEqual([plain.id, chart.id])
    fireEvent.click(row(container, "Grid"))
    expect(editor.selectedLayerId).toBe(`${chart.id}:grid`)
    expect(row(container, "Grid").getAttribute("aria-selected")).toBe("true")
    fireEvent.keyDown(row(container, plain.name), { key: "Enter" })
    expect(editor.selectedIds).toEqual([plain.id])
    fireEvent.keyDown(row(container, chart.name), { key: " " })
    expect(editor.selectedIds).toEqual([chart.id])
  })

  it("moves the focus between rows by the arrows and keeps the key from the canvas", () => {
    const { container } = render(() => <LayerTree />)
    const seen = vi.fn()
    window.addEventListener("keydown", seen)
    const all = rows(container)
    all[0].focus()
    fireEvent.keyDown(all[0], { key: "ArrowDown" })
    expect(document.activeElement).toBe(all[1])
    fireEvent.keyDown(all[1], { key: "ArrowUp" })
    fireEvent.keyDown(all[0], { key: "ArrowUp" })
    expect(document.activeElement).toBe(all[0])
    expect(seen).not.toHaveBeenCalled()
    // From a key inside a row the arrows are not the tree's.
    fireEvent.keyDown(key(all[0], "Lock artboard"), { key: "ArrowDown" })
    expect(seen).toHaveBeenCalledTimes(1)
    window.removeEventListener("keydown", seen)
  })

  it("folds a frame's layers, and a row's keys lock and hide without picking the row", () => {
    const { container } = render(() => <LayerTree />)
    const chart = editor.artboards[0]
    const frame = row(container, chart.name)
    fireEvent.click(key(frame, "Collapse layers"))
    expect(row(container, "Grid")).toBeNull()
    expect(key(frame, "Expand layers")).not.toBeNull()
    expect(editor.selectedIds).toEqual([])
    // Picking the frame opens it again.
    fireEvent.click(frame)
    expect(row(container, "Grid")).not.toBeNull()
    deselect()

    fireEvent.click(key(frame, "Lock artboard"))
    expect(chart.locked).toBe(true)
    expect(key(frame, "Unlock artboard").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(key(frame, "Hide artboard"))
    expect(chart.hidden).toBe(true)
    expect(editor.selectedIds).toEqual([])

    const grid = row(container, "Grid")
    fireEvent.click(key(grid, "Hide layer"))
    expect(chart.chart.grid.on).toBe(false)
    expect(key(grid, "Show layer").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(key(grid, "Lock layer"))
    expect(chart.chart.grid.locked).toBe(true)
    // A locked layer keeps its visibility.
    fireEvent.click(key(grid, "Show layer"))
    expect(chart.chart.grid.on).toBe(false)
    expect(editor.selectedLayerId).toBe("")
    // The row is the element it was: the focus on its key was never lost.
    expect(row(container, "Grid")).toBe(grid)
    expect(row(container, chart.name)).toBe(frame)
  })

  it("renames a frame in place: Enter keeps the name, Escape and an empty one do not", async () => {
    const { container } = render(() => <LayerTree />)
    const chart = editor.artboards[0]
    const frame = row(container, chart.name)
    const was = chart.name
    fireEvent.dblClick(frame.querySelector("span.truncate")!)
    const field = () => input(frame, "artboard-rename")
    expect(field().value).toBe(was)
    await Promise.resolve()
    expect([field().selectionStart, field().selectionEnd]).toEqual([0, was.length])
    // Its kind steps out while the name is typed.
    expect(frame.querySelector(".capitalize")).toBeNull()
    fireEvent.click(field())
    expect(editor.selectedIds).toEqual([])
    type(field(), "Sales")
    fireEvent.keyDown(field(), { key: "Enter" })
    expect(chart.name).toBe("Sales")
    expect(field()).toBeNull()

    fireEvent.dblClick(frame.querySelector("span.truncate")!)
    type(field(), "Other")
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(chart.name).toBe("Sales")
    fireEvent.dblClick(frame.querySelector("span.truncate")!)
    type(field(), "   ")
    fireEvent.blur(field())
    expect(chart.name).toBe("Sales")
    expect(field()).toBeNull()
  })

  it("heads a group over its frames, folds it, and locks and hides them together", () => {
    const { container } = render(() => <LayerTree />)
    const [chart, plain] = editor.artboards
    selectMany([chart.id, plain.id])
    groupSelected()
    deselect()
    const group = editor.groups[0]
    const head = row(container, `Group ${group.name}`)
    expect(rows(container)[0]).toBe(head)
    expect(row(container, chart.name).style.paddingLeft).toBe("16px")
    fireEvent.click(head)
    expect(editor.selectedIds).toEqual([chart.id, plain.id])
    expect(head.getAttribute("aria-selected")).toBe("true")
    fireEvent.click(key(head, "Lock group"))
    expect([chart.locked, plain.locked]).toEqual([true, true])
    fireEvent.click(key(head, "Hide group"))
    expect([chart.hidden, plain.hidden]).toEqual([true, true])
    fireEvent.click(key(head, "Collapse group"))
    expect(group.collapsed).toBe(true)
    expect(rows(container)).toEqual([head])
  })

  it("lists a screen's rows and cells, picked as layers", () => {
    const screen = createScreen()
    screen.rows = [createRow([createCell(componentEntry("DitherSwitch")!)])]
    editor.artboards[1].widget = screen
    const { container } = render(() => <LayerTree />)
    const frame = editor.artboards[1]
    const cell = [...container.querySelectorAll<HTMLElement>("div.cursor-pointer")]
    expect(cell.map((c) => c.textContent)).toEqual(["Row 1", componentEntry("DitherSwitch")!.label])
    expect(cell.map((c) => c.style.paddingLeft)).toEqual(["20px", "36px"])
    fireEvent.click(cell[1])
    expect(editor.selectedLayerId).toBe(`${frame.id}:cell:${screen.rows[0].cells[0].id}`)
    expect(cell[1].className).toContain("ring-on")
  })

  it("opens a row's menu where it was asked, with what the row can do", async () => {
    const { container } = render(() => <LayerTree />)
    const [chart, plain] = editor.artboards
    const items = () => [...document.querySelectorAll('[role="menuitem"]')].map((i) => i.textContent?.trim())
    fireEvent.contextMenu(row(container, plain.name), { clientX: 40, clientY: 60 })
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!
    expect([menu.style.left, menu.style.top]).toEqual(["40px", "60px"])
    expect(items()).toEqual(["Rename", "Duplicate", "Group selection", "Lock", "Hide", "Delete"])
    fireEvent.click(document.querySelectorAll('[role="menuitem"]')[3])
    expect(plain.locked).toBe(true)
    expect(document.querySelector('[role="menu"]')).toBeNull()

    fireEvent.contextMenu(row(container, chart.name))
    expect(items()).toContain("Save as preset")
    vi.spyOn(window, "prompt").mockReturnValue("Mine")
    fireEvent.click(
      [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Save as preset")!,
    )
    expect(presets.map((p) => p.name)).toEqual(["Mine"])

    fireEvent.contextMenu(row(container, "Grid"))
    expect(items()).toEqual(["Hide", "Lock"])
    fireEvent.click(document.querySelectorAll('[role="menuitem"]')[0])
    expect(chart.chart.grid.on).toBe(false)

    fireEvent.contextMenu(row(container, plain.name))
    fireEvent.click([...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Rename")!)
    expect(input(container, "artboard-rename")).not.toBeNull()
  })
})

describe("the title bar", () => {
  function bar(over: { agentState?: "idle" | "working" | "waiting" | "unseen" } = {}) {
    const [library, setLibrary] = createSignal(false)
    const said = { sidebar: vi.fn(), chat: vi.fn(), panel: vi.fn(), guide: vi.fn() }
    let api: ToolbarApi | undefined
    const view = render(() => (
      <Toolbar
        sidebarOpen={true}
        chatOpen={false}
        panelOpen={true}
        libraryOpen={library()}
        agentState={over.agentState}
        onUpdateSidebarOpen={said.sidebar}
        onUpdateChatOpen={said.chat}
        onUpdatePanelOpen={said.panel}
        onUpdateLibraryOpen={setLibrary}
        onGuide={said.guide}
        ref={(a) => (api = a)}
      />
    ))
    return { ...view, said, library, api: () => api! }
  }
  const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve))
  const menu = (c: Element) => c.querySelector<HTMLElement>('[role="menu"]')

  beforeEach(() => {
    projects.push({ id: "p1", name: "First", updatedAt: 1 }, { id: "p2", name: "Second", updatedAt: 2 })
    activeProjectId.value = "p1"
  })

  it("presses the keys of what is open and asks for the other state", () => {
    const { container, said, api } = bar()
    const side = key(container, "Hide the sidebar")
    expect(side.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(side)
    expect(said.sidebar).toHaveBeenCalledWith(false)
    const chat = key(container, "Toggle the chat (Chat)")
    expect(chat.getAttribute("aria-pressed")).toBe("false")
    expect(chat.title).toBe("Chat (⌘I)")
    fireEvent.click(chat)
    expect(said.chat).toHaveBeenCalledWith(true)
    fireEvent.click(key(container, "Toggle properties and layers"))
    expect(said.panel).toHaveBeenCalledWith(false)
    const guide = key(container, "Show me around")
    fireEvent.click(guide)
    expect(said.guide).toHaveBeenCalledTimes(1)
    // The tour's last stop points at its own key.
    expect(api().guideKey).toBe(guide)
    expect(container.querySelector(".agent-dot")).toBeNull()
  })

  it("says on its key what the agent is doing", () => {
    const { container } = bar({ agentState: "waiting" })
    const chat = key(container, "Toggle the chat (Chat, the agent is waiting for you)")
    expect(chat.querySelector(".agent-dot")!.getAttribute("data-state")).toBe("waiting")
    expect(chat.querySelector(".agent-dot")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("offers undo and redo only when there is one", () => {
    const { container } = bar()
    expect(key(container, "Undo").disabled).toBe(true)
    expect(key(container, "Redo").disabled).toBe(true)
    history.canUndo = true
    expect(key(container, "Undo").disabled).toBe(false)
    history.canUndo = false
  })

  it("opens the project's menu as a menu: first item focused, Escape closes, focus back on its key", async () => {
    const { container } = bar()
    const trigger = container.querySelector<HTMLButtonElement>(".project")!
    expect(trigger.textContent).toBe("First")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    const items = [...menu(container)!.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    expect(items.map((i) => i.textContent?.trim())).toEqual([
      "First",
      "Second",
      "New project",
      "Rename",
      "Save to file",
      "Open file",
      "Delete project",
    ])
    expect(items[0].className).toContain("ring-on")
    await tick()
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(items[0], { key: "ArrowDown" })
    expect(document.activeElement).toBe(items[1])
    fireEvent.keyDown(window, { key: "Escape" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await tick()
    expect(document.activeElement).toBe(trigger)
    await vi.waitFor(() => expect(menu(container)).toBeNull())
  })

  it("closes its menus on a press outside the bar, never on one inside", () => {
    const { container, library } = bar()
    fireEvent.click(button(container, "Library"))
    expect(library()).toBe(true)
    fireEvent.pointerDown(container.querySelector('[role="dialog"]')!)
    expect(library()).toBe(true)
    fireEvent.pointerDown(document.body)
    expect(library()).toBe(false)
  })

  it("names a project in the menu: Escape backs out and the menu stays, Enter keeps the name", async () => {
    const { container } = bar()
    const trigger = container.querySelector<HTMLButtonElement>(".project")!
    fireEvent.click(trigger)
    fireEvent.click(button(container, "Rename"))
    const field = () => menu(container)!.querySelector<HTMLInputElement>('input[aria-label="Project name"]')
    expect(field()!.value).toBe("First")
    await tick()
    expect([field()!.selectionStart, field()!.selectionEnd]).toEqual([0, 5])
    fireEvent.keyDown(field()!, { key: "Escape" })
    expect(field()).toBeNull()
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(button(container, "Rename"))
    type(field()!, "Renamed")
    fireEvent.submit(field()!.form!)
    expect(projects[0].name).toBe("Renamed")
    expect(trigger.textContent).toBe("Renamed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(trigger)
    fireEvent.click(button(container, "New project"))
    const fresh = menu(container)!.querySelector<HTMLInputElement>('input[aria-label="New project name"]')!
    expect(fresh.value).toBe("Project 3")
  })

  it("asks before it deletes a project", () => {
    const { container } = bar()
    fireEvent.click(container.querySelector(".project")!)
    fireEvent.click(button(container, "Delete project"))
    expect(container.querySelector(".project")!.getAttribute("aria-expanded")).toBe("false")
    const dialog = document.querySelector('[role="alertdialog"]')!
    expect(dialog.textContent).toContain("Delete project?")
    expect(projects).toHaveLength(2)
    fireEvent.click(button(dialog, "Cancel"))
    expect(projects).toHaveLength(2)
  })

  it("opens the library on its search, filters it, and adds what is picked", async () => {
    const { container, library } = bar()
    const open = button(container, "Library")
    expect(open.getAttribute("aria-haspopup")).toBe("dialog")
    fireEvent.click(open)
    expect(open.getAttribute("aria-expanded")).toBe("true")
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.getAttribute("aria-label")).toBe("Component library")
    const search = input(dialog, "component-search")
    await tick()
    expect(document.activeElement).toBe(search)
    const labels = () => [...dialog.querySelectorAll(".library-label")].map((l) => l.textContent)
    expect(labels()).toEqual(["Canvas", "Inputs", "Navigation", "Display", "Overlays", "Structure"])
    expect(button(dialog, "area chart")).toBeDefined()
    type(search, "zzzz")
    expect(labels()).toEqual([])
    expect(dialog.textContent).toContain("No components match “zzzz”.")
    type(search, "")
    const before = editor.artboards.length
    fireEvent.click(button(dialog, "pie chart"))
    expect(editor.artboards).toHaveLength(before + 1)
    expect(editor.artboards[before].chart.type).toBe("pie")
    expect(library()).toBe(false)

    fireEvent.click(open)
    const again = container.querySelector<HTMLElement>('[role="dialog"]')!
    // Closed, the search starts over.
    expect(input(again, "component-search").value).toBe("")
    fireEvent.click(button(again, "Screen"))
    expect(editor.artboards[before + 1].widget?.kind).toBe("screen")
    fireEvent.click(open)
    fireEvent.click(container.querySelector<HTMLElement>('[role="dialog"] .library-item.text-left')!)
    expect(editor.artboards[before + 2].widget?.kind).toBe("component")
  })

  it("closes the library on Escape from anywhere in it and hands focus back to its key", async () => {
    const { container, library } = bar()
    const open = button(container, "Library")
    fireEvent.click(open)
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!
    const item = button(dialog, "area chart")
    item.focus()
    fireEvent.keyDown(item, { key: "Escape" })
    expect(library()).toBe(false)
    await tick()
    expect(document.activeElement).toBe(open)
  })

  it("lists the saved presets in the library", () => {
    presets.push({ name: "Mine", chart: createArtboard("line").chart })
    const { container } = bar()
    fireEvent.click(button(container, "Library"))
    const before = editor.artboards.length
    fireEvent.click(button(container, "Mine"))
    expect(editor.artboards[before].chart.type).toBe("line")
  })
})

describe("the panels' stylesheets", () => {
  it("share the one tool key, one sheet", () => {
    for (const file of ["Toolbar.tsx", "CanvasBar.tsx"])
      expect(read(`packages/site/src/widgets/toolbar/${file}`)).toContain('import "@/widgets/toolbar/tool.css"')
  })

  it("move on the glide: no other curve", () => {
    const off: string[] = []
    for (const file of ["Toolbar.tsx", "Toolbar.css", "CanvasBar.tsx", "CanvasBar.css"]) {
      const text = read(`packages/site/src/widgets/toolbar/${file}`)
      for (const m of text.matchAll(/cubic-bezier\(([^)]*)\)/g))
        if (m[1] !== GLIDE_BEZIER.join(", ")) off.push(`${file}: ${m[0]}`)
      for (const m of text.matchAll(/easing(?:=|: )"(linear|spring)"/g)) off.push(`${file}: ${m[0]}`)
    }
    expect(off).toEqual([])
  })
})
