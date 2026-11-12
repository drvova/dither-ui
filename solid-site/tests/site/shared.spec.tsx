// The site's shared slice in Solid (`src/shared/`, `src/widgets/site-header/`),
// held to what its Vue twins do: the header and its menu, the mascot, the
// fields the Studio's inspector is built from, the theme, the interface
// sounds and the rise.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { Meta, MetaProvider } from "@solidjs/meta"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GLIDE_BEZIER } from "@dither-kit/engine/dither-paint"
import { COLORS } from "@/shared/config"
import { RISE_LIVE, RISE_WAIT } from "@/shared/lib/rise-wait"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { drivenCells, toRuns } from "@/shared/ui/car"
import { MARKS } from "@/shared/ui/marks"
import { mascotCells } from "@/shared/ui/mascot"
import {
  BAND_INK,
  CLOSE_CELLS,
  MENU_LINKS,
  SEAM_HEIGHT,
  SHEET_WIPE,
  STUDIO_LINK,
  bandFill,
} from "@/widgets/site-header/menu"
import { RISE, rise, riseDelays, useTheme } from "../../src/shared/lib"
import { CUES, play, restoreSounds, schedule, setSounds, sounds } from "../../src/shared/lib/sound"
import {
  AdSlot,
  BezierEditor,
  BloomField,
  CodeBlock,
  ColorField,
  ContextMenu,
  NumberField,
  Segmented,
  TextureField,
  Toggle,
} from "../../src/shared/ui"
import BrandMark from "../../src/shared/ui/BrandMark"
import Mascot from "../../src/shared/ui/Mascot"
import MascotCar from "../../src/shared/ui/MascotCar"
import ToolMark from "../../src/shared/ui/ToolMark"
import { SheetHead, SiteHeader } from "../../src/widgets/site-header"

let reduced = false
beforeEach(() => {
  reduced = false
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes("reduce"),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.style.overflow = ""
})

const all = (root: ParentNode, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)]
const text = (el: Element) => (el.textContent ?? "").trim()

