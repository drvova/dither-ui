// The workbench in Solid (`src/widgets/workbench/`), held to what its Vue
// twin did: the controller's undoable workspace, its keys and its Escape
// ladder, every layer of the overlay and every panel under the frame, the
// feedback sent to an agent or copied, and what unmounting gives back.
import { cleanup, render } from "@solidjs/testing-library"
import { createRoot, createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isDirected } from "dither-kit"
import { DEFAULT_SETTINGS } from "@/widgets/workbench/model/settings"
import { TOGGLES, TOOLS } from "@/widgets/workbench/model/tools"
import { Workbench, type WorkbenchApi } from "../../src/widgets/workbench"
import { type Bench, createBench } from "../../src/widgets/workbench/bench"
import { BENCH, useBench } from "../../src/widgets/workbench/context"
import Icon from "../../src/widgets/workbench/ui/Icon"
import Keyed from "../../src/widgets/workbench/ui/Keyed"

let frames: FrameRequestCallback[] = []
/** Run the frames asked for so far: one turn of the measuring loop. */
function step(now: number) {
  const due = frames
  frames = []
  for (const cb of due) cb(now)
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0))

beforeEach(() => {
  frames = []
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal("cancelAnimationFrame", () => {})
  // jsdom draws nothing: the layers that paint find no context and stand down.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ""
  localStorage.clear()
})

const rect = (x: number, y: number, w: number, h: number) =>
  ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y, toJSON() {} }) as DOMRect

/** A preview on a card, the way a docs card or the Studio hands it over:
 * one button at 40,60 (100x30) on a 400x300 stage. */
function preview() {
  const card = document.createElement("main")
  const host = document.createElement("div")
  host.tabIndex = 0
  const content = document.createElement("div")
  content.innerHTML = `<button id="go" aria-label="Deploy">Deploy</button>`
  host.append(content)
  card.append(host)
  document.body.append(card)
  const button = content.querySelector("button")!
  button.getBoundingClientRect = () => rect(40, 60, 100, 30)
  content.getBoundingClientRect = () => rect(0, 0, 400, 300)
  // What stands under the pointer: the button inside its box, else the preview.
  document.elementsFromPoint = (x: number, y: number) =>
    x >= 40 && x <= 140 && y >= 60 && y <= 90 ? [button, content, host] : [content, host]
  return { card, host, content, button }
}

function bench(props: { send?: (md: string) => void; render?: () => Element } = {}) {
  const p = preview()
  let api!: WorkbenchApi
  const exits: number[] = []
  const view = render(
    () => (
      <Workbench
        host={p.host}
        content={p.content}
        card={p.card}
        benchKey="button:1"
        section="button"
        title="Button"
        url="https://x/docs/button"
        send={props.send}
        render={props.render}
        onExit={() => exits.push(1)}
        ref={(a) => (api = a)}
      />
    ),
    { container: p.card },
  )
  const overlay = p.host.querySelector<HTMLElement>(".wb")!
  Object.defineProperty(overlay, "clientWidth", { value: 400 })
  Object.defineProperty(overlay, "clientHeight", { value: 300 })
  overlay.getBoundingClientRect = () => rect(0, 0, 400, 300)
  const b = api.bench
  const tray = () => p.host.querySelector<HTMLElement>('[role="toolbar"][aria-label="Workbench tools"]')!
  const pressed = () =>
    [...tray().querySelectorAll('button[aria-pressed="true"]')].map((k) => k.getAttribute("aria-label"))
  const key = (k: string, init: KeyboardEventInit = {}) =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: k, cancelable: true, ...init }))
  /** A pointer event on the surface the tool in hand lays over the preview. */
  const point = (type: string, x: number, y: number, init: MouseEventInit = {}) =>
    overlay
      .querySelector(".wb-surface")!
      .dispatchEvent(
        new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true, ...init }),
      )
  const drag = (from: [number, number], to: [number, number], init: MouseEventInit = {}) => {
    point("pointerdown", ...from, init)
    point("pointermove", ...to, init)
    point("pointerup", ...to, init)
  }
  p.host.dispatchEvent(new Event("pointerenter"))
  // The loop's first turn measures the stage.
  step(0)
  return { ...p, ...view, b, overlay, tray, pressed, key, point, drag, exits }
}

