// What the Studio draws with: the chart, widget, screen and reel renderers,
// the canvas with its frames and the ask at the selection, the data editor,
// and the player page with its mount.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createArtboard } from "@/entities/artboard/model/factory"
import { createChart } from "@/entities/chart"
import { componentEntry, createComponent, createWidget } from "@/entities/widget"
import { addCell, createScreen } from "@/entities/widget/model/screen"
import { CAMERA_MOVES } from "@/features/reel"
import { audit, nameOf } from "@/shared/lib/inspect/measure"
import { isDirected, release, seek } from "@dither-ui/kit/engine/clock.ts"
import { addArtboard, addReelArtboard, editor, selectArtboard } from "../../src/entities/editor"
import { handoff } from "../../src/features/agent/handoff"
import { listenerOf } from "../../src/entities/widget/model/model"
import { documentSnapshot } from "../../src/features/persistence"
import { mountPlayer } from "../../src/pages/play/main"
import PlayPage, { fitScale } from "../../src/pages/play/PlayPage"
import { readPlaySource } from "../../src/pages/play/source"
import { toBase64Url } from "../../src/shared/lib"
import Artboard from "../../src/widgets/canvas/Artboard"
import { Canvas, type CanvasApi } from "../../src/widgets/canvas"
import SelectionAsk from "../../src/widgets/canvas/SelectionAsk"
import { ChartRenderer } from "../../src/widgets/chart-renderer"
import { DataEditor } from "../../src/widgets/data-editor"
import { REEL_POOL, ReelRenderer } from "../../src/widgets/reel-renderer"
import ReelBand from "../../src/widgets/reel-renderer/ReelBand"
import ReelClip from "../../src/widgets/reel-renderer/ReelClip"
import { WidgetRenderer } from "../../src/widgets/widget-renderer"
import { FieldWrap } from "../../src/widgets/widget-renderer/FieldWrap"
import ScreenRenderer from "../../src/widgets/widget-renderer/ScreenRenderer"
import { world } from "@dither-ui/kit/testing/world.ts"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.selectedLayerId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
  editor.guides.v = null
  editor.guides.h = null
  editor.dataOpen = false
  editor.inspecting = false
  handoff.picking = false
  handoff.picked = []
  handoff.asks = []
})
afterEach(() => {
  cleanup()
  release()
  vi.restoreAllMocks()
  w.restore()
})

const press = (type: string, init: PointerEventInit = {}) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, ...init })

/** A frame on the canvas, as the editor holds it (the store's own proxy). */
function frame(kind: Parameters<typeof createArtboard>[0], x = 10, y = 20) {
  editor.artboards = [...editor.artboards, createArtboard(kind, x, y)]
  return editor.artboards[editor.artboards.length - 1]
}

describe("the chart renderer", () => {
  it.each(["area", "line", "bar", "pie", "radar"] as const)("draws a %s chart on the kit's canvas", (type) => {
    const { container } = render(() => <ChartRenderer chart={createChart(type)} />)
    expect(container.querySelector("canvas")).not.toBeNull()
  })

  it("follows the chart as the editor changes it: its kind, and the parts switched off", () => {
    const a = frame("area")
    const { container } = render(() => <ChartRenderer chart={a.chart} />)
    const root = () => container.firstElementChild
    const first = root()
    a.chart.cell = 6
    expect(root()).toBe(first)
    a.chart.type = "pie"
    expect(root()).not.toBe(first)
    expect(container.querySelector("canvas")).not.toBeNull()
  })
})

describe("the widget renderer", () => {
  it("draws each simple widget with its kit surface", () => {
    for (const kind of ["avatar", "button", "image", "gradient"] as const) {
      const { container, unmount } = render(() => <WidgetRenderer widget={createWidget(kind)} artboardId="a" />)
      expect(container.querySelector(kind === "image" ? "canvas, img" : "canvas"), kind).not.toBeNull()
      unmount()
    }
    const button = createWidget("button")
    if (button.kind !== "button") throw new Error("unreachable")
    button.label = "Ship it"
    const { getByRole } = render(() => <WidgetRenderer widget={button} artboardId="a" />)
    expect(getByRole("button").textContent).toBe("Ship it")
    expect(getByRole("button").className).toContain("px-6 py-3 text-sm")
  })

  it("makes a button anew when what its raster is built from changes, and not for its label", () => {
    const a = frame("button")
    if (a.widget?.kind !== "button") throw new Error("unreachable")
    const widget = a.widget
    const { getByRole } = render(() => <WidgetRenderer widget={widget} artboardId={a.id} />)
    const first = getByRole("button")
    widget.label = "Again"
    expect(getByRole("button")).toBe(first)
    expect(first.textContent).toBe("Again")
    widget.color = "pink"
    expect(getByRole("button")).not.toBe(first)
  })

  it("binds a registry component's model both ways", () => {
    editor.artboards = [{ ...createArtboard("button"), widget: createComponent(componentEntry("DitherSwitch")!) }]
    const a = editor.artboards[0]
    if (a.widget?.kind !== "component") throw new Error("unreachable")
    const widget = a.widget
    const { getByRole } = render(() => <WidgetRenderer widget={widget} artboardId={a.id} />)
    expect(getByRole("switch").getAttribute("aria-checked")).toBe("true")
    fireEvent.click(getByRole("switch"))
    expect(widget.model).toBe(false)
    expect(getByRole("switch").getAttribute("aria-checked")).toBe("false")
  })

  it("names an event's listener as the callback prop the kit takes", () => {
    expect(listenerOf("update:modelValue")).toBe("onUpdateModelValue")
    expect(listenerOf("update:page")).toBe("onUpdatePage")
    expect(listenerOf("close")).toBe("onClose")
    // A model on its own prop and event: the pagination's page.
    editor.artboards = [{ ...createArtboard("button"), widget: createComponent(componentEntry("DitherPagination")!) }]
    const a = editor.artboards[0]
    if (a.widget?.kind !== "component") throw new Error("unreachable")
    const widget = a.widget
    const { container } = render(() => <WidgetRenderer widget={widget} artboardId={a.id} />)
    const current = () => container.querySelector("[aria-current='page']")?.textContent?.trim()
    expect(current()).toBe(String(widget.model))
    const other = [...container.querySelectorAll("button")].find(
      (b) => /^\d+$/.test(b.textContent?.trim() ?? "") && b.textContent?.trim() !== String(widget.model),
    )!
    fireEvent.click(other)
    expect(String(widget.model)).toBe(other.textContent?.trim())
    expect(current()).toBe(String(widget.model))
  })

  it("opens a dialog from its demo key and closes it through the dialog's own", () => {
    editor.artboards = [{ ...createArtboard("button"), widget: createComponent(componentEntry("DitherDialog")!) }]
    const a = editor.artboards[0]
    if (a.widget?.kind !== "component") throw new Error("unreachable")
    const widget = a.widget
    const { getByText, container } = render(() => <WidgetRenderer widget={widget} artboardId={a.id} />)
    expect(container.querySelector(".widget-renderer-scope .demo-trigger")).not.toBeNull()
    expect(document.querySelector("[role='dialog']")).toBeNull()
    fireEvent.click(getByText("Open dialog"))
    expect(widget.model).toBe(true)
    expect(document.querySelector("[role='dialog']")).not.toBeNull()
    fireEvent.click(document.querySelector("[role='dialog'] [aria-label='Close']")!)
    expect(widget.model).toBe(false)
  })

  it("wraps a field only when it has a label, the field's class on the box around it", () => {
    const bare = render(() => (
      <FieldWrap label={null} class="w-full">
        <input />
      </FieldWrap>
    ))
    expect(bare.container.firstElementChild?.tagName).toBe("INPUT")
    const named = render(() => (
      <FieldWrap label="Email" class="w-full">
        <input />
      </FieldWrap>
    ))
    expect(named.container.firstElementChild?.className).toBe("w-full")
    expect(named.container.querySelector("label")?.textContent).toBe("Email")
  })
})

