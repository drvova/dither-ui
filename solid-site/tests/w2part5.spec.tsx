// Controls, overlays, text and widgets of the Solid kit, held to what their
// Vue twins do: each shows its content under its role and name, reports a
// change through its callback, and keeps its keyboard and focus rules.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import BouncyAccordion from "../../dither-kit/solid/BouncyAccordion"
import Box from "../../dither-kit/solid/Box"
import ChoiceChips from "../../dither-kit/solid/ChoiceChips"
import CodeInput from "../../dither-kit/solid/CodeInput"
import DateTimeText from "../../dither-kit/solid/DateTimeText"
import DitherAccordion from "../../dither-kit/solid/DitherAccordion"
import DitherAutocomplete from "../../dither-kit/solid/DitherAutocomplete"
import DitherCanvas from "../../dither-kit/solid/DitherCanvas"
import DitherContainer from "../../dither-kit/solid/DitherContainer"
import DitherDrawer from "../../dither-kit/solid/DitherDrawer"
import DitherDrawerIndent from "../../dither-kit/solid/DitherDrawerIndent"
import DitherOtpField from "../../dither-kit/solid/DitherOtpField"
import DitherSpinner from "../../dither-kit/solid/DitherSpinner"
import DitherTextarea from "../../dither-kit/solid/DitherTextarea"
import FallingText from "../../dither-kit/solid/FallingText"
import FocusScope from "../../dither-kit/solid/FocusScope"
import Island from "../../dither-kit/solid/Island"
import Label from "../../dither-kit/solid/Label"
import LineClamp from "../../dither-kit/solid/LineClamp"
import Overlay from "../../dither-kit/solid/Overlay"
import PixelTrail from "../../dither-kit/solid/PixelTrail"
import Pressable from "../../dither-kit/solid/Pressable"
import { FieldContextKey } from "../../dither-kit/solid/runtime/field"
import Shuffle from "../../dither-kit/solid/Shuffle"
import VariableProximity from "../../dither-kit/solid/VariableProximity"
import WheelPicker from "../../dither-kit/solid/WheelPicker"
import { world } from "./world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

/** Microtasks queued so far run. */
const tick = () => new Promise<void>((r) => queueMicrotask(r))

describe("Box", () => {
  it("renders its children in the tag asked for, attributes falling through", () => {
    render(() => (
      <Box as="section" class="p-2" aria-label="Area" data-kind="x">
        inside
      </Box>
    ))
    const el = screen.getByRole("region", { name: "Area" })
    expect(el.tagName).toBe("SECTION")
    expect(el.textContent).toBe("inside")
    expect(el.className).toBe("p-2")
    expect(el.getAttribute("data-kind")).toBe("x")
  })
})

describe("Label", () => {
  it("is a real label tied to its control, marked when required", () => {
    render(() => (
      <>
        <Label for="name" required>
          Name
        </Label>
        <input id="name" />
      </>
    ))
    expect(screen.getByLabelText(/Name/).id).toBe("name")
    expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true")
  })
})

describe("LineClamp", () => {
  it("clamps its content to the lines asked for, a paragraph by default", () => {
    render(() => <LineClamp lines={2}>long words</LineClamp>)
    const el = screen.getByText("long words")
    expect(el.tagName).toBe("P")
    expect(el.className).toBe("line-clamp-2")
  })
})