describe("the workbench's feedback", () => {
  it("goes to the agent when the page gives it somewhere to go", async () => {
    const sent: string[] = []
    const w = bench({ send: (md) => sent.push(md) })
    const k = document.querySelector<HTMLButtonElement>('[aria-keyshortcuts="k"]')!
    expect(k.getAttribute("aria-label")).toBe("Send feedback to the agent (K)")
    k.click()
    await tick()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toContain("Button")
    expect(w.card.querySelector('[role="status"]')!.textContent).toBe("Sent the feedback to the agent")
  })

  it("is copied where there is no agent", async () => {
    const w = bench()
    const k = document.querySelector<HTMLButtonElement>('[aria-keyshortcuts="k"]')!
    expect(k.getAttribute("aria-label")).toBe("Copy feedback for an agent (K)")
    const written: string[] = []
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (t: string) => void written.push(t) },
      configurable: true,
    })
    w.key("k")
    await tick()
    expect(written[0]).toContain("https://x/docs/button")
    expect(w.card.querySelector('[role="status"]')!.textContent).toBe("Copied the feedback for an agent")
  })
})

describe("the workbench on a preview", () => {
  it("switches tools by key and by tray, and steps out with Escape", () => {
    const w = bench()
    expect(w.tray()).not.toBeNull()
    expect(w.pressed()).toContain("Inspect (I)")
    // The overlay is the frame's own child, and the frame keeps the tray's lane.
    expect(w.overlay.parentElement).toBe(w.host)
    expect(w.host.dataset.tray).toBe("bottom")

    w.host.focus()
    w.key("x")
    expect(w.pressed()).toContain("X-ray (X)")
    w.key("2")
    expect(w.tray().querySelector('[aria-label="Arrow (D)"]')).not.toBeNull()
    w.tray().querySelector<HTMLButtonElement>('[aria-label="Comment (M)"]')!.click()
    expect(w.pressed()).toContain("Comment (M)")
    expect(w.card.textContent).toContain("Click an element to start a thread on it")

    // Escape: the tool goes, then the workbench closes.
    w.key("Escape")
    expect(w.pressed().some((l) => l?.startsWith("Comment"))).toBe(false)
    expect(w.overlay.querySelector(".wb-surface")).toBeNull()
    expect(w.exits).toHaveLength(0)
    w.key("Escape")
    expect(w.exits).toHaveLength(1)
  })

  it("gives every tool and toggle its key, and none to a field being typed in", () => {
    const w = bench()
    for (const t of TOOLS) {
      w.b.setTool(null)
      w.key(t.key)
      expect(w.b.tool()).toBe(t.id)
      expect(w.b.group()).toBe(t.group)
    }
    for (const t of TOGGLES) {
      const was = w.b.toggles[t.id]
      w.key(t.key)
      expect(w.b.toggles[t.id]).toBe(!was)
      w.key(t.key)
    }
    const input = document.createElement("input")
    w.card.append(input)
    w.b.setTool("inspect")
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }))
    expect(w.b.tool()).toBe("inspect")
  })

  it("keeps its keys to the preview under the pointer or holding focus", () => {
    const w = bench()
    w.host.dispatchEvent(new Event("pointerleave"))
    w.key("x")
    expect(w.b.tool()).toBe("inspect")
    w.host.focus()
    w.key("x")
    expect(w.b.tool()).toBe("xray")
  })

  it("steps back one level per Escape: thread, selection, pin, panel, tool", () => {
    const w = bench()
    w.point("pointerdown", 50, 70)
    expect(w.b.pinned()).toBe(w.button)
    w.key(",")
    expect(w.b.panel()).toBe("settings")
    w.key("Escape")
    expect(w.b.pinned()).toBeNull()
    expect(w.b.panel()).toBe("settings")
    w.key("Escape")
    expect(w.b.panel()).toBeNull()
    expect(w.b.tool()).toBe("inspect")
    w.key("Escape")
    expect(w.b.tool()).toBeNull()
    expect(w.exits).toHaveLength(0)
  })

  it("gives back what it took when it unmounts", () => {
    const w = bench()
    w.b.toggle("motion")
    w.card.querySelector<HTMLButtonElement>('.wb-motion [aria-pressed="false"].act')!.click()
    expect(isDirected()).toBe(true)
    w.unmount()
    expect(isDirected()).toBe(false)
    expect(w.host.dataset.tray).toBeUndefined()
    expect(w.host.querySelector(".wb")).toBeNull()
    w.key("x")
    expect(w.b.tool()).toBe("inspect")
  })
})