describe("the screen renderer", () => {
  it("selects the cell pressed, then the row around it, and holds a cell's model", () => {
    editor.artboards = [{ ...createArtboard("button"), widget: createScreen() }]
    const a = editor.artboards[0]
    if (a.widget?.kind !== "screen") throw new Error("unreachable")
    const screen = a.widget
    const cell = addCell(screen.rows[0], componentEntry("DitherSwitch")!)
    const { getByRole, container } = render(() => <ScreenRenderer screen={screen} artboardId={a.id} />)
    const row = container.firstElementChild!.firstElementChild!
    getByRole("switch").dispatchEvent(press("pointerdown"))
    expect(editor.selectedLayerId).toBe(`${a.id}:cell:${cell.id}`)
    expect(getByRole("switch").closest(".ring-accent")).not.toBeNull()
    row.dispatchEvent(press("pointerdown"))
    expect(editor.selectedLayerId).toBe(`${a.id}:row:${screen.rows[0].id}`)
    expect(row.className).toContain("ring-accent/60")
    fireEvent.click(getByRole("switch"))
    expect(screen.rows[0].cells[0].model).toBe(false)
  })

  it("binds a cell's model by the prop its component names, as a frame of it does", () => {
    editor.artboards = [{ ...createArtboard("button"), widget: createScreen() }]
    const a = editor.artboards[0]
    if (a.widget?.kind !== "screen") throw new Error("unreachable")
    const screen = a.widget
    addCell(screen.rows[0], componentEntry("DitherListBox")!).model = "Taipei"
    const cell = render(() => <ScreenRenderer screen={screen} artboardId={a.id} />)
    expect(cell.getByRole("option", { selected: true }).textContent).toContain("Taipei")
    cell.unmount()
    const widget = { ...createComponent(componentEntry("DitherListBox")!), model: "Kyoto" }
    const frame = render(() => <WidgetRenderer widget={widget} artboardId="a" />)
    expect(frame.getByRole("option", { selected: true }).textContent).toContain("Kyoto")
  })

  it("says an empty row is empty", () => {
    const { getByText } = render(() => <ScreenRenderer screen={createScreen()} artboardId="a" />)
    expect(getByText("Empty row. Add a component in the inspector.")).toBeTruthy()
  })
})

