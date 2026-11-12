// The Solid kit's dialogs, palette, dials, text and small widgets, held to
// what their Vue twins do: each renders what it is given, reports through
// its callbacks, keeps its keyboard paths, and lets go of what it listened
// to when it leaves.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Antigravity from "../../dither-kit/solid/Antigravity"
import DitherAlertDialog from "../../dither-kit/solid/DitherAlertDialog"
import DitherCollapsible from "../../dither-kit/solid/DitherCollapsible"
import DitherCommand from "../../dither-kit/solid/DitherCommand"
import DitherDialog from "../../dither-kit/solid/DitherDialog"
import DitherGauge from "../../dither-kit/solid/DitherGauge"
import DitherMeter from "../../dither-kit/solid/DitherMeter"
import DitherSchedule from "../../dither-kit/solid/DitherSchedule"
import ExpandTabs from "../../dither-kit/solid/ExpandTabs"
import GradientText from "../../dither-kit/solid/GradientText"
import InputGroup from "../../dither-kit/solid/InputGroup"
import LogoLoop from "../../dither-kit/solid/LogoLoop"
import Magnet from "../../dither-kit/solid/Magnet"
import MentionInput from "../../dither-kit/solid/MentionInput"
import NumberFlow from "../../dither-kit/solid/NumberFlow"
import Overline from "../../dither-kit/solid/Overline"
import PluralText from "../../dither-kit/solid/PluralText"
import RotatingText from "../../dither-kit/solid/RotatingText"
import StarBorder from "../../dither-kit/solid/StarBorder"
import Thumbnail from "../../dither-kit/solid/Thumbnail"
import VisuallyHidden from "../../dither-kit/solid/VisuallyHidden"
import WalletCard from "../../dither-kit/solid/WalletCard"
import { world } from "./world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** Let queued microtasks (a focus move, a swap) run. */
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
}
/** A button outside the component that holds focus before it opens. */
const Opener = () => <button type="button">Opener</button>
const focusOpener = () => {
  const opener = screen.getByRole("button", { name: "Opener" })
  opener.focus()
  return opener
}

describe("DitherAntigravity", () => {
  it("holds its content and draws its motes once in view, until it leaves", async () => {
    const arc = vi.fn()
    HTMLCanvasElement.prototype.getContext = (() => ({
      clearRect() {},
      beginPath() {},
      arc,
      fill() {},
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { getByText, container, unmount } = render(() => <Antigravity count={5}>Floating</Antigravity>)
    expect(getByText("Floating")).toBeTruthy()
    expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true")
    w.show()
    await w.frame(16)
    expect(arc).toHaveBeenCalledTimes(5)
    unmount()
    await w.frame(32)
    expect(arc).toHaveBeenCalledTimes(5)
  })
})

describe("DitherAlertDialog", () => {
  const Harness = (p: { onConfirm?: () => void }) => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Opener />
        <button type="button" onClick={() => setOpen(true)}>
          Ask
        </button>
        <DitherAlertDialog
          open={open()}
          title="Delete the frame?"
          description="It cannot be brought back."
          confirmLabel="Delete"
          danger
          onCancel={() => setOpen(false)}
          onConfirm={p.onConfirm}
        />
      </>
    )
  }

  it("opens named by its title with the cancel key focused, closes on Escape and returns focus", async () => {
    render(() => <Harness />)
    const opener = focusOpener()
    expect(screen.queryByRole("alertdialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Ask" }))
    await settle()
    const dialog = screen.getByRole("alertdialog", { name: "Delete the frame?" })
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.textContent).toContain("It cannot be brought back.")
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }))
    fireEvent.keyDown(dialog, { key: "Escape" })
    await settle()
    await w.frame(16)
    expect(screen.queryByRole("alertdialog")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("reports the confirm key, and keeps Tab inside the panel", async () => {
    const confirm = vi.fn()
    render(() => <Harness onConfirm={confirm} />)
    fireEvent.click(screen.getByRole("button", { name: "Ask" }))
    await settle()
    const yes = screen.getByRole("button", { name: "Delete" })
    const no = screen.getByRole("button", { name: "Cancel" })
    yes.focus()
    fireEvent.keyDown(yes, { key: "Tab" })
    expect(document.activeElement).toBe(no)
    fireEvent.keyDown(no, { key: "Tab", shiftKey: true })
    expect(document.activeElement).toBe(yes)
    fireEvent.click(yes)
    expect(confirm).toHaveBeenCalledTimes(1)
  })
})