describe("the controller", () => {
  it("undoes and redoes by snapshot, and drops a gesture that changed nothing", () => {
    const w = bench()
    const before = w.b.ws()
    w.b.change((d) => d.guides.push({ id: "g1", axis: "x", at: 20 }))
    expect(w.b.ws()).not.toBe(before)
    expect(w.b.ws().guides).toHaveLength(1)
    expect(w.b.history.canUndo).toBe(true)
    w.key("z", { ctrlKey: true })
    expect(w.b.ws().guides).toHaveLength(0)
    expect(w.b.status()).toBe("Undone")
    w.key("z", { ctrlKey: true, shiftKey: true })
    expect(w.b.ws().guides).toHaveLength(1)
    w.key("z", { ctrlKey: true })
    w.key("z", { ctrlKey: true })
    expect(w.b.status()).toBe("Nothing to undo")

    // A press on a guide that goes nowhere leaves no step behind.
    w.b.change((d) => d.guides.push({ id: "g2", axis: "x", at: 100 }))
    w.key("g")
    w.point("pointerdown", 100, 50)
    w.point("pointerup", 100, 50)
    w.key("z", { ctrlKey: true })
    expect(w.b.ws().guides).toHaveLength(0)
    expect(w.b.history.canUndo).toBe(false)
  })

  it("keeps the workspace per preview, debounced, and only while asked to", () => {
    vi.useFakeTimers()
    const w = bench()
    w.b.change((d) => d.guides.push({ id: "g1", axis: "y", at: 12 }))
    expect(localStorage.getItem("dither-workbench:button:1")).toBeNull()
    vi.advanceTimersByTime(260)
    expect(localStorage.getItem("dither-workbench:button:1")).toContain('"at":12')
    w.b.settings.persist = false
    expect(localStorage.getItem("dither-workbench:button:1") ?? "").not.toContain('"at":12')
    expect(JSON.parse(localStorage.getItem("dither-workbench-settings")!).persist).toBe(false)
  })

  it("loads what the preview kept and one set of settings for all", () => {
    localStorage.setItem("dither-workbench-settings", JSON.stringify({ ...DEFAULT_SETTINGS, tray: "top" }))
    const first = bench()
    first.b.change((d) => d.notes.push({ id: "n1", at: { x: 5, y: 6 }, text: "tighter", color: "red", size: 13 }))
    first.unmount()
    document.body.innerHTML = ""
    const again = bench()
    expect(again.b.ws().notes[0].text).toBe("tighter")
    expect(again.host.dataset.tray).toBe("top")
    expect(again.tray().classList.contains("top")).toBe(true)
    expect(again.host.querySelector("[data-note]")!.textContent).toBe("tighter")
  })

  it("says what it did in a polite status line that clears", () => {
    vi.useFakeTimers()
    const w = bench()
    w.key("r")
    const status = w.card.querySelector('[role="status"][aria-live="polite"]')!
    expect(status.textContent).toBe("Rulers off")
    vi.advanceTimersByTime(2800)
    expect(status.textContent).toBe("")
  })

  it("runs outside a component too, on signals", () => {
    const p = preview()
    createRoot((dispose) => {
      const b: Bench = createBench({ ...p, key: "k", section: "s", title: "T", url: "u", exit() {} })
      expect(b.tool()).toBe("inspect")
      b.setTool("inspect")
      expect(b.tool()).toBeNull()
      b.setGroup(2)
      expect(b.group()).toBe(2)
      b.setPanel("settings")
      expect(b.panel()).toBe("settings")
      dispose()
    })
  })
})