describe("the reel's parts", () => {
  it("shows a clip's frame at its own size, scaled about the centre", () => {
    const a = createArtboard("button")
    const { container } = render(() => <ReelClip artboard={a} scale={0.5} />)
    const clip = container.querySelector<HTMLElement>("[data-clip]")!
    expect(clip.dataset.clip).toBe(a.id)
    expect(clip.style.width).toBe(`${a.w}px`)
    expect(clip.style.transform).toBe("translate(-50%, -50%) scale(0.5)")
    expect(clip.querySelector("button")).not.toBeNull()
    const chart = createArtboard("area")
    const second = render(() => <ReelClip artboard={chart} scale={1} />)
    expect(second.container.querySelector("[data-clip] > .h-full canvas")).not.toBeNull()
  })

  it("prints the chapter band, the one before under the one coming in", () => {
    const one = { line: "One frame.", spec: [["1", "button"]] as [string, string][] }
    const two = { line: "Another.", spec: [["", "no figure"]] as [string, string][] }
    const still = render(() => (
      <ReelBand class="reel-band-slot" state={{ chapter: one, previous: null, progress: 1 }} reduced={false} />
    ))
    const band = still.container.firstElementChild!
    expect(band.className).toContain("reel-band-scope reel-band")
    expect(band.className).toContain("reel-band-slot")
    expect(band.getAttribute("data-reel-chapter")).toBe("One frame.")
    expect(band.querySelectorAll("[data-reveal]")).toHaveLength(1)
    expect([...band.querySelectorAll("li span")].map((s) => s.textContent)).toEqual(["1", "button"])
    still.unmount()

    const turning = render(() => <ReelBand state={{ chapter: two, previous: one, progress: 0.4 }} reduced={false} />)
    const reveals = [...turning.container.querySelectorAll("[data-reveal]")]
    expect(reveals.map((r) => r.querySelector(".band-line")?.textContent)).toEqual(["One frame.", "Another."])
    expect(reveals.map((r) => r.getAttribute("data-reveal"))).toEqual(["shown", "playing"])
    // A row without a figure prints its words alone.
    expect(reveals[1].querySelectorAll("li span")).toHaveLength(1)
    turning.unmount()

    // Reduced motion: a cut.
    const cut = render(() => <ReelBand state={{ chapter: two, previous: one, progress: 0.4 }} reduced />)
    expect(cut.container.querySelectorAll("[data-reveal]")).toHaveLength(1)
  })

  it("cuts to the frames it is given before the editor's", () => {
    const a = addArtboard("button")
    const reel = addReelArtboard([a.id])
    if (reel.widget?.kind !== "reel") throw new Error("unreachable")
    const widget = reel.widget
    const empty = render(() => (
      <REEL_POOL.Provider value={() => []}>
        <ReelRenderer reel={widget} artboardId={reel.id} />
      </REEL_POOL.Provider>
    ))
    expect(empty.container.textContent).toContain("a clip's frame is missing")
    empty.unmount()
    const own = render(() => <ReelRenderer reel={widget} artboardId={reel.id} />)
    expect(own.container.querySelector("[data-clip]")?.getAttribute("data-clip")).toBe(a.id)
    own.unmount()
    widget.clips = []
    const none = render(() => <ReelRenderer reel={widget} artboardId={reel.id} />)
    expect(none.container.textContent).toContain("No clips. Select frames and press Reel.")
    expect(none.container.firstElementChild?.getAttribute("data-reel-clip")).toBe("-1")
  })
})

