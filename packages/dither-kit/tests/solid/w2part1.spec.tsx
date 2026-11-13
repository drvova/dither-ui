// The kit's controls and text, from CardStack on: each renders what it
// names, reports a change through its callback, answers its keys, and
// paints its canvas where it has one.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import CardStack from "../../src/solid/CardStack"
import CheckboxCard from "../../src/solid/CheckboxCard"
import CircularText from "../../src/solid/CircularText"
import ClickSpark from "../../src/solid/ClickSpark"
import ColorSwatch from "../../src/solid/ColorSwatch"
import CurrencyText from "../../src/solid/CurrencyText"
import CurvedLoop from "../../src/solid/CurvedLoop"
import DitherCheckbox from "../../src/solid/DitherCheckbox"
import DitherCheckboxGroup from "../../src/solid/DitherCheckboxGroup"
import DitherCombobox from "../../src/solid/DitherCombobox"
import DitherFieldset from "../../src/solid/DitherFieldset"
import DitherNumberField from "../../src/solid/DitherNumberField"
import DitherPreviewCard from "../../src/solid/DitherPreviewCard"
import DitherRadioGroup from "../../src/solid/DitherRadioGroup"
import DitherSelect, { type Option } from "../../src/solid/DitherSelect"
import DitherToggle from "../../src/solid/DitherToggle"
import DitherToggleGroup from "../../src/solid/DitherToggleGroup"
import Dock from "../../src/solid/Dock"
import ElectricBorder from "../../src/solid/ElectricBorder"
import Emoji from "../../src/solid/Emoji"
import Image from "../../src/solid/Image"
import Knob from "../../src/solid/Knob"
import MagicRings from "../../src/solid/MagicRings"
import { FieldContextKey } from "../../src/solid/runtime/field"
import ScrollVelocity from "../../src/solid/ScrollVelocity"
import TransferList from "../../src/solid/TransferList"
import TrueFocus from "../../src/solid/TrueFocus"
import { world } from "../support/world"

const OPTIONS: Option[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta", disabled: true },
  { value: "c", label: "Gamma" },
]

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

/** Timers the spec steps, leaving the world's frames alone. */
const fakeTimers = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] })