describe("the measuring loop", () => {
  it("reads the pointed element into the marks, the rulers and the readout", () => {
    const w = bench()
    w.point("pointermove", 50, 70)
    step(1000)
    expect(w.b.size()).toEqual({ w: 400, h: 300 })
    expect(w.b.reading()?.box).toEqual({ x: 40, y: 60, w: 100, h: 30 })
    const target = w.overlay.querySelector<HTMLElement>(".wb-marks .target")!
    expect(target.style.left).toBe("40px")
    expect(target.style.width).toBe("100px")
    expect(target.querySelector(".chip")!.textContent).toContain("100×30")
    const span = w.overlay.querySelector<HTMLElement>(".wb-rule-x .span")!
    expect(span.style.left).toBe("40px")
    expect(w.overlay.querySelector<HTMLElement>(".wb-rule-x .at")!.style.left).toBe("50px")
    // Labels every 50 along each ruler.
    expect([...w.overlay.querySelectorAll(".wb-rule-x > span")].map((s) => s.textContent)).toEqual([
      "50",
      "100",
      "150",
      "200",
      "250",
      "300",
      "350",
      "400",
    ])
    const readout = w.card.querySelector(".wb-readout")!
    expect(readout.getAttribute("aria-label")).toBe("Workbench: Inspect")
    expect(readout.textContent).toContain("pointing")
    expect(readout.querySelector(".model .c")!.textContent).toMatch(/^\d+×\d+$/)

    // A click pins it; the arrows then walk the tree from there.
    w.point("pointerdown", 50, 70)
    expect(w.b.status()).toMatch(/^Pinned /)
    step(1100)
    expect(readout.textContent).toContain("pinned")
    // The same reading writes nothing: the box is the object it was.
    const kept = w.b.reading()
    step(1200)
    expect(w.b.reading()).toBe(kept)
  })

  it("names the role, the name and the Tab order under Accessibility", () => {
    const w = bench()
    w.key("y")
    w.point("pointermove", 50, 70)
    step(1000)
    expect(w.b.a11y()).toMatchObject({ role: "button", name: "Deploy", control: true })
    expect(w.b.order()).toHaveLength(1)
    expect(w.overlay.querySelector(".wb-marks .order")!.textContent).toBe("1")
    expect(w.card.querySelector(".wb-readout")!.textContent).toContain("1 tab stops")
  })

  it("draws X-ray's boxes and says how many", () => {
    const w = bench()
    w.key("x")
    step(1000)
    expect(w.b.xray()).toHaveLength(1)
    expect(w.overlay.querySelector<HTMLElement>("canvas.xray")!.style.display).toBe("")
    expect(w.card.querySelector(".wb-readout")!.textContent).toContain("1 elements, 0 flex or grid (dashed), depth 1")
    w.key("i")
    expect(w.overlay.querySelector<HTMLElement>("canvas.xray")!.style.display).toBe("none")
  })
})