describe("a frame on the canvas", () => {
  it("resizes from a handle, the opposite edge held and the frame's minimum kept", () => {
    const a = frame("button", 100, 100)
    a.w = 300
    a.h = 200
    selectArtboard(a.id)
    const { container } = render(() => <Artboard artboard={a} />)
    const handles = container.querySelectorAll(
      ".cursor-nwse-resize, .cursor-nesw-resize, .cursor-ns-resize, .cursor-ew-resize",
    )
    expect(handles).toHaveLength(8)
    const nw = container.querySelector(".-left-1\\.5.-top-1\\.5")!
    nw.dispatchEvent(press("pointerdown", { clientX: 100, clientY: 100 }))
    expect(container.textContent).toContain("100, 100")
    window.dispatchEvent(press("pointermove", { clientX: 60, clientY: 80 }))
    expect([a.x, a.y, a.w, a.h]).toEqual([60, 80, 340, 220])
    window.dispatchEvent(press("pointermove", { clientX: 2000, clientY: 2000 }))
    expect([a.w, a.h]).toEqual([100, 60])
    expect([a.x + a.w, a.y + a.h]).toEqual([400, 300])
    window.dispatchEvent(press("pointerup"))
    expect(container.textContent).not.toContain(`${a.x}, ${a.y}`)
  })

  it("gives each handle a finger's reach on the screen, whatever the zoom", () => {
    const a = frame("button")
    selectArtboard(a.id)
    editor.viewport.zoom = 0.5
    const { container } = render(() => <Canvas />)
    // the layer the frames stand in tells their chrome the zoom
    const layer = container.querySelector<HTMLElement>(".dk-canvas > div")!
    expect(layer.style.getPropertyValue("--zoom")).toBe("0.5")
    const handles = [...container.querySelectorAll<HTMLElement>("[data-handle]")]
    expect(handles.map((h) => h.dataset.handle)).toEqual(["nw", "n", "ne", "e", "se", "s", "sw", "w"])
    for (const h of handles) expect(h.classList.contains("handle")).toBe(true)
    // The frame's name, its grip, stands over the corner's reach: a finger
    // on it moves the frame, never resizes it.
    const grip = container.querySelector<HTMLElement>(".cursor-move")!
    expect(grip.textContent).toContain(a.name)
    const z = (el: HTMLElement) => Number(/(?:^|\s)z-(\d+)/.exec(el.className)?.[1] ?? 0)
    expect(z(grip)).toBeGreaterThan(z(handles[0]))
    // The reach (the handle's ::before; jsdom lays nothing out, so read from
    // its rule): 24px under a cursor, 40px under a finger, divided by the
    // zoom, so a 12px handle that shows 6px at 50% still reaches 40px; past
    // it, the handle drawn is its own reach.
    const css = readFileSync(join(process.cwd(), "src/widgets/canvas/Artboard.css"), "utf8")
    expect(css).toMatch(/--handle-reach: 24px;\s*@media \(pointer: coarse\) \{\s*--handle-reach: 40px;/)
    const inset = css.match(/\.handle::before \{[^}]*inset: ([^;]+);/)?.[1]
    expect(inset).toBe("min(0px, calc((12px - var(--handle-reach) / var(--zoom, 1)) / 2))")
  })

  it("shows no handles on a locked frame, and its label does not move it", () => {
    const a = frame("button")
    a.locked = true
    selectArtboard(a.id)
    const { container, getByText } = render(() => <Artboard artboard={a} />)
    expect(container.querySelector(".cursor-nwse-resize")).toBeNull()
    expect(container.querySelector("svg rect[rx='2']")).not.toBeNull()
    getByText(a.name).dispatchEvent(press("pointerdown", { clientX: 5, clientY: 5 }))
    window.dispatchEvent(press("pointermove", { clientX: 50, clientY: 50 }))
    expect([a.x, a.y]).toEqual([10, 20])
  })

  it("is handed to the agent while picking, and nothing inside it hears the press", () => {
    const a = frame("button")
    const { container, getByRole } = render(() => <Artboard artboard={a} />)
    const clicked = vi.fn()
    getByRole("button").addEventListener("click", clicked)
    handoff.picking = true
    getByRole("button").dispatchEvent(press("pointerdown"))
    fireEvent.click(getByRole("button"))
    expect(handoff.picked).toEqual([a.id])
    expect(clicked).not.toHaveBeenCalled()
    expect(editor.selectedIds).toEqual([])
    expect(container.querySelector(".artboard-scope .picked")).not.toBeNull()
    getByRole("button").dispatchEvent(press("pointerdown"))
    expect(handoff.picked).toEqual([])
    expect(container.querySelector(".picked")).toBeNull()
  })

  it("adds to the selection on a modified press and snaps to a neighbour's edge", () => {
    const a = frame("button", 0, 0)
    const b = frame("button", 400, 0)
    const { container } = render(() => (
      <>
        <Artboard artboard={a} />
        <Artboard artboard={b} />
      </>
    ))
    const [sa, sb] = [...container.querySelectorAll("[data-artboard-surface]")]
    sa.dispatchEvent(press("pointerdown"))
    window.dispatchEvent(press("pointerup"))
    sb.dispatchEvent(press("pointerdown", { shiftKey: true }))
    expect(editor.selectedIds).toEqual([a.id, b.id])
    selectArtboard(a.id)
    // Dragged to within the snap threshold of b's left edge: it lands on it.
    sa.dispatchEvent(press("pointerdown", { clientX: 0, clientY: 0 }))
    window.dispatchEvent(press("pointermove", { clientX: 400 - a.w - 3, clientY: 0 }))
    expect(a.x + a.w).toBe(400)
    expect(editor.guides.v).toBe(400)
    window.dispatchEvent(press("pointerup"))
    expect(editor.guides.v).toBeNull()
  })
})

describe("the canvas", () => {
  it("hands the page its element and the frames' layer before the page mounts", () => {
    frame("button")
    let api: CanvasApi | undefined
    const { container } = render(() => <Canvas ref={(a) => (api = a)} />)
    expect(api?.host).toBe(container.querySelector(".dk-canvas"))
    expect(api?.world.querySelector("[data-artboard-id]")).not.toBeNull()
  })

  it("offers a first artboard when it has none, and leaves hidden frames out", () => {
    const { getByText, container } = render(() => <Canvas />)
    expect(getByText("No artboards yet.")).toBeTruthy()
    fireEvent.click(getByText("Add an artboard"))
    expect(editor.artboards).toHaveLength(1)
    expect(container.querySelectorAll("[data-artboard-id]")).toHaveLength(1)
    editor.artboards[0].hidden = true
    expect(container.querySelectorAll("[data-artboard-id]")).toHaveLength(0)
  })

  it("selects the frames a marquee crosses and clears the selection on a plain click", () => {
    const a = frame("button", 50, 50)
    const { container } = render(() => <Canvas />)
    const host = container.querySelector(".dk-canvas")!
    host.dispatchEvent(press("pointerdown", { clientX: 10, clientY: 10 }))
    window.dispatchEvent(press("pointermove", { clientX: 80, clientY: 80 }))
    expect(editor.selectedIds).toEqual([a.id])
    const box = container.querySelector<HTMLElement>(".bg-accent\\/10")!
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual(["10px", "10px", "70px", "70px"])
    window.dispatchEvent(press("pointerup", { clientX: 80, clientY: 80 }))
    expect(container.querySelector(".bg-accent\\/10")).toBeNull()
    expect(editor.selectedIds).toEqual([a.id])
    host.dispatchEvent(press("pointerdown", { clientX: 10, clientY: 10 }))
    window.dispatchEvent(press("pointerup", { clientX: 10, clientY: 10 }))
    expect(editor.selectedIds).toEqual([])
  })

  it("pans under a Space drag and draws the snap guides in screen pixels", () => {
    const { container } = render(() => <Canvas />)
    const host = container.querySelector(".dk-canvas")!
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))
    expect(host.className).toContain("cursor-grab")
    host.dispatchEvent(press("pointerdown", { clientX: 0, clientY: 0 }))
    window.dispatchEvent(press("pointermove", { clientX: 30, clientY: 12 }))
    window.dispatchEvent(press("pointerup", { clientX: 30, clientY: 12 }))
    expect([editor.viewport.x, editor.viewport.y]).toEqual([30, 12])
    window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }))
    expect(host.className).not.toContain("cursor-grab")
    editor.viewport.zoom = 2
    editor.guides.v = 100
    expect(container.querySelector<HTMLElement>(".w-px")?.style.left).toBe("230px")
  })

  it("shows the pick bar while picking, counts what was picked, and ends on Esc or Done", () => {
    const a = frame("button")
    const { container, getByText } = render(() => <Canvas />)
    expect(container.querySelector(".pick-bar")).toBeNull()
    handoff.picking = true
    expect(container.querySelector(".dk-canvas")?.className).toContain("is-picking")
    const bar = container.querySelector(".pick-bar")!
    expect(bar.getAttribute("role")).toBe("status")
    expect(bar.querySelector("span")?.textContent).toBe("Click frames to hand them to the agent")
    container.querySelector("[data-artboard-surface]")!.dispatchEvent(press("pointerdown"))
    expect(handoff.picked).toEqual([a.id])
    expect(bar.querySelector("span")?.textContent).toBe("Click frames to hand them to the agent, 1 picked")
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(handoff.picking).toBe(false)
    handoff.picking = true
    fireEvent.click(getByText("Done", { exact: false }))
    expect(handoff.picking).toBe(false)
  })

  it("puts the ask away while a pointer is down on the canvas, but not for a press on the ask", () => {
    const a = frame("button", 100, 100)
    selectArtboard(a.id)
    editor.stage = { w: 900, h: 700 }
    const { container } = render(() => <Canvas />)
    const ask = () => container.querySelector(".ask")
    expect(ask()).not.toBeNull()
    ask()!.dispatchEvent(press("pointerdown"))
    expect(ask()).not.toBeNull()
    container.querySelector("[data-artboard-surface]")!.dispatchEvent(press("pointerdown"))
    expect(ask()).toBeNull()
    window.dispatchEvent(press("pointerup"))
    expect(ask()).not.toBeNull()
  })
})