describe("DitherCollapsible", () => {
  it("says whether it is open, reports a press, and holds its content inert while shut", () => {
    const [open, setOpen] = createSignal(false)
    const { getByRole, getByText } = render(() => (
      <DitherCollapsible title="Details" modelValue={open()} onUpdateModelValue={setOpen}>
        The small print
      </DitherCollapsible>
    ))
    const button = getByRole("button", { name: "Details" })
    const region = document.getElementById(button.getAttribute("aria-controls")!)!
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(region.contains(getByText("The small print"))).toBe(true)
    expect(region.inert).toBe(true)
    fireEvent.click(button)
    expect(open()).toBe(true)
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(region.inert).toBe(false)
  })

  it("prints its rail once it has a height", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40)
    const { container } = render(() => <DitherCollapsible title="Details" modelValue />)
    await w.frame(16)
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })
})

describe("DitherCommand", () => {
  const ITEMS = [
    { value: "new", label: "New frame", group: "File" },
    { value: "open", label: "Open frame", group: "File", kbd: "O" },
    { value: "theme", label: "Turn the theme" },
  ]
  const Harness = (p: { onSelect?: (v: string) => void }) => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Opener />
        <button type="button" onClick={() => setOpen(true)}>
          Palette
        </button>
        <DitherCommand
          open={open()}
          items={ITEMS}
          empty={(scope) => <>Nothing for {scope.query}</>}
          onClose={() => setOpen(false)}
          onSelect={p.onSelect}
        />
      </>
    )
  }
  const open = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Palette" }))
    await settle()
    return screen.getByRole("combobox") as HTMLInputElement
  }

  it("opens on its field, lists every item, and closes on Escape back to where focus was", async () => {
    render(() => <Harness />)
    const opener = focusOpener()
    const input = await open()
    expect(screen.getByRole("dialog", { name: "Type a command…" })).toBeTruthy()
    expect(document.activeElement).toBe(input)
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "New frame",
      "Open frameO",
      "Turn the theme",
    ])
    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("filters as you type, walks with the arrows and runs the active item on Enter", async () => {
    const select = vi.fn()
    render(() => <Harness onSelect={select} />)
    const input = await open()
    fireEvent.input(input, { target: { value: "frame" } })
    const options = screen.getAllByRole("option")
    expect(options.map((o) => o.textContent)).toEqual(["New frame", "Open frameO"])
    expect(options[0].getAttribute("aria-selected")).toBe("true")
    fireEvent.keyDown(input, { key: "ArrowDown" })
    const second = screen.getAllByRole("option")[1]
    expect(second.getAttribute("aria-selected")).toBe("true")
    expect(input.getAttribute("aria-activedescendant")).toBe(second.id)
    fireEvent.keyDown(input, { key: "Enter" })
    expect(select).toHaveBeenCalledWith("open")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("draws the empty state with the query when nothing matches", async () => {
    render(() => <Harness />)
    const input = await open()
    fireEvent.input(input, { target: { value: " zzz " } })
    expect(screen.queryAllByRole("option")).toEqual([])
    expect(screen.getByRole("listbox").textContent).toBe("Nothing for zzz")
  })
})