// One header for the pages that read: the same links and key on each, the
// page's own link current, a page's tools beside the key.
describe("site header", () => {
  const links = (root: ParentNode) => all(root, "header nav a").map((a) => text(a).replace(/\s*\(opens.*$/, ""))

  it("marks the docs current on the docs, nothing on the landing, and carries a page's tools", () => {
    const docs = render(() => <SiteHeader current="docs" tools={<button type="button" aria-label="Search docs" />} />)
    expect(links(docs.container)).toEqual(["Components", "Docs", "Agents", "GitHub"])
    expect(all(docs.container, "[aria-current]").map(text)).toEqual(["Docs"])
    expect(docs.container.querySelector('[aria-label="Search docs"]')).not.toBeNull()
    const github = all(docs.container, "header nav a").at(-1)!
    expect([github.getAttribute("target"), github.getAttribute("rel")]).toEqual(["_blank", "noreferrer"])
    expect(github.querySelector("svg.tool-mark")).not.toBeNull()
    const landing = render(() => <SiteHeader current="landing" />)
    expect(links(landing.container)).toEqual(links(docs.container))
    expect(all(landing.container, "[aria-current]")).toHaveLength(0)
    expect(text(all(landing.container, "a").at(-1)!)).toBe("Open studio")
  })

  it("opens every link as a band of the ink's steps, the studio at the foot", () => {
    const w = render(() => <SiteHeader current="docs" />)
    const key = w.container.querySelector<HTMLElement>(".menu-key")!
    const dialog = w.container.querySelector("dialog")!
    expect(key.getAttribute("aria-expanded")).toBe("false")
    expect(key.getAttribute("aria-haspopup")).toBe("dialog")
    expect(key.getAttribute("aria-controls")).toBe(dialog.id)
    expect(dialog.getAttribute("aria-label")).toBe("Site menu")
    expect(all(w.container, ".menu-chip > span")).toHaveLength(BAND_INK.length + 1)
    fireEvent.click(key)
    expect(key.getAttribute("aria-expanded")).toBe("true")
    expect(document.documentElement.style.overflow).toBe("hidden")
    const bands = all(w.container, ".menu-band")
    const say = (sel: string) => bands.map((b) => text(b.querySelector(sel)!).replace(/\s*\(opens.*$/, ""))
    expect(say(".menu-name")).toEqual([...MENU_LINKS.map((l) => l.label), STUDIO_LINK.label])
    expect(say(".menu-note")).toEqual([...MENU_LINKS.map((l) => l.note), STUDIO_LINK.note])
    expect(bands.slice(0, -1).map((b) => b.style.background)).toEqual(MENU_LINKS.map((_, i) => bandFill(i)))
    expect(all(w.container, ".menu-band[aria-current] .menu-name").map(text)).toEqual(["Docs"])
    expect(all(w.container, ".menu-seam")).toHaveLength(bands.length)
    // A link taken shuts the sheet at once and frees the page.
    bands[0].addEventListener("click", (e) => e.preventDefault())
    fireEvent.click(bands[0])
    expect(key.getAttribute("aria-expanded")).toBe("false")
    expect(document.documentElement.style.overflow).toBe("")
    expect(w.container.querySelector(".menu-band")).toBeNull()
    expect(document.activeElement).toBe(key)
  })

  it("rolls the sheet back up before it shuts, from the close key and from Escape", () => {
    vi.useFakeTimers()
    const w = render(() => <SiteHeader current="landing" />)
    const key = w.container.querySelector<HTMLElement>(".menu-key")!
    const dialog = w.container.querySelector("dialog")!
    for (const close of [
      () => fireEvent.click(w.container.querySelector('[aria-label="Close menu"]')!),
      () => fireEvent(dialog, new Event("cancel", { cancelable: true })),
    ]) {
      fireEvent.click(key)
      expect(w.container.querySelector("[data-phase]")?.getAttribute("data-phase")).toBe("open")
      close()
      // Leaving: the sheet still up, playing its wipe back; the key says shut.
      expect(w.container.querySelector("[data-phase]")?.getAttribute("data-phase")).toBe("leaving")
      expect(w.container.querySelector(".menu-sheet")).not.toBeNull()
      expect(key.getAttribute("aria-expanded")).toBe("false")
      expect(document.documentElement.style.overflow).toBe("hidden")
      vi.advanceTimersByTime(SHEET_WIPE.duration * 1000)
      expect(w.container.querySelector("[data-phase]")).toBeNull()
      expect(w.container.querySelector(".menu-sheet")).toBeNull()
      expect(document.documentElement.style.overflow).toBe("")
    }
  })

  it("shuts at once under reduced motion, and frees the page when it goes while open", () => {
    reduced = true
    const w = render(() => <SiteHeader current="landing" />)
    const key = w.container.querySelector<HTMLElement>(".menu-key")!
    fireEvent.click(key)
    fireEvent.click(w.container.querySelector('[aria-label="Close menu"]')!)
    expect(w.container.querySelector(".menu-sheet")).toBeNull()
    expect(document.documentElement.style.overflow).toBe("")
    fireEvent.click(key)
    expect(document.documentElement.style.overflow).toBe("hidden")
    w.unmount()
    expect(document.documentElement.style.overflow).toBe("")
  })

  it("closes a sheet under an X drawn in the brand's pixel, clear of the seam", () => {
    const w = render(() => <SiteHeader current="landing" />)
    fireEvent.click(w.container.querySelector(".menu-key")!)
    const head = w.container.querySelector<HTMLElement>(".sheet-head")!
    expect(all(head, '[aria-label="Close menu"] svg rect')).toHaveLength(CLOSE_CELLS.length)
    expect(head.style.paddingBottom).toBe(`${8 + SEAM_HEIGHT}px`)
  })

  it("heads any sheet: what it is in the middle, its close key named and first", () => {
    const closed = vi.fn()
    const w = render(() => (
      <SheetHead closeLabel="Close sections" onClose={closed}>
        <span class="what">Sections</span>
      </SheetHead>
    ))
    const close = w.container.querySelector<HTMLButtonElement>("button")!
    expect(close.getAttribute("aria-label")).toBe("Close sections")
    expect(close.hasAttribute("autofocus")).toBe(true)
    expect(text(w.container.querySelector(".what")!)).toBe("Sections")
    fireEvent.click(close)
    expect(closed).toHaveBeenCalledTimes(1)
  })
})

describe("marks and the mascot", () => {
  it("draws the brand's diamond, or another mark on its grid, as a decorative SVG", () => {
    const w = render(() => <BrandMark size={13} />)
    const svg = w.container.querySelector("svg")!
    expect([svg.getAttribute("width"), svg.getAttribute("height")]).toEqual(["13", "13"])
    expect([svg.getAttribute("aria-hidden"), svg.getAttribute("focusable")]).toEqual(["true", "false"])
    expect(all(svg, "rect")).toHaveLength(MARK_CELLS.length)
    expect(all(svg, "rect").filter((r) => r.getAttribute("fill") !== "currentColor")).toHaveLength(1)
    const x = render(() => <BrandMark size={14} cells={CLOSE_CELLS} />)
    expect(all(x.container, "rect")).toHaveLength(CLOSE_CELLS.length)
  })

  it("draws a tool's mark in currentColor, at 14px unless told", () => {
    const w = render(() => <ToolMark id="github" />)
    const svg = w.container.querySelector("svg")!
    expect(svg.getAttribute("viewBox")).toBe(MARKS.github.viewBox)
    expect([svg.getAttribute("width"), svg.getAttribute("fill")]).toEqual(["14", "currentColor"])
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(all(svg, "path").map((p) => p.getAttribute("d"))).toEqual([...MARKS.github.d])
    const holed = (Object.keys(MARKS) as (keyof typeof MARKS)[]).find((id) => "evenodd" in MARKS[id])
    if (holed) {
      const h = render(() => <ToolMark id={holed} size={18} />)
      expect(h.container.querySelector("svg")!.getAttribute("fill-rule")).toBe("evenodd")
    }
  })

  it("draws the mascot as a decorative SVG, the size its height", () => {
    const w = render(() => <Mascot size={30} class="max-[479px]:hidden" />)
    const svg = w.container.querySelector("svg")!
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("height")).toBe("30")
    expect(svg.classList.contains("mascot") && svg.classList.contains("max-[479px]:hidden")).toBe(true)
    expect(all(svg, "rect")).toHaveLength(mascotCells("idle").length)
  })

  it("hops under a pointer, blinks while alive, and holds still under reduced motion", () => {
    vi.useFakeTimers()
    vi.spyOn(Math, "random").mockReturnValue(0)
    const cells = (root: ParentNode) => all(root, "rect").map((r) => `${r.getAttribute("x")}.${r.getAttribute("y")}`)
    const of = (pose: Parameters<typeof mascotCells>[0], turn = 0) =>
      mascotCells(pose, turn).map((c) => `${c.x}.${c.y}`)
    const w = render(() => <Mascot size={16} alive />)
    const svg = w.container.querySelector("svg")!
    vi.advanceTimersByTime(3200)
    expect(cells(svg)).toEqual(of("blink"))
    vi.advanceTimersByTime(140)
    expect(cells(svg)).toEqual(of("idle"))
    fireEvent.pointerEnter(svg)
    expect(cells(svg)).toEqual(of("hop"))
    vi.advanceTimersByTime(220)
    expect(cells(svg)).toEqual(of("idle"))
    w.unmount()

    const flying = render(() => <Mascot size={16} pose="fly" />)
    const air = flying.container.querySelector("svg")!
    expect(cells(air)).toEqual(of("fly", 0))
    vi.advanceTimersByTime(60)
    expect(cells(air)).toEqual(of("fly", 1))
    // Flying, a pointer does not take it out of the air.
    fireEvent.pointerEnter(air)
    expect(cells(air)).toEqual(of("fly", 1))
    flying.unmount()

    reduced = true
    const still = render(() => <Mascot size={16} alive pose="fly" />)
    vi.advanceTimersByTime(8000)
    expect(cells(still.container)).toEqual(of("fly", 0))
    vi.mocked(Math.random).mockRestore()
  })

  it("turns the car's wheels only while it drives", () => {
    vi.useFakeTimers()
    const paint = (c: ReturnType<typeof drivenCells>[number]) =>
      "driver" in c ? (c.ink === "ember" ? "ember" : "light") : c.ink
    const [driving, setDriving] = createSignal(false)
    const w = render(() => <MascotCar size={21} driving={driving()} />)
    const svg = w.container.querySelector("svg")!
    const widths = () =>
      all(svg, "rect").map((r) => `${r.getAttribute("x")}.${r.getAttribute("y")}.${r.getAttribute("width")}`)
    const runs = (turn: number) => toRuns(drivenCells(turn), paint).map((r) => `${r.x}.${r.y}.${r.w}`)
    expect(svg.getAttribute("height")).toBe("21")
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(widths()).toEqual(runs(0))
    vi.advanceTimersByTime(700)
    expect(widths()).toEqual(runs(0))
    setDriving(true)
    vi.advanceTimersByTime(70)
    expect(widths()).toEqual(runs(1))
    setDriving(false)
    vi.advanceTimersByTime(700)
    expect(widths()).toEqual(runs(1))
  })
})

describe("the inspector's fields", () => {
  it("lets a number field's name sit in a pair's grid, and holds a value to its range", () => {
    const got = vi.fn()
    const w = render(() => (
      <NumberField label="strokeWidth" modelValue={1} min={0} max={10} unit="px" onUpdateModelValue={got} />
    ))
    expect(text(w.container.querySelector(".prop-name")!)).toBe("stroke​Width")
    const input = w.container.querySelector("input")!
    expect([input.name, input.value, input.step]).toEqual(["strokeWidth", "1", "1"])
    expect(input.classList.contains("pr-6")).toBe(true)
    expect(text(w.container.querySelector("label > span:last-child > span")!)).toBe("px")
    for (const [typed, held] of [
      ["4", 4],
      ["40", 10],
      ["-3", 0],
      ["", 0],
    ] as const) {
      fireEvent.input(input, { target: { value: typed } })
      expect(got).toHaveBeenLastCalledWith(held)
    }
    const bare = render(() => <NumberField label="X" modelValue={1} />)
    expect(text(bare.container.querySelector(".prop-name")!)).toBe("X")
    expect(bare.container.querySelector("input")!.classList.contains("pr-6")).toBe(false)
  })

  it("presses the chosen segment, names an option by its label, and says which was picked", () => {
    const got = vi.fn()
    const [value, setValue] = createSignal<"css" | "stylex">("css")
    const w = render(() => (
      <Segmented
        options={["css", "stylex"] as const}
        modelValue={value()}
        label="styling"
        labels={{ stylex: "StyleX" }}
        onUpdateModelValue={(v) => (got(v), setValue(v))}
      />
    ))
    const keys = all(w.container, "button")
    expect(text(w.container.querySelector(".prop-name")!)).toBe("styling")
    expect(keys.map(text)).toEqual(["css", "StyleX"])
    expect(keys.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"])
    expect(keys[0].classList.contains("ring-on")).toBe(true)
    fireEvent.click(keys[1])
    expect(got).toHaveBeenCalledWith("stylex")
    expect(keys.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true"])
    const bare = render(() => <Segmented options={[1, 2]} modelValue={1} />)
    expect(bare.container.querySelector(".prop-name")).toBeNull()
  })

  it("toggles a named checkbox", () => {
    const got = vi.fn()
    const w = render(() => <Toggle modelValue={false} label="showGrid" onUpdateModelValue={got} />)
    const box = w.container.querySelector("input")!
    expect([box.type, box.name, box.checked]).toEqual(["checkbox", "showGrid", false])
    expect(text(w.container.querySelector("label")!)).toBe("show​Grid")
    fireEvent.click(box)
    expect(got).toHaveBeenCalledWith(true)
  })

  it("edits a bezier by its numbers and its presets, each held to its range", () => {
    const got = vi.fn()
    const w = render(() => <BezierEditor modelValue={[0.25, 0.1, 0.25, 1]} onUpdateModelValue={got} />)
    const inputs = all(w.container, "input") as HTMLInputElement[]
    expect(inputs.map((i) => [i.name, i.value])).toEqual([
      ["bezier-0", "0.25"],
      ["bezier-1", "0.1"],
      ["bezier-2", "0.25"],
      ["bezier-3", "1"],
    ])
    expect(w.container.querySelector("path")!.getAttribute("d")).toBe("M 0 111 C 58 103.6, 58 37, 232 37")
    fireEvent.change(inputs[0], { target: { value: "3" } })
    expect(got).toHaveBeenLastCalledWith([1, 0.1, 0.25, 1])
    fireEvent.change(inputs[1], { target: { value: "-4" } })
    expect(got).toHaveBeenLastCalledWith([0.25, -0.5, 0.25, 1])
    expect(all(w.container, "button").map(text)).toEqual(["back", "anticipate", "snap"])
    fireEvent.click(all(w.container, "button")[0])
    expect(got).toHaveBeenLastCalledWith([0.34, 1.56, 0.64, 1])
  })

  it("drags a bezier's handle inside its box", () => {
    const got = vi.fn()
    const w = render(() => <BezierEditor modelValue={[0.25, 0.1, 0.25, 1]} onUpdateModelValue={got} />)
    const svg = w.container.querySelector("svg")!
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
    const handle = all(w.container, "circle.cursor-grab")[1]
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 25 })
    expect(got).toHaveBeenLastCalledWith([0.25, 0.1, 0.5, 1])
    fireEvent(window, new MouseEvent("pointermove", { clientX: 500, clientY: 500 }))
    expect(got).toHaveBeenLastCalledWith([0.25, 0.1, 1, -0.5])
    fireEvent(window, new MouseEvent("pointerup"))
    got.mockClear()
    fireEvent(window, new MouseEvent("pointermove", { clientX: 10, clientY: 10 }))
    expect(got).not.toHaveBeenCalled()
  })

  it("offers bloom's levels, and its own sliders once custom, seeded from the level it left", () => {
    const got = vi.fn()
    const [value, setValue] = createSignal<Parameters<typeof BloomField>[0]["modelValue"]>("high")
    const w = render(() => <BloomField modelValue={value()} onUpdateModelValue={(v) => (got(v), setValue(v))} />)
    const keys = () => all(w.container, "button")
    expect(keys().map(text)).toEqual(["off", "low", "high", "aura", "custom"])
    expect(keys().find((b) => b.getAttribute("aria-pressed") === "true")?.textContent).toBe("high")
    expect(all(w.container, "input[type=range]")).toHaveLength(0)
    fireEvent.click(keys()[4])
    expect(got).toHaveBeenLastCalledWith({ blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 })
    const sliders = all(w.container, "input[type=range]") as HTMLInputElement[]
    expect(sliders.map((s) => [s.name, s.value])).toEqual([
      ["bloom-blur", "5"],
      ["bloom-brightness", "1.5"],
      ["bloom-opacity", "0.78"],
      ["bloom-saturate", "1.5"],
    ])
    expect(all(w.container, "label > span:last-child").map(text)).toEqual(["5px", "1.50", "0.78", "1.50"])
    fireEvent.input(sliders[0], { target: { value: "9" } })
    expect(got).toHaveBeenLastCalledWith({ blur: 9, brightness: 1.5, opacity: 0.78, saturate: 1.5 })
    fireEvent.click(keys()[1])
    expect(got).toHaveBeenLastCalledWith("low")
    expect(all(w.container, "input[type=range]")).toHaveLength(0)
  })

  it("offers a texture's variants, and its own sliders once custom, the density held visible", () => {
    const got = vi.fn()
    const [value, setValue] = createSignal<Parameters<typeof TextureField>[0]["modelValue"]>("solid")
    const w = render(() => <TextureField modelValue={value()} onUpdateModelValue={(v) => (got(v), setValue(v))} />)
    const keys = () => all(w.container, "button")
    expect(keys().map(text)).toEqual(["gradient", "dotted", "hatched", "solid", "custom"])
    fireEvent.click(keys()[4])
    const seeded = got.mock.lastCall![0] as { density: number; gaps: boolean }
    expect(seeded.density).toBeLessThanOrEqual(1)
    const sliders = all(w.container, "input[type=range]") as HTMLInputElement[]
    expect(sliders.map((s) => s.name)).toEqual(["tex-ramp", "tex-density", "tex-offTier", "tex-edge", "tex-hatch"])
    fireEvent.input(sliders[4], { target: { value: "3" } })
    expect(got.mock.lastCall![0]).toMatchObject({ hatch: 3 })
    const gaps = w.container.querySelector<HTMLInputElement>("input[type=checkbox]")!
    expect(gaps.name).toBe("real gaps (dotted look)")
    fireEvent.click(gaps)
    expect(got.mock.lastCall![0]).toMatchObject({ gaps: !seeded.gaps })
    fireEvent.click(keys()[1])
    expect(got).toHaveBeenLastCalledWith("dotted")
  })

  it("picks a preset colour or a custom one by its square, its hue and its hex", () => {
    const got = vi.fn()
    const [value, setValue] = createSignal<string>("blue")
    const w = render(() => <ColorField modelValue={value()} onUpdateModelValue={(v) => (got(v), setValue(v))} />)
    const swatches = all(w.container, "button")
    expect(swatches.map((b) => b.getAttribute("aria-label"))).toEqual([...COLORS, "Custom colour"])
    expect(swatches[COLORS.indexOf("blue")].classList.contains("ring-2")).toBe(true)
    expect(w.container.querySelector("input")).toBeNull()
    fireEvent.click(swatches.at(-1)!)
    const custom = got.mock.lastCall![0] as string
    expect(custom).toMatch(/^#[0-9a-f]{6}$/)
    expect(swatches.at(-1)!.classList.contains("ring-2")).toBe(true)
    const hex = w.container.querySelector<HTMLInputElement>('input[name="hex"]')!
    expect(hex.value).toBe(custom)
    fireEvent.change(hex, { target: { value: "F80" } })
    expect(got).toHaveBeenLastCalledWith("#ff8800")
    fireEvent.change(hex, { target: { value: "nope" } })
    expect(got).toHaveBeenLastCalledWith("#ff8800")
    const hue = w.container.querySelector<HTMLInputElement>('input[name="hue"]')!
    expect(hue.classList.contains("dk-hue")).toBe(true)
    fireEvent.input(hue, { target: { value: "120" } })
    expect(got.mock.lastCall![0]).toBe("#00ff00")
    const square = w.container.querySelector<HTMLElement>(".cursor-crosshair")!
    square.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    fireEvent.pointerDown(square, { clientX: 0, clientY: 0 })
    expect(got).toHaveBeenLastCalledWith("#ffffff")
    fireEvent(window, new MouseEvent("pointermove", { clientX: 100, clientY: 100 }))
    expect(got).toHaveBeenLastCalledWith("#000000")
    fireEvent(window, new MouseEvent("pointerup"))
    fireEvent.click(swatches[0])
    expect(got).toHaveBeenLastCalledWith(COLORS[0])
    expect(w.container.querySelector("input")).toBeNull()
  })
})

describe("the context menu", () => {
  const items = () => [
    { label: "Rename", onClick: vi.fn() },
    { divider: true },
    { label: "Locked", disabled: true, onClick: vi.fn() },
    { label: "Delete", danger: true, onClick: vi.fn() },
  ]

  it("opens on the body where it was asked, its first item focused, and roves by the arrows", async () => {
    const list = items()
    render(() => <ContextMenu x={40} y={60} items={list} />)
    const menu = document.body.querySelector<HTMLElement>("[role=menu]")!
    expect(menu.getAttribute("aria-orientation")).toBe("vertical")
    expect([menu.style.left, menu.style.top]).toEqual(["40px", "60px"])
    expect(all(menu, "[role=menuitem]").map(text)).toEqual(["Rename", "Locked", "Delete"])
    expect(all(menu, "[role=separator]")).toHaveLength(1)
    expect(all(menu, "[role=menuitem]")[2].classList.contains("text-destructive")).toBe(true)
    await Promise.resolve()
    expect(text(document.activeElement!)).toBe("Rename")
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" })
    expect(text(document.activeElement!)).toBe("Delete")
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" })
    expect(text(document.activeElement!)).toBe("Rename")
  })

  it("runs an item and closes; a disabled one does neither", () => {
    const list = items()
    const closed = vi.fn()
    render(() => <ContextMenu x={0} y={0} items={list} onClose={closed} />)
    const menu = document.body.querySelector<HTMLElement>("[role=menu]")!
    const [rename, locked] = all(menu, "[role=menuitem]")
    fireEvent.click(locked)
    expect(list[2].onClick).not.toHaveBeenCalled()
    expect(closed).not.toHaveBeenCalled()
    fireEvent.click(rename)
    expect(list[0].onClick).toHaveBeenCalledTimes(1)
    expect(closed).toHaveBeenCalledTimes(1)
  })

  it("closes on Escape, a press outside or the window losing focus, never on the opening press or one inside", () => {
    vi.useFakeTimers()
    const closed = vi.fn()
    const w = render(() => <ContextMenu x={0} y={0} items={items()} onClose={closed} />)
    const menu = document.body.querySelector<HTMLElement>("[role=menu]")!
    // The press that opened it is still on its way up.
    fireEvent.pointerDown(document.body)
    expect(closed).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    fireEvent.pointerDown(menu)
    expect(closed).not.toHaveBeenCalled()
    expect(fireEvent.contextMenu(menu)).toBe(false)
    fireEvent.pointerDown(document.body)
    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.blur(window)
    expect(closed).toHaveBeenCalledTimes(3)
    w.unmount()
    fireEvent.pointerDown(document.body)
    expect(closed).toHaveBeenCalledTimes(3)
    expect(document.body.querySelector("[role=menu]")).toBeNull()
  })
})

describe("the code block and the ad slot", () => {
  it("shows the code as text and says it copied, for a beat", async () => {
    vi.useFakeTimers()
    const wrote = vi.fn(async () => {})
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: wrote } })
    setSounds(false)
    const w = render(() => <CodeBlock code={'<b class="x">hi</b>'} />)
    expect(w.container.querySelector("pre code")!.textContent).toBe('<b class="x">hi</b>')
    expect(w.container.querySelector("pre b")).toBeNull()
    const key = w.container.querySelector("button")!
    expect(text(key)).toBe("copy")
    fireEvent.click(key)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrote).toHaveBeenCalledWith('<b class="x">hi</b>')
    expect(text(key)).toBe("copied")
    await vi.advanceTimersByTimeAsync(1400)
    expect(text(key)).toBe("copy")
  })

  it("renders no ad without a publisher, and fetches nothing", () => {
    const w = render(() => <AdSlot />)
    expect(w.container.querySelector(".ad-slot")).toBeNull()
    expect(document.getElementById("ethicalads-client")).toBeNull()
  })
})