describe("the ask's composer", () => {
  it("sends what was typed about the frame and clears, and sends nothing blank", () => {
    const a = frame("button", 100, 100)
    selectArtboard(a.id)
    editor.stage = { w: 900, h: 700 }
    const { getByLabelText } = render(() => <SelectionAsk held={false} />)
    const field = getByLabelText(`Ask the agent about ${a.name}`) as HTMLInputElement
    const go = getByLabelText("Send to the agent") as HTMLButtonElement
    expect(field.placeholder).toBe(`Ask about ${a.name}`)
    expect(go.disabled).toBe(true)
    fireEvent.submit(field.form!)
    expect(handoff.asks).toEqual([])
    fireEvent.input(field, { target: { value: "  make it pink " } })
    expect(go.disabled).toBe(false)
    expect(go.className).toContain("key-chrome")
    fireEvent.submit(field.form!)
    expect(handoff.asks).toEqual([{ text: "make it pink", frames: [a.id] }])
    expect(field.value).toBe("")
  })

  it("stays away while held, while picking, and with more than one frame selected", () => {
    const a = frame("button", 100, 100)
    const b = frame("button", 500, 100)
    selectArtboard(a.id)
    editor.stage = { w: 900, h: 700 }
    const held = render(() => <SelectionAsk held />)
    expect(held.container.querySelector(".ask")).toBeNull()
    held.unmount()
    const { container } = render(() => <SelectionAsk held={false} />)
    expect(container.querySelector(".ask")).not.toBeNull()
    handoff.picking = true
    expect(container.querySelector(".ask")).toBeNull()
    handoff.picking = false
    editor.selectedIds = [a.id, b.id]
    expect(container.querySelector(".ask")).toBeNull()
  })
})

describe("the data editor", () => {
  const cells = (container: HTMLElement) => [...container.querySelectorAll<HTMLInputElement>("tbody input")]

  it("stands only for a chart frame with the data open", () => {
    const { container } = render(() => <DataEditor />)
    expect(container.firstElementChild).toBeNull()
    const a = frame("area")
    selectArtboard(a.id)
    expect(container.firstElementChild).toBeNull()
    editor.dataOpen = true
    expect(container.querySelector("table")).not.toBeNull()
    const b = frame("button")
    selectArtboard(b.id)
    expect(container.firstElementChild).toBeNull()
  })

  it("edits a chart's cells in place: a label as text, a figure as a number", () => {
    const a = frame("area")
    selectArtboard(a.id)
    editor.dataOpen = true
    const { container, getByText, getByLabelText } = render(() => <DataEditor />)
    const chart = a.chart
    const key = chart.series.find((s) => s.on)!.key
    const label = container.querySelector<HTMLInputElement>("input[name='row-0-label']")!
    const figure = container.querySelector<HTMLInputElement>(`input[name='row-0-${key}']`)!
    expect(label.value).toBe(String(chart.rows[0].month))
    expect(figure.value).toBe(String(chart.rows[0][key]))
    fireEvent.input(label, { target: { value: "Yule" } })
    expect(chart.rows[0].month).toBe("Yule")
    fireEvent.input(figure, { target: { value: "42.5" } })
    expect(chart.rows[0][key]).toBe(42.5)
    // The field under the caret keeps its text; another write shows.
    expect(figure.value).toBe("42.5")
    chart.rows[0][key] = 7
    expect(figure.value).toBe("7")
    // The same fields stay while the cells change under them.
    expect(container.querySelector(`input[name='row-0-${key}']`)).toBe(figure)

    const rows = chart.rows.length
    fireEvent.click(getByText("+ row"))
    expect(chart.rows).toHaveLength(rows + 1)
    expect(container.querySelectorAll("tbody tr")).toHaveLength(rows + 1)
    fireEvent.click(getByLabelText("Delete row 1"))
    expect(chart.rows).toHaveLength(rows)
    const columns = container.querySelectorAll("thead th").length
    fireEvent.click(getByText("+ series"))
    expect(container.querySelectorAll("thead th")).toHaveLength(columns + 1)
    fireEvent.click(getByLabelText("Close data editor"))
    expect(editor.dataOpen).toBe(false)
    expect(container.firstElementChild).toBeNull()
  })

  it("names a pie's slices on change, with a value beside each and no series to add", () => {
    const a = frame("pie")
    selectArtboard(a.id)
    editor.dataOpen = true
    const { container, queryByText } = render(() => <DataEditor />)
    expect(queryByText("+ series")).toBeNull()
    expect([...container.querySelectorAll("thead th")].map((th) => th.textContent?.trim())).toEqual([
      "name",
      "value",
      "",
    ])
    const [name, value] = cells(container)
    expect(name.value).toBe(String(a.chart.rows[0].name))
    fireEvent.input(name, { target: { value: "Other" } })
    expect(a.chart.rows[0].name).not.toBe("Other")
    fireEvent.change(name, { target: { value: "Other" } })
    expect(a.chart.rows[0].name).toBe("Other")
    fireEvent.input(value, { target: { value: "12" } })
    expect(a.chart.rows[0].value).toBe(12)
  })

  it("replaces the data from a CSV file and replays the chart", async () => {
    const a = frame("area")
    selectArtboard(a.id)
    editor.dataOpen = true
    const { container } = render(() => <DataEditor />)
    const input = container.querySelector<HTMLInputElement>("input[name='import-csv']")!
    const token = editor.replayToken
    const file = new File(["month,sales\nJan,1\nFeb,2\n"], "data.csv", { type: "text/csv" })
    Object.defineProperty(input, "files", { value: [file], configurable: true })
    fireEvent.change(input)
    await vi.waitFor(() => expect(editor.replayToken).toBe(token + 1))
    expect(a.chart.rows.map((r) => r.month)).toEqual(["Jan", "Feb"])
  })
})

