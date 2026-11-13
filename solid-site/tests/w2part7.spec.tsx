// The Solid ports of the controls, overlays, text and cursor widgets from
// ColorPicker to TargetCursor, held to what their Vue twins did: each renders
// its content under its role and name, reports a change through its
// callback, and the ones with a canvas paint it.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal, useContext } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { release, seek } from "@dither-kit/engine/clock"
import { ICONS } from "@dither-kit/engine/icons"
import ColorPicker from "../../dither-kit/solid/ColorPicker"
import DitherConsole from "../../dither-kit/solid/DitherConsole"
import DitherField from "../../dither-kit/solid/DitherField"
import DitherLayer from "../../dither-kit/solid/DitherLayer"
import DitherMenubar from "../../dither-kit/solid/DitherMenubar"
import DitherPopover from "../../dither-kit/solid/DitherPopover"
import DitherProgress from "../../dither-kit/solid/DitherProgress"
import DitherReveal from "../../dither-kit/solid/DitherReveal"
import DitherScrollArea from "../../dither-kit/solid/DitherScrollArea"
import DitherShell from "../../dither-kit/solid/DitherShell"
import DitherStage, { STAGE } from "../../dither-kit/solid/DitherStage"
import DitherSwitch from "../../dither-kit/solid/DitherSwitch"
import DitherTooltip from "../../dither-kit/solid/DitherTooltip"
import FadeContent from "../../dither-kit/solid/FadeContent"
import FocusRing from "../../dither-kit/solid/FocusRing"
import GhostCursor from "../../dither-kit/solid/GhostCursor"
import HoldAction from "../../dither-kit/solid/HoldAction"
import IconSet from "../../dither-kit/solid/IconSet"
import Portal from "../../dither-kit/solid/Portal"
import { useField } from "../../dither-kit/solid/runtime/field"
import ScrollProgress from "../../dither-kit/solid/ScrollProgress"
import SignaturePad from "../../dither-kit/solid/SignaturePad"
import SplashCursor from "../../dither-kit/solid/SplashCursor"
import SplitText from "../../dither-kit/solid/SplitText"
import TargetCursor from "../../dither-kit/solid/TargetCursor"
import { world } from "./world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  release()
  w.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** A 2D context that records the shapes drawn on it (the world's records
 * uploads only). */
function drawing() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  }
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
  return ctx
}

/** Hold `performance.now()` at `ms` on the world's frame clock, so a
 * component that reads both sees one time. */
async function clockAt(ms: number) {
  let origin = 0
  requestAnimationFrame((t) => (origin = t))
  await w.frame(0)
  vi.spyOn(performance, "now").mockReturnValue(origin + ms)
}

/** Give an element a box on the page: jsdom lays nothing out. */
function box(el: Element, width: number, height: number) {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, right: width, bottom: height }) as DOMRect
}

describe("ColorPicker", () => {
  it("renders its plane, hue strip and hex field", () => {
    render(() => <ColorPicker modelValue="#ff0000" />)
    expect(screen.getByRole("slider", { name: "Saturation and brightness" }).getAttribute("aria-valuetext")).toBe(
      "#ff0000",
    )
    expect(screen.getByRole("slider", { name: "Hue" }).getAttribute("aria-valuenow")).toBe("0")
    expect((screen.getByLabelText("Hex") as HTMLInputElement).value).toBe("#ff0000")
  })

  it("reports a pick on the plane, a nudge from the arrows and a typed hex", () => {
    const change = vi.fn()
    render(() => <ColorPicker modelValue="#ff0000" onUpdateModelValue={change} />)
    const plane = screen.getByRole("slider", { name: "Saturation and brightness" })
    box(plane, 100, 100)
    fireEvent.pointerDown(plane, { button: 0, clientX: 100, clientY: 100 })
    expect(change).toHaveBeenLastCalledWith("#000000")
    fireEvent.keyDown(plane, { key: "ArrowDown", shiftKey: true })
    expect(change).toHaveBeenLastCalledWith("#e60000")
    fireEvent.keyDown(screen.getByRole("slider", { name: "Hue" }), { key: "ArrowRight", shiftKey: true })
    expect(change).toHaveBeenLastCalledWith("#ff4400")
    fireEvent.input(screen.getByLabelText("Hex"), { target: { value: "00ff00" } })
    expect(change).toHaveBeenLastCalledWith("#00ff00")
  })

  it("stays put while disabled", () => {
    const change = vi.fn()
    render(() => <ColorPicker disabled onUpdateModelValue={change} />)
    const plane = screen.getByRole("slider", { name: "Saturation and brightness" })
    expect(plane.getAttribute("aria-disabled")).toBe("true")
    fireEvent.keyDown(plane, { key: "ArrowLeft" })
    expect(change).not.toHaveBeenCalled()
  })
})