describe("Overlay", () => {
  it("is hidden from assistive tech until it is interactive", () => {
    const [interactive, setInteractive] = createSignal(false)
    const onClick = vi.fn()
    render(() => (
      <Overlay interactive={interactive()} dim="strong" onClick={onClick}>
        busy
      </Overlay>
    ))
    const el = screen.getByText("busy")
    expect(el.getAttribute("aria-hidden")).toBe("true")
    expect(el.className).toContain("pointer-events-none")
    expect(el.className).toContain("bg-background/60")
    setInteractive(true)
    expect(el.hasAttribute("aria-hidden")).toBe(false)
    expect(el.className).toContain("pointer-events-auto")
    fireEvent.click(el)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe("Pressable", () => {
  it("is a button that never submits by default and reports its press", () => {
    const onClick = vi.fn()
    render(() => (
      <Pressable variant="outline" onClick={onClick} aria-pressed="false">
        Save
      </Pressable>
    ))
    const button = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement
    expect(button.type).toBe("button")
    expect(button.className).toContain("border-border")
    expect(button.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("wears no look of its own when plain, and holds while disabled", () => {
    render(() => (
      <Pressable variant="plain" disabled>
        Bare
      </Pressable>
    ))
    const button = screen.getByRole("button", { name: "Bare" }) as HTMLButtonElement
    expect(button.className).toBe("transition-transform active:scale-[0.97]")
    expect(button.disabled).toBe(true)
  })
})

describe("DateTimeText", () => {
  it("writes the date in the locale's words, and a dash for no date", () => {
    render(() => (
      <>
        <DateTimeText date="2024-03-05T14:30:00Z" options={{ dateStyle: "medium", timeZone: "UTC" }} />
        <DateTimeText date="nonsense" class="x" />
      </>
    ))
    expect(screen.getByText("Mar 5, 2024").className).toBe("tabular-nums")
    expect(screen.getByText("—").className).toBe("tabular-nums x")
  })
})

describe("DitherCanvas", () => {
  it("lays its pattern behind its content at the pitch asked for", () => {
    const { container } = render(() => (
      <DitherCanvas pattern="grid" cell={8}>
        <button type="button">On it</button>
      </DitherCanvas>
    ))
    expect(screen.getByRole("button", { name: "On it" })).toBeTruthy()
    const layer = container.querySelector<HTMLElement>("[aria-hidden='true']")!
    expect(layer.style.backgroundSize).toBe("8px 8px")
    expect(layer.style.backgroundImage).toContain("linear-gradient")
  })
})

describe("ChoiceChips", () => {
  it("names its group and reports the radio picked", () => {
    const onUpdate = vi.fn()
    render(() => <ChoiceChips label="Size" options={["S", "M"]} modelValue="S" onUpdateModelValue={onUpdate} />)
    expect(screen.getByRole("group", { name: "Size" })).toBeTruthy()
    expect((screen.getByRole("radio", { name: "S" }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole("radio", { name: "M" }))
    expect(onUpdate).toHaveBeenCalledWith("M")
  })

  it("reports the whole set when multiple, read from the older `value` too", () => {
    const onUpdate = vi.fn()
    render(() => <ChoiceChips options={["a", "b", "c"]} value={["a"]} multiple onUpdateModelValue={onUpdate} />)
    expect((screen.getByRole("checkbox", { name: "a" }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: "c" }))
    expect(onUpdate).toHaveBeenLastCalledWith(["a", "c"])
    fireEvent.click(screen.getByRole("checkbox", { name: "a" }))
    expect(onUpdate).toHaveBeenLastCalledWith([])
  })
})

describe("DitherTextarea", () => {
  it("shows its value and reports what is typed, its own listener heard too", () => {
    const onUpdate = vi.fn()
    const onInput = vi.fn()
    render(() => <DitherTextarea modelValue="hi" aria-label="Notes" onUpdateModelValue={onUpdate} onInput={onInput} />)
    const area = screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement
    expect(area.value).toBe("hi")
    expect(area.rows).toBe(4)
    expect(area.style.resize).toBe("vertical")
    fireEvent.input(area, { target: { value: "hi there" } })
    expect(onUpdate).toHaveBeenCalledWith("hi there")
    expect(onInput).toHaveBeenCalledOnce()
  })

  it("takes its id, description and error from the field around it", () => {
    render(() => (
      <FieldContextKey.Provider value={{ controlId: () => "f1", describedBy: () => "f1-help", invalid: () => true }}>
        <DitherTextarea aria-label="Bio" />
      </FieldContextKey.Provider>
    ))
    const area = screen.getByRole("textbox", { name: "Bio" })
    expect(area.id).toBe("f1")
    expect(area.getAttribute("aria-describedby")).toBe("f1-help")
    expect(area.getAttribute("aria-invalid")).toBe("true")
  })
})

describe("CodeInput", () => {
  it("indents on Tab and dedents on Shift+Tab instead of leaving the field", () => {
    const onUpdate = vi.fn()
    render(() => <CodeInput modelValue="  ab" aria-label="Code" onUpdateModelValue={onUpdate} />)
    const area = screen.getByRole("textbox", { name: "Code" }) as HTMLTextAreaElement
    expect(area.rows).toBe(6)
    area.setSelectionRange(4, 4)
    expect(fireEvent.keyDown(area, { key: "Tab" })).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith("  ab  ")
    fireEvent.keyDown(area, { key: "Tab", shiftKey: true })
    expect(onUpdate).toHaveBeenLastCalledWith("ab")
  })

  it("submits on Ctrl+Enter", () => {
    const onSubmit = vi.fn()
    render(() => <CodeInput aria-label="Code" onSubmit={onSubmit} />)
    const area = screen.getByRole("textbox", { name: "Code" })
    expect(area.getAttribute("placeholder")).toBe("// paste or type…")
    fireEvent.keyDown(area, { key: "Enter" })
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(area, { key: "Enter", ctrlKey: true })
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe("DitherAccordion", () => {
  const items = [
    { value: "a", title: "First" },
    { value: "b", title: "Second" },
  ]

  it("shows each panel under its header and reports the one toggled", () => {
    const onUpdate = vi.fn()
    render(() => (
      <DitherAccordion
        items={items}
        modelValue="a"
        onUpdateModelValue={onUpdate}
        slots={{ a: "Alpha body", b: "Beta body" }}
      />
    ))
    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    expect(first.getAttribute("aria-expanded")).toBe("true")
    expect(second.getAttribute("aria-expanded")).toBe("false")
    const panel = document.getElementById(second.getAttribute("aria-controls")!)!
    expect(panel.textContent).toBe("Beta body")
    expect(panel.inert).toBe(true)
    fireEvent.click(second)
    expect(onUpdate).toHaveBeenLastCalledWith("b")
    fireEvent.click(first)
    expect(onUpdate).toHaveBeenLastCalledWith("")
  })

  it("keeps several open when multiple", () => {
    const onUpdate = vi.fn()
    render(() => <DitherAccordion items={items} modelValue={["a"]} type="multiple" onUpdateModelValue={onUpdate} />)
    fireEvent.click(screen.getByRole("button", { name: "Second" }))
    expect(onUpdate).toHaveBeenLastCalledWith(["a", "b"])
    fireEvent.click(screen.getByRole("button", { name: "First" }))
    expect(onUpdate).toHaveBeenLastCalledWith([])
  })

  it("paints each panel's rail once laid out", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40)
    const { container } = render(() => <DitherAccordion items={items} modelValue="a" />)
    await w.frame(0)
    const rails = [...container.querySelectorAll("canvas")]
    expect(rails.length).toBe(2)
    expect(w.uploads).toEqual(rails)
    expect(rails[0].height).toBe(20)
  })
})

describe("BouncyAccordion", () => {
  const items = [
    { value: "a", label: "Alpha", hint: "first", content: "Alpha text" },
    { value: "b", label: "Beta", icon: "B" },
  ]

  it("shows each row's label, hint and content, and reports the one toggled", () => {
    const onUpdate = vi.fn()
    render(() => (
      <BouncyAccordion items={items} modelValue="a" onUpdateModelValue={onUpdate} slots={{ b: "Beta slot" }} />
    ))
    const alpha = screen.getByRole("button", { name: /^Alpha\s*first$/ })
    const beta = screen.getByRole("button", { name: "Beta" })
    expect(alpha.getAttribute("aria-expanded")).toBe("true")
    const open = document.getElementById(alpha.getAttribute("aria-controls")!)!
    const shut = document.getElementById(beta.getAttribute("aria-controls")!)!
    expect(open.textContent).toBe("Alpha text")
    expect(shut.textContent).toBe("Beta slot")
    expect(open.style.height).toBe("auto")
    expect(shut.style.height).toBe("0px")
    expect(shut.inert).toBe(true)
    fireEvent.click(beta)
    expect(onUpdate).toHaveBeenLastCalledWith("b")
    fireEvent.click(alpha)
    expect(onUpdate).toHaveBeenLastCalledWith("")
  })

  it("springs a panel's height when the open one changes", async () => {
    const [value, setValue] = createSignal("a")
    render(() => <BouncyAccordion items={items} modelValue={value()} />)
    const shut = document.getElementById(screen.getByRole("button", { name: "Beta" }).getAttribute("aria-controls")!)!
    vi.spyOn(shut, "scrollHeight", "get").mockReturnValue(80)
    setValue("b")
    await w.frame(16)
    expect(shut.style.height).toMatch(/px$/)
    expect(shut.inert).toBe(false)
  })
})

describe("DitherAutocomplete", () => {
  const suggestions = ["Apple", "Apricot", "Banana"]

  it("filters as typed, and picks with the arrows and Enter", () => {
    const [value, setValue] = createSignal("")
    const onUpdate = vi.fn(setValue)
    render(() => <DitherAutocomplete suggestions={suggestions} modelValue={value()} onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole("combobox") as HTMLInputElement
    expect(input.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByRole("listbox")).toBeNull()
    fireEvent.input(input, { target: { value: "ap" } })
    expect(onUpdate).toHaveBeenLastCalledWith("ap")
    expect(input.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Apple", "Apricot"])
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onUpdate).toHaveBeenLastCalledWith("Apricot")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("opens on the arrows and closes on Escape", () => {
    render(() => <DitherAutocomplete suggestions={suggestions} modelValue="Banana" />)
    const input = screen.getByRole("combobox")
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(screen.getByRole("option", { name: "Banana" }).getAttribute("aria-selected")).toBe("true")
    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})

describe("DitherContainer", () => {
  it("measures itself and hands its children the bucket it falls in", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100)
    const { container } = render(() => (
      <DitherContainer as="section" name="card" step={50}>
        {(cq) => (
          <p>
            {cq.size} {cq.width}x{cq.height}
          </p>
        )}
      </DitherContainer>
    ))
    const root = container.firstElementChild as HTMLElement
    expect(root.tagName).toBe("SECTION")
    expect(root.className).toBe("dither-container")
    expect(root.style.getPropertyValue("--cq-w")).toBe("0")
    await new Promise((r) => setTimeout(r, 5))
    expect(root.getAttribute("data-cq")).toBe("md")
    expect(root.style.getPropertyValue("--cq-w")).toBe("400")
    expect(root.style.getPropertyValue("--cq-i")).toBe("2")
    expect(root.style.getPropertyValue("container-name")).toBe("card")
    expect(screen.getByText("md 400x100")).toBeTruthy()
  })
})

describe("FocusScope", () => {
  it("takes focus in, keeps Tab inside, and hands focus back as it leaves", async () => {
    const [open, setOpen] = createSignal(false)
    render(() => (
      <>
        <button type="button">Opener</button>
        {open() && (
          <FocusScope aria-label="Scope" role="group">
            <button type="button">One</button>
            <button type="button">Two</button>
          </FocusScope>
        )}
      </>
    ))
    const opener = screen.getByRole("button", { name: "Opener" })
    opener.focus()
    setOpen(true)
    await tick()
    const one = screen.getByRole("button", { name: "One" })
    const two = screen.getByRole("button", { name: "Two" })
    expect(screen.getByRole("group", { name: "Scope" }).tabIndex).toBe(-1)
    expect(document.activeElement).toBe(one)
    expect(fireEvent.keyDown(one, { key: "Tab", shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(two)
    expect(fireEvent.keyDown(two, { key: "Tab" })).toBe(false)
    expect(document.activeElement).toBe(one)
    // between its ends, Tab is the browser's own
    expect(fireEvent.keyDown(one, { key: "Tab" })).toBe(true)
    setOpen(false)
    expect(document.activeElement).toBe(opener)
  })

  it("leaves focus alone when told to", async () => {
    render(() => (
      <FocusScope autofocus={false} trapped={false}>
        <button type="button">One</button>
      </FocusScope>
    ))
    await tick()
    const one = screen.getByRole("button", { name: "One" })
    expect(document.activeElement).toBe(document.body)
    one.focus()
    expect(fireEvent.keyDown(one, { key: "Tab" })).toBe(true)
  })
})

describe("DitherDrawer", () => {
  function Harness(props: { modal?: boolean; dismissible?: boolean; side?: "right" | "left" | "bottom" }) {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <DitherDrawer
          open={open()}
          title="Settings"
          side={props.side}
          modal={props.modal}
          dismissible={props.dismissible}
          onClose={() => setOpen(false)}
        >
          <button type="button">Inside</button>
        </DitherDrawer>
      </>
    )
  }
  /** The open or close transition runs out. */
  const settle = async () => {
    await tick()
    await w.frame(0)
    // the panel's own 200ms settle, read from its styles
    await new Promise((r) => setTimeout(r, 240))
  }

  it("opens as a modal dialog, closes on Escape and returns focus to its opener", async () => {
    render(() => <Harness />)
    const opener = screen.getByRole("button", { name: "Open" })
    expect(screen.queryByRole("dialog")).toBeNull()
    opener.focus()
    fireEvent.click(opener)
    await settle()
    const dialog = screen.getByRole("dialog", { name: "Settings" })
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.className).toContain("right-0")
    expect(screen.getByRole("button", { name: "Inside" })).toBeTruthy()
    // focus goes in, the close key first
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }))
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("keeps Tab inside while modal", async () => {
    render(() => <Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    await settle()
    const inside = screen.getByRole("button", { name: "Inside" })
    inside.focus()
    expect(fireEvent.keyDown(inside, { key: "Tab" })).toBe(false)
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }))
  })

  it("closes from its close key and from its backdrop, unless it is not dismissible", async () => {
    const { unmount } = render(() => <Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    await settle()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    await settle()
    fireEvent.click(document.querySelector(".bg-black\\/60")!)
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    unmount()

    render(() => <Harness dismissible={false} />)
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    await settle()
    fireEvent.click(document.querySelector(".bg-black\\/60")!)
    await settle()
    expect(screen.getByRole("dialog")).toBeTruthy()
  })

  it("draws no backdrop and holds no focus when not modal", async () => {
    render(() => <Harness modal={false} side="bottom" />)
    const opener = screen.getByRole("button", { name: "Open" })
    opener.focus()
    fireEvent.click(opener)
    await settle()
    const dialog = screen.getByRole("dialog", { name: "Settings" })
    expect(dialog.hasAttribute("aria-modal")).toBe(false)
    expect(dialog.className).toContain("bottom-0")
    expect(document.querySelector(".bg-black\\/60")).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it("swipes away past half its width", async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(() => (
      <DitherDrawer open title="Swipe" onClose={onClose}>
        body
      </DitherDrawer>
    ))
    const dialog = screen.getByRole("dialog", { name: "Swipe" })
    dialog.setPointerCapture = vi.fn()
    vi.spyOn(dialog, "offsetWidth", "get").mockReturnValue(320)
    const at = (type: string, clientX: number) =>
      dialog.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { clientX, clientY: 0, pointerId: 1 }))
    at("pointerdown", 0)
    at("pointermove", 200)
    expect(dialog.style.transform).toBe("translateX(200px)")
    at("pointerup", 200)
    expect(dialog.style.transform).toBe("translateX(336px)")
    vi.runAllTimers()
    expect(onClose).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

describe("DitherDrawerIndent", () => {
  it("steps back while a drawer inside it is open", async () => {
    const [open, setOpen] = createSignal(false)
    render(() => (
      <DitherDrawerIndent class="app">
        <p>Page</p>
        <DitherDrawer open={open()} title="Menu" />
      </DitherDrawerIndent>
    ))
    const root = screen.getByText("Page").parentElement!
    expect(root.className).not.toContain("scale-[0.98]")
    expect(root.className).toContain("app")
    setOpen(true)
    await tick()
    expect(root.className).toContain("scale-[0.98]")
    setOpen(false)
    await tick()
    expect(root.className).not.toContain("scale-[0.98]")
  })
})

describe("DitherOtpField", () => {
  it("labels each digit, moves on as one is typed, and reports the code", () => {
    const onUpdate = vi.fn()
    const onComplete = vi.fn()
    render(() => <DitherOtpField length={3} modelValue="1" onUpdateModelValue={onUpdate} onComplete={onComplete} />)
    expect(screen.getByRole("group", { name: "Verification code" })).toBeTruthy()
    const digit = (n: number) => screen.getByRole("textbox", { name: `Digit ${n}` }) as HTMLInputElement
    expect(digit(1).value).toBe("1")
    fireEvent.input(digit(2), { target: { value: "x7" } })
    expect(digit(2).value).toBe("7")
    expect(onUpdate).toHaveBeenLastCalledWith("17")
    expect(document.activeElement).toBe(digit(3))
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.input(digit(3), { target: { value: "9" } })
    expect(onComplete).toHaveBeenCalledWith("179")
  })

  it("steps back on Backspace in an empty digit, and fills from a paste", () => {
    const onUpdate = vi.fn()
    const onComplete = vi.fn()
    render(() => <DitherOtpField length={3} modelValue="12" onUpdateModelValue={onUpdate} onComplete={onComplete} />)
    const digit = (n: number) => screen.getByRole("textbox", { name: `Digit ${n}` }) as HTMLInputElement
    fireEvent.keyDown(digit(3), { key: "Backspace" })
    expect(onUpdate).toHaveBeenLastCalledWith("1")
    expect(document.activeElement).toBe(digit(2))
    fireEvent.paste(digit(1), { clipboardData: { getData: () => "4 5-6" } })
    expect([digit(1).value, digit(2).value, digit(3).value]).toEqual(["4", "5", "6"])
    expect(onComplete).toHaveBeenCalledWith("456")
  })

  it("follows a value set from outside", () => {
    const [value, setValue] = createSignal("")
    render(() => <DitherOtpField length={2} modelValue={value()} />)
    setValue("42")
    expect((screen.getByRole("textbox", { name: "Digit 2" }) as HTMLInputElement).value).toBe("2")
  })
})

describe("DitherSpinner", () => {
  it("is a status named Loading that paints its canvas", async () => {
    const { container } = render(() => <DitherSpinner size={32} />)
    const status = screen.getByRole("status", { name: "Loading" })
    const canvas = container.querySelector("canvas")!
    expect(status.contains(canvas)).toBe(true)
    await tick()
    expect(w.uploads).toContain(canvas)
    expect(canvas.width).toBe(16)
    expect(canvas.style.width).toBe("32px")
  })

  it("spins while in view, and stops once it has left the page", async () => {
    const { unmount } = render(() => <DitherSpinner />)
    await tick()
    w.show()
    await w.frame(100)
    const painted = w.uploads.length
    expect(painted).toBeGreaterThan(1)
    unmount()
    await w.frame(200)
    await w.frame(300)
    expect(w.uploads.length).toBe(painted)
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <DitherSpinner precompiled="data:image/png;base64,AAAA" />)
    await tick()
    await w.frame(100)
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })
})

describe("FallingText", () => {
  it("reads as its text, a letter a span, and falls again on a new token", () => {
    const [token, setToken] = createSignal(0)
    render(() => <FallingText text="a b" stagger={10} duration={300} replayToken={token()} />)
    const line = screen.getByLabelText("a b")
    const letters = [...line.children] as HTMLElement[]
    expect(letters.map((l) => l.textContent)).toEqual(["a", " ", "b"])
    expect(letters.every((l) => l.getAttribute("aria-hidden") === "true")).toBe(true)
    expect(letters[2].style.animationDelay).toBe("20ms")
    expect(letters[2].style.animationDuration).toBe("300ms")
    setToken(1)
    expect(screen.getByLabelText("a b")).not.toBe(line)
  })
})

describe("Shuffle", () => {
  it("reads as its text, each letter from its own offset, and runs again on a new token", () => {
    const [token, setToken] = createSignal(0)
    render(() => <Shuffle text="hi" replayToken={token()} />)
    const line = screen.getByLabelText("hi")
    const letters = [...line.children] as HTMLElement[]
    expect(letters.map((l) => l.textContent)).toEqual(["h", "i"])
    expect(letters[1].style.getPropertyValue("--dx")).toMatch(/em$/)
    expect(letters[1].style.getPropertyValue("--rot")).toMatch(/deg$/)
    expect(letters[1].style.animationDelay).toBe("55ms")
    setToken(1)
    const again = screen.getByLabelText("hi")
    expect(again).not.toBe(line)
    expect((again.children[1] as HTMLElement).style.getPropertyValue("--dx")).toBe(
      letters[1].style.getPropertyValue("--dx"),
    )
  })
})

describe("Island", () => {
  it("shows its label and its detail, and reports a toggle", () => {
    const onUpdate = vi.fn()
    render(() => (
      <Island label="Build" onUpdateModelValue={onUpdate}>
        Details
      </Island>
    ))
    const button = screen.getByRole("button", { name: "Build" })
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(screen.getByText("Details").parentElement!.inert).toBe(true)
    fireEvent.click(button)
    expect(onUpdate).toHaveBeenLastCalledWith(true)
  })

  it("collapses on Escape, its compact row drawn in place of the label", () => {
    const onUpdate = vi.fn()
    render(() => (
      <Island modelValue compact={<b>Live now</b>} onUpdateModelValue={onUpdate}>
        Details
      </Island>
    ))
    const button = screen.getByRole("button", { name: "Live now" })
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByText("Details").parentElement!.inert).toBe(false)
    fireEvent.keyDown(button, { key: "Escape" })
    expect(onUpdate).toHaveBeenLastCalledWith(false)
  })
})

describe("PixelTrail", () => {
  it("lights the cell under the pointer on its canvas, over its content", async () => {
    const fillRect = vi.fn()
    HTMLCanvasElement.prototype.getContext = function () {
      return { clearRect() {}, fillRect }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container } = render(() => (
      <PixelTrail gap={10}>
        <span>Over here</span>
      </PixelTrail>
    ))
    expect(screen.getByText("Over here")).toBeTruthy()
    expect(container.querySelector("canvas")!.getAttribute("aria-hidden")).toBe("true")
    // lit at a moment after any frame the world stamps: still fresh when drawn
    vi.spyOn(performance, "now").mockReturnValue(Number.MAX_SAFE_INTEGER)
    fireEvent.pointerMove(container.firstElementChild!, { clientX: 25, clientY: 5 })
    await w.frame(0)
    expect(fillRect).toHaveBeenCalledOnce()
    expect(fillRect.mock.calls[0]).toEqual([21.5, 1.5, 7, 7])
  })

  it("lets its cells fade out and stops", async () => {
    const fillRect = vi.fn()
    HTMLCanvasElement.prototype.getContext = function () {
      return { clearRect() {}, fillRect }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container } = render(() => <PixelTrail />)
    // lit long before the frames the world stamps: past its life when drawn
    vi.spyOn(performance, "now").mockReturnValue(0)
    fireEvent.pointerMove(container.firstElementChild!, { clientX: 5, clientY: 5 })
    await w.frame(1000)
    await w.frame(2000)
    expect(fillRect).not.toHaveBeenCalled()
  })
})

describe("VariableProximity", () => {
  it("reads as its text and weights each letter by the pointer's distance", async () => {
    render(() => <VariableProximity text="a b" radius={100} />)
    const line = screen.getByLabelText("a b")
    const letters = [...line.children] as HTMLElement[]
    expect(letters.map((l) => l.textContent)).toEqual(["a", "b"])
    expect(line.textContent).toBe("a b")
    expect(letters[0].style.opacity).toBe("0.55")
    w.show()
    window.dispatchEvent(Object.assign(new Event("pointermove"), { clientX: 0, clientY: 0 }))
    await w.frame(0)
    expect(letters[0].style.fontWeight).toBe("900")
    expect(letters[0].style.opacity).toBe("1")
  })
})

describe("WheelPicker", () => {
  const options = ["one", "two", { value: "3", label: "three" }]
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
  })
  afterEach(() => {
    delete (Element.prototype as { scrollTo?: unknown }).scrollTo
  })

  it("is a spinbutton that reads its option out and starts on its value", () => {
    render(() => <WheelPicker options={options} modelValue="two" label="Count" />)
    const wheel = screen.getByRole("spinbutton", { name: "Count" })
    expect(wheel.scrollTop).toBe(28)
    expect(wheel.getAttribute("aria-valuenow")).toBe("1")
    expect(wheel.getAttribute("aria-valuetext")).toBe("two")
    expect(wheel.getAttribute("aria-valuemax")).toBe("2")
    expect(wheel.style.height).toBe("140px")
    expect([...wheel.children].map((c) => c.textContent)).toEqual(["one", "two", "three"])
  })

  it("steps with the arrow keys, Home and End", () => {
    const onUpdate = vi.fn()
    render(() => <WheelPicker options={options} modelValue="two" onUpdateModelValue={onUpdate} />)
    const wheel = screen.getByRole("spinbutton", { name: "Wheel picker" })
    expect(fireEvent.keyDown(wheel, { key: "ArrowDown" })).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith("3")
    expect(wheel.scrollTo).toHaveBeenLastCalledWith({ top: 56, behavior: "smooth" })
    fireEvent.keyDown(wheel, { key: "Home" })
    expect(onUpdate).toHaveBeenLastCalledWith("one")
    fireEvent.keyDown(wheel, { key: "End" })
    expect(onUpdate).toHaveBeenLastCalledWith("3")
    fireEvent.keyDown(wheel, { key: "PageUp" })
    expect(onUpdate).toHaveBeenLastCalledWith("one")
  })

  it("reports the option it comes to rest on after a scroll", () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(() => <WheelPicker options={options} modelValue="one" onUpdateModelValue={onUpdate} />)
    const wheel = screen.getByRole("spinbutton", { name: "Wheel picker" })
    wheel.scrollTop = 56
    fireEvent.scroll(wheel)
    expect(wheel.getAttribute("aria-valuetext")).toBe("three")
    vi.advanceTimersByTime(130)
    expect(onUpdate).toHaveBeenCalledWith("3")
    vi.useRealTimers()
  })
})