describe("the player", () => {
  it("plays the frame its source names, else the first one shown, else says there is none", () => {
    const a = frame("button")
    const b = frame("gradient")
    const doc = JSON.parse(JSON.stringify(documentSnapshot()))
    const named = render(() => <PlayPage source={{ document: doc, artboardId: b.id, theme: "dark" }} />)
    const surface = named.container.querySelector<HTMLElement>(".play-surface")!
    expect(surface.className).toContain("play-page-scope")
    expect(surface.dataset.artboardId).toBe(b.id)
    expect([surface.style.width, surface.style.height]).toEqual([`${b.w}px`, `${b.h}px`])
    named.unmount()
    const first = render(() => <PlayPage source={{ document: doc, artboardId: null, theme: "dark" }} />)
    expect(first.container.querySelector<HTMLElement>(".play-surface")?.dataset.artboardId).toBe(a.id)
    expect(first.container.querySelector("button")).not.toBeNull()
    first.unmount()
    const none = render(() => <PlayPage source={{ document: null, artboardId: null, theme: "dark" }} />)
    expect(none.container.querySelector(".play-empty")?.textContent).toBe(
      "No frame to play. Open this page from the Studio's video export.",
    )
  })

  it("fits a frame wider than the window into it, laid out and painted at its own size", () => {
    expect([fitScale(520, 390), fitScale(520, 1366), fitScale(520, 520), fitScale(520, 0)]).toEqual([0.75, 1, 1, 1])
    const a = frame("button")
    const doc = JSON.parse(JSON.stringify(documentSnapshot()))
    const root = document.documentElement
    const narrow = Object.defineProperty(root, "clientWidth", { configurable: true, get: () => a.w / 2 })
    try {
      const { container } = render(() => <PlayPage source={{ document: doc, artboardId: a.id, theme: "dark" }} />)
      const surface = container.querySelector<HTMLElement>(".play-surface")!
      expect([surface.style.width, surface.style.height, surface.style.transform]).toEqual([
        `${a.w}px`,
        `${a.h}px`,
        "scale(0.5)",
      ])
      const fit = surface.parentElement!
      expect([fit.style.width, fit.style.height]).toEqual([`${a.w / 2}px`, `${a.h / 2}px`])
    } finally {
      delete (narrow as { clientWidth?: number }).clientWidth
    }
    // a window as wide as the frame (a composition's) shows it as it is
    const wide = render(() => <PlayPage source={{ document: doc, artboardId: a.id, theme: "dark" }} />)
    expect(wide.container.querySelector<HTMLElement>(".play-surface")!.style.transform).toBe("")
  })

  it("cuts a reel between the frames of its own document, never the editor's", () => {
    const a = addArtboard("button")
    const reel = addReelArtboard([a.id])
    const doc = JSON.parse(JSON.stringify(documentSnapshot()))
    editor.artboards = []
    const { container } = render(() => <PlayPage source={{ document: doc, artboardId: reel.id, theme: "dark" }} />)
    expect(container.querySelector("[data-clip]")?.getAttribute("data-clip")).toBe(a.id)
  })

  it("reads its source from the embedded document first, then the link's hash", () => {
    const stage = document.createElement("div")
    stage.id = "dither-stage"
    document.body.append(stage)
    location.hash = `doc=${toBase64Url(JSON.stringify({ from: "hash" }))}&artboard=h&theme=light`
    expect(readPlaySource()).toEqual({ document: { from: "hash" }, artboardId: "h", theme: "light" })
    const embedded = document.createElement("script")
    embedded.id = "dither-document"
    embedded.type = "application/json"
    embedded.textContent = JSON.stringify({ from: "embedded" })
    document.body.append(embedded)
    stage.dataset.artboard = "s"
    stage.dataset.theme = "dark"
    expect(readPlaySource()).toEqual({ document: { from: "embedded" }, artboardId: "s", theme: "dark" })
    embedded.textContent = "{not json"
    expect(readPlaySource().document).toBeNull()
    stage.remove()
    embedded.remove()
    location.hash = ""
  })

  it("mounts in the stage, opens the clock's two doors and says when the build is ready", async () => {
    const a = frame("button")
    const stage = document.createElement("div")
    stage.id = "dither-stage"
    stage.dataset.theme = "light"
    document.body.append(stage)
    location.hash = `doc=${toBase64Url(JSON.stringify(documentSnapshot()))}`
    document.documentElement.classList.add("dark")
    const unmount = mountPlayer()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(stage.querySelector<HTMLElement>(".play-surface")?.dataset.artboardId).toBe(a.id)
    await expect(window.__hf?.buildReady?.["dither-ui"]).resolves.toBeUndefined()
    window.ditherClock?.seek(1.5)
    expect(window.ditherClock?.directed()).toBe(true)
    expect(window.ditherClock?.time()).toBe(1.5)
    window.ditherClock?.seek(-3)
    expect(window.ditherClock?.time()).toBe(0)
    // HyperFrames' own door: its seek event.
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 2 } }))
    expect(window.ditherClock?.time()).toBe(2)
    window.ditherClock?.release()
    expect(isDirected()).toBe(false)
    unmount()
    expect(stage.childElementCount).toBe(0)
    stage.remove()
    location.hash = ""
    expect(() => mountPlayer()).toThrow("#dither-stage")
  })
})