// The browser's chrome (iOS Safari's bar) follows the theme the reader
// picks, not the system's scheme: the page's theme-color takes the page's
// ground as the theme turns, through the head's own tags.
describe("the theme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark")
    document.body.style.backgroundColor = ""
  })

  it("defaults to dark, remembers a toggle, and gives the page's ground after the first paint", async () => {
    document.body.style.backgroundColor = "rgb(8, 9, 11)"
    let theme!: ReturnType<typeof useTheme>
    const w = render(() => {
      theme = useTheme()
      return (
        <MetaProvider>
          <Meta name="theme-color" content={theme.ground() ?? "#08090b"} />
        </MetaProvider>
      )
    })
    const tints = () => all(document.head, 'meta[name="theme-color"]').map((m) => (m as HTMLMetaElement).content)
    expect(theme.dark()).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    // Not inside the mount (that forced a style pass over the fresh page):
    // once the first frame has painted.
    expect(tints()).toEqual(["#08090b"])
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 1)))
    expect(tints()).toEqual(["rgb(8, 9, 11)"])
    document.body.style.backgroundColor = "rgb(255, 255, 255)"
    theme.toggle()
    expect(theme.dark()).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem("dither-theme")).toBe("light")
    expect(tints()).toEqual(["rgb(255, 255, 255)"])
    w.unmount()
  })

  it("comes back in the theme the reader left", () => {
    localStorage.setItem("dither-theme", "light")
    let theme!: ReturnType<typeof useTheme>
    render(() => ((theme = useTheme()), null))
    expect(theme.dark()).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("turns from the control that asked: a plain toggle where the page cannot transition", () => {
    let theme!: ReturnType<typeof useTheme>
    const w = render(() => {
      theme = useTheme()
      return <button onClick={(e) => theme.revealToggle(e)}>turn</button>
    })
    fireEvent.click(w.container.querySelector("button")!)
    expect(theme.dark()).toBe(false)
  })
})

