// The Solid kit's text, navigation and small canvas pieces, held to what
// their Vue twins did: each renders its content under the role and name a
// reader finds it by, reports a change through its callback, keeps its
// keyboard path, and paints its canvas where it has one.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AsciiText from "../../dither-kit/solid/AsciiText"
import Blockquote from "../../dither-kit/solid/Blockquote"
import CascadeSelect from "../../dither-kit/solid/CascadeSelect"
import CenterMorphModal from "../../dither-kit/solid/CenterMorphModal"
import DitherAvatar from "../../dither-kit/solid/DitherAvatar"
import DitherBadge from "../../dither-kit/solid/DitherBadge"
import DitherImage from "../../dither-kit/solid/DitherImage"
import DitherKbd from "../../dither-kit/solid/DitherKbd"
import DitherNavMenu from "../../dither-kit/solid/DitherNavMenu"
import DitherSeparator from "../../dither-kit/solid/DitherSeparator"
import DitherStepper from "../../dither-kit/solid/DitherStepper"
import DitherTabPanel from "../../dither-kit/solid/DitherTabPanel"
import DitherTabs from "../../dither-kit/solid/DitherTabs"
import DitherToolbar from "../../dither-kit/solid/DitherToolbar"
import GlareHover from "../../dither-kit/solid/GlareHover"
import GlitchText from "../../dither-kit/solid/GlitchText"
import KbdCombo from "../../dither-kit/solid/KbdCombo"
import MagnetLines from "../../dither-kit/solid/MagnetLines"
import NumberText from "../../dither-kit/solid/NumberText"
import PercentText from "../../dither-kit/solid/PercentText"
import PreviewRail from "../../dither-kit/solid/PreviewRail"
import RelativeTime from "../../dither-kit/solid/RelativeTime"
import ScrollReveal from "../../dither-kit/solid/ScrollReveal"
import SelectableText from "../../dither-kit/solid/SelectableText"
import ShinyText from "../../dither-kit/solid/ShinyText"
import TextType from "../../dither-kit/solid/TextType"
import { world } from "./world"

let w: ReturnType<typeof world>
/** Lines stroked on any canvas since the spec began. */
let strokes = 0
beforeEach(() => {
  w = world()
  strokes = 0
  // The world's canvas, with the rest of the 2D context these pieces draw
  // through: text to measure, pixels to read back, lines to stroke.
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    const image = (width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4).fill(255),
    })
    return {
      canvas: this,
      createImageData: image,
      getImageData: (_x: number, _y: number, width: number, height: number) => image(width, height),
      putImageData: () => w.uploads.push(this),
      measureText: () => ({ width: 320 }),
      stroke: () => strokes++,
      clearRect() {},
      drawImage() {},
      fillText() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
    }
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/** jsdom lays nothing out: every element measures as one small box. */
function laidOut() {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(96)
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 96,
    height: 40,
  } as DOMRect)
}
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
}

describe("AsciiText", () => {
  it("names the word it draws, and draws it as rows of the asked width", () => {
    const { getByLabelText } = render(() => <AsciiText text="KIT" cols={16} />)
    const rows = getByLabelText("KIT").textContent!.trimEnd().split("\n")
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows.every((row) => row.length === 16)).toBe(true)
  })

  it("draws again when its word changes", () => {
    const [cols, setCols] = createSignal(16)
    const { getByLabelText } = render(() => <AsciiText text="KIT" cols={cols()} />)
    setCols(24)
    expect(getByLabelText("KIT").textContent!.split("\n")[0].length).toBe(24)
  })
})

describe("Blockquote", () => {
  it("is a real blockquote holding its content", () => {
    const { container } = render(() => <Blockquote class="mt-4">Measure twice.</Blockquote>)
    const quote = container.querySelector("blockquote")!
    expect(quote.textContent).toBe("Measure twice.")
    expect(quote.className).toContain("mt-4")
  })
})