describe("artboard surface drag", () => {
  it("moves from passive space but leaves controls interactive", () => {
    const a = frame("button", 10, 20)
    selectArtboard(a.id)
    const { container } = render(() => <Artboard artboard={a} />)
    container
      .querySelector("[data-artboard-surface]")!
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: 50, clientY: 50 }),
      )
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 60, clientY: 55 }))
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }))
    expect([a.x, a.y]).toEqual([20, 25])

    container
      .querySelector("button")!
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 2, clientX: 60, clientY: 55 }),
      )
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 2, clientX: 80, clientY: 75 }))
    expect([a.x, a.y]).toEqual([20, 25])
  })
})

describe("a field's label setting", () => {
  /** The screen from the live run: an email field and a password field. */
  function signIn(labels: [string, string]) {
    const s = createScreen()
    const email = addCell(s.rows[0], componentEntry("DitherEmailInput")!)
    const password = addCell(s.rows[0], componentEntry("DitherPasswordInput")!)
    email.props.label = labels[0]
    password.props.label = labels[1]
    email.grow = true
    return s
  }

  it("ties the label to the control on the canvas, so the audit's placeholder rule passes", () => {
    const named = render(() => <ScreenRenderer screen={signIn(["Email", "Password"])} artboardId="a" />)
    const bare = render(() => <ScreenRenderer screen={signIn(["", ""])} artboardId="b" />)
    const box = { width: 200, height: 40, x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, toJSON() {} }
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect)
    const root = (r: typeof named) => r.container.firstElementChild!
    const fields = (r: typeof named) => [...root(r).querySelectorAll("input:not([type=button])")].slice(0, 2)
    expect(fields(named).map(nameOf)).toEqual(["Email", "Password"])
    expect(audit(root(named), root(named)).filter((i) => i.kind === "label")).toEqual([])
    expect(audit(root(bare), root(bare)).filter((i) => i.kind === "label")).toHaveLength(2)
    expect(root(bare).querySelector("label")).toBeNull()
  })

  it("labels a field standing as its own frame too", () => {
    const widget = createComponent(componentEntry("DitherSearchInput")!)
    widget.props.label = "Find a frame"
    const { container } = render(() => <WidgetRenderer widget={widget} artboardId="c" />)
    const label = container.querySelector("label")!
    expect(label.textContent?.trim()).toBe("Find a frame")
    expect(document.getElementById(label.getAttribute("for")!)?.tagName).toBe("INPUT")
  })
})

describe("studio canvas touch", () => {
  const touch = (type: string, pointerId: number, clientX: number, clientY: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId,
      pointerType: "touch",
      clientX,
      clientY,
    })
  beforeEach(() => {
    editor.artboards = [createArtboard("button", 300, 300)]
  })

  it("pans under one finger on empty canvas", () => {
    const { container } = render(() => <Canvas />)
    const host = container.querySelector(".dk-canvas")!
    host.dispatchEvent(touch("pointerdown", 1, 20, 20))
    window.dispatchEvent(touch("pointermove", 1, 60, 50))
    window.dispatchEvent(touch("pointerup", 1, 60, 50))
    expect([editor.viewport.x, editor.viewport.y]).toEqual([40, 30])
  })

  it("pinches about the fingers' midpoint and ends the first finger's drag", () => {
    const { container } = render(() => <Canvas />)
    const host = container.querySelector(".dk-canvas")!
    const surface = container.querySelector("[data-artboard-surface]")!
    const [x0, y0] = [editor.artboards[0].x, editor.artboards[0].y]

    // The first finger lands on the artboard and starts moving it.
    surface.dispatchEvent(touch("pointerdown", 1, 100, 100))
    window.dispatchEvent(touch("pointermove", 1, 110, 100))
    expect(editor.artboards[0].x).toBe(x0 + 10)

    // A second finger lands: the drag ends and the pinch takes over.
    host.dispatchEvent(touch("pointerdown", 2, 210, 100))
    window.dispatchEvent(touch("pointermove", 1, 60, 100))
    window.dispatchEvent(touch("pointermove", 2, 260, 100))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([x0 + 10, y0])
    // The spread doubled (100 to 200) about the unchanged midpoint (160, 100).
    expect(editor.viewport.zoom).toBeCloseTo(2)
    expect(editor.viewport.x).toBeCloseTo(160 - 160 * 2)
    expect(editor.viewport.y).toBeCloseTo(100 - 100 * 2)

    // Lifting both ends it; a later finger pans again.
    window.dispatchEvent(touch("pointerup", 1, 60, 100))
    window.dispatchEvent(touch("pointerup", 2, 260, 100))
    const x = editor.viewport.x
    host.dispatchEvent(touch("pointerdown", 3, 20, 20))
    window.dispatchEvent(touch("pointermove", 3, 30, 20))
    window.dispatchEvent(touch("pointerup", 3, 30, 20))
    expect(editor.viewport.x).toBeCloseTo(x + 10)
  })

  it("holds a third finger off and rebases on the pair that remains", () => {
    const { container } = render(() => <Canvas />)
    const host = container.querySelector(".dk-canvas")!
    host.dispatchEvent(touch("pointerdown", 1, 100, 100))
    host.dispatchEvent(touch("pointerdown", 2, 200, 100))
    // A third finger starts nothing of its own, not even a pan.
    const third = touch("pointerdown", 3, 150, 300)
    host.dispatchEvent(third)
    expect(third.defaultPrevented).toBe(true)
    window.dispatchEvent(touch("pointermove", 3, 190, 300))
    expect([editor.viewport.x, editor.viewport.y, editor.viewport.zoom]).toEqual([0, 0, 1])
    // The first lifts: fingers 2 and 3 are the pair now, and it starts from
    // them, so the view holds still until they move.
    window.dispatchEvent(touch("pointerup", 1, 100, 100))
    window.dispatchEvent(touch("pointermove", 2, 200, 100))
    expect([editor.viewport.x, editor.viewport.y, editor.viewport.zoom]).toEqual([0, 0, 1])
  })
})