describe("interface sounds", () => {
  function fakeAudio() {
    const events: { what: string; v: number; t: number; node: string }[] = []
    const param = (node: string) => ({
      setValueAtTime: (v: number, t: number) => events.push({ what: "set", v, t, node }),
      linearRampToValueAtTime: (v: number, t: number) => events.push({ what: "linear", v, t, node }),
      exponentialRampToValueAtTime: (v: number, t: number) => events.push({ what: "exp", v, t, node }),
      setTargetAtTime: (v: number, t: number) => events.push({ what: "target", v, t, node }),
    })
    const node = () => ({ connect() {}, disconnect() {} })
    const audio = {
      currentTime: 2,
      destination: {},
      createOscillator: () => ({
        ...node(),
        type: "",
        frequency: param("freq"),
        start: (t: number) => events.push({ what: "start", v: 0, t, node: "osc" }),
        stop: (t: number) => events.push({ what: "stop", v: 0, t, node: "osc" }),
      }),
      createGain: () => ({ ...node(), gain: param("gain") }),
      createBiquadFilter: () => ({ ...node(), type: "", frequency: param("lowpass") }),
    }
    return { audio: audio as unknown as BaseAudioContext, events }
  }

  it("schedules each cue's voices as measured", () => {
    const { audio, events } = fakeAudio()
    schedule(audio, "on", () => 0.5)
    const glide = events.find((e) => e.what === "exp")!
    expect(events[0]).toMatchObject({ what: "set", v: 520, t: 2 })
    expect(glide.v).toBe(880)
    expect(glide.t).toBeCloseTo(2.087, 6)
    expect(events.find((e) => e.what === "linear")!.v).toBeCloseTo(0.147, 6)
    expect(events.find((e) => e.what === "stop")!.t).toBeCloseTo(2.167, 6)

    const copy = fakeAudio()
    schedule(copy.audio, "copy", () => 0)
    const starts = copy.events.filter((e) => e.what === "start").map((e) => e.t)
    expect(starts[0]).toBeCloseTo(2, 6)
    expect(starts[1]).toBeCloseTo(2.04, 6)
    expect(copy.events.filter((e) => e.node === "freq").map((e) => e.v)).toEqual([1200, 1400])

    const fold = fakeAudio()
    schedule(fold.audio, "fold", () => 1)
    expect(fold.events.find((e) => e.node === "lowpass")!.v).toBe(2200)
    expect(Object.keys(CUES)).toEqual(["on", "off", "tap", "copy", "theme", "fold", "unfold"])
  })

  it("stays silent while switched off, and remembers the switch", () => {
    const made = vi.fn()
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running"
        constructor() {
          made()
        }
      },
    )
    setSounds(false)
    expect(sounds()).toBe(false)
    play("tap")
    expect(made).not.toHaveBeenCalled()
    expect(localStorage.getItem("dither-sounds")).toBe("off")
    setSounds(true)
    expect(sounds()).toBe(true)
    expect(localStorage.getItem("dither-sounds")).toBe("on")
    // Asked again, the stored switch never overrides the reader's last word.
    localStorage.setItem("dither-sounds", "off")
    restoreSounds()
    expect(sounds()).toBe(true)
  })
})