describe("CascadeSelect", () => {
  const tree = [
    { value: "Fruit", children: [{ value: "Apple" }, { value: "Pear" }] },
    { value: "Tool", children: [{ value: "Saw" }] },
  ]

  it("shows one named select a level, and opens the next as a parent is chosen", () => {
    const changed = vi.fn()
    const { getByRole, getAllByRole } = render(() => (
      <CascadeSelect tree={tree} placeholders={["Kind"]} onUpdateModelValue={changed} />
    ))
    expect(getAllByRole("combobox").length).toBe(1)
    fireEvent.change(getByRole("combobox", { name: "Kind" }), { target: { value: "Fruit" } })
    expect(changed).toHaveBeenLastCalledWith(["Fruit"])
    const second = getByRole("combobox", { name: "Level 2" }) as HTMLSelectElement
    expect([...second.options].map((o) => o.value)).toEqual(["", "Apple", "Pear"])
  })

  it("drops the deeper choices when a parent changes", () => {
    const changed = vi.fn()
    const { getByRole } = render(() => (
      <CascadeSelect tree={tree} value={["Fruit", "Pear"]} onUpdateModelValue={changed} />
    ))
    expect((getByRole("combobox", { name: "Level 2" }) as HTMLSelectElement).value).toBe("Pear")
    fireEvent.change(getByRole("combobox", { name: "Level 1" }), { target: { value: "Tool" } })
    expect(changed).toHaveBeenLastCalledWith(["Tool"])
    expect((getByRole("combobox", { name: "Level 2" }) as HTMLSelectElement).value).toBe("")
  })

  it("follows the path it is given", () => {
    const [value, setValue] = createSignal<string[]>([])
    const { getAllByRole } = render(() => <CascadeSelect tree={tree} value={value()} />)
    setValue(["Tool", "Saw"])
    expect((getAllByRole("combobox") as HTMLSelectElement[]).map((s) => s.value)).toEqual(["Tool", "Saw"])
  })
})

describe("CenterMorphModal", () => {
  // The sheet stands on the body, outside what `render` returns queries for.
  function Sheet(props: { onClose?: () => void }) {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open the sheet
        </button>
        <CenterMorphModal
          open={open()}
          label="Settings"
          onClose={() => {
            props.onClose?.()
            setOpen(false)
          }}
        >
          <button type="button">Save</button>
        </CenterMorphModal>
      </>
    )
  }

  it("opens as a named dialog with its close key focused", async () => {
    render(() => <Sheet />)
    expect(screen.queryByRole("dialog")).toBeNull()
    const opener = screen.getByRole("button", { name: "Open the sheet" })
    opener.focus()
    fireEvent.click(opener)
    await settle()
    const dialog = screen.getByRole("dialog", { name: "Settings" })
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }))
  })

  it("closes on Escape, keeps the key from the page, and hands focus back", async () => {
    const closed = vi.fn()
    const page = vi.fn()
    document.addEventListener("keydown", page)
    render(() => <Sheet onClose={closed} />)
    const opener = screen.getByRole("button", { name: "Open the sheet" })
    opener.focus()
    fireEvent.click(opener)
    await settle()
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Escape" })
    document.removeEventListener("keydown", page)
    expect(closed).toHaveBeenCalledTimes(1)
    expect(page).not.toHaveBeenCalled()
    await w.frame(100)
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("keeps Tab inside the sheet", async () => {
    render(() => <Sheet />)
    fireEvent.click(screen.getByRole("button", { name: "Open the sheet" }))
    await settle()
    const save = screen.getByRole("button", { name: "Save" })
    save.focus()
    fireEvent.keyDown(save, { key: "Tab" })
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }))
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Tab", shiftKey: true })
    expect(document.activeElement).toBe(save)
  })

  it("closes from its key and from the backdrop, never from inside the panel", async () => {
    const closed = vi.fn()
    render(() => (
      <CenterMorphModal open onClose={closed}>
        Body
      </CenterMorphModal>
    ))
    await settle()
    const dialog = screen.getByRole("dialog", { name: "Modal" })
    fireEvent.pointerDown(dialog)
    expect(closed).not.toHaveBeenCalled()
    fireEvent.pointerDown(dialog.parentElement!)
    expect(closed).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(closed).toHaveBeenCalledTimes(2)
  })
})