describe("the overlay's layers", () => {
  it("places a guide where the Guides tool clicks, by number, and out of a ruler", () => {
    const w = bench()
    w.key("g")
    w.b.settings.snap = false
    w.point("pointermove", 200, 50)
    const ghost = w.overlay.querySelector<HTMLElement>(".wb-guides .line.preview")!
    expect(ghost.classList.contains("x")).toBe(true)
    expect(ghost.style.left).toBe("200px")
    w.drag([200, 50], [200, 50])
    expect(w.b.ws().guides).toMatchObject([{ axis: "x", at: 200 }])
    w.key("h")
    expect(w.b.guideAxis()).toBe("y")
    expect(w.b.status()).toBe("Horizontal guides")

    // By number, from the readout.
    const form = w.card.querySelector<HTMLFormElement>(".wb-readout form")!
    w.card.querySelector<HTMLButtonElement>('.wb-readout [aria-pressed="false"]')!.click()
    expect(w.b.guideAxis()).toBe("x")
    const at = form.querySelector("input")!
    at.value = "260"
    at.dispatchEvent(new Event("input", { bubbles: true }))
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    expect(w.b.ws().guides.map((g) => g.at)).toEqual([200, 260])
    // The gap between neighbours on an axis is labelled between them.
    const gap = w.overlay.querySelector<HTMLElement>(".wb-guides .gap")!
    expect(gap.textContent).toBe("60")
    expect(gap.style.left).toBe("230px")
    expect(w.card.querySelectorAll(".wb-readout .tags li")).toHaveLength(2)

    // Out of the top ruler: a horizontal guide, dropped on the stage.
    w.overlay
      .querySelector(".wb-rule-x")!
      .dispatchEvent(
        new MouseEvent("pointerdown", { clientX: 80, clientY: 4, button: 0, bubbles: true, cancelable: true }),
      )
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 80, clientY: 120 }))
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 80, clientY: 120 }))
    expect(w.b.ws().guides.at(-1)).toMatchObject({ axis: "y", at: 120 })
    // Dragged off the stage, a guide goes.
    w.drag([200, 50], [200, 400])
    w.point("pointerdown", 200, 50)
    w.point("pointermove", 500, 50)
    w.point("pointerup", 500, 50)
    expect(w.b.ws().guides.some((g) => g.at === 200)).toBe(false)
    expect(w.b.status()).toBe("Guide removed")
  })

  it("shows the layout grid the readout sets", () => {
    const w = bench()
    w.key("g")
    const box = w.card.querySelector<HTMLInputElement>('.wb-readout .grid-ctl input[type="checkbox"]')!
    box.checked = true
    box.dispatchEvent(new Event("change", { bubbles: true }))
    step(1000)
    expect(w.b.ws().grid.show.columns).toBe(true)
    expect(w.overlay.querySelectorAll(".wb-guides .band")).toHaveLength(w.b.ws().grid.columns)
  })

  it("draws an arrow, selects it, moves it, and deletes it as undoable steps", () => {
    const w = bench()
    w.key("d")
    w.b.settings.snap = false
    w.point("pointerdown", 200, 200)
    w.point("pointermove", 260, 200)
    expect(w.overlay.querySelectorAll(".wb-ink g path")).toHaveLength(2)
    w.point("pointerup", 260, 200)
    expect(w.b.ws().arrows).toMatchObject([{ from: { x: 200, y: 200 }, to: { x: 260, y: 200 }, width: 2 }])
    const drawn = w.overlay.querySelector(".wb-ink g")!

    w.key("s")
    step(1000)
    w.drag([230, 200], [240, 220])
    expect(w.b.selection()).toHaveLength(1)
    expect(w.b.ws().arrows[0].from).toEqual({ x: 210, y: 220 })
    // The row is the arrow it was: only what it reads moved.
    expect(w.overlay.querySelector(".wb-ink g")).toBe(drawn)
    expect(w.overlay.querySelectorAll(".wb-ink .selected")).toHaveLength(1)
    expect(w.overlay.querySelectorAll(".wb-ink .handles .knob")).toHaveLength(5)
    expect(w.card.querySelector(".wb-readout")!.textContent).toContain("selected 1")

    w.key("ArrowRight", { shiftKey: true })
    expect(w.b.ws().arrows[0].from.x).toBe(220)
    w.key("Delete")
    expect(w.b.ws().arrows).toHaveLength(0)
    expect(w.b.status()).toBe("Deleted 1 annotation")
    w.key("z", { metaKey: true })
    expect(w.b.ws().arrows).toHaveLength(1)
  })

  it("inks a stroke with the pen in hand and rubs it out", () => {
    const w = bench()
    w.key("n")
    w.point("pointerdown", 100, 100)
    w.point("pointermove", 120, 110)
    expect(w.overlay.querySelector(".wb-ink > path")).not.toBeNull()
    w.point("pointerup", 140, 120)
    expect(w.b.ws().strokes).toMatchObject([{ kind: "ink", width: 3 }])
    // The marker, from the readout.
    w.card.querySelectorAll<HTMLButtonElement>('.wb-readout [aria-label="Pen"] button')[1].click()
    expect(w.b.settings.pen).toBe("marker")
    w.drag([10, 10], [30, 30])
    expect(w.b.ws().strokes[1]).toMatchObject({ kind: "marker", width: 14 })
    expect(w.overlay.querySelector(".wb-ink .marker")).not.toBeNull()

    w.key("e")
    w.point("pointermove", 100, 100)
    expect(w.overlay.querySelector(".wb-ink .eraser")!.getAttribute("r")).toBe("8")
    w.drag([100, 100], [120, 110])
    expect(w.b.ws().strokes.every((s) => s.kind === "marker")).toBe(true)
  })

  it("writes a note in place: Enter keeps it, an empty one goes", async () => {
    const w = bench()
    w.key("t")
    w.point("pointerdown", 30, 40)
    await tick()
    const field = w.overlay.querySelector<HTMLTextAreaElement>(".wb-notes textarea")!
    expect(field.getAttribute("aria-label")).toBe("Note text")
    expect(document.activeElement).toBe(field)
    field.value = "tighter\nhere"
    field.dispatchEvent(new Event("input", { bubbles: true }))
    expect(field.rows).toBe(2)
    // A key in the field is the field's, never a tool's.
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
    expect(w.b.editing()).toBeNull()
    expect(w.b.tool()).toBe("text")
    const note = w.overlay.querySelector<HTMLElement>(".wb-notes .note")!
    expect(note.textContent).toBe("tighter\nhere")
    expect(note.style.left).toBe("30px")
    expect(note.dataset.note).toBe(w.b.ws().notes[0].id)

    // Written in again by a double click; emptied, it goes.
    note.getBoundingClientRect = () => rect(30, 40, 60, 20)
    w.point("dblclick", 35, 45)
    await tick()
    const again = w.overlay.querySelector<HTMLTextAreaElement>(".wb-notes textarea")!
    expect(again.value).toBe("tighter\nhere")
    again.value = " "
    again.dispatchEvent(new Event("input", { bubbles: true }))
    again.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    expect(w.b.ws().notes).toHaveLength(0)
    expect(w.exits).toHaveLength(0)
  })

  it("pins a comment thread to the control clicked, replies, resolves and deletes", async () => {
    const w = bench()
    w.key("m")
    w.point("pointermove", 50, 70)
    step(1000)
    expect(w.overlay.querySelector(".wb-marks .ghost .chip")!.textContent).toContain("comment on ")
    w.point("pointerdown", 50, 70)
    expect(w.b.draftThread()).toMatchObject({ at: { x: 50, y: 70 }, offset: { x: 10, y: 10 } })
    expect(w.b.draftThread()!.selector.startsWith("#button ")).toBe(true)
    await tick()
    const pop = () => w.overlay.querySelector<HTMLElement>('.wb-comments [role="dialog"]')!
    expect(pop().getAttribute("aria-label")).toBe("New comment")
    const field = () => pop().querySelector("textarea")!
    expect(document.activeElement).toBe(field())
    const post = () => pop().querySelector<HTMLButtonElement>(".act.primary")!
    expect(post().disabled).toBe(true)
    const write = (text: string) => {
      field().value = text
      field().dispatchEvent(new Event("input", { bubbles: true }))
    }
    write("Too wide")
    field().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
    expect(w.b.ws().threads).toMatchObject([{ n: 1, resolved: false, messages: [{ text: "Too wide" }] }])
    step(2000)
    const pin = w.overlay.querySelector<HTMLButtonElement>(".wb-comments button.pin")!
    expect(pin.getAttribute("aria-label")).toBe("Comment 1: Too wide")
    expect(pin.getAttribute("aria-expanded")).toBe("true")
    expect(pin.style.left).toBe("50px")
    expect(pop().getAttribute("aria-label")).toMatch(/^Comment 1 on /)
    expect(field().value).toBe("")

    write("By 8px")
    post().click()
    expect(pop().querySelectorAll(".msg")).toHaveLength(2)
    // The thread in the readout's list, found by what was said.
    const search = w.card.querySelector<HTMLInputElement>(".wb-readout .search")!
    expect(w.card.querySelectorAll(".wb-readout .thread")).toHaveLength(1)
    search.value = "nothing like it"
    search.dispatchEvent(new Event("input", { bubbles: true }))
    expect(w.card.querySelector(".wb-readout")!.textContent).toContain("No thread matches.")

    const act = (label: string) =>
      [...pop().querySelectorAll<HTMLButtonElement>(".foot .act")].find((k) => k.textContent === label)!
    act("Resolve").click()
    expect(pin.classList.contains("resolved")).toBe(true)
    expect(pin.getAttribute("aria-label")).toBe("Comment 1, resolved: Too wide")
    expect(act("Reopen")).toBeDefined()
    // Escape in the field closes the thread and nothing more.
    field().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    expect(w.b.openThread()).toBeNull()
    expect(w.b.tool()).toBe("comment")
    pin.click()
    act("Delete").click()
    expect(w.b.ws().threads).toHaveLength(0)
    expect(w.overlay.querySelector(".wb-comments .pin")).toBeNull()
  })

  it("holds a press on the tray and a pin from the frame under them", () => {
    const w = bench()
    const seen: string[] = []
    w.host.addEventListener("pointerdown", () => seen.push("host"))
    w.tray()
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    expect(seen).toEqual([])
  })

  it("roams the tray with the arrows, and folds it away", () => {
    const w = bench()
    const keys = [...w.tray().querySelectorAll<HTMLButtonElement>("button:not(:disabled)")]
    keys[0].focus()
    const press = (k: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))
    press("ArrowRight")
    expect(document.activeElement).toBe(keys[1])
    press("End")
    expect(document.activeElement).toBe(keys.at(-1))
    press("ArrowRight")
    expect(document.activeElement).toBe(keys[0])
    // The arrows moved focus, not a pin.
    expect(w.b.pinned()).toBeNull()
    expect(w.tray().querySelector<HTMLButtonElement>('[aria-label="Undo (⌘Z)"]')!.disabled).toBe(true)

    w.tray().querySelector<HTMLButtonElement>('[aria-label="Minimize the tray"]')!.click()
    const show = w.tray().querySelectorAll("button")
    expect(show).toHaveLength(1)
    expect(show[0].getAttribute("aria-label")).toBe("Show the tools (inspect in hand)")
    show[0].click()
    expect(w.tray().querySelectorAll("button").length).toBeGreaterThan(8)
  })

  it("shows the loupe under the pointer and zooms it with the wheel", () => {
    const w = bench()
    w.key("z")
    expect(w.overlay.querySelector(".wb-loupe")).toBeNull()
    w.point("pointermove", 100, 100)
    const loupe = w.overlay.querySelector<HTMLElement>(".wb-loupe")!
    expect(loupe.style.left).toBe("120px")
    expect(loupe.textContent).toContain("100,100 at 10×")
    w.overlay.querySelector(".wb-surface")!.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }))
    expect(w.b.loupeZoom()).toBe(13)
    // Near the far edges it flips to stay on the stage.
    w.point("pointermove", 390, 290)
    expect(w.overlay.querySelector<HTMLElement>(".wb-loupe")!.style.left).toBe(`${390 - 20 - 132}px`)
    w.host.dispatchEvent(new Event("pointerleave"))
    expect(w.overlay.querySelector(".wb-loupe")).toBeNull()
  })

  it("marks the region a screenshot would take", () => {
    const w = bench()
    w.key("c")
    w.point("pointerdown", 10, 10)
    w.point("pointermove", 110, 60)
    expect(w.overlay.querySelector(".wb-ink rect.region")!.getAttribute("width")).toBe("100")
    expect(w.overlay.querySelector(".wb-size")!.textContent).toBe("100×50")
    w.key("Escape")
    expect(w.b.draft()).toBeNull()
    expect(w.overlay.querySelector(".wb-size")).toBeNull()
  })
})

