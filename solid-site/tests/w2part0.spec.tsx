// The Solid kit's inputs, text pieces and small utilities, held to what
// their Vue twins do: each renders its content under its role and name,
// reports a change through its callback, and keeps its keyboard path.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import BlobCursor from "../../dither-kit/solid/BlobCursor"
import Calendar from "../../dither-kit/solid/Calendar"
import ClickOutside from "../../dither-kit/solid/ClickOutside"
import Clipboard from "../../dither-kit/solid/Clipboard"
import CopyableText from "../../dither-kit/solid/CopyableText"
import Crosshair from "../../dither-kit/solid/Crosshair"
import CurrencyInput from "../../dither-kit/solid/CurrencyInput"
import DatePicker from "../../dither-kit/solid/DatePicker"
import DitherBracket from "../../dither-kit/solid/DitherBracket"
import DitherInput from "../../dither-kit/solid/DitherInput"
import DitherToaster from "../../dither-kit/solid/DitherToaster"
import EmailInput from "../../dither-kit/solid/EmailInput"
import ExpandingArrow from "../../dither-kit/solid/ExpandingArrow"
import ExternalLink from "../../dither-kit/solid/ExternalLink"
import FileInput from "../../dither-kit/solid/FileInput"
import FileSizeText from "../../dither-kit/solid/FileSizeText"
import FuzzyText from "../../dither-kit/solid/FuzzyText"
import Highlight from "../../dither-kit/solid/Highlight"
import HotkeyInput from "../../dither-kit/solid/HotkeyInput"
import HoverArea from "../../dither-kit/solid/HoverArea"
import Icon from "../../dither-kit/solid/Icon"
import IconPicker from "../../dither-kit/solid/IconPicker"
import InlineEdit from "../../dither-kit/solid/InlineEdit"
import KeyValueInput from "../../dither-kit/solid/KeyValueInput"
import LanguageSelect from "../../dither-kit/solid/LanguageSelect"
import Link from "../../dither-kit/solid/Link"
import Measure from "../../dither-kit/solid/Measure"
import MiddleEllipsis from "../../dither-kit/solid/MiddleEllipsis"
import MultiSelect from "../../dither-kit/solid/MultiSelect"
import PasswordInput from "../../dither-kit/solid/PasswordInput"
import PhoneInput from "../../dither-kit/solid/PhoneInput"
import ScrambleText from "../../dither-kit/solid/ScrambleText"
import ScrubInput from "../../dither-kit/solid/ScrubInput"
import SearchInput from "../../dither-kit/solid/SearchInput"
import TagInput from "../../dither-kit/solid/TagInput"
import Text from "../../dither-kit/solid/Text"
import { FieldContextKey } from "../../dither-kit/solid/runtime/field"
import { dismiss, toast, toasts } from "../../dither-kit/solid/runtime/toast"
import { world } from "./world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/** A pointer event at a point (jsdom has no `PointerEvent` to make one). */
const pointer = (type: string, x: number, y = 0) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })

describe("DitherInput", () => {
  it("shows its model and reports what is typed", () => {
    const onUpdate = vi.fn()
    render(() => <DitherInput modelValue="ab" aria-label="Name" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Name" })
    expect(input.value).toBe("ab")
    fireEvent.input(input, { target: { value: "abc" } })
    expect(onUpdate).toHaveBeenCalledWith("abc")
  })

  it("keeps the caller's own input listener beside the model's", () => {
    const onInput = vi.fn()
    const onUpdate = vi.fn()
    render(() => <DitherInput aria-label="Name" onInput={onInput} onUpdateModelValue={onUpdate} />)
    fireEvent.input(screen.getByRole("textbox"), { target: { value: "x" } })
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith("x")
  })

  it("takes its id, help text and error from the field around it", () => {
    render(() => (
      <FieldContextKey.Provider value={{ controlId: () => "f1", describedBy: () => "f1-help", invalid: () => true }}>
        <DitherInput aria-label="Name" />
      </FieldContextKey.Provider>
    ))
    const input = screen.getByRole("textbox")
    expect(input.id).toBe("f1")
    expect(input.getAttribute("aria-describedby")).toBe("f1-help")
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })

  it("lets its own id win over the field's", () => {
    render(() => (
      <FieldContextKey.Provider value={{ controlId: () => "f1", describedBy: () => undefined, invalid: () => false }}>
        <DitherInput id="mine" aria-label="Name" />
      </FieldContextKey.Provider>
    ))
    const input = screen.getByRole("textbox")
    expect(input.id).toBe("mine")
    expect(input.hasAttribute("aria-invalid")).toBe(false)
  })
})

describe("the input family", () => {
  it("EmailInput is an email field with the autofill contract", () => {
    const onUpdate = vi.fn()
    render(() => <EmailInput aria-label="Email" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Email" })
    expect(input.type).toBe("email")
    expect(input.getAttribute("inputmode")).toBe("email")
    expect(input.getAttribute("autocomplete")).toBe("email")
    expect(input.placeholder).toBe("you@example.com")
    fireEvent.input(input, { target: { value: "a@b.c" } })
    expect(onUpdate).toHaveBeenCalledWith("a@b.c")
  })

  it("PhoneInput reports the digits in the national shape", () => {
    const onUpdate = vi.fn()
    render(() => <PhoneInput aria-label="Phone" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Phone" })
    expect(input.type).toBe("tel")
    fireEvent.input(input, { target: { value: "41555526719999" } })
    expect(onUpdate).toHaveBeenCalledWith("(415) 555-2671")
  })

  it("CurrencyInput groups thousands while blurred, shows the raw model while focused, and reports clean decimals", () => {
    const onUpdate = vi.fn()
    render(() => <CurrencyInput aria-label="Amount" modelValue="1234.5" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Amount" })
    expect(input.value).toBe("1,234.5")
    expect(screen.getByText("$")).toBeTruthy()
    fireEvent.focus(input)
    expect(input.value).toBe("1234.5")
    fireEvent.input(input, { target: { value: "12a.3.456" } })
    expect(onUpdate).toHaveBeenCalledWith("12.34")
    fireEvent.blur(input)
    expect(input.value).toBe("1,234.5")
  })

  it("PasswordInput reveals and hides what was typed", () => {
    render(() => <PasswordInput aria-label="Password" modelValue="hunter2" />)
    const input = screen.getByLabelText<HTMLInputElement>("Password")
    expect(input.type).toBe("password")
    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(toggle)
    expect(input.type).toBe("text")
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true")
  })

  it("SearchInput clears by its button and by Escape, which goes no further", () => {
    const onUpdate = vi.fn()
    const onClear = vi.fn()
    const outer = vi.fn()
    render(() => (
      <div on:keydown={outer}>
        <SearchInput aria-label="Search" modelValue="dither" onUpdateModelValue={onUpdate} onClear={onClear} />
      </div>
    ))
    const input = screen.getByRole<HTMLInputElement>("searchbox", { name: "Search" })
    expect(input.placeholder).toBe("Search…")
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(onUpdate).toHaveBeenLastCalledWith("")
    expect(onClear).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onClear).toHaveBeenCalledTimes(2)
    expect(outer).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: "a" })
    expect(outer).toHaveBeenCalledTimes(1)
  })

  it("SearchInput offers no clear button over an empty field", () => {
    render(() => <SearchInput aria-label="Search" />)
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
  })

  it("HotkeyInput reports a combination, holds on a modifier, and clears on Escape", () => {
    const onUpdate = vi.fn()
    render(() => <HotkeyInput aria-label="Shortcut" onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Shortcut" })
    expect(input.readOnly).toBe(true)
    expect(input.placeholder).toBe("Press a shortcut…")
    fireEvent.keyDown(input, { key: "Shift", shiftKey: true })
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: "k", ctrlKey: true, shiftKey: true })
    expect(onUpdate).toHaveBeenLastCalledWith("Ctrl+Shift+K")
    fireEvent.keyDown(input, { key: " " })
    expect(onUpdate).toHaveBeenLastCalledWith("Space")
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onUpdate).toHaveBeenLastCalledWith("")
  })

  it("ScrubInput is a slider the keyboard steps, clamped to its range", () => {
    const onUpdate = vi.fn()
    render(() => <ScrubInput modelValue={5} max={10} step={0.5} onUpdateModelValue={onUpdate} />)
    const grip = screen.getByRole("slider", { name: "Scrub value" })
    expect(grip.getAttribute("aria-valuenow")).toBe("5")
    expect(grip.getAttribute("aria-valuemin")).toBe("0")
    expect(grip.getAttribute("aria-valuemax")).toBe("10")
    expect(grip.getAttribute("aria-valuetext")).toBe("5")
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("5")
    fireEvent.keyDown(grip, { key: "ArrowRight" })
    expect(onUpdate).toHaveBeenLastCalledWith(5.5)
    fireEvent.keyDown(grip, { key: "PageUp" })
    expect(onUpdate).toHaveBeenLastCalledWith(10)
    fireEvent.keyDown(grip, { key: "Home" })
    expect(onUpdate).toHaveBeenLastCalledWith(0)
  })

  it("ScrubInput follows a drag across the window until the pointer lifts", () => {
    const onUpdate = vi.fn()
    render(() => <ScrubInput modelValue={5} onUpdateModelValue={onUpdate} />)
    screen.getByRole("slider").dispatchEvent(pointer("pointerdown", 100))
    window.dispatchEvent(pointer("pointermove", 112))
    expect(onUpdate).toHaveBeenLastCalledWith(17)
    window.dispatchEvent(pointer("pointerup", 112))
    window.dispatchEvent(pointer("pointermove", 150))
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

describe("InlineEdit", () => {
  it("opens an input on its text, and saves on Enter only what changed", async () => {
    const onSave = vi.fn()
    const onUpdate = vi.fn()
    render(() => <InlineEdit modelValue="Title" onSave={onSave} onUpdateModelValue={onUpdate} />)
    fireEvent.click(screen.getByRole("button", { name: "Title" }))
    const input = screen.getByRole<HTMLInputElement>("textbox")
    await Promise.resolve()
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe("Title")
    fireEvent.input(input, { target: { value: "Heading" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith("Heading")
    expect(onUpdate).toHaveBeenCalledWith("Heading")
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("reverts on Escape and saves nothing", () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    render(() => <InlineEdit modelValue="Title" onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: "Title" }))
    const input = screen.getByRole("textbox")
    fireEvent.input(input, { target: { value: "Other" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Title" })).toBeTruthy()
  })

  it("commits on blur, and shows its placeholder when empty", () => {
    const onSave = vi.fn()
    render(() => <InlineEdit onSave={onSave} />)
    fireEvent.click(screen.getByRole("button", { name: "—" }))
    const input = screen.getByRole("textbox")
    fireEvent.input(input, { target: { value: "New" } })
    fireEvent.blur(input)
    expect(onSave).toHaveBeenCalledWith("New")
  })
})

describe("TagInput", () => {
  it("commits a tag on Enter or a comma, once, and pulls the last back on Backspace", () => {
    const onUpdate = vi.fn()
    render(() => <TagInput modelValue={["vue"]} onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Add tag…" })
    fireEvent.keyDown(input, { key: "Backspace" })
    expect(onUpdate).toHaveBeenLastCalledWith([])
    fireEvent.input(input, { target: { value: " solid " } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onUpdate).toHaveBeenLastCalledWith(["vue", "solid"])
    expect(input.value).toBe("")
    fireEvent.input(input, { target: { value: "VUE" } })
    fireEvent.keyDown(input, { key: "," })
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(input.value).toBe("")
  })

  it("removes a tag by its button, and holds at its cap", () => {
    const onUpdate = vi.fn()
    render(() => <TagInput modelValue={["a", "b"]} max={2} onUpdateModelValue={onUpdate} />)
    const input = screen.getByRole("textbox")
    fireEvent.input(input, { target: { value: "c" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Remove a" }))
    expect(onUpdate).toHaveBeenCalledWith(["b"])
  })
})

describe("KeyValueInput", () => {
  it("reports the whole list on every edit, and keeps the field being typed in", () => {
    const [rows, setRows] = createSignal([{ key: "a", value: "1" }])
    render(() => <KeyValueInput modelValue={rows()} onUpdateModelValue={setRows} />)
    const key = screen.getByPlaceholderText<HTMLInputElement>("key")
    fireEvent.input(key, { target: { value: "ab" } })
    expect(rows()).toEqual([{ key: "ab", value: "1" }])
    expect(screen.getByPlaceholderText("key")).toBe(key)
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }))
    expect(rows().length).toBe(2)
    fireEvent.click(screen.getByRole("button", { name: "Remove row 1" }))
    expect(rows()).toEqual([{ key: "", value: "" }])
  })
})

describe("MultiSelect", () => {
  it("checks and unchecks options, removes a chip, and narrows the list by its query", () => {
    const onUpdate = vi.fn()
    const onSearch = vi.fn()
    render(() => (
      <MultiSelect
        options={["Vue", "Solid", "Svelte"]}
        value={["Vue"]}
        onUpdateModelValue={onUpdate}
        onSearch={onSearch}
      />
    ))
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Vue" }).checked).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: "Solid" }))
    expect(onUpdate).toHaveBeenLastCalledWith(["Vue", "Solid"])
    fireEvent.click(screen.getByRole("button", { name: "Remove Vue" }))
    expect(onUpdate).toHaveBeenLastCalledWith([])
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "sv" } })
    expect(onSearch).toHaveBeenCalledWith("sv")
    expect(screen.getAllByRole("checkbox").length).toBe(1)
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "zzz" } })
    expect(screen.getByText("No matches")).toBeTruthy()
  })
})

describe("LanguageSelect", () => {
  it("shows its model's language and reports the tag picked", () => {
    const onUpdate = vi.fn()
    render(() => <LanguageSelect modelValue="fr" includeDefault onUpdateModelValue={onUpdate} />)
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Language" })
    expect(select.value).toBe("fr")
    expect(screen.getByRole("option", { name: "System default" })).toBeTruthy()
    fireEvent.change(select, { target: { value: "ja" } })
    expect(onUpdate).toHaveBeenCalledWith("ja")
  })

  it("follows its model", () => {
    const [lang, setLang] = createSignal("en")
    render(() => <LanguageSelect modelValue={lang()} />)
    setLang("de")
    expect(screen.getByRole<HTMLSelectElement>("combobox").value).toBe("de")
  })
})

describe("IconPicker", () => {
  it("offers every glyph as a radio, narrows by its filter, and reports the pick", () => {
    const onUpdate = vi.fn()
    render(() => <IconPicker modelValue="Check" onUpdateModelValue={onUpdate} />)
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Check" }).checked).toBe(true)
    fireEvent.click(screen.getByRole("radio", { name: "Copy" }))
    expect(onUpdate).toHaveBeenCalledWith("Copy")
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "no-such-glyph" } })
    expect(screen.queryAllByRole("radio")).toEqual([])
    expect(screen.getByText("No icons match “no-such-glyph”")).toBeTruthy()
  })
})

describe("FileInput", () => {
  const file = (name: string, size: number) => new File([new Uint8Array(size)], name)

  it("lists the chosen files with their sizes, removes one, and clears all", () => {
    const onUpdate = vi.fn()
    const onChange = vi.fn()
    const files = [file("a.png", 2048), file("b.png", 10)]
    render(() => <FileInput modelValue={files} onUpdateModelValue={onUpdate} onChange={onChange} />)
    expect(screen.getByText("a.png")).toBeTruthy()
    expect(screen.getByText("2.0 KB")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Remove a.png" }))
    expect(onUpdate).toHaveBeenLastCalledWith([files[1]])
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
    expect(onUpdate).toHaveBeenLastCalledWith([])
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it("takes dropped files: one unless it is multiple, none while disabled", () => {
    const onUpdate = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    const { container } = render(() => <FileInput disabled={disabled()} onUpdateModelValue={onUpdate} />)
    const zone = container.querySelector("label")!
    const dropped = [file("a.png", 1), file("b.png", 1)]
    fireEvent.drop(zone, { dataTransfer: { files: dropped } })
    expect(onUpdate).toHaveBeenLastCalledWith([dropped[0]])
    setDisabled(true)
    fireEvent.drop(zone, { dataTransfer: { files: dropped } })
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it("takes what the native input picked, and names what it accepts", () => {
    const onUpdate = vi.fn()
    const { container } = render(() => <FileInput multiple accept=".png" onUpdateModelValue={onUpdate} />)
    expect(screen.getByText(".png")).toBeTruthy()
    expect(screen.getByText("Choose files")).toBeTruthy()
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const picked = [file("a.png", 1), file("b.png", 1)]
    Object.defineProperty(input, "files", { value: picked, configurable: true })
    fireEvent.change(input)
    expect(onUpdate).toHaveBeenCalledWith(picked)
  })
})

describe("Calendar", () => {
  it("shows the model's month as a grid, with the day selected and in the tab order", () => {
    render(() => <Calendar modelValue="2026-03-15" />)
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeTruthy()
    expect(screen.getAllByRole("columnheader").length).toBe(7)
    expect(screen.getAllByRole("gridcell").length).toBe(42)
    const day = document.getElementById("dk-cal-2026-03-15")!
    expect(day.getAttribute("aria-selected")).toBe("true")
    expect(day.tabIndex).toBe(0)
    expect(document.getElementById("dk-cal-2026-03-16")!.tabIndex).toBe(-1)
  })

  it("picks a day by click, and no day outside its range", () => {
    const onUpdate = vi.fn()
    const onSelect = vi.fn()
    render(() => (
      <Calendar modelValue="2026-03-15" min="2026-03-10" onUpdateModelValue={onUpdate} onSelect={onSelect} />
    ))
    expect((document.getElementById("dk-cal-2026-03-09") as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(document.getElementById("dk-cal-2026-03-20")!)
    expect(onUpdate).toHaveBeenCalledWith("2026-03-20")
    expect(onSelect).toHaveBeenCalledWith("2026-03-20")
  })

  it("moves the day by the arrows, the month by the page keys, and selects on Enter", () => {
    const onSelect = vi.fn()
    const [value, setValue] = createSignal("2026-03-15")
    render(() => <Calendar modelValue={value()} onUpdateModelValue={setValue} onSelect={onSelect} />)
    const grid = screen.getByRole("grid")
    fireEvent.keyDown(grid, { key: "ArrowRight" })
    expect(value()).toBe("2026-03-16")
    fireEvent.keyDown(grid, { key: "ArrowUp" })
    expect(value()).toBe("2026-03-09")
    fireEvent.keyDown(grid, { key: "End" })
    expect(value()).toBe("2026-03-15")
    fireEvent.keyDown(grid, { key: "PageDown" })
    expect(value()).toBe("2026-04-15")
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeTruthy()
    fireEvent.keyDown(grid, { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith("2026-04-15")
  })

  it("turns the month by its buttons, and re-centres on a model from another month", () => {
    const [value, setValue] = createSignal("2026-03-15")
    render(() => <Calendar modelValue={value()} />)
    fireEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(screen.getByRole("grid", { name: "February 2026" })).toBeTruthy()
    setValue("2026-12-01")
    expect(screen.getByRole("grid", { name: "December 2026" })).toBeTruthy()
  })
})

describe("DatePicker", () => {
  it("opens its calendar as a dialog, and closes on Escape, which goes no further", () => {
    const outer = vi.fn()
    render(() => (
      <div on:keydown={outer}>
        <DatePicker modelValue="2026-03-15" />
      </div>
    ))
    const trigger = screen.getByRole("button", { name: "Mar 15, 2026" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("dialog", { name: "Pick a date" })).toBeTruthy()
    fireEvent.keyDown(screen.getByRole("grid"), { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(outer).not.toHaveBeenCalled()
  })

  it("closes on a pick, reporting it, and on a press outside", () => {
    const onSelect = vi.fn()
    const onUpdate = vi.fn()
    render(() => <DatePicker onSelect={onSelect} onUpdateModelValue={onUpdate} modelValue="2026-03-15" />)
    fireEvent.focus(screen.getByRole("button", { name: "Mar 15, 2026" }))
    fireEvent.click(document.getElementById("dk-cal-2026-03-20")!)
    expect(onUpdate).toHaveBeenCalledWith("2026-03-20")
    expect(onSelect).toHaveBeenCalledWith("2026-03-20")
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Mar 15, 2026" }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("shows its placeholder without a date", () => {
    render(() => <DatePicker />)
    expect(screen.getByRole("button", { name: "YYYY-MM-DD" })).toBeTruthy()
  })
})

describe("ClickOutside", () => {
  it("reports a press outside its content, never one inside, and none while off", () => {
    const onOutside = vi.fn()
    const [enabled, setEnabled] = createSignal(true)
    const { unmount } = render(() => (
      <ClickOutside enabled={enabled()} onOutside={onOutside}>
        <button type="button">inside</button>
      </ClickOutside>
    ))
    fireEvent.pointerDown(screen.getByRole("button", { name: "inside" }))
    expect(onOutside).not.toHaveBeenCalled()
    fireEvent.pointerDown(document.body)
    expect(onOutside).toHaveBeenCalledTimes(1)
    setEnabled(false)
    fireEvent.pointerDown(document.body)
    expect(onOutside).toHaveBeenCalledTimes(1)
    setEnabled(true)
    unmount()
    fireEvent.pointerDown(document.body)
    expect(onOutside).toHaveBeenCalledTimes(1)
  })
})

describe("Clipboard", () => {
  const clipboard = () => {
    const writeText = vi.fn(async (_text: string) => {})
    vi.stubGlobal("navigator", { clipboard: { writeText } })
    return writeText
  }
  const settle = async () => {
    for (let i = 0; i < 4; i++) await Promise.resolve()
  }

  it("copies its value on a click, tells its trigger and announces it, then settles back", async () => {
    vi.useFakeTimers()
    const writeText = clipboard()
    const onCopied = vi.fn()
    render(() => (
      <Clipboard value="npm i dither-kit" onCopied={onCopied}>
        {(scope) => <button type="button">{scope.copied ? "Done" : "Copy"}</button>}
      </Clipboard>
    ))
    fireEvent.click(screen.getByRole("button", { name: "Copy" }))
    await settle()
    expect(writeText).toHaveBeenCalledWith("npm i dither-kit")
    expect(onCopied).toHaveBeenCalledWith("npm i dither-kit")
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("Copied to clipboard")
    vi.advanceTimersByTime(1500)
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("")
  })

  it("copies nothing while disabled", async () => {
    const writeText = clipboard()
    render(() => (
      <Clipboard value="x" disabled>
        {() => <button type="button">Copy</button>}
      </Clipboard>
    ))
    fireEvent.click(screen.getByRole("button", { name: "Copy" }))
    await settle()
    expect(writeText).not.toHaveBeenCalled()
  })

  it("CopyableText is a button whose name and glyph turn once copied", async () => {
    const writeText = clipboard()
    render(() => <CopyableText value="abc">{(scope) => (scope.copied ? "copied" : "abc")}</CopyableText>)
    const button = screen.getByRole("button", { name: "Copy" })
    expect(button.textContent).toBe("abc")
    fireEvent.click(button)
    await settle()
    expect(writeText).toHaveBeenCalledWith("abc")
    expect(screen.getByRole("button", { name: "Copied" }).textContent).toBe("copied")
  })

  it("CopyableText takes plain content too", () => {
    render(() => <CopyableText value="abc">abc</CopyableText>)
    expect(screen.getByRole("button", { name: "Copy" }).textContent).toBe("abc")
  })
})

describe("DitherToaster", () => {
  afterEach(() => {
    for (const t of [...toasts]) dismiss(t.id)
  })

  it("announces each toast, paints its rail, and lets one be dismissed", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(32)
    render(() => <DitherToaster />)
    const region = screen.getByRole("status")
    expect(region.getAttribute("aria-live")).toBe("polite")
    toast("Saved", { color: "green" })
    toast("Sent")
    expect(region.textContent).toContain("Saved")
    expect(region.querySelectorAll(".dk-toast").length).toBe(2)
    await w.frame(100)
    expect(w.uploads.length).toBe(2)
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[0])
    expect(region.textContent).not.toContain("Saved")
    expect(region.textContent).toContain("Sent")
  })
})

describe("DitherBracket", () => {
  const rounds = [
    [
      { a: "Ada", b: "Bo", winner: "a" as const },
      { a: "Cy", b: "Di" },
    ],
    [{ a: "Ada", b: "?" }],
  ]

  it("names the group and marks a winner for a screen reader", () => {
    render(() => <DitherBracket rounds={rounds} />)
    const group = screen.getByRole("group", { name: "Tournament bracket" })
    expect(group.textContent).toContain("Cy")
    expect(screen.getAllByText("winner").length).toBe(1)
    expect(screen.queryAllByRole("button")).toEqual([])
  })

  it("lets an open match be picked when interactive, a decided one never", () => {
    const onPick = vi.fn()
    render(() => <DitherBracket rounds={rounds} interactive onPick={onPick} />)
    expect(screen.queryByRole("button", { name: "Bo" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Di" }))
    expect(onPick).toHaveBeenCalledWith(0, 1, "b")
    fireEvent.click(screen.getByText("Bo"))
    expect(onPick).toHaveBeenCalledTimes(1)
  })
})

describe("links and text", () => {
  it("Link is an anchor that opens a new tab only when external", () => {
    render(() => (
      <>
        <Link href="/docs">Docs</Link>
        <Link href="https://example.com" external aria-label="Out">
          Elsewhere
        </Link>
      </>
    ))
    const inner = screen.getByRole("link", { name: "Docs" })
    expect(inner.getAttribute("href")).toBe("/docs")
    expect(inner.hasAttribute("target")).toBe(false)
    const outer = screen.getByRole("link", { name: "Out" })
    expect(outer.getAttribute("target")).toBe("_blank")
    expect(outer.getAttribute("rel")).toBe("noreferrer")
  })

  it("ExternalLink opens a new tab and carries the glyph after its label", () => {
    render(() => <ExternalLink href="https://example.com">Source</ExternalLink>)
    const link = screen.getByRole("link", { name: "Source" })
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noreferrer")
    expect(link.querySelector("svg")?.getAttribute("width")).toBe("12")
  })

  it("ExpandingArrow is a button with a default label, the caller's listeners on it", () => {
    const onClick = vi.fn()
    render(() => <ExpandingArrow onClick={onClick} />)
    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Explore the kit" })
    expect(button.type).toBe("button")
    expect(button.classList.contains("dk-arrow")).toBe(true)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("Text renders as the element asked for, in its tone and size", () => {
    render(() => (
      <Text as="h3" tone="muted" size="lg" id="t">
        Heading
      </Text>
    ))
    const heading = screen.getByRole("heading", { name: "Heading", level: 3 })
    expect(heading.id).toBe("t")
    expect(heading.className).toBe("text-[15px] text-muted-foreground")
  })

  it("Text is a paragraph by default", () => {
    render(() => <Text>Body</Text>)
    expect(screen.getByText("Body").tagName).toBe("P")
  })

  it("Highlight marks its content", () => {
    render(() => <Highlight>found</Highlight>)
    expect(screen.getByText("found").tagName).toBe("MARK")
  })

  it("FileSizeText prints bytes in 1024-based units, whole under a kilobyte", () => {
    const { container } = render(() => (
      <>
        <FileSizeText bytes={512} />
        <FileSizeText bytes={1536} />
        <FileSizeText bytes={-5 * 1024 * 1024} decimals={0} />
      </>
    ))
    expect([...container.querySelectorAll("span")].map((s) => s.textContent)).toEqual(["512 B", "1.5 KB", "-5 MB"])
  })

  it("MiddleEllipsis keeps both ends and the whole string in its title", () => {
    render(() => <MiddleEllipsis text="0123456789abcdefghijklmnop" />)
    const span = screen.getByText("01234567…klmnop")
    expect(span.title).toBe("0123456789abcdefghijklmnop")
  })

  it("MiddleEllipsis leaves a short string whole, and drops the title when told", () => {
    render(() => <MiddleEllipsis text="short" title={false} />)
    expect(screen.getByText("short").hasAttribute("title")).toBe(false)
  })

  it("FuzzyText names itself by its text and filters a hidden copy", () => {
    const { container } = render(() => <FuzzyText text="NOISE" intensity={9} />)
    const root = screen.getByLabelText("NOISE")
    const filter = container.querySelector("filter")!
    expect(container.querySelector("feDisplacementMap")?.getAttribute("scale")).toBe("9")
    const copy = root.querySelector<HTMLElement>(":scope > span[aria-hidden]")!
    expect(copy.textContent).toBe("NOISE")
    expect(filter.id).toMatch(/^dither-fuzz-/)
    expect(copy.style.filter).toContain(`#${filter.id}`)
  })

  it("two FuzzyTexts never share a filter", () => {
    const { container } = render(() => (
      <>
        <FuzzyText />
        <FuzzyText />
      </>
    ))
    const ids = [...container.querySelectorAll("filter")].map((f) => f.id)
    expect(new Set(ids).size).toBe(2)
  })

  it("ScrambleText scrambles on hover and settles back on its text", async () => {
    render(() => <ScrambleText text="ab" />)
    const span = screen.getByLabelText("ab")
    expect(span.textContent).toBe("ab")
    fireEvent.mouseEnter(span)
    await w.frame(16)
    expect(span.textContent?.length).toBe(2)
    for (let i = 0; i < 12; i++) await w.frame(32 + i * 16)
    expect(span.textContent).toBe("ab")
  })
})

describe("Icon", () => {
  it("is decorative by default, and an image with a name when labelled", () => {
    const { container } = render(() => (
      <>
        <Icon name="Check" />
        <Icon name="Check" label="Done" size={20} />
      </>
    ))
    const plain = container.querySelector("svg")!
    expect(plain.getAttribute("aria-hidden")).toBe("true")
    expect(plain.getAttribute("focusable")).toBe("false")
    expect(plain.querySelectorAll("path").length).toBeGreaterThan(0)
    const named = screen.getByRole("img", { name: "Done" })
    expect(named.getAttribute("width")).toBe("20")
    expect(named.hasAttribute("aria-hidden")).toBe(false)
  })

  it("fails loudly on a name it does not have", () => {
    expect(() => render(() => <Icon name={"Nope" as never} />)).toThrow(/unknown icon/)
  })
})

describe("pointer surfaces", () => {
  const box = (el: Element) => vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 10, top: 20 } as DOMRect)

  it("Crosshair draws its lines at the pointer and hides them as it leaves", () => {
    const { container } = render(() => <Crosshair thickness={2}>content</Crosshair>)
    const area = container.firstElementChild as HTMLElement
    expect(area.textContent).toBe("content")
    const [v, h] = area.querySelectorAll<HTMLElement>("[aria-hidden]")
    expect(v.style.opacity).toBe("0")
    box(area)
    area.dispatchEvent(pointer("pointermove", 110, 70))
    expect(v.style.left).toBe("100px")
    expect(v.style.width).toBe("2px")
    expect(h.style.top).toBe("50px")
    expect(v.style.opacity).toBe("0.8")
    fireEvent.pointerLeave(area)
    expect(h.style.opacity).toBe("0")
  })

  it("BlobCursor trails the pointer once in view, and stops as it leaves the page", async () => {
    const { container, unmount } = render(() => <BlobCursor lag={1}>content</BlobCursor>)
    const area = container.firstElementChild as HTMLElement
    const blob = area.querySelector<HTMLElement>("[aria-hidden]")!
    expect(area.textContent).toBe("content")
    await w.frame(16)
    expect(blob.style.transform).toBe("scale(0)")
    w.show()
    box(area)
    area.dispatchEvent(pointer("pointermove", 110, 70))
    await w.frame(32)
    expect(blob.style.transform).toBe("translate(100px, 50px) translate(-50%, -50%) scale(1)")
    fireEvent.pointerLeave(area)
    await w.frame(48)
    expect(blob.style.transform).toContain("scale(0)")
    unmount()
    blob.style.transform = "none"
    await w.frame(64)
    expect(blob.style.transform).toBe("none")
  })

  it("HoverArea tells its content of the pointer and of focus inside it", () => {
    const { container } = render(() => (
      <HoverArea class="row">
        {(scope) => (
          <button type="button">{`${scope.hovered ? "hover" : "rest"} ${scope.focused ? "focus" : "blur"}`}</button>
        )}
      </HoverArea>
    ))
    const area = container.firstElementChild as HTMLElement
    expect(area.className).toBe("row")
    expect(screen.getByRole("button", { name: "rest blur" })).toBeTruthy()
    area.dispatchEvent(new Event("pointerenter"))
    expect(screen.getByRole("button", { name: "hover blur" })).toBeTruthy()
    fireEvent.focusIn(screen.getByRole("button"))
    expect(screen.getByRole("button", { name: "hover focus" })).toBeTruthy()
    area.dispatchEvent(new Event("pointerleave"))
    fireEvent.focusOut(screen.getByRole("button"))
    expect(screen.getByRole("button", { name: "rest blur" })).toBeTruthy()
  })

  it("Measure reports its box as it is observed, rounded", () => {
    let report: ResizeObserverCallback | undefined
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          report = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    const onResize = vi.fn()
    const { container } = render(() => (
      <Measure class="box" onResize={onResize}>
        content
      </Measure>
    ))
    expect(container.firstElementChild?.className).toBe("box")
    expect(container.textContent).toBe("content")
    report?.([{ contentRect: { width: 120.4, height: 39.6 } } as ResizeObserverEntry], {} as ResizeObserver)
    expect(onResize).toHaveBeenCalledWith({ width: 120, height: 40 })
  })
})