describe("the ask at the selection", () => {
  function placed(y: number) {
    const a = createArtboard("button")
    a.x = 100
    a.y = y
    a.w = 300
    a.h = 200
    editor.artboards = [a]
    editor.selectedIds = [a.id]
    editor.viewport = { x: 0, y: 0, zoom: 1 }
    editor.stage = { w: 900, h: 700 }
    const { container, unmount } = render(() => <SelectionAsk held={false} />)
    const top = parseFloat(container.querySelector<HTMLElement>(".ask")!.style.top)
    unmount()
    return { top, frameTop: a.y, frameBottom: a.y + a.h }
  }

  it("stands under a frame with room under it", () => {
    const p = placed(100)
    expect(p.top).toBeGreaterThan(p.frameBottom)
  })

  it("moves above the frame when only the bars' foot is left under it", () => {
    // 700 tall: under the frame it would end at 610 + 10 + 36 = 656, inside the
    // 60px foot the bars stand in.
    const p = placed(410)
    expect(p.top).toBeLessThan(p.frameTop)
  })
})

describe("reel renderer", () => {
  // Mounts the Studio's widget renderer (the whole kit) — integration-scale budget.
  it(
    "cuts between frames on the kit clock, keeping each clip's element while it is on screen",
    { timeout: 30000 },
    async () => {
      const a = addArtboard("button")
      const b = addArtboard("button")
      const reel = addReelArtboard([a.id, b.id])
      if (reel.widget?.kind !== "reel") throw new Error("unreachable")
      const widget = reel.widget
      widget.clips[1].transition = { kind: "wipe-right", seconds: 1, cell: 4, seed: null }
      const { container } = render(() => <ReelRenderer reel={widget} artboardId={reel.id} />)
      const root = container.firstElementChild!
      const layers = () =>
        [...root.querySelectorAll("[data-reel-layer]")].map(
          (l) => `${l.getAttribute("data-reel-layer")}:${l.getAttribute("data-reveal")}`,
        )
      seek(1000)
      expect(root.getAttribute("data-reel-clip")).toBe("0")
      expect(layers()).toEqual(["0:shown"])
      const first = root.querySelector("[data-reel-layer='0']")
      seek(3500)
      expect(root.getAttribute("data-reel-clip")).toBe("1")
      expect(layers()).toEqual(["0:shown", "1:playing"])
      expect(root.querySelector("[data-reel-layer='0']")).toBe(first)
      expect([...root.querySelectorAll("[data-clip]")].map((c) => c.getAttribute("data-clip"))).toEqual([a.id, b.id])
      seek(4500)
      expect(layers()).toEqual(["1:shown"])
      // Directed time is held past the end rather than looped.
      seek(60000)
      expect(root.getAttribute("data-reel-clip")).toBe("1")
      // Free-running, the loop wraps.
      release()
      await w.frame(100000)
      await w.frame(100050)
      expect(Number(root.getAttribute("data-reel-time"))).toBeCloseTo(0.05)
    },
  )

  it("moves each clip by its camera, draws its callouts and keeps the chapter band", { timeout: 30000 }, () => {
    // The stage measures 640 x 360: callouts are placed in its pixels.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private cb: ResizeObserverCallback) {}
        observe() {
          this.cb([{ contentRect: { width: 640, height: 360 } } as ResizeObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    const a = addArtboard("button")
    const b = addArtboard("button")
    const reel = addReelArtboard([a.id, b.id])
    if (reel.widget?.kind !== "reel") throw new Error("unreachable")
    const widget = reel.widget
    widget.clips[0].camera = CAMERA_MOVES["push in"].map((k) => ({ ...k }))
    widget.clips[0].callouts = [{ x: 0.5, y: 0.5, label: "A button", note: "seeded", side: "right", from: 1, to: 3 }]
    widget.clips[0].chapter = { line: "One frame.", spec: [["1", "button"]] }
    widget.clips[1].chapter = { line: "Another frame.", spec: [] }
    const { container } = render(() => <ReelRenderer reel={widget} artboardId={reel.id} />)
    const camera = () => container.querySelector("[data-reel-camera]")?.getAttribute("style") ?? ""
    seek(0)
    expect(camera()).toContain("scale(1)")
    expect(container.querySelector("[data-reel-callout]")).toBeNull()
    expect(container.querySelector("[data-reel-chapter]")?.getAttribute("data-reel-chapter")).toBe("One frame.")
    seek(2000)
    expect(camera()).not.toContain("scale(1)")
    expect(container.querySelector("[data-reel-callout]")?.getAttribute("data-reel-callout")).toBe("A button")
    expect(container.querySelector(".reel-renderer-scope .callout .note")?.textContent).toBe("seeded")
    seek(5000)
    expect(container.querySelector("[data-reel-callout]")).toBeNull()
    expect(container.querySelector("[data-reel-chapter]")?.getAttribute("data-reel-chapter")).toBe("Another frame.")
    // The band stands in the renderer's slot.
    expect(container.querySelector(".reel-band")?.className).toContain("reel-band-slot shrink-0")
  })
})