describe("the panels under the frame", () => {
  it("sets the overlay's colours, the tray's edge and the defaults from Settings", () => {
    const w = bench()
    expect(w.overlay.style.getPropertyValue("--wb-hl")).toBe("var(--swatch-orange)")
    w.key(",")
    const panel = w.card.querySelector<HTMLElement>(".wb-settings")!
    expect(panel.getAttribute("aria-label")).toBe("Workbench settings")
    const radios = panel.querySelectorAll<HTMLButtonElement>('[aria-label="highlight colour"] [role="radio"]')
    expect(radios[0].getAttribute("aria-checked")).toBe("true")
    radios[3].click()
    expect(w.overlay.style.getPropertyValue("--wb-hl")).toBe("var(--swatch-green)")
    expect(radios[3].getAttribute("aria-checked")).toBe("true")
    expect(JSON.parse(localStorage.getItem("dither-workbench-settings")!).highlight).toBe("green")

    const top = [...panel.querySelectorAll<HTMLButtonElement>('[aria-label="Where the tray docks"] button')][1]
    top.click()
    expect(w.host.dataset.tray).toBe("top")
    expect(w.tray().classList.contains("top")).toBe(true)

    const checks = panel.querySelectorAll<HTMLInputElement>('.check input[type="checkbox"]')
    expect(checks).toHaveLength(5)
    expect(checks[1].checked).toBe(true)
    checks[1].click()
    expect(w.b.settings.snap).toBe(false)

    ;[...panel.querySelectorAll<HTMLButtonElement>(".act")].find((k) => k.textContent === "Restore defaults")!.click()
    expect({ ...w.b.settings }).toEqual(DEFAULT_SETTINGS)
    expect(w.host.dataset.tray).toBe("bottom")
    panel.querySelector<HTMLButtonElement>('[aria-label="Close settings"]')!.click()
    expect(w.card.querySelector(".wb-settings")).toBeNull()
  })

  it("holds, steps and releases the kit clock from Motion", () => {
    const w = bench()
    w.key("o")
    const panel = w.card.querySelector<HTMLElement>(".wb-motion")!
    expect(panel.textContent).toContain("0 animations in this preview")
    expect(panel.textContent).toContain("No CSS or Web animations here.")
    expect(panel.textContent).toContain("Every dithered surface on the page, running")
    const hold = [...panel.querySelectorAll<HTMLButtonElement>(".clock .act")].find((k) =>
      k.hasAttribute("aria-pressed"),
    )!
    expect(hold.textContent).toContain("Hold")
    panel.querySelector<HTMLButtonElement>('[aria-label="Forward one frame"]')!.click()
    expect(isDirected()).toBe(true)
    expect(hold.getAttribute("aria-pressed")).toBe("true")
    expect(panel.textContent).toContain("held at 0.033 s")
    hold.click()
    expect(isDirected()).toBe(false)
    expect(w.b.status()).toBe("Kit clock released")
    const rates = panel.querySelectorAll<HTMLButtonElement>('[aria-label="Playback rate"] button')
    rates[0].click()
    expect(rates[0].getAttribute("aria-pressed")).toBe("true")
    expect(w.b.status()).toBe("Playback at 0.1×")
  })

  it("renders the preview again at each width under Responsive, inert", () => {
    let copies = 0
    const w = bench({
      render: () => {
        copies++
        const el = document.createElement("button")
        el.className = "copy"
        return el
      },
    })
    w.key("b")
    const panel = w.card.querySelector<HTMLElement>(".wb-responsive")!
    const widths = () => [...panel.querySelectorAll<HTMLElement>("[data-frame]")].map((f) => f.dataset.frame)
    expect(widths()).toEqual(["320", "768", "1280"])
    expect(copies).toBe(3)
    const frame = panel.querySelector<HTMLElement>("[data-frame]")!
    expect(frame.hasAttribute("inert")).toBe(true)
    expect(frame.getAttribute("aria-hidden")).toBe("true")
    expect(frame.querySelector(".copy")).not.toBeNull()
    expect(frame.style.width).toBe("320px")

    const presets = panel.querySelectorAll<HTMLButtonElement>('[aria-label="Frame widths"] button')
    presets[1].click()
    expect(widths()).toEqual(["320", "375", "768", "1280"])
    expect(copies).toBe(4)
    presets[0].click()
    expect(widths()).toEqual(["375", "768", "1280"])
    const form = panel.querySelector("form")!
    const custom = form.querySelector("input")!
    custom.value = "100"
    custom.dispatchEvent(new Event("input", { bubbles: true }))
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    expect(widths()).toEqual(["160", "375", "768", "1280"])
    expect(w.b.status()).toBe("160 px frame")
    panel.querySelector<HTMLButtonElement>('[aria-label="Close responsive frames"]')!.click()
    expect(w.card.querySelector(".wb-responsive")).toBeNull()
  })

  it("lists a colour sample in every format and copies the one asked for", async () => {
    const w = bench()
    w.key("p")
    const readout = w.card.querySelector<HTMLElement>(".wb-readout")!
    expect(readout.textContent).toContain("no samples yet")
    const written: string[] = []
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (t: string) => void written.push(t) },
      configurable: true,
    })
    await w.b.addSample({ r: 255, g: 0, b: 0, a: 1 })
    expect(written).toEqual(["#ff0000"])
    expect(readout.querySelectorAll(".fields .value")).toHaveLength(4)
    expect(readout.querySelector('[aria-label="Recent samples"] [role="listitem"]')!.getAttribute("aria-label")).toBe(
      "Copy #ff0000",
    )
    const formats = readout.querySelectorAll<HTMLButtonElement>('[aria-label="Colour format"] button')
    formats[1].click()
    expect(w.b.settings.format).toBe("rgb")
    expect(readout.querySelector('[role="listitem"]')!.getAttribute("aria-label")).toMatch(/^Copy rgb/)
  })
})