describe("DitherConsole", () => {
  // jsdom scrolls nothing: the log's `scrollTo` is the spec's.
  const scrollTo = vi.fn()
  beforeEach(() => {
    scrollTo.mockClear()
    HTMLElement.prototype.scrollTo = scrollTo as unknown as typeof HTMLElement.prototype.scrollTo
  })
  afterEach(() => {
    delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo
  })

  it("renders its title, lines and actions, and says so when empty", () => {
    const [lines, setLines] = createSignal<(string | { text: string; at: string })[]>([])
    render(() => <DitherConsole title="build" lines={lines()} actions={<button>Clear</button>} />)
    const log = screen.getByRole("log")
    expect(screen.getByText("build")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy()
    expect(log.textContent).toContain("No output yet.")
    setLines(["compiled", { text: "done", at: "12:00" }])
    expect(log.textContent).not.toContain("No output yet.")
    expect(log.textContent).toContain("compiled")
    expect(log.textContent).toContain("12:00")
  })

  it("follows the newest line as output arrives", async () => {
    const [lines, setLines] = createSignal(["one"])
    render(() => <DitherConsole lines={lines()} />)
    const log = screen.getByRole("log")
    setLines(["one", "two"])
    await Promise.resolve()
    expect(scrollTo).toHaveBeenCalledWith({ top: log.scrollHeight })
  })
})

describe("DitherField", () => {
  it("labels the control inside it and describes it with its help", () => {
    const Control = () => {
      const field = useField()
      return <input id={field?.controlId()} aria-describedby={field?.describedBy()} aria-invalid={field?.invalid()} />
    }
    const [error, setError] = createSignal<string>()
    render(() => (
      <DitherField label="Name" description="As on your card" error={error()}>
        <Control />
      </DitherField>
    ))
    const input = screen.getByLabelText("Name")
    const help = screen.getByText("As on your card")
    expect(input.getAttribute("aria-describedby")).toBe(help.id)
    expect(input.getAttribute("aria-invalid")).toBe("false")
    setError("Required")
    expect(screen.getByRole("alert").textContent).toContain("Required")
    expect(screen.getByRole("alert").id).toBe(input.getAttribute("aria-describedby"))
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })
})

describe("DitherStage and DitherLayer", () => {
  it("runs its clock once in view and hands it to its layers", async () => {
    let time = () => -1
    const Probe = () => {
      time = useContext(STAGE)!.time
      return null
    }
    const { container } = render(() => (
      <DitherStage class="scene">
        <Probe />
      </DitherStage>
    ))
    const stage = container.querySelector<HTMLElement>(".dither-stage.scene")!
    expect(stage.dataset.stage).toBe("playing")
    w.show()
    await w.frame(1000)
    await w.frame(1050)
    expect(time()).toBeCloseTo(0.05)
    expect(stage.dataset.stageTime).toBe("0.05")
  })

  it("moves a layer along its keyframes at the directed moment, and hands a function child the slot", () => {
    const { container } = render(() => (
      <DitherStage as="section">
        <DitherLayer
          keyframes={[
            { at: 0, x: "0px", opacity: 0 },
            { at: 1, x: "100px", opacity: 1 },
          ]}
          easing="linear"
        >
          {(slot) => <b>{slot.progress.toFixed(2)}</b>}
        </DitherLayer>
      </DitherStage>
    ))
    const stage = container.querySelector<HTMLElement>("section.dither-stage")!
    const layer = container.querySelector<HTMLElement>(".dither-layer")!
    seek(500)
    expect(stage.dataset.stage).toBe("directed")
    expect(layer.style.opacity).toBe("0.5")
    expect(layer.style.transform).toContain("50px")
    expect(layer.style.getPropertyValue("--layer-p")).toBe("0.5")
    expect(layer.querySelector("b")?.textContent).toBe("0.50")
  })

  it("restarts from 0 when its restart key changes, and holds while paused", async () => {
    const [key, setKey] = createSignal(0)
    const [paused, setPaused] = createSignal(false)
    const { container } = render(() => <DitherStage restartKey={key()} paused={paused()} />)
    const stage = container.querySelector<HTMLElement>(".dither-stage")!
    w.show()
    await w.frame(1000)
    await w.frame(1050)
    setKey(1)
    expect(stage.dataset.stageTime).toBe("0.00")
    setPaused(true)
    expect(stage.dataset.stage).toBe("paused")
    await w.frame(2000)
    await w.frame(2050)
    expect(stage.dataset.stageTime).toBe("0.00")
  })
})

describe("DitherMenubar", () => {
  const menus = [
    { label: "File", items: [{ label: "New" }, { divider: true }, { label: "Quit", danger: true }] },
    { label: "Edit", items: [{ label: "Undo" }, { label: "Redo", disabled: true }] },
  ]

  it("opens a menu, and reports the item picked and returns focus", () => {
    const select = vi.fn()
    render(() => <DitherMenubar menus={menus} onSelect={select} />)
    const file = screen.getByRole("button", { name: "File" })
    expect(screen.getByRole("menubar")).toBeTruthy()
    expect(file.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(file)
    expect(file.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(screen.getByRole("menuitem", { name: "Quit" }))
    expect(select).toHaveBeenCalledWith("File", "Quit")
    expect(file.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(file)
  })

  it("walks its menus and items with the arrows, and closes on Escape with focus back", () => {
    render(() => <DitherMenubar menus={menus} />)
    const file = screen.getByRole("button", { name: "File" })
    const edit = screen.getByRole("button", { name: "Edit" })
    fireEvent.click(file)
    fireEvent.keyDown(file, { key: "ArrowDown" })
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "New" }))
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" })
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Quit" }))
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(edit)
    expect(edit.getAttribute("aria-expanded")).toBe("true")
    fireEvent.keyDown(edit, { key: "ArrowDown" })
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Undo" }))
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(edit.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(edit)
  })

  it("closes on a press outside it", () => {
    vi.useFakeTimers()
    render(() => <DitherMenubar menus={menus} />)
    const file = screen.getByRole("button", { name: "File" })
    fireEvent.click(file)
    vi.runAllTimers()
    fireEvent.pointerDown(file)
    expect(file.getAttribute("aria-expanded")).toBe("true")
    fireEvent.pointerDown(document.body)
    expect(file.getAttribute("aria-expanded")).toBe("false")
  })
})

describe("DitherPopover", () => {
  it("shows its content while open, and asks to close on Escape or a press outside", () => {
    vi.useFakeTimers()
    const close = vi.fn()
    const [open, setOpen] = createSignal(false)
    render(() => (
      <DitherPopover open={open()} onClose={close} align="end" trigger={<button>Options</button>}>
        <p>Density</p>
      </DitherPopover>
    ))
    expect(screen.getByRole("button", { name: "Options" })).toBeTruthy()
    expect(screen.queryByText("Density")).toBeNull()
    setOpen(true)
    vi.runAllTimers()
    expect(screen.getByText("Density").parentElement?.className).toContain("right-0")
    fireEvent.pointerDown(screen.getByText("Density"))
    expect(close).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(close).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(document.body)
    expect(close).toHaveBeenCalledTimes(2)
    setOpen(false)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(close).toHaveBeenCalledTimes(2)
  })
})

describe("DitherProgress", () => {
  it("says its value and paints its track, again as the value changes", async () => {
    const [value, setValue] = createSignal(40)
    const { container } = render(() => <DitherProgress value={value()} />)
    const bar = screen.getByRole("progressbar")
    expect(bar.getAttribute("aria-valuenow")).toBe("40")
    expect(bar.getAttribute("aria-valuemax")).toBe("100")
    await w.frame(100)
    const painted = w.uploads.length
    expect(w.uploads).toContain(container.querySelector("canvas"))
    setValue(60)
    expect(bar.getAttribute("aria-valuenow")).toBe("60")
    expect(w.uploads.length).toBe(painted + 1)
  })

  it("carries no value while indeterminate, and puts its band where a directed moment says", async () => {
    render(() => <DitherProgress indeterminate />)
    const bar = screen.getByRole("progressbar")
    expect(bar.hasAttribute("aria-valuenow")).toBe(false)
    expect(bar.hasAttribute("aria-valuemin")).toBe(false)
    await w.frame(100)
    const painted = w.uploads.length
    seek(250)
    expect(w.uploads.length).toBe(painted + 1)
  })
})

describe("DitherReveal", () => {
  it("renders its content, hidden at 0 and shown at 1 of a manual progress", () => {
    const [progress, setProgress] = createSignal(0)
    const { container } = render(() => (
      <DitherReveal progress={progress()} class="card">
        <p>Revealed</p>
      </DitherReveal>
    ))
    const root = container.querySelector<HTMLElement>(".relative.card")!
    expect(screen.getByText("Revealed")).toBeTruthy()
    expect(root.dataset.reveal).toBe("hidden")
    setProgress(0.5)
    expect(root.dataset.reveal).toBe("playing")
    setProgress(1)
    expect(root.dataset.reveal).toBe("shown")
  })

  it("plays over its duration once in view", async () => {
    const { container } = render(() => <DitherReveal duration={1} easing="linear" />)
    const root = container.querySelector<HTMLElement>("[data-reveal]")!
    await clockAt(1000)
    w.show()
    await w.frame(1500)
    expect(root.dataset.reveal).toBe("playing")
    await w.frame(2500)
    expect(root.dataset.reveal).toBe("shown")
  })
})

describe("DitherScrollArea", () => {
  it("renders its content in a scrolling box", () => {
    render(() => (
      <DitherScrollArea class="h-40">
        <p>Long read</p>
      </DitherScrollArea>
    ))
    expect(screen.getByText("Long read").parentElement?.className).toBe("dk-scroll overflow-auto h-40")
  })
})

describe("DitherShell", () => {
  it("renders the regions it is given", () => {
    render(() => (
      <DitherShell frame topbar={<span>Top</span>} aside={<nav>Side</nav>} statusbar={<span>Ready</span>}>
        Content
      </DitherShell>
    ))
    expect(screen.getByRole("banner").textContent).toBe("Top")
    expect(screen.getByRole("contentinfo").textContent).toBe("Ready")
    expect(screen.getByRole("navigation").textContent).toBe("Side")
    expect(screen.getByRole("main").textContent).toBe("Content")
    expect(screen.getByRole("main").className).not.toContain("col-span-2")
  })

  it("leaves out the bars it has none for, and gives the content the aside's column", () => {
    render(() => <DitherShell>Content</DitherShell>)
    expect(screen.queryByRole("banner")).toBeNull()
    expect(screen.queryByRole("contentinfo")).toBeNull()
    expect(screen.getByRole("main").className).toContain("col-span-2")
  })
})

describe("DitherSwitch", () => {
  it("says its state under its label, paints its track and reports a flip", async () => {
    const change = vi.fn()
    const click = vi.fn()
    const [on, setOn] = createSignal(false)
    const { container } = render(() => (
      <DitherSwitch label="Grain" modelValue={on()} onUpdateModelValue={change} onClick={click} data-testid="grain" />
    ))
    const control = screen.getByRole("switch", { name: "Grain" })
    expect(control.getAttribute("aria-checked")).toBe("false")
    expect(control.dataset.testid).toBe("grain")
    await w.frame(100)
    expect(w.uploads).toEqual([container.querySelector("canvas")])
    fireEvent.click(control)
    expect(change).toHaveBeenCalledWith(true)
    expect(click).toHaveBeenCalledTimes(1)
    setOn(true)
    expect(control.getAttribute("aria-checked")).toBe("true")
    expect(w.uploads.length).toBe(2)
  })

  it("reports nothing while disabled", () => {
    const change = vi.fn()
    render(() => <DitherSwitch label="Grain" modelValue={false} disabled onUpdateModelValue={change} />)
    fireEvent.click(screen.getByRole("switch", { name: "Grain" }))
    expect(change).not.toHaveBeenCalled()
  })
})

describe("DitherTooltip", () => {
  it("shows its text after the delay on focus, and hides it on Escape", () => {
    vi.useFakeTimers()
    render(() => (
      <DitherTooltip text="Copy link" delay={200}>
        <button>Copy</button>
      </DitherTooltip>
    ))
    const button = screen.getByRole("button", { name: "Copy" })
    fireEvent.focusIn(button)
    vi.advanceTimersByTime(199)
    expect(screen.queryByRole("tooltip")).toBeNull()
    vi.advanceTimersByTime(1)
    expect(screen.getByRole("tooltip").textContent).toBe("Copy link")
    fireEvent.keyDown(button, { key: "Escape" })
    vi.advanceTimersByTime(200)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })

  it("follows the pointer in and out", () => {
    vi.useFakeTimers()
    render(() => (
      <DitherTooltip text="Copy link">
        <button>Copy</button>
      </DitherTooltip>
    ))
    const host = screen.getByRole("button", { name: "Copy" }).parentElement!
    fireEvent.pointerEnter(host)
    vi.advanceTimersByTime(300)
    expect(screen.getByRole("tooltip")).toBeTruthy()
    fireEvent.pointerLeave(host)
    vi.advanceTimersByTime(200)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
})

describe("FadeContent", () => {
  it("renders its content clear, and fades it in once in view", () => {
    render(() => (
      <FadeContent blur duration={400} delay={50}>
        <p>Faded</p>
      </FadeContent>
    ))
    const root = screen.getByText("Faded").parentElement!
    expect(root.className).toBe("dither-fade-content")
    expect(root.style.opacity).toBe("0")
    expect(root.style.filter).toBe("blur(10px)")
    expect(root.style.transitionDuration).toBe("400ms")
    expect(root.style.transitionDelay).toBe("50ms")
    w.show()
    expect(root.style.opacity).toBe("1")
    expect(root.style.filter).toBe("blur(0)")
  })
})

describe("FocusRing", () => {
  it("wraps its controls in the ring that shows while one holds focus", () => {
    render(() => (
      <FocusRing class="p-1">
        <button>Inside</button>
      </FocusRing>
    ))
    const ring = screen.getByRole("button", { name: "Inside" }).parentElement!
    expect(ring.className).toContain("focus-within:ring-ring")
    expect(ring.className).toContain("p-1")
  })
})

describe("GhostCursor", () => {
  it("renders its content, and trails the pointer on its canvas once in view", async () => {
    const ctx = drawing()
    const { container } = render(() => (
      <GhostCursor count={4}>
        <p>Hover me</p>
      </GhostCursor>
    ))
    const root = screen.getByText("Hover me").parentElement!
    expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true")
    w.show()
    await w.frame(100)
    expect(ctx.arc).not.toHaveBeenCalled()
    box(root, 200, 100)
    fireEvent.pointerMove(root, { clientX: 40, clientY: 20 })
    await w.frame(200)
    expect(ctx.arc).toHaveBeenCalled()
    ctx.arc.mockClear()
    fireEvent.pointerLeave(root)
    await w.frame(300)
    expect(ctx.arc).not.toHaveBeenCalled()
  })
})

describe("HoldAction", () => {
  it("renders its label, its own by default", () => {
    render(() => (
      <>
        <HoldAction />
        <HoldAction aria-describedby="why">Delete</HoldAction>
      </>
    ))
    expect(screen.getByRole("button", { name: "Hold to confirm" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Delete" }).getAttribute("aria-describedby")).toBe("why")
  })

  it("completes once when held for its duration, by key too", async () => {
    await clockAt(0)
    const complete = vi.fn()
    render(() => <HoldAction duration={100} onComplete={complete} />)
    const button = screen.getByRole("button")
    fireEvent.keyDown(button, { key: "Enter" })
    for (let t = 50; t <= 250; t += 50) await w.frame(t)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status").textContent).toBe("completed")
  })

  it("drains back when released early", async () => {
    await clockAt(0)
    const complete = vi.fn()
    render(() => <HoldAction duration={1000} onComplete={complete} />)
    const button = screen.getByRole("button")
    const fill = button.querySelector<HTMLElement>("span[aria-hidden]")!
    fireEvent.pointerDown(button)
    await w.frame(50)
    expect(fill.style.height).toBe("5%")
    fireEvent.pointerUp(button)
    for (let t = 50; t <= 250; t += 50) await w.frame(t)
    expect(fill.style.height).toBe("0%")
    expect(complete).not.toHaveBeenCalled()
  })
})

describe("IconSet", () => {
  it("stamps every icon as a hidden symbol, and takes the svg's attributes", () => {
    const { container } = render(() => <IconSet class="sprite" />)
    const svg = container.querySelector("svg")!
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("focusable")).toBe("false")
    expect(svg.getAttribute("class")).toBe("sprite")
    expect(svg.style.display).toBe("none")
    const names = Object.keys(ICONS)
    expect([...svg.querySelectorAll("symbol")].map((s) => s.id)).toEqual(names.map((n) => `di-icon-${n}`))
    expect(svg.querySelector("symbol path")?.getAttribute("stroke-linecap")).toBe("round")
  })
})

describe("Portal", () => {
  it("renders its content in the body, in a named target, or in place when disabled", () => {
    const target = document.createElement("div")
    target.id = "overlays"
    document.body.append(target)
    const { container } = render(() => (
      <>
        <Portal>
          <p>In the body</p>
        </Portal>
        <Portal to="#overlays">
          <p>In the target</p>
        </Portal>
        <Portal disabled>
          <p>In place</p>
        </Portal>
      </>
    ))
    expect(container.contains(screen.getByText("In the body"))).toBe(false)
    expect(document.body.contains(screen.getByText("In the body"))).toBe(true)
    expect(target.contains(screen.getByText("In the target"))).toBe(true)
    expect(screen.getByText("In place").parentElement).toBe(container)
    target.remove()
  })
})

describe("ScrollProgress", () => {
  it("rides the viewport edge and follows the page's scroll", async () => {
    // The spec's global is not jsdom's `Window` instance: say what the page's is.
    vi.stubGlobal(
      "Window",
      class {
        static [Symbol.hasInstance](v: unknown) {
          return v === window
        }
      },
    )
    const doc = document.documentElement
    vi.spyOn(doc, "scrollHeight", "get").mockReturnValue(2000)
    vi.spyOn(doc, "clientHeight", "get").mockReturnValue(1000)
    render(() => <ScrollProgress edge="bottom" />)
    const bar = screen.getByRole("progressbar")
    expect(screen.getByRole("presentation").className).toBe("fixed inset-x-0 z-50 bottom-0")
    expect(bar.getAttribute("aria-valuenow")).toBe("0")
    vi.spyOn(doc, "scrollTop", "get").mockReturnValue(250)
    fireEvent.scroll(window)
    await w.frame(100)
    expect(bar.getAttribute("aria-valuenow")).toBe("25")
  })

  it("tracks the nearest scrolling parent when attached to it", async () => {
    const { container } = render(() => (
      <div style={{ "overflow-y": "auto" }}>
        <ScrollProgress attach="parent" />
      </div>
    ))
    const scroller = container.firstElementChild as HTMLElement
    vi.spyOn(scroller, "scrollHeight", "get").mockReturnValue(300)
    vi.spyOn(scroller, "clientHeight", "get").mockReturnValue(100)
    scroller.scrollTop = 100
    fireEvent.scroll(scroller)
    await w.frame(100)
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50")
    expect(screen.getByRole("presentation").className).toContain("sticky")
  })
})

describe("SignaturePad", () => {
  it("renders its canvas under its placeholder, sized in markup", () => {
    render(() => <SignaturePad width={300} height={100} placeholder="Your signature" />)
    const pad = screen.getByRole("img", { name: "Your signature" }) as HTMLCanvasElement
    expect(pad.width).toBe(300)
    expect(pad.height).toBe(100)
    expect(screen.getByRole("button", { name: "Clear" }).getAttribute("size")).toBe("sm")
  })

  it("reports the drawing after a stroke, and nothing left after a clear", () => {
    const ctx = drawing()
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,INK")
    const change = vi.fn()
    const model = vi.fn()
    render(() => <SignaturePad onChange={change} onUpdateModelValue={model} />)
    const pad = screen.getByRole("img", { name: "Sign here" })
    fireEvent.pointerDown(pad, { button: 0, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(pad, { clientX: 30, clientY: 20 })
    expect(ctx.lineTo).toHaveBeenLastCalledWith(30, 20)
    expect(change).not.toHaveBeenCalled()
    fireEvent.pointerUp(pad)
    expect(change).toHaveBeenLastCalledWith("data:image/png;base64,INK")
    expect(model).toHaveBeenLastCalledWith("data:image/png;base64,INK")
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(ctx.clearRect).toHaveBeenCalled()
    expect(change).toHaveBeenLastCalledWith("")
    expect(model).toHaveBeenLastCalledWith("")
  })

  it("refuses strokes while disabled", () => {
    const ctx = drawing()
    const change = vi.fn()
    render(() => <SignaturePad disabled onChange={change} />)
    const pad = screen.getByRole("img", { name: "Sign here" })
    fireEvent.pointerDown(pad, { button: 0, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(pad)
    expect(ctx.stroke).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe("SplashCursor", () => {
  it("renders its content, and rings the pointer's path on its canvas", async () => {
    const ctx = drawing()
    render(() => (
      <SplashCursor duration={500}>
        <p>Splash</p>
      </SplashCursor>
    ))
    const root = screen.getByText("Splash").parentElement!
    box(root, 200, 100)
    const now = 1000
    await clockAt(now)
    fireEvent.pointerMove(root, { clientX: 5, clientY: 5 })
    await w.frame(now + 10)
    expect(ctx.arc).not.toHaveBeenCalled()
    fireEvent.pointerMove(root, { clientX: 80, clientY: 40 })
    await w.frame(now + 100)
    expect(ctx.arc).toHaveBeenCalledTimes(1)
    expect(ctx.arc.mock.lastCall?.slice(0, 2)).toEqual([80, 40])
    await w.frame(now + 5000)
    await w.frame(now + 6000)
    expect(ctx.arc).toHaveBeenCalledTimes(1)
  })
})

describe("SplitText", () => {
  it("names the whole text and staggers its letters", () => {
    const { container } = render(() => <SplitText text="Hi yo" stagger={10} duration={300} />)
    const root = screen.getByLabelText("Hi yo")
    const chars = [...container.querySelectorAll<HTMLElement>(".dither-split-char")]
    expect(chars.map((c) => c.textContent)).toEqual(["H", "i", " ", "y", "o"])
    expect(chars.every((c) => c.getAttribute("aria-hidden") === "true")).toBe(true)
    expect(chars[3].style.animationDelay).toBe("30ms")
    expect(chars[3].style.animationDuration).toBe("300ms")
    expect(root.className).toBe("inline-block")
  })

  it("plays again from a new element when its replay token changes", () => {
    const [token, setToken] = createSignal(0)
    render(() => <SplitText text="Again" replayToken={token()} />)
    const first = screen.getByLabelText("Again")
    setToken(1)
    const second = screen.getByLabelText("Again")
    expect(second).not.toBe(first)
    expect(first.isConnected).toBe(false)
  })
})

describe("TargetCursor", () => {
  it("renders its content, and puts its target on the pointer while it is inside", () => {
    const { container } = render(() => (
      <TargetCursor size={40} color="#fff">
        <p>Aim</p>
      </TargetCursor>
    ))
    const root = screen.getByText("Aim").parentElement!
    const target = container.querySelector<HTMLElement>(".dither-target")!
    expect(target.getAttribute("aria-hidden")).toBe("true")
    expect(target.querySelectorAll(".corner").length).toBe(4)
    expect(target.style.opacity).toBe("0")
    expect(target.style.width).toBe("40px")
    box(root, 200, 100)
    fireEvent.pointerMove(root, { clientX: 50, clientY: 30 })
    expect(target.style.opacity).toBe("1")
    expect(target.style.transform).toBe("translate(50px, 30px) translate(-50%, -50%)")
    fireEvent.pointerLeave(root)
    expect(target.style.opacity).toBe("0")
  })
})