describe("DitherCardStack", () => {
  it("names its top card and hides the ones beneath", () => {
    const { container } = render(() => <CardStack items={["one", "two", "three"]} />)
    const top = screen.getByRole("group", { name: "Card 1 of 3" })
    expect(top.textContent).toBe("one")
    expect(top.getAttribute("aria-roledescription")).toBe("swipeable card")
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(2)
  })

  it("draws each card through its children, told which is on top", () => {
    render(() => (
      <CardStack items={["one", "two"]}>
        {(card) => (
          <p>
            {card.item}:{card.index}:{String(card.top)}
          </p>
        )}
      </CardStack>
    ))
    expect(screen.getByText("one:0:true")).toBeTruthy()
    expect(screen.getByText("two:1:false")).toBeTruthy()
  })

  it("sends a far drag flying and reports the card that rises", () => {
    fakeTimers()
    HTMLElement.prototype.setPointerCapture = () => {}
    const onAdvance = vi.fn()
    const { container } = render(() => <CardStack items={["one", "two", "three"]} onAdvance={onAdvance} />)
    Object.defineProperty(container.firstElementChild, "offsetWidth", { value: 300 })
    const top = screen.getByRole("group", { name: "Card 1 of 3" })
    fireEvent.pointerDown(top, { pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(top, { pointerId: 1, clientX: 100 })
    expect(top.style.transform).toContain("translateX(100px)")
    fireEvent.pointerMove(top, { pointerId: 1, clientX: 220 })
    fireEvent.pointerUp(top, { pointerId: 1, clientX: 220 })
    vi.advanceTimersByTime(200)
    expect(onAdvance).toHaveBeenCalledWith(1)
    expect(screen.getByRole("group", { name: "Card 2 of 3" }).textContent).toBe("two")
  })
})

describe("DitherCheckbox", () => {
  it("renders its label, paints its box, and reports the flip", async () => {
    const onUpdate = vi.fn()
    const { container } = render(() => (
      <DitherCheckbox modelValue={false} onUpdateModelValue={onUpdate}>
        Accept
      </DitherCheckbox>
    ))
    const box = screen.getByRole("checkbox", { name: "Accept" })
    expect(box.getAttribute("aria-checked")).toBe("false")
    await w.frame(100)
    expect(w.uploads).toContain(container.querySelector("canvas"))
    fireEvent.click(box)
    expect(onUpdate).toHaveBeenCalledWith(true)
  })

  it("repaints when its value changes, and keeps a click handler handed to it", async () => {
    const [on, setOn] = createSignal(false)
    const onClick = vi.fn()
    render(() => (
      <DitherCheckbox modelValue={on()} onUpdateModelValue={setOn} onClick={onClick}>
        Accept
      </DitherCheckbox>
    ))
    await w.frame(100)
    fireEvent.click(screen.getByRole("checkbox", { name: "Accept" }))
    expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true")
    expect(w.uploads.length).toBe(2)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe("DitherCheckboxCard", () => {
  it("renders its title, description and content, and reports the flip", () => {
    const onUpdate = vi.fn()
    render(() => (
      <CheckboxCard label="Email" description="Once a week" onUpdateModelValue={onUpdate}>
        More
      </CheckboxCard>
    ))
    expect(screen.getByText("Email")).toBeTruthy()
    expect(screen.getByText("Once a week")).toBeTruthy()
    expect(screen.getByText("More")).toBeTruthy()
    fireEvent.click(screen.getByRole("checkbox"))
    expect(onUpdate).toHaveBeenCalledWith(true)
  })
})

describe("DitherCircularText", () => {
  it("names itself by its text and sets it on its own path", () => {
    const { container } = render(() => <CircularText text="round" size={80} duration={4} />)
    const root = screen.getByLabelText("round")
    expect(root.style.width).toBe("80px")
    const path = container.querySelector("path")!
    expect(container.querySelector("textPath")!.getAttribute("href")).toBe(`#${path.id}`)
    expect(container.querySelector("textPath")!.textContent).toBe("round")
    expect(container.querySelector("svg")!.style.animationDuration).toBe("4s")
  })
})

describe("DitherClickSpark", () => {
  it("renders its content and draws a burst where it is clicked", async () => {
    const stroke = vi.fn()
    HTMLCanvasElement.prototype.getContext = function () {
      return { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    render(() => (
      <ClickSpark count={6}>
        <button type="button">Spark</button>
      </ClickSpark>
    ))
    // The world stamps its frames far ahead: the click lands later still, so
    // the burst is young when the frame runs.
    vi.spyOn(performance, "now").mockReturnValue(1e15)
    fireEvent.click(screen.getByRole("button", { name: "Spark" }))
    await w.frame(100)
    expect(stroke).toHaveBeenCalledTimes(6)
  })
})

describe("DitherColorSwatch", () => {
  it("is a button named by its colour that reports a pick", () => {
    const onSelect = vi.fn()
    render(() => <ColorSwatch color="#ff9632" label="Ember" selected onSelect={onSelect} />)
    const chip = screen.getByRole("button", { name: "Select Ember" })
    expect(chip.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(chip)
    expect(onSelect).toHaveBeenCalledWith("#ff9632")
  })
})

describe("DitherCurrencyText", () => {
  it("formats money through Intl", () => {
    render(() => <CurrencyText value={1234.5} />)
    expect(screen.getByText("$1,234.50")).toBeTruthy()
  })
})

describe("DitherCurvedLoop", () => {
  it("names itself by its text and scrolls along its path once in view", async () => {
    Object.assign(SVGElement.prototype, { getComputedTextLength: () => 100 })
    const { container } = render(() => <CurvedLoop text="loop" speed={100} />)
    expect(screen.getByLabelText("loop")).toBeTruthy()
    const path = container.querySelector("textPath")!
    expect(path.textContent).toBe("loop".repeat(10))
    w.show()
    await w.frame(100)
    await w.frame(120)
    expect(Number(path.getAttribute("startOffset"))).toBeLessThan(0)
  })
})

describe("DitherSelect", () => {
  it("shows its placeholder, opens on a click, and reports the option picked", async () => {
    const onUpdate = vi.fn()
    render(() => <DitherSelect options={OPTIONS} modelValue="" placeholder="Pick one" onUpdateModelValue={onUpdate} />)
    const trigger = screen.getByRole("button", { name: /Pick one/ })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("listbox").id).toBe(trigger.getAttribute("aria-controls"))
    await w.frame(50)
    fireEvent.click(screen.getByRole("option", { name: "Gamma" }))
    expect(onUpdate).toHaveBeenCalledWith("c")
    await w.frame(100)
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it("walks its options by keyboard past a disabled one, and closes on Escape", async () => {
    const onUpdate = vi.fn()
    render(() => <DitherSelect options={OPTIONS} modelValue="a" onUpdateModelValue={onUpdate} aria-label="Letter" />)
    const trigger = screen.getByRole("button", { name: "Letter" })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    const active = () => document.getElementById(trigger.getAttribute("aria-activedescendant")!)
    expect(active()?.textContent).toBe("Alpha")
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    expect(active()?.textContent).toBe("Gamma")
    await w.frame(50)
    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await w.frame(100)
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(document.activeElement).toBe(trigger)
    fireEvent.keyDown(trigger, { key: "ArrowUp" })
    fireEvent.keyDown(trigger, { key: "Enter" })
    expect(onUpdate).toHaveBeenCalledWith("c")
  })

  it("takes its id, help text and error from the field around it", () => {
    render(() => (
      <FieldContextKey.Provider value={{ controlId: () => "f1", describedBy: () => "f1-help", invalid: () => true }}>
        <DitherSelect options={OPTIONS} modelValue="a" />
      </FieldContextKey.Provider>
    ))
    const trigger = screen.getByRole("button")
    expect(trigger.id).toBe("f1")
    expect(trigger.getAttribute("aria-describedby")).toBe("f1-help")
    expect(trigger.getAttribute("aria-invalid")).toBe("true")
  })
})

describe("DitherCheckboxGroup", () => {
  it("renders an option a checkbox under its label, and reports the set", () => {
    const onUpdate = vi.fn()
    render(() => (
      <DitherCheckboxGroup options={OPTIONS} modelValue={["a"]} label="Letters" onUpdateModelValue={onUpdate} />
    ))
    expect(screen.getByRole("group", { name: "Letters" })).toBeTruthy()
    expect(screen.getByRole("checkbox", { name: "Alpha" }).getAttribute("aria-checked")).toBe("true")
    expect((screen.getByRole("checkbox", { name: "Beta" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: "Gamma" }))
    expect(onUpdate).toHaveBeenCalledWith(["a", "c"])
    fireEvent.click(screen.getByRole("checkbox", { name: "Alpha" }))
    expect(onUpdate).toHaveBeenCalledWith([])
  })
})

describe("DitherCombobox", () => {
  it("shows the selected label, filters as you type, and reports the pick", () => {
    const onUpdate = vi.fn()
    render(() => <DitherCombobox options={OPTIONS} modelValue="a" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole("combobox") as HTMLInputElement
    expect(input.value).toBe("Alpha")
    fireEvent.input(input, { target: { value: "gam" } })
    expect(input.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Gamma"])
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onUpdate).toHaveBeenCalledWith("c")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("says when nothing matches, and Escape snaps the text back", () => {
    render(() => <DitherCombobox options={OPTIONS} modelValue="a" />)
    const input = screen.getByRole("combobox") as HTMLInputElement
    fireEvent.input(input, { target: { value: "zzz" } })
    expect(screen.getByText("no matches")).toBeTruthy()
    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(input.value).toBe("Alpha")
  })

  it("follows its value from outside", () => {
    const [value, setValue] = createSignal("a")
    render(() => <DitherCombobox options={OPTIONS} modelValue={value()} />)
    setValue("c")
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("Gamma")
  })
})

describe("DitherFieldset", () => {
  it("groups its content under its legend", () => {
    render(() => (
      <DitherFieldset legend="Profile">
        <p>inside</p>
      </DitherFieldset>
    ))
    expect(screen.getByRole("group", { name: "Profile" }).textContent).toContain("inside")
  })
})

describe("DitherNumberField", () => {
  it("is a named spinbutton whose keys step and whose buttons stop at the bounds", () => {
    const onUpdate = vi.fn()
    render(() => (
      <DitherNumberField modelValue={8} min={0} max={10} step={2} label="Count" onUpdateModelValue={onUpdate} />
    ))
    const input = screen.getByRole("spinbutton", { name: "Count" }) as HTMLInputElement
    expect(input.value).toBe("8")
    expect(input.getAttribute("aria-valuenow")).toBe("8")
    fireEvent.click(screen.getByRole("button", { name: "Increase" }))
    expect(onUpdate).toHaveBeenLastCalledWith(10)
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(onUpdate).toHaveBeenLastCalledWith(6)
  })

  it("snaps typed text to its step and bounds on blur, and drops text that is no number", () => {
    const [value, setValue] = createSignal(10)
    render(() => <DitherNumberField modelValue={value()} min={0} max={10} step={2} onUpdateModelValue={setValue} />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect((screen.getByRole("button", { name: "Increase" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.input(input, { target: { value: "4.9" } })
    fireEvent.blur(input)
    expect(value()).toBe(4)
    expect(input.value).toBe("4")
    fireEvent.input(input, { target: { value: "abc" } })
    fireEvent.blur(input)
    expect(input.value).toBe("4")
  })
})

describe("DitherPreviewCard", () => {
  it("shows its card after the delay once its trigger is focused, and closes on Escape", async () => {
    fakeTimers()
    render(() => (
      <DitherPreviewCard delay={300} trigger={<a href="#x">Profile</a>}>
        <p>About them</p>
      </DitherPreviewCard>
    ))
    const link = screen.getByRole("link", { name: "Profile" })
    fireEvent.focusIn(link)
    vi.advanceTimersByTime(299)
    expect(screen.queryByText("About them")).toBeNull()
    vi.advanceTimersByTime(1)
    expect(screen.getByText("About them")).toBeTruthy()
    await w.frame(50)
    fireEvent.keyDown(link, { key: "Escape" })
    await w.frame(100)
    expect(screen.queryByText("About them")).toBeNull()
  })

  it("stays open while the pointer moves from the trigger into the card", async () => {
    fakeTimers()
    render(() => (
      <DitherPreviewCard delay={0} trigger={<a href="#x">Profile</a>}>
        <p>About them</p>
      </DitherPreviewCard>
    ))
    const hover = screen.getByRole("link", { name: "Profile" }).parentElement!
    fireEvent.pointerEnter(hover)
    vi.advanceTimersByTime(0)
    fireEvent.pointerLeave(hover)
    fireEvent.pointerEnter(screen.getByText("About them").parentElement!)
    vi.advanceTimersByTime(500)
    await w.frame(100)
    expect(screen.getByText("About them")).toBeTruthy()
  })
})

describe("DitherRadioGroup", () => {
  it("renders its options as radios, one in the tab order, and paints each", async () => {
    const { container } = render(() => <DitherRadioGroup options={OPTIONS} modelValue="c" label="Letter" />)
    expect(screen.getByRole("radiogroup", { name: "Letter" })).toBeTruthy()
    const radios = screen.getAllByRole("radio")
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "false", "true"])
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, -1, 0])
    await w.frame(100)
    expect(w.uploads).toEqual([...container.querySelectorAll("canvas")])
  })

  it("moves by arrow past a disabled option, taking focus with it", async () => {
    const [value, setValue] = createSignal("a")
    render(() => <DitherRadioGroup options={OPTIONS} modelValue={value()} onUpdateModelValue={setValue} />)
    fireEvent.keyDown(screen.getByRole("radio", { name: "Alpha" }), { key: "ArrowDown" })
    expect(value()).toBe("c")
    await Promise.resolve()
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Gamma" }))
    fireEvent.click(screen.getByRole("radio", { name: "Alpha" }))
    expect(value()).toBe("a")
  })
})

describe("DitherToggle", () => {
  it("renders its label, reports the flip, and paints its fill once pressed", async () => {
    const [on, setOn] = createSignal(false)
    const { container } = render(() => (
      <DitherToggle modelValue={on()} onUpdateModelValue={setOn}>
        Bold
      </DitherToggle>
    ))
    const button = screen.getByRole("button", { name: "Bold" })
    const canvas = container.querySelector("canvas")!
    expect(button.getAttribute("aria-pressed")).toBe("false")
    expect(canvas.style.display).toBe("none")
    w.size()
    await w.frame(100)
    expect(w.uploads).toEqual([])
    fireEvent.click(button)
    expect(button.getAttribute("aria-pressed")).toBe("true")
    expect(canvas.style.display).toBe("")
    await w.frame(200)
    expect(w.uploads).toEqual([canvas])
  })
})

describe("DitherToggleGroup", () => {
  it("is a radio group when single: arrows move the choice, the chosen one is painted", async () => {
    const [value, setValue] = createSignal<string | string[]>("a")
    const { container } = render(() => (
      <DitherToggleGroup options={OPTIONS} modelValue={value()} onUpdateModelValue={setValue} />
    ))
    expect(screen.getByRole("radiogroup")).toBeTruthy()
    await w.frame(100)
    expect(w.uploads).toEqual([container.querySelector("canvas")])
    fireEvent.keyDown(screen.getByRole("radio", { name: "Alpha" }), { key: "ArrowRight" })
    expect(value()).toBe("c")
    await Promise.resolve()
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Gamma" }))
    expect(screen.getByRole("radio", { name: "Gamma" }).getAttribute("aria-checked")).toBe("true")
  })

  it("is a group of pressed buttons when multiple, and reports the set", () => {
    const onUpdate = vi.fn()
    render(() => (
      <DitherToggleGroup type="multiple" options={OPTIONS} modelValue={["a"]} onUpdateModelValue={onUpdate} />
    ))
    expect(screen.getByRole("group")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Alpha" }).getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Gamma" }))
    expect(onUpdate).toHaveBeenLastCalledWith(["a", "c"])
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }))
    expect(onUpdate).toHaveBeenLastCalledWith([])
  })
})

describe("DitherDock", () => {
  const items = [
    { value: "home", label: "Home" },
    { value: "mail", label: "Mail" },
  ]

  it("renders a named button an item and reports the one picked", () => {
    const onSelect = vi.fn()
    render(() => <Dock items={items} onSelect={onSelect} />)
    expect(screen.getByRole("group", { name: "Dock" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Mail" }))
    expect(onSelect).toHaveBeenCalledWith("mail")
  })

  it("swells under the pointer and settles when it leaves", () => {
    render(() => <Dock items={items} magnify={2} />)
    const bar = screen.getByRole("group", { name: "Dock" })
    const home = screen.getByRole("button", { name: "Home" })
    expect(home.style.transform).toBe("scale(1)")
    fireEvent.pointerMove(bar, { clientX: 0 })
    expect(home.style.transform).toBe("scale(2)")
    fireEvent.pointerLeave(bar)
    expect(home.style.transform).toBe("scale(1)")
  })
})

describe("DitherElectricBorder", () => {
  it("renders its content inside a border run through its own filter", () => {
    const { container } = render(() => (
      <ElectricBorder thickness={3} color="red">
        <p>live</p>
      </ElectricBorder>
    ))
    expect(screen.getByText("live")).toBeTruthy()
    const filter = container.querySelector("filter")!
    const border = container.querySelector<HTMLElement>(".dk-electric-border > div[aria-hidden]")!
    expect(border.style.filter).toContain(filter.id)
    expect(border.style.border).toBe("3px solid red")
    expect(container.querySelector("feDisplacementMap")!.getAttribute("scale")).toBe("9")
  })
})

describe("DitherEmoji", () => {
  it("is an image named by its label", () => {
    render(() => <Emoji char="🔥" label="Hot" />)
    expect(screen.getByRole("img", { name: "Hot" }).textContent).toBe("🔥")
  })
})

describe("DitherImg", () => {
  it("is a lazy, async image that passes the rest to the img", () => {
    render(() => <Image src="/a.png" alt="A print" width={40} class="rounded" />)
    const img = screen.getByRole("img", { name: "A print" })
    expect(img.getAttribute("src")).toBe("/a.png")
    expect(img.getAttribute("loading")).toBe("lazy")
    expect(img.getAttribute("decoding")).toBe("async")
    expect(img.getAttribute("width")).toBe("40")
    expect(img.className).toBe("rounded")
  })
})

describe("DitherKnob", () => {
  it("is a named slider that shows its value and steps by keyboard", () => {
    const onUpdate = vi.fn()
    render(() => <Knob label="Gain" modelValue={50} onUpdateModelValue={onUpdate} />)
    const knob = screen.getByRole("slider", { name: "Gain" })
    expect(knob.getAttribute("aria-valuenow")).toBe("50")
    expect(screen.getByText("50")).toBeTruthy()
    fireEvent.keyDown(knob, { key: "ArrowUp" })
    expect(onUpdate).toHaveBeenLastCalledWith(51)
    fireEvent.keyDown(knob, { key: "PageDown" })
    expect(onUpdate).toHaveBeenLastCalledWith(40)
    fireEvent.keyDown(knob, { key: "End" })
    expect(onUpdate).toHaveBeenLastCalledWith(100)
  })

  it("follows a vertical drag until the pointer lifts, and holds while disabled", () => {
    const onUpdate = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    render(() => <Knob modelValue={50} disabled={disabled()} onUpdateModelValue={onUpdate} />)
    const knob = screen.getByRole("slider", { name: "Knob" })
    fireEvent.pointerDown(knob, { button: 0, clientY: 100 })
    fireEvent.pointerMove(window, { clientY: 84 })
    expect(onUpdate).toHaveBeenLastCalledWith(60)
    fireEvent.pointerUp(window)
    fireEvent.pointerMove(window, { clientY: 20 })
    expect(onUpdate).toHaveBeenCalledTimes(1)
    setDisabled(true)
    expect(knob.getAttribute("aria-disabled")).toBe("true")
    fireEvent.keyDown(knob, { key: "ArrowUp" })
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

describe("DitherMagicRings", () => {
  it("renders its content under its rings, each a beat behind the last", () => {
    const { container } = render(() => (
      <MagicRings count={3} duration={3}>
        <p>core</p>
      </MagicRings>
    ))
    expect(screen.getByText("core")).toBeTruthy()
    const rings = [...container.querySelectorAll<HTMLElement>(".dither-ring")]
    expect(rings.map((r) => r.style.animationDelay)).toEqual(["0s", "-1s", "-2s"])
  })
})

describe("DitherScrollVelocity", () => {
  it("names itself by its text and runs its track once in view", async () => {
    const { container } = render(() => <ScrollVelocity text="fast" />)
    const host = screen.getByLabelText("fast")
    const track = host.firstElementChild as HTMLElement
    expect(track.children.length).toBe(8)
    expect(container.textContent).toBe("fast".repeat(8))
    w.show()
    await w.frame(100)
    await w.frame(120)
    expect(track.style.transform).toMatch(/^translateX\(/)
  })
})

describe("DitherTransferList", () => {
  it("moves the checked items across and reports the new selection", () => {
    const [value, setValue] = createSignal(["b"])
    render(() => <TransferList source={["a", "b", "c"]} value={value()} onUpdateModelValue={setValue} />)
    expect(screen.getByText("Available")).toBeTruthy()
    expect(screen.getByText("Selected")).toBeTruthy()
    const add = screen.getByRole("button", { name: "Add →" }) as HTMLButtonElement
    expect(add.disabled).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: "c" }))
    expect(add.disabled).toBe(false)
    fireEvent.click(add)
    expect(value()).toEqual(["b", "c"])
    fireEvent.click(screen.getByRole("checkbox", { name: "b" }))
    fireEvent.click(screen.getByRole("button", { name: "← Remove" }))
    expect(value()).toEqual(["c"])
    fireEvent.click(screen.getByRole("button", { name: "Add all" }))
    expect(value()).toEqual(["c", "a", "b"])
    expect(screen.getByText("Nothing left")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Remove all" }))
    expect(value()).toEqual([])
    expect(screen.getByText("Empty")).toBeTruthy()
  })
})

describe("DitherTrueFocus", () => {
  it("names itself by its text and brings one word into focus at a time, on the kit clock", async () => {
    render(() => <TrueFocus text="one two" interval={500} blur={4} />)
    const words = [...screen.getByLabelText("one two").children] as HTMLElement[]
    expect(words.map((x) => x.textContent)).toEqual(["one", "two"])
    expect(words.map((x) => x.style.filter)).toEqual(["blur(0)", "blur(4px)"])
    w.show()
    await w.run(0, 450)
    expect(words.map((x) => x.style.filter)).toEqual(["blur(0)", "blur(4px)"])
    await w.run(500, 500)
    expect(words.map((x) => x.style.filter)).toEqual(["blur(4px)", "blur(0)"])
  })
})