// The rise: a headline's words come up one after another on the glide, then
// what stands with it; reduced motion stands everything where it is.
describe("the rise", () => {
  let seen: ((entries: { isIntersecting: boolean }[]) => void) | null = null
  let animated: { el: Element; delay: number; easing: string }[] = []
  let disconnected = 0
  const animate = Element.prototype.animate

  beforeEach(() => {
    seen = null
    animated = []
    disconnected = 0
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          seen = cb
        }
        observe() {}
        disconnect() {
          disconnected++
        }
      },
    )
    Element.prototype.animate = function (this: Element, _k: unknown, o: KeyframeAnimationOptions) {
      animated.push({ el: this, delay: Number(o.delay), easing: String(o.easing) })
      return {} as Animation
    } as typeof Element.prototype.animate
    document.documentElement.className = RISE_WAIT
    delete document.documentElement.dataset.rise
  })
  afterEach(() => {
    Element.prototype.animate = animate
    document.documentElement.className = ""
  })

  const mountHead = () =>
    render(() => (
      <div ref={rise}>
        <h2>
          <span data-rise="word">Every</span> <span data-rise="word">component,</span>{" "}
          <span data-rise="word">live.</span>
        </h2>
        <p data-rise>lede</p>
        <a data-rise>more</a>
      </div>
    ))

  it("staggers the words, then the blocks after the last word", () => {
    expect(riseDelays(["word", "word", "word", "block", "block"])).toEqual([0, 60, 120, 240, 330])
    expect(riseDelays(["block", "block"])).toEqual([0, RISE.block])
    expect(RISE.easing).toBe(`cubic-bezier(${GLIDE_BEZIER.join(", ")})`)
  })

  it("rises each riser once it comes into view, on the glide, and lets go with its component", () => {
    const w = mountHead()
    expect(document.documentElement.dataset.rise).toBe(RISE_LIVE)
    expect(animated).toEqual([])
    seen!([{ isIntersecting: true }])
    expect(animated.map((a) => a.delay)).toEqual([0, 60, 120, 240, 330])
    expect(new Set(animated.map((a) => a.easing))).toEqual(new Set([RISE.easing]))
    expect(all(w.container, "[data-rise]").every((e) => e.getAttribute("data-risen") === "")).toBe(true)
    const before = disconnected
    w.unmount()
    expect(disconnected).toBe(before + 1)
  })

  it("stands everything where it is under reduced motion", () => {
    reduced = true
    const w = mountHead()
    expect(seen).toBe(null)
    expect(animated).toEqual([])
    expect(all(w.container, "[data-rise]").every((e) => e.getAttribute("data-risen") === "")).toBe(true)
  })

  it("keeps a riser out of sight until it comes into view", () => {
    document.documentElement.className = ""
    const w = mountHead()
    const items = all(w.container, "[data-rise]")
    expect(items).toHaveLength(5)
    expect(items.every((e) => e.style.opacity === "0")).toBe(true)
    seen!([{ isIntersecting: false }])
    expect(animated).toEqual([])
    seen!([{ isIntersecting: true }])
    expect(items.every((e) => e.style.opacity === "")).toBe(true)
  })
})
