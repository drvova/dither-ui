// The site's shared slice (`src/shared/`, `src/widgets/site-header/`): the
// header and its menu, the mascot, the fields the Studio's inspector is
// built from, the theme and the interface sounds.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { Meta, MetaProvider } from "@solidjs/meta"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { COLORS } from "@/shared/config"
import { installHand } from "@/shared/lib/hand"
import { drivenCells, WHEEL_STEPS } from "@/shared/ui/car"
import { runPaths } from "@/shared/ui/cells"
import { EYE, MASCOT_ROTOR_STEPS } from "@/shared/ui/mascot"
import { BRAND_SYMBOL, MASCOT_SYMBOLS, markSymbol, spriteRef } from "@/shared/ui/sprite"
import {
  BAND_INK,
  CLOSE_CELLS,
  MENU_LINKS,
  SEAM_HEIGHT,
  SHEET_OUT,
  STUDIO_LINK,
  bandFill,
} from "@/widgets/site-header/menu"
import { useTheme } from "../../src/shared/lib"
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
/** A finger's (or a cursor's) event, by its pointer's id. */
const pointer = (type: string, pointerId: number, clientX: number, clientY: number) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId, clientX, clientY })

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

  it("slides the sheet back down before it shuts, from the close key, Escape and the page above it", () => {
    const w = render(() => <SiteHeader current="landing" />)
    const key = w.container.querySelector<HTMLElement>(".menu-key")!
    const dialog = w.container.querySelector("dialog")!
    for (const close of [
      () => fireEvent.click(w.container.querySelector('[aria-label="Close menu"]')!),
      () => fireEvent(dialog, new Event("cancel", { cancelable: true })),
      () => fireEvent.click(dialog),
    ]) {
      fireEvent.click(key)
      expect(w.container.querySelector("[data-phase]")?.getAttribute("data-phase")).toBe("open")
      close()
      // Leaving: the sheet still up, sliding down; the key says shut.
      expect(w.container.querySelector("[data-phase]")?.getAttribute("data-phase")).toBe("leaving")
      expect(w.container.querySelector(".menu-sheet")).not.toBeNull()
      expect(key.getAttribute("aria-expanded")).toBe("false")
      expect(document.documentElement.style.overflow).toBe("hidden")
      // Its slide down played (the stylesheet's keyframes): it shuts.
      const slid = Object.assign(new Event("animationend", { bubbles: true }), { animationName: SHEET_OUT })
      w.container.querySelector(".menu-sheet")!.dispatchEvent(slid)
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
    const head = w.container.querySelector<HTMLElement>(".menu-grab")!
    const close = head.querySelector<HTMLElement>('[aria-label="Close menu"]')!
    expect(all(close, "svg path").map((p) => p.getAttribute("d"))).toEqual(
      runPaths(CLOSE_CELLS, (c: { core?: boolean }) => (c.core ? "core" : "ink")).map((p) => p.d),
    )
    expect(close.hasAttribute("autofocus")).toBe(true)
    // no handle: nothing drags the sheet (the user's call: no motion is JS)
    expect(head.querySelector(".menu-handle")).toBeNull()
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
  const href = (el: Element | null | undefined) => el?.getAttribute("href")
  it("draws the brand's diamond from the sprite, or another mark on its grid as its own paths", () => {
    const w = render(() => <BrandMark size={13} />)
    const svg = w.container.querySelector("svg")!
    expect([svg.getAttribute("width"), svg.getAttribute("height")]).toEqual(["13", "13"])
    expect([svg.getAttribute("aria-hidden"), svg.getAttribute("focusable")]).toEqual(["true", "false"])
    expect(href(svg.querySelector("use"))).toBe(spriteRef(BRAND_SYMBOL))
    const x = render(() => <BrandMark size={14} cells={CLOSE_CELLS} />)
    const paths = all(x.container, "path")
    // one path an ink, its runs covering exactly the close mark's cells
    expect(paths.map((p) => p.getAttribute("d"))).toEqual(
      runPaths(CLOSE_CELLS, (c: { core?: boolean }) => (c.core ? "core" : "ink")).map((p) => p.d),
    )
    expect(paths.filter((p) => p.getAttribute("fill") !== "currentColor")).toHaveLength(1)
  })

  it("draws a tool's mark from the sprite in currentColor, at 14px unless told", () => {
    const w = render(() => <ToolMark id="github" />)
    const svg = w.container.querySelector("svg")!
    expect([svg.getAttribute("width"), svg.getAttribute("fill")]).toEqual(["14", "currentColor"])
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(href(svg.querySelector("use"))).toBe(spriteRef(markSymbol("github")))
    expect(svg.querySelector("path")).toBeNull()
  })

  it("draws the mascot as a decorative SVG of the sprite's parts, the size its height", () => {
    const w = render(() => <Mascot size={30} class="max-[479px]:hidden" />)
    const svg = w.container.querySelector("svg")!
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("height")).toBe("30")
    expect(svg.classList.contains("mascot") && svg.classList.contains("max-[479px]:hidden")).toBe(true)
    expect(all(svg, "use").map(href)).toEqual(
      [MASCOT_SYMBOLS.antennae, MASCOT_SYMBOLS.body, MASCOT_SYMBOLS.feet].map(spriteRef),
    )
  })

  it("poses by its stylesheet: alive, waving, flying on a rotor of every turn, no timer", () => {
    vi.useFakeTimers()
    const w = render(() => <Mascot size={16} alive />)
    const svg = w.container.querySelector("svg")!
    expect([svg.dataset.pose, svg.dataset.alive]).toEqual(["idle", ""])
    // the lid the blink shows sits on the eye
    const lid = svg.querySelector(".mascot-lid")!
    expect([lid.getAttribute("x"), lid.getAttribute("y")]).toEqual(EYE.map(String))
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.pointerEnter(svg)
    expect(svg.dataset.pose).toBe("idle")

    const waving = render(() => <Mascot size={16} pose="wave" />)
    expect(href(waving.container.querySelector("use"))).toBe(spriteRef(MASCOT_SYMBOLS.wave))
    expect(waving.container.querySelector("svg")!.dataset.alive).toBeUndefined()

    const flying = render(() => <Mascot size={16} pose="fly" />)
    const air = flying.container.querySelector("svg")!
    expect(air.dataset.pose).toBe("fly")
    expect(all(air, ".mascot-turn").map(href)).toEqual(
      Array.from({ length: MASCOT_ROTOR_STEPS }, (_, t) => spriteRef(MASCOT_SYMBOLS.rotor(t))),
    )
    expect(all(air, ".mascot-turn").map((u) => u.style.getPropertyValue("--turn"))).toEqual(["0", "1", "2", "3"])
    expect(vi.getTimerCount()).toBe(0)
  })

  it("turns the car's wheels only while it drives, by its stylesheet: no timer, every turn drawn", () => {
    vi.useFakeTimers()
    const [driving, setDriving] = createSignal(false)
    const w = render(() => <MascotCar size={21} driving={driving()} />)
    const svg = w.container.querySelector("svg")!
    /** The cells a list of paths covers. */
    const cellsOf = (paths: Element[]) =>
      paths.flatMap((p) =>
        [...p.getAttribute("d")!.matchAll(/M(\d+) (-?\d+)h(\d+)/g)].flatMap((m) =>
          Array.from({ length: Number(m[3]) }, (_, i) => `${Number(m[1]) + i}.${m[2]}`),
        ),
      )
    const still = cellsOf(all(svg, ":scope > path"))
    const turns = all(svg, "g.car-turn")
    const at = (turn: number) =>
      drivenCells(turn)
        .map((c) => `${c.x}.${c.y}`)
        .sort()
    expect(svg.getAttribute("height")).toBe("21")
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    // each turn is the still part and its own group, in its place of the cycle
    expect(turns).toHaveLength(WHEEL_STEPS)
    turns.forEach((g, turn) => {
      expect([...still, ...cellsOf(all(g, "path"))].sort()).toEqual(at(turn))
      expect(g.style.getPropertyValue("--turn")).toBe(String(turn))
    })
    // driving is an attribute the stylesheet reads; nothing steps by a timer
    expect(svg.hasAttribute("data-driving")).toBe(false)
    const before = svg.innerHTML
    setDriving(true)
    expect(svg.hasAttribute("data-driving")).toBe(true)
    vi.advanceTimersByTime(700)
    expect(svg.innerHTML).toBe(before)
    setDriving(false)
    expect(svg.hasAttribute("data-driving")).toBe(false)
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

  it("drags a bezier's handle inside its box, from a finger's reach, and lets go on a cancel", () => {
    const got = vi.fn()
    const w = render(() => <BezierEditor modelValue={[0.25, 0.1, 0.25, 1]} onUpdateModelValue={got} />)
    const svg = w.container.querySelector("svg")!
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
    const handles = all(w.container, "[data-handle]")
    expect(handles).toHaveLength(2)
    // The dot is 12px; what a finger presses reaches 28px (a radius of 14).
    expect(handles.map((h) => all(h, "circle").map((c) => c.getAttribute("r")))).toEqual([
      ["14", "6"],
      ["14", "6"],
    ])
    handles[1].dispatchEvent(pointer("pointerdown", 1, 100, 25))
    expect(got).toHaveBeenLastCalledWith([0.25, 0.1, 0.5, 1])
    // a second finger steers nothing
    window.dispatchEvent(pointer("pointermove", 2, 0, 0))
    expect(got).toHaveBeenLastCalledWith([0.25, 0.1, 0.5, 1])
    window.dispatchEvent(pointer("pointermove", 1, 500, 500))
    expect(got).toHaveBeenLastCalledWith([0.25, 0.1, 1, -0.5])
    window.dispatchEvent(pointer("pointerup", 1, 500, 500))
    got.mockClear()
    window.dispatchEvent(pointer("pointermove", 1, 10, 10))
    expect(got).not.toHaveBeenCalled()
    // A touch the browser takes for a scroll is cancelled: the drag ends there.
    handles[0].dispatchEvent(pointer("pointerdown", 3, 100, 25))
    window.dispatchEvent(pointer("pointercancel", 3, 100, 25))
    got.mockClear()
    window.dispatchEvent(pointer("pointermove", 3, 10, 10))
    expect(got).not.toHaveBeenCalled()
    // every key and field of the editor is a 24px target at least
    for (const el of all(w.container, "button, input")) expect(el.className).toMatch(/(^|\s)(min-)?h-6(\s|$)/)
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
    // The hue is a 24px target, its band drawn inside it.
    expect(hue.classList.contains("h-6")).toBe(true)
    const square = w.container.querySelector<HTMLElement>(".cursor-crosshair")!
    // A finger in the square picks, never scrolls the panel under it.
    expect(square.classList.contains("touch-none")).toBe(true)
    square.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    square.dispatchEvent(pointer("pointerdown", 1, 0, 0))
    expect(got).toHaveBeenLastCalledWith("#ffffff")
    window.dispatchEvent(pointer("pointermove", 1, 100, 100))
    expect(got).toHaveBeenLastCalledWith("#000000")
    window.dispatchEvent(pointer("pointerup", 1, 100, 100))
    // A cancelled touch lets go too: no pointer moving after it steers the colour.
    square.dispatchEvent(pointer("pointerdown", 2, 0, 0))
    window.dispatchEvent(pointer("pointercancel", 2, 0, 0))
    got.mockClear()
    window.dispatchEvent(pointer("pointermove", 2, 100, 100))
    window.dispatchEvent(pointer("pointermove", 1, 50, 50))
    expect(got).not.toHaveBeenCalled()
    // every swatch is a 24px target
    for (const b of swatches) expect(b.classList.contains("size-6")).toBe(true)
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

  it("opened by a long press, takes focus on the menu itself: no item ringed under the finger", async () => {
    const uninstall = installHand(document)
    fireEvent.pointerDown(document.body, { pointerType: "touch" })
    render(() => <ContextMenu x={40} y={60} items={items()} />)
    await Promise.resolve()
    const menu = document.body.querySelector<HTMLElement>("[role=menu]")!
    expect(document.activeElement).toBe(menu)
    // an arrow still reaches the first item
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(text(document.activeElement!)).toBe("Rename")
    fireEvent.pointerDown(document.body, { pointerType: "mouse" })
    uninstall()
  })

  it("moves in from the window's edge, where a long press on the right column's rows opens it", async () => {
    vi.stubGlobal("innerWidth", 1194)
    vi.stubGlobal("innerHeight", 834)
    const box = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ left: 0, top: 0, width: 172, height: 252, right: 172, bottom: 252 } as DOMRect)
    const [at, setAt] = createSignal({ x: 1100, y: 700 })
    render(() => <ContextMenu x={at().x} y={at().y} items={items()} />)
    await Promise.resolve()
    const menu = document.body.querySelector<HTMLElement>("[role=menu]")!
    expect([menu.style.left, menu.style.top]).toEqual([`${1194 - 172 - 8}px`, `${834 - 252 - 8}px`])
    // opened again elsewhere, it stands where it was asked
    setAt({ x: 300, y: 200 })
    expect([menu.style.left, menu.style.top]).toEqual(["300px", "200px"])
    box.mockRestore()
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
    // once the page has loaded.
    expect(tints()).toEqual(["#08090b"])
    await new Promise((r) => setTimeout(r, 1))
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

  it("turns through a typed view transition where the browser has one, else at once", () => {
    let theme!: ReturnType<typeof useTheme>
    const w = render(() => {
      theme = useTheme()
      return <button onClick={() => theme.turn()}>turn</button>
    })
    fireEvent.click(w.container.querySelector("button")!)
    expect(theme.dark()).toBe(false)
    // a browser with typed view transitions: the one call, its motion the stylesheet's
    const started: { types: string[] }[] = []
    vi.stubGlobal("ViewTransition", class {})
    Object.defineProperty(ViewTransition.prototype, "types", { value: new Set(), configurable: true })
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = (o: {
      update: () => void
      types: string[]
    }) => {
      started.push(o)
      o.update()
    }
    fireEvent.click(w.container.querySelector("button")!)
    expect(started.map((o) => o.types)).toEqual([["theme"]])
    expect(theme.dark()).toBe(true)
    // under reduced motion it turns at once
    reduced = true
    fireEvent.click(w.container.querySelector("button")!)
    expect(started).toHaveLength(1)
    expect(theme.dark()).toBe(false)
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
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