describe("the workbench's parts", () => {
  it("draws an icon from path data, decorative", () => {
    const { container } = render(() => <Icon d="M1 1h2" size={12} />)
    const svg = container.querySelector("svg")!
    expect(svg.getAttribute("width")).toBe("12")
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.querySelector("path")!.getAttribute("d")).toBe("M1 1h2")
    expect(
      render(() => <Icon d="M0 0" />)
        .container.querySelector("svg")!
        .getAttribute("height"),
    ).toBe("16")
  })

  it("keeps a row for as long as its id, reading it fresh", () => {
    const [rows, setRows] = createSignal([
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ])
    const { container } = render(() => <Keyed each={rows()}>{(r) => <li>{r().n}</li>}</Keyed>)
    const [a, b] = container.querySelectorAll("li")
    setRows([
      { id: "b", n: 20 },
      { id: "c", n: 3 },
    ])
    const next = container.querySelectorAll("li")
    expect([...next].map((li) => li.textContent)).toEqual(["20", "3"])
    expect(next[0]).toBe(b)
    expect(a.isConnected).toBe(false)
  })

  it("has no bench outside a workbench", () => {
    expect(() => createRoot(() => useBench())).toThrow("useBench() outside a Workbench")
    expect(BENCH.defaultValue).toBeUndefined()
  })
})