describe("DitherAvatar", () => {
  it("is an image named for its owner, sized as asked, and paints its canvas", async () => {
    const { getByRole } = render(() => <DitherAvatar name="Ada" size={48} />)
    const avatar = getByRole("img", { name: "Ada avatar" })
    expect(avatar.style.width).toBe("48px")
    await w.frame(performance.now() + 50)
    expect(w.uploads).toContain(avatar.querySelector("canvas"))
  })

  it("paints at once when still, again when replayed, and glows through a second canvas", () => {
    const [token, setToken] = createSignal(0)
    const { getByRole } = render(() => <DitherAvatar name="Ada" animate={false} replayToken={token()} bloom="low" />)
    expect(getByRole("img").querySelectorAll("canvas").length).toBe(2)
    expect(w.uploads.length).toBe(1)
    setToken(1)
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherBadge", () => {
  it("shows its label over a canvas it paints, and repaints for a new colour", async () => {
    const [color, setColor] = createSignal<"blue" | "green">("blue")
    const { getByText } = render(() => <DitherBadge color={color()}>Beta</DitherBadge>)
    const badge = getByText("Beta")
    const canvas = badge.querySelector("canvas")!
    expect(canvas.getAttribute("aria-hidden")).toBe("true")
    await w.frame(100)
    expect(w.uploads).toEqual([canvas])
    setColor("green")
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherImage", () => {
  const source = () =>
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 8
        naturalHeight = 8
        complete = true
        crossOrigin = ""
        onload: (() => void) | null = null
        #src = ""
        get src() {
          return this.#src
        }
        set src(value: string) {
          this.#src = value
          queueMicrotask(() => this.onload?.())
        }
      },
    )

  it("is an image named by its alt, and paints its source once in view", async () => {
    source()
    laidOut()
    const { getByRole } = render(() => <DitherImage src="/faces.webp" alt="A row of faces" />)
    const frame = getByRole("img", { name: "A row of faces" })
    await settle()
    expect(w.uploads).toEqual([])
    w.show()
    await settle()
    expect(w.uploads).toContain(frame.querySelector("canvas"))
  })

  it("hides from readers without an alt", () => {
    source()
    const { container } = render(() => <DitherImage src="/faces.webp" />)
    const frame = container.firstElementChild!
    expect(frame.getAttribute("aria-hidden")).toBe("true")
    expect(frame.hasAttribute("role")).toBe(false)
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    source()
    laidOut()
    const { container } = render(() => (
      <DitherImage src="/faces.webp" alt="Faces" precompiled="data:image/png;base64,AAAA" />
    ))
    await settle()
    w.show()
    await settle()
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })
})

describe("DitherKbd", () => {
  it("is a real kbd holding its key", () => {
    const { container } = render(() => <DitherKbd>Esc</DitherKbd>)
    const key = container.querySelector("kbd")!
    expect(key.textContent).toBe("Esc")
    expect(key.style.borderBottomWidth).toBe("2px")
  })
})

describe("KbdCombo", () => {
  it("reads as one shortcut: a kbd a key, a separator between", () => {
    const { getByLabelText } = render(() => <KbdCombo keys={["Ctrl", "", "K"]} separator="then" />)
    const combo = getByLabelText("Keyboard shortcut")
    expect([...combo.querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["Ctrl", "K"])
    expect(combo.querySelectorAll('[aria-hidden="true"]').length).toBe(1)
    expect(combo.textContent).toBe("CtrlthenK")
  })
})

describe("DitherNavMenu", () => {
  const items = [{ label: "Docs", href: "/docs" }, { label: "Studio" }]

  it("marks the current link, and reports a pick without leaving the page", () => {
    const picked = vi.fn()
    const { getByRole } = render(() => <DitherNavMenu items={items} modelValue="Docs" onUpdateModelValue={picked} />)
    const docs = getByRole("link", { name: "Docs" })
    const studio = getByRole("link", { name: "Studio" })
    expect(docs.getAttribute("aria-current")).toBe("page")
    expect(docs.getAttribute("href")).toBe("/docs")
    expect(studio.hasAttribute("aria-current")).toBe(false)
    expect(studio.getAttribute("href")).toBe("#")
    expect(fireEvent.click(studio)).toBe(false)
    expect(picked).toHaveBeenCalledWith("Studio")
  })

  it("paints its underline under the current link, and moves it with the model", async () => {
    laidOut()
    const [value, setValue] = createSignal("Docs")
    const { container } = render(() => <DitherNavMenu items={items} modelValue={value()} />)
    const canvas = container.querySelector("canvas")!
    await w.frame(100)
    expect(w.uploads).toEqual([canvas])
    expect(canvas.style.width).toBe("96px")
    setValue("Studio")
    await settle()
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherSeparator", () => {
  it("is a separator that says which way it runs, and paints its rule", async () => {
    const [way, setWay] = createSignal<"horizontal" | "vertical">("horizontal")
    const { getByRole } = render(() => <DitherSeparator orientation={way()} />)
    const rule = getByRole("separator")
    expect(rule.getAttribute("aria-orientation")).toBe("horizontal")
    await w.frame(100)
    expect(w.uploads).toEqual([rule.querySelector("canvas")])
    setWay("vertical")
    expect(rule.getAttribute("aria-orientation")).toBe("vertical")
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherStepper", () => {
  it("lists its steps as progress, the current one marked, the done ones ticked", () => {
    const steps = [{ label: "Pick" }, { label: "Tune", hint: "Two minutes" }, { label: "Ship" }]
    const { getByRole, getAllByRole, getByText } = render(() => <DitherStepper steps={steps} current={1} />)
    expect(getByRole("list", { name: "Progress" })).toBeTruthy()
    const rows = getAllByRole("listitem")
    expect(rows.map((row) => row.getAttribute("aria-current"))).toEqual([null, "step", null])
    expect(rows[0].querySelector("svg")).not.toBeNull()
    expect(rows[1].textContent).toContain("2")
    expect(getByText("Two minutes")).toBeTruthy()
    expect(getAllByRole("separator").length).toBe(4)
  })
})

describe("DitherTabs", () => {
  const tabs = ["Preview", { value: "code", label: "Code", badge: 3 }, { value: "api", disabled: true }, "Notes"]
  function Tabs(props: { onPick?: (value: string) => void; variant?: "underline" | "segmented" | "washed" }) {
    const [value, setValue] = createSignal("Preview")
    return (
      <DitherTabs
        tabs={tabs}
        modelValue={value()}
        variant={props.variant}
        onUpdateModelValue={(v) => {
          props.onPick?.(v)
          setValue(v)
        }}
      >
        <DitherTabPanel value="Preview">The preview</DitherTabPanel>
        <DitherTabPanel value="code">The code</DitherTabPanel>
      </DitherTabs>
    )
  }

  it("is a tablist: one tab selected and in the tab order, each linked to its panel", () => {
    const { getByRole, getAllByRole } = render(() => <Tabs />)
    expect(getByRole("tablist").getAttribute("aria-orientation")).toBe("horizontal")
    const preview = getByRole("tab", { name: "Preview" })
    const code = getByRole("tab", { name: "Code 3" })
    expect(preview.getAttribute("aria-selected")).toBe("true")
    expect(preview.tabIndex).toBe(0)
    expect(code.getAttribute("aria-selected")).toBe("false")
    expect(code.tabIndex).toBe(-1)
    expect((getByRole("tab", { name: "api" }) as HTMLButtonElement).disabled).toBe(true)
    const panel = getByRole("tabpanel", { name: "Preview" })
    expect(panel.textContent).toBe("The preview")
    expect(preview.getAttribute("aria-controls")).toBe(panel.id)
    expect(getAllByRole("tabpanel").length).toBe(1)
  })

  it("reports a click, and shows that tab's panel while the other stays mounted", () => {
    const picked = vi.fn()
    const { getByRole, getByText } = render(() => <Tabs onPick={picked} />)
    fireEvent.click(getByRole("tab", { name: "Code 3" }))
    expect(picked).toHaveBeenCalledWith("code")
    expect(getByRole("tabpanel", { name: "Code 3" }).textContent).toBe("The code")
    expect(getByText("The preview").style.display).toBe("none")
  })

  it("moves by arrow keys past a disabled tab, wraps, and takes focus along", async () => {
    const picked = vi.fn()
    const { getByRole } = render(() => <Tabs onPick={picked} />)
    const list = getByRole("tablist")
    fireEvent.keyDown(list, { key: "ArrowRight" })
    fireEvent.keyDown(list, { key: "ArrowRight" })
    expect(picked.mock.calls.map(([v]) => v)).toEqual(["code", "Notes"])
    await settle()
    expect(document.activeElement).toBe(getByRole("tab", { name: "Notes" }))
    fireEvent.keyDown(list, { key: "ArrowRight" })
    expect(picked).toHaveBeenLastCalledWith("Preview")
    fireEvent.keyDown(list, { key: "End" })
    expect(picked).toHaveBeenLastCalledWith("Notes")
    fireEvent.keyDown(list, { key: "Home" })
    expect(picked).toHaveBeenLastCalledWith("Preview")
  })

  it("paints its marker under the selected tab, and has none when segmented", async () => {
    laidOut()
    const { container, unmount } = render(() => <Tabs />)
    const canvas = container.querySelector("canvas")!
    await w.frame(100)
    expect(w.uploads).toEqual([canvas])
    expect(canvas.style.height).toBe("2px")
    unmount()
    const segmented = render(() => <Tabs variant="segmented" />)
    expect(segmented.container.querySelector("canvas")).toBeNull()
  })

  it("leaves a panel outside any tabs unlinked and hidden", () => {
    const { container } = render(() => <DitherTabPanel value="lone">Alone</DitherTabPanel>)
    const panel = container.firstElementChild as HTMLElement
    expect(panel.id).toBe("")
    expect(panel.style.display).toBe("none")
  })
})

describe("DitherToolbar", () => {
  const bar = () => (
    <DitherToolbar label="Formatting">
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <button type="button">Code</button>
    </DitherToolbar>
  )

  it("is a named toolbar with one tab stop", () => {
    const { getByRole, getAllByRole } = render(bar)
    expect(getByRole("toolbar", { name: "Formatting" })).toBeTruthy()
    expect(getAllByRole("button").map((b) => b.tabIndex)).toEqual([0, -1, -1])
  })

  it("walks its buttons by arrow keys, Home and End, and keeps the key from the page", () => {
    const page = vi.fn()
    document.addEventListener("keydown", page)
    const { getByRole, getAllByRole } = render(bar)
    const bold = getByRole("button", { name: "Bold" })
    bold.focus()
    fireEvent.keyDown(bold, { key: "ArrowRight" })
    expect(document.activeElement).toBe(getByRole("button", { name: "Italic" }))
    expect(getAllByRole("button").map((b) => b.tabIndex)).toEqual([-1, 0, -1])
    fireEvent.keyDown(document.activeElement!, { key: "End" })
    expect(document.activeElement).toBe(getByRole("button", { name: "Code" }))
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(bold)
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(getByRole("button", { name: "Code" }))
    fireEvent.keyDown(document.activeElement!, { key: "Home" })
    expect(document.activeElement).toBe(bold)
    document.removeEventListener("keydown", page)
    expect(page).not.toHaveBeenCalled()
  })
})

describe("GlareHover", () => {
  it("holds its content under a glare no reader hears", () => {
    const { getByText } = render(() => (
      <GlareHover>
        <span>Card</span>
      </GlareHover>
    ))
    const root = getByText("Card").parentElement!
    expect(root.className).toContain("dk-glare-hover")
    expect(root.querySelector(".glare")?.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("GlitchText", () => {
  it("shows its text, hands it to its ghosts, and times them by its speed", () => {
    const { getByText } = render(() => <GlitchText text="SIGNAL" speed={5} />)
    const text = getByText("SIGNAL")
    expect(text.dataset.text).toBe("SIGNAL")
    expect(text.style.getPropertyValue("--dither-glitch-dur")).toBe("0.5s")
  })
})

describe("MagnetLines", () => {
  it("holds its content, draws its field at mount and again as the pointer moves", () => {
    laidOut()
    const { getByText } = render(() => (
      <MagnetLines gap={20}>
        <span>Over the field</span>
      </MagnetLines>
    ))
    const root = getByText("Over the field").parentElement!
    expect(root.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true")
    const drawn = strokes
    expect(drawn).toBeGreaterThan(0)
    fireEvent.pointerMove(root, { clientX: 10, clientY: 10 })
    expect(strokes).toBe(drawn * 2)
  })
})

describe("NumberText", () => {
  it("formats its number by locale, decimals and grouping", () => {
    const { container } = render(() => (
      <>
        <NumberText value={1234.5} decimals={2} />
        <NumberText value={1234.5} decimals={0} grouping={false} />
        <NumberText value={1234.5} decimals={1} locale="de-DE" />
      </>
    ))
    expect([...container.querySelectorAll("span")].map((s) => s.textContent)).toEqual(["1,234.50", "1235", "1.234,5"])
  })
})

describe("PercentText", () => {
  it("reads a fraction as a percent", () => {
    const { getByText } = render(() => (
      <>
        <PercentText value={0.42} />
        <PercentText value={0.4256} decimals={1} />
      </>
    ))
    expect(getByText("42%")).toBeTruthy()
    expect(getByText("42.6%")).toBeTruthy()
  })
})

describe("PreviewRail", () => {
  const items = [
    { value: "intro", label: "Intro", hint: "Start here" },
    { value: "api", label: "API" },
  ]

  it("is a named rail of buttons, the current one marked, a pick reported", () => {
    const picked = vi.fn()
    const { getByRole } = render(() => <PreviewRail items={items} modelValue="intro" onUpdateModelValue={picked} />)
    expect(getByRole("navigation", { name: "Preview rail" })).toBeTruthy()
    const intro = getByRole("button", { name: "Intro — Start here" })
    const api = getByRole("button", { name: "API" })
    expect(intro.getAttribute("aria-current")).toBe("page")
    expect(api.hasAttribute("aria-current")).toBe(false)
    fireEvent.click(api)
    expect(picked).toHaveBeenCalledWith("api")
  })

  it("floats the focused tick's preview, and takes it away as focus leaves", () => {
    const { getByRole, queryByText } = render(() => <PreviewRail items={items} />)
    expect(queryByText("Start here")).toBeNull()
    fireEvent.focusIn(getByRole("button", { name: "Intro — Start here" }))
    expect(queryByText("Intro")).not.toBeNull()
    expect(queryByText("Start here")).not.toBeNull()
    fireEvent.focusIn(getByRole("button", { name: "API" }))
    expect(queryByText("API")).not.toBeNull()
    expect(queryByText("Start here")).toBeNull()
    fireEvent.focusOut(getByRole("button", { name: "API" }))
    expect(queryByText("API")).toBeNull()
  })

  it("shows the preview it is given for the item, and swells the tick under the pointer", () => {
    laidOut()
    const { getByRole, queryByText } = render(() => (
      <PreviewRail items={items} preview={(scope) => <b>Go to {scope.item.label}</b>} />
    ))
    const rail = getByRole("navigation")
    const tick = getByRole("button", { name: "API" }).firstElementChild as HTMLElement
    expect(tick.style.width).toBe("10px")
    fireEvent.pointerMove(rail, { clientY: 20 })
    expect(queryByText("Go to Intro")).not.toBeNull()
    expect(tick.style.width).toBe("26px")
    fireEvent.pointerLeave(rail)
    expect(queryByText("Go to Intro")).toBeNull()
    expect(tick.style.width).toBe("10px")
  })
})

describe("RelativeTime", () => {
  const now = Date.UTC(2026, 0, 10, 12)

  it("says how long ago or how soon, in the largest sane unit", () => {
    const { container } = render(() => (
      <>
        <RelativeTime date={now - 3 * 60_000} now={now} />
        <RelativeTime date={now + 2 * 86_400_000} now={now} />
        <RelativeTime date={now} now={now} />
        <RelativeTime date={new Date(now - 3 * 3_600_000)} now={now} locale="de-DE" />
      </>
    ))
    expect([...container.querySelectorAll("time")].map((t) => t.textContent)).toEqual([
      "3 minutes ago",
      "in 2 days",
      "now",
      "vor 3 Stunden",
    ])
  })

  it("ticks by itself, and stops when it leaves", () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const { container, unmount } = render(() => <RelativeTime date={now} updateInterval={1000} />)
    const time = container.querySelector("time")!
    expect(time.textContent).toBe("now")
    vi.advanceTimersByTime(5000)
    expect(time.textContent).toBe("5 seconds ago")
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("ScrollReveal", () => {
  it("names its sentence for readers, and reveals its words once measured", async () => {
    const { getByLabelText } = render(() => <ScrollReveal text="Read me" />)
    const block = getByLabelText("Read me")
    const words = [...block.children] as HTMLElement[]
    expect(words.map((word) => word.textContent)).toEqual(["Read", " ", "me"])
    expect(words.every((word) => word.getAttribute("aria-hidden") === "true")).toBe(true)
    expect(words[0].style.opacity).toBe("0.06")
    await w.frame(100)
    expect(words[0].style.opacity).toBe("1")
  })

  it("stops listening to the page when it leaves", async () => {
    const { unmount } = render(() => <ScrollReveal />)
    await w.frame(100)
    const measured = vi.spyOn(Element.prototype, "getBoundingClientRect")
    unmount()
    fireEvent.scroll(window)
    await w.frame(200)
    expect(measured).not.toHaveBeenCalled()
  })
})

describe("SelectableText", () => {
  it("wraps its content in the asked element, selectable whole", () => {
    const { getByText } = render(() => <SelectableText as="code">KEY-1234</SelectableText>)
    const text = getByText("KEY-1234")
    expect(text.tagName).toBe("CODE")
    expect(text.className).toContain("select-all")
    expect(render(() => <SelectableText>plain</SelectableText>).getByText("plain").tagName).toBe("SPAN")
  })
})

describe("ShinyText", () => {
  it("shows its content, paced by its speed, held while disabled", () => {
    const [off, setOff] = createSignal(false)
    const { getByText } = render(() => (
      <ShinyText speed={2} disabled={off()}>
        Shine
      </ShinyText>
    ))
    const text = getByText("Shine")
    expect(text.style.animationDuration).toBe("2.5s")
    expect(text.style.animationPlayState).toBe("running")
    setOff(true)
    expect(text.style.animationPlayState).toBe("paused")
  })
})

describe("TextType", () => {
  it("types its first line, deletes it, then types the next", () => {
    vi.useFakeTimers()
    const { container } = render(() => (
      <TextType texts={["Hi", "Yo"]} typingSpeed={10} deletingSpeed={10} pause={100} />
    ))
    const [typed, caret] = [...container.firstElementChild!.children]
    expect(caret.getAttribute("aria-hidden")).toBe("true")
    expect(typed.textContent).toBe("")
    vi.advanceTimersByTime(300)
    expect(typed.textContent).toBe("H")
    vi.advanceTimersByTime(10)
    expect(typed.textContent).toBe("Hi")
    vi.advanceTimersByTime(10 + 100 + 10 + 10)
    expect(typed.textContent).toBe("")
    vi.advanceTimersByTime(10 + 220 + 10)
    expect(typed.textContent).toBe("Yo")
  })

  it("stops after its last line without a loop, and stops typing when it leaves", () => {
    vi.useFakeTimers()
    const { container, unmount } = render(() => <TextType texts={["Hi"]} loop={false} cursor={false} />)
    vi.advanceTimersByTime(5000)
    expect(container.textContent).toBe("Hi")
    expect(vi.getTimerCount()).toBe(0)
    unmount()
    render(() => <TextType />).unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