describe("DitherDialog", () => {
  const Harness = (p: { closeOnBackdrop?: boolean }) => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Opener />
        <button type="button" onClick={() => setOpen(true)}>
          Show
        </button>
        <DitherDialog
          open={open()}
          title="Export"
          description="Pick a format."
          closeOnBackdrop={p.closeOnBackdrop}
          onClose={() => setOpen(false)}
          footer={<button type="button">Done</button>}
        >
          The body
        </DitherDialog>
      </>
    )
  }
  const show = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Show" }))
    await settle()
    return screen.getByRole("dialog", { name: "Export" })
  }

  it("opens labelled and described, its close key focused, closes on Escape and returns focus", async () => {
    render(() => <Harness />)
    const opener = focusOpener()
    const dialog = await show()
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe("Pick a format.")
    expect(dialog.textContent).toContain("The body")
    expect(dialog.querySelector("footer")?.contains(screen.getByRole("button", { name: "Done" }))).toBe(true)
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }))
    fireEvent.keyDown(dialog, { key: "Escape" })
    await settle()
    await w.frame(16)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("keeps Tab inside, and closes from its backdrop only when allowed", async () => {
    const { unmount } = render(() => <Harness />)
    const dialog = await show()
    const close = screen.getByRole("button", { name: "Close" })
    const done = screen.getByRole("button", { name: "Done" })
    done.focus()
    fireEvent.keyDown(done, { key: "Tab" })
    expect(document.activeElement).toBe(close)
    fireEvent.pointerDown(dialog)
    expect(screen.queryByRole("dialog")).not.toBeNull()
    fireEvent.pointerDown(dialog.parentElement!)
    await w.frame(16)
    expect(screen.queryByRole("dialog")).toBeNull()
    unmount()

    render(() => <Harness closeOnBackdrop={false} />)
    const held = await show()
    fireEvent.pointerDown(held.parentElement!)
    await w.frame(16)
    expect(screen.queryByRole("dialog")).not.toBeNull()
  })
})

describe("DitherGauge", () => {
  it("is a meter that reads its value and label, and prints its dial", async () => {
    const { getByRole, container } = render(() => <DitherGauge value={42.5} decimals={1} label="psi" />)
    const meter = getByRole("meter", { name: "psi" })
    expect(meter.getAttribute("aria-valuemin")).toBe("0")
    expect(meter.getAttribute("aria-valuemax")).toBe("100")
    expect(meter.getAttribute("aria-valuenow")).toBe("42.5")
    expect(meter.getAttribute("aria-valuetext")).toBe("42.5 psi")
    expect(container.querySelector("svg")?.textContent).toContain("42.5")
    await w.frame(16)
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })

  it("moves its needle to a new reading and paints the way there", async () => {
    const [value, setValue] = createSignal(0)
    const { container } = render(() => <DitherGauge value={value()} />)
    await w.frame(16)
    const needle = () => container.querySelector('line[stroke-linecap="round"]')!.getAttribute("x2")
    const before = needle()
    const painted = w.uploads.length
    setValue(100)
    await w.frame(performance.now() + 10_000)
    expect(needle()).not.toBe(before)
    expect(w.uploads.length).toBeGreaterThan(painted)
  })
})

describe("DitherMeter", () => {
  it("is a meter with its range, prints its track and prints again as the value moves", async () => {
    const [value, setValue] = createSignal(20)
    const { getByRole, container } = render(() => <DitherMeter value={value()} max={50} />)
    const meter = getByRole("meter")
    expect(meter.getAttribute("aria-valuemax")).toBe("50")
    expect(meter.getAttribute("aria-valuenow")).toBe("20")
    await w.frame(16)
    expect(w.uploads).toEqual([container.querySelector("canvas")])
    setValue(45)
    expect(meter.getAttribute("aria-valuenow")).toBe("45")
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherSchedule", () => {
  it("places its events in the day and says the current time", () => {
    const { getByRole, getByText } = render(() => (
      <DitherSchedule events={[{ start: 9.5, end: 11, label: "Standup" }]} from={8} to={12} now={10} />
    ))
    expect(getByRole("group", { name: "Day schedule" })).toBeTruthy()
    const event = getByText("Standup").parentElement!
    expect(event.style.top).toBe("37.5%")
    expect(event.textContent).toContain("09:30–11:00")
    expect(getByText("Current time 10:00")).toBeTruthy()
  })

  it("draws no now line outside the day", () => {
    const { queryByText } = render(() => <DitherSchedule events={[]} now={20} />)
    expect(queryByText(/Current time/)).toBeNull()
  })
})

describe("DitherExpandTabs", () => {
  it("marks the chosen tab and reports a press on another", () => {
    const [value, setValue] = createSignal("a")
    const { getByRole } = render(() => (
      <ExpandTabs
        tabs={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        modelValue={value()}
        onUpdateModelValue={setValue}
      />
    ))
    expect(getByRole("tablist")).toBeTruthy()
    const alpha = getByRole("tab", { name: "Alpha" })
    const beta = getByRole("tab", { name: "Beta" })
    expect(alpha.getAttribute("aria-selected")).toBe("true")
    expect(beta.getAttribute("aria-selected")).toBe("false")
    fireEvent.click(beta)
    expect(value()).toBe("b")
    expect(beta.getAttribute("aria-selected")).toBe("true")
    expect(alpha.getAttribute("aria-selected")).toBe("false")
  })
})

describe("DitherGradientText", () => {
  it("holds its text over a gradient of its colours, timed by its speed", () => {
    const { getByText } = render(() => (
      <GradientText colors={["#ff0000", "#0000ff"]} speed={2}>
        Shine
      </GradientText>
    ))
    const el = getByText("Shine")
    expect(el.classList.contains("dither-gradient-text")).toBe(true)
    expect(el.style.animationDuration).toBe("3s")
    expect(el.getAttribute("style")).toContain("linear-gradient(90deg")
  })
})

describe("DitherInputGroup", () => {
  it("sets its prefix and suffix around the control", () => {
    const { container, getByRole } = render(() => (
      <InputGroup prefix="https://" suffix=".com">
        <input aria-label="Site" />
      </InputGroup>
    ))
    expect(getByRole("textbox", { name: "Site" })).toBeTruthy()
    expect(container.textContent).toBe("https://.com")
    expect(container.firstElementChild!.children[1].tagName).toBe("INPUT")
  })
})

describe("DitherLogoLoop", () => {
  it("runs its items twice over for the wrap, hidden from readers", () => {
    const { container } = render(() => <LogoLoop items={["ONE", "TWO"]} speed={9} gap={10} />)
    const root = container.firstElementChild!
    expect(root.getAttribute("aria-hidden")).toBe("true")
    const track = root.firstElementChild as HTMLElement
    expect(track.style.animationDuration).toBe("9s")
    expect([...track.children].map((c) => c.textContent)).toEqual(["ONE", "TWO", "ONE", "TWO"])
    expect((track.children[0] as HTMLElement).style.paddingRight).toBe("10px")
  })
})

describe("DitherMagnet", () => {
  it("leans its content toward a near pointer, lets go of a far one, and stops listening when it leaves", () => {
    const { getByText, container, unmount } = render(() => <Magnet strength={0.5}>Pull</Magnet>)
    const inner = getByText("Pull")
    vi.spyOn(container.firstElementChild!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect)
    fireEvent.pointerMove(window, { clientX: 70, clientY: 60 })
    expect(inner.style.transform).toBe("translate(10px, 5px)")
    fireEvent.pointerMove(window, { clientX: 900, clientY: 900 })
    expect(inner.style.transform).toBe("translate(0, 0)")
    unmount()
    fireEvent.pointerMove(window, { clientX: 70, clientY: 60 })
    expect(inner.style.transform).toBe("translate(0, 0)")
  })
})

describe("DitherMentionInput", () => {
  const setup = () => {
    const mention = vi.fn()
    const [value, setValue] = createSignal("")
    const view = render(() => (
      <MentionInput
        modelValue={value()}
        options={["alice", "alan", "bob"]}
        onUpdateModelValue={setValue}
        onMention={mention}
      />
    ))
    const field = view.getByRole("textbox") as HTMLTextAreaElement
    const type = (text: string) => {
      fireEvent.input(field, { target: { value: text } })
      field.setSelectionRange(text.length, text.length)
      fireEvent.keyUp(field, { key: text.slice(-1) })
    }
    return { ...view, field, type, value, mention }
  }

  it("reports what is typed and offers the names that fit an @", () => {
    const { field, type, value, getByRole, getAllByRole, queryByRole } = setup()
    expect(field.placeholder).toBe("Write… use @ to mention")
    type("hi ")
    expect(value()).toBe("hi ")
    expect(queryByRole("listbox")).toBeNull()
    type("hi @al")
    expect(getByRole("listbox", { name: "Mention suggestions" })).toBeTruthy()
    expect(getAllByRole("option").map((o) => o.textContent)).toEqual(["alice", "alan"])
  })

  it("picks with the arrows, inserts on Enter with a space after, and closes on Escape", async () => {
    const { field, type, value, mention, getAllByRole, queryByRole } = setup()
    type("hi @al")
    fireEvent.keyDown(field, { key: "ArrowDown" })
    expect(getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true")
    fireEvent.keyDown(field, { key: "Enter" })
    expect(value()).toBe("hi @alan ")
    expect(mention).toHaveBeenCalledWith("alan")
    expect(queryByRole("listbox")).toBeNull()
    await w.frame(16)
    expect(field.selectionStart).toBe(9)

    type("hi @alan @b")
    expect(queryByRole("listbox")).not.toBeNull()
    fireEvent.keyDown(field, { key: "Escape" })
    expect(queryByRole("listbox")).toBeNull()
  })
})

describe("DitherNumberFlow", () => {
  it("reads its figure to a reader and rolls each digit's column to it", () => {
    const [value, setValue] = createSignal(12.5)
    const { container } = render(() => <NumberFlow value={value()} decimals={1} duration={200} />)
    const root = container.firstElementChild!
    expect(root.getAttribute("aria-live")).toBe("polite")
    const read = () => root.querySelector(".sr-only")!.textContent
    const columns = () => [...root.querySelectorAll<HTMLElement>(".grid")].map((c) => c.style.transform)
    expect(read()).toBe("12.5")
    expect(columns()).toEqual(["translateY(-1em)", "translateY(-2em)", "translateY(-5em)"])
    expect(root.querySelector<HTMLElement>(".grid")!.style.transitionDuration).toBe("200ms")
    const first = root.querySelector(".grid")
    setValue(13.5)
    expect(read()).toBe("13.5")
    expect(columns()[1]).toBe("translateY(-3em)")
    expect(root.querySelector(".grid")).toBe(first)
  })
})

describe("DitherOverline", () => {
  it("holds its line", () => {
    const { getByText } = render(() => <Overline class="mb-2">Section</Overline>)
    expect(getByText("Section").className).toContain("mb-2")
  })
})

describe("DitherPluralText", () => {
  it("picks the sentence by the count's plural category, the children when none fits", () => {
    const [count, setCount] = createSignal(1)
    const { container } = render(() => (
      <PluralText count={count()} one={(s) => <>{s.count} frame</>}>
        {(s) => <>{s.count} frames</>}
      </PluralText>
    ))
    expect(container.textContent).toBe("1 frame")
    setCount(3)
    expect(container.textContent).toBe("3 frames")
  })
})

describe("DitherRotatingText", () => {
  it("shows its first word, then turns to the next once the first has left", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] })
    const { container, unmount } = render(() => <RotatingText texts={["one", "two"]} interval={500} />)
    expect(container.textContent).toBe("one")
    vi.advanceTimersByTime(500)
    expect(container.textContent).toBe("one")
    await w.frame(16)
    await settle()
    expect(container.textContent).toBe("two")
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("stands still on a single word", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] })
    const { container } = render(() => <RotatingText texts={["only"]} />)
    expect(container.textContent).toBe("only")
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("DitherStarBorder", () => {
  it("holds its content inside a border as thick as asked", () => {
    const { getByText, container } = render(() => <StarBorder thickness={3}>Inside</StarBorder>)
    expect(getByText("Inside")).toBeTruthy()
    const root = container.firstElementChild as HTMLElement
    expect(root.style.padding).toBe("3px")
    expect(root.querySelectorAll('.star-strip[aria-hidden="true"]').length).toBe(2)
  })
})

describe("DitherThumbnail", () => {
  it("is a link named by its image, and passes on what a link takes", () => {
    const pressed = vi.fn((e: MouseEvent) => e.preventDefault())
    const { getByRole } = render(() => (
      <Thumbnail src="/a.webp" alt="A frame" href="/frames/a" target="_blank" onClick={pressed} />
    ))
    const link = getByRole("link", { name: "A frame" }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/frames/a")
    expect(link.target).toBe("_blank")
    expect(link.style.aspectRatio).toContain("1.618")
    const img = getByRole("img", { name: "A frame" }) as HTMLImageElement
    expect(img.getAttribute("src")).toBe("/a.webp")
    expect(img.getAttribute("loading")).toBe("lazy")
    fireEvent.click(link)
    expect(pressed).toHaveBeenCalledTimes(1)
  })
})

describe("DitherVisuallyHidden", () => {
  it("keeps its content for readers only, and shows on focus when focusable", () => {
    const { getByText } = render(() => (
      <>
        <VisuallyHidden>Hidden label</VisuallyHidden>
        <VisuallyHidden focusable tabindex="0">
          Skip to content
        </VisuallyHidden>
      </>
    ))
    const plain = getByText("Hidden label")
    expect(plain.className).toBe("sr-only")
    const skip = getByText("Skip to content")
    expect(skip.className).toContain("focus:not-sr-only")
    expect(skip.getAttribute("tabindex")).toBe("0")
  })
})

describe("DitherWalletCard", () => {
  const ACCOUNTS = [
    { value: "main", label: "Main", address: "0x1234567890abcdef", balance: 1234.5, change: 2.25 },
    { value: "cold", label: "Cold", address: "0xshort", balance: 10, change: -1 },
  ]
  const setup = (extra: Partial<Parameters<typeof WalletCard>[0]> = {}) => {
    const [value, setValue] = createSignal("main")
    const view = render(() => (
      <WalletCard accounts={ACCOUNTS} modelValue={value()} onUpdateModelValue={setValue} {...extra} />
    ))
    return { ...view, value }
  }
  /** Past the timeout that arms the outside listeners. */
  const armed = () => new Promise((r) => setTimeout(r, 5))

  it("shows the active account's balance, change and shortened address", () => {
    const { getByRole, container } = setup()
    expect(getByRole("button", { name: /Main/ }).getAttribute("aria-expanded")).toBe("false")
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("$1,234.50")
    expect(container.textContent).toContain("▲ 2.3%")
    expect(getByRole("button", { name: "Copy address" }).textContent).toContain("0x1234…cdef")
  })

  it("switches account from its list, and returns focus to the switcher", async () => {
    const { getByRole, queryByRole, value, container } = setup()
    const switcher = getByRole("button", { name: /Main/ })
    fireEvent.click(switcher)
    await settle()
    expect(switcher.getAttribute("aria-expanded")).toBe("true")
    expect(getByRole("listbox", { name: "Accounts" })).toBeTruthy()
    expect(getByRole("option", { name: "Main" }).getAttribute("aria-selected")).toBe("true")
    fireEvent.click(getByRole("option", { name: "Cold" }))
    expect(value()).toBe("cold")
    expect(document.activeElement).toBe(switcher)
    await w.frame(16)
    expect(queryByRole("listbox")).toBeNull()
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("$10.00")
    expect(container.textContent).toContain("▼ 1.0%")
  })

  it("closes its list on Escape with focus back on the switcher, and on a press outside", async () => {
    const { getByRole, queryByRole } = setup()
    const switcher = getByRole("button", { name: /Main/ })
    fireEvent.click(switcher)
    await armed()
    fireEvent.keyDown(window, { key: "Escape" })
    await w.frame(16)
    expect(queryByRole("listbox")).toBeNull()
    expect(document.activeElement).toBe(switcher)
    fireEvent.click(switcher)
    await armed()
    fireEvent.pointerDown(document.body)
    await w.frame(16)
    expect(queryByRole("listbox")).toBeNull()
  })

  it("masks the balance on its toggle", () => {
    const { getByRole, container } = setup()
    const toggle = getByRole("button", { name: "Hide balance" })
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(toggle)
    expect(getByRole("button", { name: "Show balance" }).getAttribute("aria-pressed")).toBe("true")
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("*******")
  })

  it("opens its search on the field, reports each keystroke, and commits on Enter or a recent row", async () => {
    const search = vi.fn()
    const submit = vi.fn()
    const { getByRole } = setup({ recent: ["eth"], onSearch: search, onSubmit: submit })
    fireEvent.click(getByRole("button", { name: "Search wallet" }))
    await settle()
    const field = getByRole("textbox", { name: "Search wallet" }) as HTMLInputElement
    expect(document.activeElement).toBe(field)
    fireEvent.click(getByRole("button", { name: "eth" }))
    expect(submit).toHaveBeenLastCalledWith("eth")
    expect(field.value).toBe("eth")
    fireEvent.input(field, { target: { value: "btc" } })
    expect(search).toHaveBeenLastCalledWith("btc")
    fireEvent.keyDown(field, { key: "Enter" })
    expect(submit).toHaveBeenLastCalledWith("btc")
  })

  it("reports its actions and its bell", () => {
    const action = vi.fn()
    const notify = vi.fn()
    const { getByRole } = setup({ onAction: action, onNotify: notify })
    fireEvent.click(getByRole("button", { name: "Swap" }))
    expect(action).toHaveBeenCalledWith("swap")
    fireEvent.click(getByRole("button", { name: "Notifications" }))
    expect(notify).toHaveBeenCalledTimes(1)
  })
})
