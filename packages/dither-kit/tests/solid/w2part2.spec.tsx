// The kit's text effects, sidebar, small controls and layout pieces: each
// renders its content under its role and name, a control reports through
// its callback, a keyboard path works, and a surface paints once it is in
// view.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AnimatedContent from "../../src/solid/AnimatedContent"
import Caption from "../../src/solid/Caption"
import DecryptedText from "../../src/solid/DecryptedText"
import DitherForm from "../../src/solid/DitherForm"
import DitherGradient from "../../src/solid/DitherGradient"
import DitherRail from "../../src/solid/DitherRail"
import DitherScope from "../../src/solid/DitherScope"
import DitherSidebar from "../../src/solid/DitherSidebar"
import DitherSidebarGroup from "../../src/solid/DitherSidebarGroup"
import DitherSidebarItem from "../../src/solid/DitherSidebarItem"
import DitherSidebarSub from "../../src/solid/DitherSidebarSub"
import DitherSkeleton from "../../src/solid/DitherSkeleton"
import DitherSwipeArea from "../../src/solid/DitherSwipeArea"
import Divider from "../../src/solid/Divider"
import FontPicker from "../../src/solid/FontPicker"
import GradualBlur from "../../src/solid/GradualBlur"
import ImageTrail from "../../src/solid/ImageTrail"
import ListBox from "../../src/solid/ListBox"
import MonthPicker from "../../src/solid/MonthPicker"
import NotificationStack from "../../src/solid/NotificationStack"
import OrbitImages from "../../src/solid/OrbitImages"
import SlideAction from "../../src/solid/SlideAction"
import Spacer from "../../src/solid/Spacer"
import StickerPeel from "../../src/solid/StickerPeel"
import Svg from "../../src/solid/Svg"
import TextCursor from "../../src/solid/TextCursor"
import TextPressure from "../../src/solid/TextPressure"
import { world } from "../support/world"

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

/** Past the microtask and the timer a surface defers its first paint to. */
const settle = () => new Promise((done) => setTimeout(done, 5))

describe("AnimatedContent", () => {
  it("holds its content offset and clear until it comes into view", () => {
    render(() => <AnimatedContent distance="4cqh">Revealed</AnimatedContent>)
    const el = screen.getByText("Revealed")
    expect(el.style.opacity).toBe("0")
    expect(el.style.transform).toBe("translateY(4cqh)")
    w.show()
    expect(el.style.opacity).toBe("1")
    expect(el.style.transform).toBe("none")
  })

  it("flips a length's sign for a reversed, horizontal reveal", () => {
    render(() => (
      <AnimatedContent distance={24} direction="horizontal" reverse>
        Side
      </AnimatedContent>
    ))
    expect(screen.getByText("Side").style.transform).toBe("translateX(-24px)")
  })
})

describe("Caption", () => {
  it("renders its text in the caption register", () => {
    render(() => <Caption class="mt-1">Figure 1</Caption>)
    expect(screen.getByText("Figure 1").className).toContain("text-[11px]")
  })
})

describe("DecryptedText", () => {
  it("is named by its text, and resolves to it once seen", async () => {
    render(() => <DecryptedText text="OK GO" speed={3} />)
    const el = screen.getByLabelText("OK GO")
    expect(el.textContent).toBe("?? ??")
    w.show()
    for (let i = 0; i < 20; i++) await w.frame(i * 16)
    expect(el.textContent).toBe("OK GO")
  })

  it("shows its text at rest and scrambles under the pointer when hover triggers it", async () => {
    render(() => <DecryptedText text="HOVER" trigger="hover" />)
    const el = screen.getByLabelText("HOVER")
    expect(el.textContent).toBe("HOVER")
    fireEvent.mouseEnter(el)
    await w.frame(16)
    expect(el.textContent).not.toBe("HOVER")
    expect(el.textContent).toHaveLength(5)
  })
})

describe("DitherForm", () => {
  it("reports a submit and keeps the page from posting it", () => {
    const onSubmit = vi.fn()
    render(() => (
      <DitherForm onSubmit={onSubmit} aria-label="Sign in">
        <button type="submit">Send</button>
      </DitherForm>
    ))
    const form = screen.getByRole("form", { name: "Sign in" }) as HTMLFormElement
    expect(form.noValidate).toBe(true)
    expect(fireEvent.submit(form)).toBe(false)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

describe("DitherGradient", () => {
  it("paints its canvas, hidden from assistive tech", async () => {
    const { container } = render(() => <DitherGradient from="green" />)
    await settle()
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true")
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })

  it("repaints when a colour changes", async () => {
    const [from, setFrom] = createSignal<"green" | "blue">("green")
    render(() => <DitherGradient from={from()} />)
    await settle()
    const before = w.uploads.length
    setFrom("blue")
    expect(w.uploads.length).toBe(before + 1)
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <DitherGradient precompiled="data:image/png;base64,AAAA" />)
    await settle()
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })
})

describe("DitherSidebar", () => {
  it("is a named landmark holding its header, items and footer", () => {
    render(() => (
      <DitherSidebar label="Project" header={<p>Top</p>} footer={<p>Bottom</p>}>
        <DitherSidebarItem label="Files" />
      </DitherSidebar>
    ))
    const aside = screen.getByRole("complementary", { name: "Project" })
    // its items' list is a landmark of its own, named apart from the page's other navigation
    expect(aside.querySelector("nav")).toBe(screen.getByRole("navigation", { name: "Project" }))
    expect(aside.textContent).toContain("Top")
    expect(aside.textContent).toContain("Bottom")
    expect(screen.getByRole("button", { name: "Files" })).toBeTruthy()
  })

  it("asks to fold through its toggle, and folds its items' labels on the rail", () => {
    const [collapsed, setCollapsed] = createSignal(false)
    render(() => (
      <DitherSidebar modelValue={collapsed()} onUpdateModelValue={setCollapsed}>
        <DitherSidebarItem label="Files" badge={3} />
      </DitherSidebar>
    ))
    const toggle = screen.getByRole("button", { name: "Collapse sidebar" })
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByText("Files")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
    fireEvent.click(toggle)
    expect(collapsed()).toBe(true)
    expect(screen.getByRole("button", { name: "Expand sidebar" }).getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("Files")).toBeNull()
    expect(screen.queryByText("3")).toBeNull()
    expect(screen.getByTitle("Files")).toBeTruthy()
  })

  it("has no toggle when it folds away, and washes its chrome when asked", async () => {
    const { container } = render(() => <DitherSidebar collapse="hide" variant="washed" />)
    await settle()
    expect(screen.queryByRole("button")).toBeNull()
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })
})

describe("DitherRail", () => {
  it("is a named landmark whose items keep only their icons", () => {
    render(() => (
      <DitherRail label="Tools">
        <DitherSidebarGroup label="Draw">
          <DitherSidebarItem label="Pen" icon={<i data-testid="pen" />} />
        </DitherSidebarGroup>
      </DitherRail>
    ))
    expect(screen.getByRole("complementary", { name: "Tools" })).toBeTruthy()
    expect(screen.getByRole("navigation", { name: "Tools" })).toBeTruthy()
    expect(screen.getByTestId("pen")).toBeTruthy()
    expect(screen.queryByText("Pen")).toBeNull()
    expect(screen.getByTitle("Pen")).toBeTruthy()
    // the group's label folds into a separator
    expect(screen.queryByText("Draw")).toBeNull()
    expect(screen.getByRole("group", { name: "Draw" })).toBeTruthy()
  })
})

describe("DitherSidebarGroup", () => {
  it("labels its cluster of items", () => {
    render(() => (
      <DitherSidebarGroup label="Library">
        <DitherSidebarItem label="Fonts" />
      </DitherSidebarGroup>
    ))
    const group = screen.getByRole("group", { name: "Library" })
    expect(screen.getByText("Library")).toBeTruthy()
    expect(group.contains(screen.getByRole("button", { name: "Fonts" }))).toBe(true)
  })
})

describe("DitherSidebarItem", () => {
  it("reports a select, and takes a button's own attributes", () => {
    const onSelect = vi.fn()
    render(() => <DitherSidebarItem label="Inbox" onSelect={onSelect} data-row="1" />)
    const item = screen.getByRole("button", { name: "Inbox" })
    expect(item.getAttribute("aria-current")).toBeNull()
    expect(item.getAttribute("data-row")).toBe("1")
    fireEvent.click(item)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("marks the active item and paints its rail, also when it becomes active later", async () => {
    const [active, setActive] = createSignal(false)
    const { container } = render(() => (
      <>
        <DitherSidebarItem label="Now" active />
        <DitherSidebarItem label="Later" active={active()} />
      </>
    ))
    expect(screen.getByRole("button", { name: "Now" }).getAttribute("aria-current")).toBe("true")
    expect(w.uploads).toEqual([container.querySelector("canvas")])
    setActive(true)
    await w.frame(16)
    expect(screen.getByRole("button", { name: "Later" }).getAttribute("aria-current")).toBe("true")
    expect(w.uploads.length).toBe(2)
  })
})

describe("DitherSidebarSub", () => {
  it("asks to open through its row, which names the region it controls", () => {
    const [open, setOpen] = createSignal(false)
    render(() => (
      <DitherSidebarSub label="Settings" modelValue={open()} onUpdateModelValue={setOpen}>
        <DitherSidebarItem label="Billing" />
      </DitherSidebarSub>
    ))
    const row = screen.getByRole("button", { name: /Settings/ })
    expect(row.getAttribute("aria-expanded")).toBe("false")
    const region = document.getElementById(row.getAttribute("aria-controls")!)!
    expect(region.contains(screen.getByText("Billing"))).toBe(true)
    const shut = region.firstElementChild as HTMLElement & { inert: boolean }
    expect(shut.inert === true || shut.hasAttribute("inert")).toBe(true)
    fireEvent.click(row)
    expect(open()).toBe(true)
    expect(row.getAttribute("aria-expanded")).toBe("true")
    expect(shut.inert === true || shut.hasAttribute("inert")).toBe(false)
  })

  it("keeps only its row on the icon rail", () => {
    render(() => (
      <DitherRail>
        <DitherSidebarSub label="Settings" modelValue>
          <DitherSidebarItem label="Billing" />
        </DitherSidebarSub>
      </DitherRail>
    ))
    expect(screen.getByTitle("Settings")).toBeTruthy()
    expect(screen.queryByTitle("Billing")).toBeNull()
  })
})

describe("DitherScope", () => {
  it("is an image named for its wave, and paints its canvas once laid out", async () => {
    const { container } = render(() => <DitherScope signal="square" />)
    expect(screen.getByRole("img", { name: "square wave" })).toBeTruthy()
    await w.frame(100)
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })

  it("takes its label as its name, and repaints samples when they change", async () => {
    const [samples, setSamples] = createSignal([0, 0.5, -0.5, 0])
    render(() => <DitherScope signal={samples()} label="Channel A" />)
    expect(screen.getByRole("img", { name: "Channel A" }).textContent).toContain("Channel A")
    await w.frame(100)
    const before = w.uploads.length
    setSamples([1, -1, 1, -1])
    expect(w.uploads.length).toBe(before + 1)
  })
})

describe("DitherSkeleton", () => {
  it("paints its field once laid out, hidden from assistive tech", async () => {
    const { container } = render(() => <DitherSkeleton class="h-4 w-20" />)
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true")
    await w.frame(100)
    expect(w.uploads).toContain(container.querySelector("canvas"))
  })

  it("stops when it leaves the page", async () => {
    const { unmount } = render(() => <DitherSkeleton seed={4} />)
    await w.frame(100)
    const painted = w.uploads.length
    unmount()
    for (let i = 2; i < 40; i++) await w.frame(i * 100)
    expect(w.uploads.length).toBe(painted)
  })
})

describe("DitherSwipeArea", () => {
  const strip = (container: HTMLElement) => {
    const el = container.firstElementChild as HTMLElement
    el.setPointerCapture = vi.fn()
    return el
  }

  it("opens once on an inward swipe past its threshold", () => {
    const onOpen = vi.fn()
    const { container } = render(() => <DitherSwipeArea side="right" threshold={24} onOpen={onOpen} />)
    const el = strip(container)
    expect(el.style.width).toBe("16px")
    fireEvent.pointerDown(el, { clientX: 300, pointerId: 1 })
    fireEvent.pointerMove(el, { clientX: 290, pointerId: 1 })
    expect(onOpen).not.toHaveBeenCalled()
    fireEvent.pointerMove(el, { clientX: 270, pointerId: 1 })
    fireEvent.pointerMove(el, { clientX: 240, pointerId: 1 })
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(el.setPointerCapture).toHaveBeenCalledWith(1)
  })

  it("ignores an outward swipe, and every swipe while disabled", () => {
    const onOpen = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    const { container } = render(() => <DitherSwipeArea side="left" disabled={disabled()} onOpen={onOpen} />)
    const el = strip(container)
    fireEvent.pointerDown(el, { clientX: 100, pointerId: 1 })
    fireEvent.pointerMove(el, { clientX: 40, pointerId: 1 })
    setDisabled(true)
    fireEvent.pointerDown(el, { clientX: 0, pointerId: 1 })
    fireEvent.pointerMove(el, { clientX: 80, pointerId: 1 })
    expect(onOpen).not.toHaveBeenCalled()
  })
})

describe("Divider", () => {
  it("is a horizontal rule by default and a stretched separator when vertical", () => {
    render(() => (
      <>
        <Divider />
        <Divider orientation="vertical" />
      </>
    ))
    const [flat, tall] = screen.getAllByRole("separator")
    expect(flat.tagName).toBe("HR")
    expect(flat.getAttribute("aria-orientation")).toBe("horizontal")
    expect(tall.tagName).toBe("DIV")
    expect(tall.getAttribute("aria-orientation")).toBe("vertical")
  })
})

describe("FontPicker", () => {
  it("offers each stack as a radio in its own face, and reports the pick", () => {
    const [value, setValue] = createSignal("")
    render(() => <FontPicker modelValue={value()} onUpdateModelValue={setValue} />)
    expect(screen.getByRole("radiogroup", { name: "Font" })).toBeTruthy()
    expect(screen.getAllByRole("radio")).toHaveLength(10)
    const mono = screen.getByRole("radio", { name: /Monospace/ }) as HTMLInputElement
    expect(screen.getByText("Monospace").style.fontFamily).toContain("JetBrains Mono")
    fireEvent.click(mono)
    expect(value()).toBe("'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace")
    expect(mono.checked).toBe(true)
  })

  it("disables every radio when disabled", () => {
    render(() => <FontPicker disabled />)
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLInputElement).disabled)).toBe(true)
  })
})

describe("GradualBlur", () => {
  it("renders its content under a blurred strip on the chosen edge", () => {
    const { container } = render(() => (
      <GradualBlur position="top" height={40} strength={6}>
        <p>Scrolling text</p>
      </GradualBlur>
    ))
    expect(screen.getByText("Scrolling text")).toBeTruthy()
    const strip = container.firstElementChild!.lastElementChild as HTMLElement
    expect(strip.className).toContain("top-0")
    expect(strip.style.height).toBe("40px")
    expect(strip.getAttribute("style")).toContain("blur(6px)")
  })
})

describe("ImageTrail", () => {
  it("renders its content and drops a tile where the pointer travels", () => {
    const fills: string[] = []
    const ctx = {
      clearRect() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      globalAlpha: 1,
      fillStyle: "",
      fillRect() {
        fills.push(this.fillStyle)
      },
    }
    HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container } = render(() => (
      <ImageTrail colors={["#111111", "#222222"]} size={10}>
        <p>Trail me</p>
      </ImageTrail>
    ))
    expect(screen.getByText("Trail me")).toBeTruthy()
    expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true")
    const wrap = container.firstElementChild!
    vi.spyOn(performance, "now").mockReturnValue(1000)
    // its own frame clock, stamped beside the tiles' birth
    const queued: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queued.push(cb))
    fireEvent.pointerMove(wrap, { clientX: 50, clientY: 50 })
    fireEvent.pointerMove(wrap, { clientX: 52, clientY: 50 }) // too near the last tile
    fireEvent.pointerMove(wrap, { clientX: 90, clientY: 50 })
    expect(queued).toHaveLength(1)
    queued[0](1100)
    expect(fills).toEqual(["#111111", "#222222"])
  })
})

describe("ListBox", () => {
  const OPTIONS = ["Ash", "Birch", "Cedar"]

  it("lists its options and marks the picked one", () => {
    render(() => <ListBox options={OPTIONS} value="Birch" aria-label="Tree" />)
    // its name is the one it is given
    const list = screen.getByRole("listbox", { name: "Tree" })
    expect(list.tabIndex).toBe(0)
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(OPTIONS)
    expect(screen.getByRole("option", { name: "Birch" }).getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("option", { name: "Ash" }).getAttribute("aria-selected")).toBe("false")
  })

  it("moves with the arrows, jumps with Home and End, and commits with Enter", () => {
    const onSelect = vi.fn()
    const onUpdateModelValue = vi.fn()
    render(() => <ListBox options={OPTIONS} onSelect={onSelect} onUpdateModelValue={onUpdateModelValue} />)
    const list = screen.getByRole("listbox")
    const active = () => document.getElementById(list.getAttribute("aria-activedescendant") ?? "")?.textContent
    expect(list.getAttribute("aria-activedescendant")).toBeNull()
    fireEvent.keyDown(list, { key: "Enter" })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(list, { key: "ArrowDown" })
    expect(active()).toBe("Ash")
    fireEvent.keyDown(list, { key: "End" })
    expect(active()).toBe("Cedar")
    fireEvent.keyDown(list, { key: "ArrowDown" })
    expect(active()).toBe("Cedar")
    fireEvent.keyDown(list, { key: "ArrowUp" })
    expect(active()).toBe("Birch")
    fireEvent.keyDown(list, { key: "Enter" })
    expect(onSelect).toHaveBeenLastCalledWith("Birch")
    fireEvent.keyDown(list, { key: "Home" })
    fireEvent.keyDown(list, { key: " " })
    expect(onSelect).toHaveBeenLastCalledWith("Ash")
    expect(onUpdateModelValue.mock.calls).toEqual([["Birch"], ["Ash"]])
  })

  it("commits a click the same way, and leaves the tab order when disabled", () => {
    const onSelect = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    render(() => <ListBox options={OPTIONS} disabled={disabled()} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("option", { name: "Cedar" }))
    expect(onSelect).toHaveBeenCalledWith("Cedar")
    setDisabled(true)
    const list = screen.getByRole("listbox")
    expect(list.tabIndex).toBe(-1)
    expect(list.getAttribute("aria-disabled")).toBe("true")
  })
})

describe("MonthPicker", () => {
  it("shows the model's year and presses its month", () => {
    render(() => <MonthPicker modelValue="2031-03" />)
    expect(screen.getByRole("group", { name: "Months of 2031" })).toBeTruthy()
    const mar = screen.getByRole("button", { name: "Mar" })
    expect(mar.getAttribute("aria-pressed")).toBe("true")
    expect(mar.tabIndex).toBe(0)
    expect(screen.getByRole("button", { name: "Apr" }).getAttribute("aria-pressed")).toBe("false")
    expect(screen.getByRole("button", { name: "Apr" }).tabIndex).toBe(-1)
  })

  it("reports a clicked month in the year it shows", () => {
    const onUpdateModelValue = vi.fn()
    render(() => <MonthPicker modelValue="2031-03" onUpdateModelValue={onUpdateModelValue} />)
    fireEvent.click(screen.getByRole("button", { name: "Next year" }))
    fireEvent.click(screen.getByRole("button", { name: "Nov" }))
    expect(onUpdateModelValue).toHaveBeenLastCalledWith("2032-11")
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }))
    expect(screen.getByRole("group", { name: "Months of 2031" })).toBeTruthy()
  })

  it("roams the grid with the arrows and shifts the year with the page keys", () => {
    const [value, setValue] = createSignal("2031-03")
    render(() => <MonthPicker modelValue={value()} onUpdateModelValue={setValue} />)
    const grid = screen.getByRole("group", { name: "Months of 2031" })
    fireEvent.keyDown(grid, { key: "ArrowRight" })
    expect(value()).toBe("2031-04")
    fireEvent.keyDown(grid, { key: "ArrowDown" })
    expect(value()).toBe("2031-07")
    fireEvent.keyDown(grid, { key: "ArrowUp" })
    fireEvent.keyDown(grid, { key: "ArrowLeft" })
    expect(value()).toBe("2031-03")
    fireEvent.keyDown(grid, { key: "PageDown" })
    expect(value()).toBe("2031-03")
    fireEvent.keyDown(grid, { key: "Enter" })
    expect(value()).toBe("2032-03")
    expect(screen.getByRole("group", { name: "Months of 2032" })).toBeTruthy()
  })
})

describe("NotificationStack", () => {
  const ITEMS = [
    { id: "a", title: "Build passed", body: "main", time: "2m" },
    { id: "b", title: "Review asked", icon: "@" },
    { id: "c", title: "Deploy done" },
    { id: "d", title: "Fourth" },
  ]

  it("stacks its first cards under its name, the rest hidden until it opens", () => {
    render(() => <NotificationStack items={ITEMS} />)
    const group = screen.getByRole("group", { name: "Notifications" })
    expect(group.textContent).toContain("4")
    expect(screen.getByText("Build passed")).toBeTruthy()
    expect(screen.queryByText("Fourth")).toBeNull()
    expect(screen.getByText("Review asked").closest("[aria-hidden='true']")).not.toBeNull()
    expect(screen.queryByRole("button", { name: /View all/ })).toBeNull()
  })

  it("pins open through its top card", () => {
    const [open, setOpen] = createSignal(false)
    render(() => <NotificationStack items={ITEMS} modelValue={open()} onUpdateModelValue={setOpen} />)
    const top = screen.getByRole("button", { name: "Notifications" })
    expect(top.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(top)
    expect(open()).toBe(true)
    expect(top.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByText("Review asked").closest("div[aria-hidden='true']")).toBeNull()
    expect((screen.getByText("Deploy done").closest(".absolute") as HTMLElement).style.transform).toBe(
      "translateY(144px)",
    )
  })

  it("opens under focus and offers the full list", async () => {
    const onViewall = vi.fn()
    render(() => <NotificationStack items={ITEMS} onViewall={onViewall} />)
    fireEvent.focusIn(screen.getByRole("button", { name: "Notifications" }))
    await Promise.resolve()
    fireEvent.click(screen.getByRole("button", { name: /View all/ }))
    expect(onViewall).toHaveBeenCalledTimes(1)
  })

  it("says so when there is nothing to show", () => {
    render(() => <NotificationStack items={[]} emptyLabel="Quiet" />)
    expect(screen.getByText("Quiet")).toBeTruthy()
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("OrbitImages", () => {
  it("places its items on the ring around its content", () => {
    const { container } = render(() => (
      <OrbitImages items={["N", "S"]} radius={50} duration={8}>
        <b>Core</b>
      </OrbitImages>
    ))
    expect(screen.getByText("Core")).toBeTruthy()
    const north = screen.getByText("N")
    expect(north.style.animationDuration).toBe("8s")
    expect(north.parentElement!.style.transform).toContain("-50px)")
    expect(screen.getByText("S").parentElement!.style.transform).toContain(" 50px)")
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("SlideAction", () => {
  it("confirms from the keyboard and says so, then rests", () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    render(() => <SlideAction label="Slide to pay" onConfirm={onConfirm} />)
    const thumb = screen.getByRole("button", { name: "Slide to pay" })
    fireEvent.keyDown(thumb, { key: "a" })
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.keyDown(thumb, { key: "Enter" })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status").textContent).toBe("confirmed")
    fireEvent.keyDown(thumb, { key: " " }) // already done
    expect(onConfirm).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(900)
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("confirms when the thumb is dragged to the end, and springs back from short of it", () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    const { container } = render(() => <SlideAction onConfirm={onConfirm} />)
    const track = container.firstElementChild as HTMLElement
    const thumb = screen.getByRole("button", { name: "Slide to confirm" })
    thumb.setPointerCapture = vi.fn()
    Object.defineProperty(track, "clientWidth", { value: 256 })
    Object.defineProperty(thumb, "offsetWidth", { value: 32 })
    fireEvent.pointerDown(thumb, { clientX: 10, pointerId: 3 })
    fireEvent.pointerMove(thumb, { clientX: 60, pointerId: 3 })
    expect(thumb.style.transform).toBe("translateX(50px)")
    expect(thumb.style.transition).toBe("none")
    fireEvent.pointerUp(thumb, { clientX: 60, pointerId: 3 })
    expect(onConfirm).not.toHaveBeenCalled()
    expect(thumb.style.transform).toBe("translateX(0px)")
    fireEvent.pointerDown(thumb, { clientX: 10, pointerId: 4 })
    fireEvent.pointerMove(thumb, { clientX: 400, pointerId: 4 })
    expect(thumb.style.transform).toBe("translateX(216px)")
    fireEvent.pointerUp(thumb, { clientX: 400, pointerId: 4 })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("does nothing while disabled", () => {
    const onConfirm = vi.fn()
    render(() => <SlideAction disabled onConfirm={onConfirm} />)
    const thumb = screen.getByRole("button", { name: "Slide to confirm" }) as HTMLButtonElement
    expect(thumb.disabled).toBe(true)
    fireEvent.keyDown(thumb, { key: "Enter" })
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe("Spacer", () => {
  it("is empty room of the asked size on the asked axis", () => {
    const { container } = render(() => (
      <>
        <Spacer />
        <Spacer axis="x" size="xl" />
      </>
    ))
    const [y, x] = [...container.children]
    expect(y.className).toBe("h-[16px] shrink-0")
    expect(x.className).toBe("w-[40px] shrink-0")
    expect(y.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("StickerPeel", () => {
  it("renders its content above a decorative corner", () => {
    const { container } = render(() => <StickerPeel>New</StickerPeel>)
    expect(screen.getByText("New")).toBeTruthy()
    expect(container.querySelector(".dither-sticker > .dither-peel")?.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("Svg", () => {
  it("is decorative by default and a named image with a label", () => {
    const { container } = render(() => (
      <>
        <Svg viewBox="0 0 8 8">
          <rect width="8" height="8" />
        </Svg>
        <Svg label="Logo" />
      </>
    ))
    const plain = container.querySelector("svg")!
    expect(plain.getAttribute("aria-hidden")).toBe("true")
    expect(plain.getAttribute("focusable")).toBe("false")
    expect(plain.getAttribute("viewBox")).toBe("0 0 8 8")
    expect(plain.querySelector("rect")).not.toBeNull()
    expect(screen.getByRole("img", { name: "Logo" }).getAttribute("aria-hidden")).toBeNull()
  })
})

describe("TextCursor", () => {
  it("is named by its text and trails its letters behind the pointer once seen", async () => {
    render(() => <TextCursor text="a b" />)
    const area = screen.getByLabelText("a b")
    const letters = [...area.firstElementChild!.children] as HTMLElement[]
    expect(letters.map((l) => l.textContent)).toEqual(["a", " ", "b"])
    expect(letters[0].style.opacity).toBe("0")
    w.show()
    fireEvent.pointerMove(area, { clientX: 40, clientY: 20 })
    await w.frame(16)
    expect(letters[0].style.opacity).toBe("1")
    expect(letters[0].style.transform).toContain("translate(14px, 7px)")
    fireEvent.pointerLeave(area)
    await w.frame(32)
    expect(letters[0].style.opacity).toBe("0")
  })
})

describe("TextPressure", () => {
  it("is named by its text and presses the letters near the pointer once seen", async () => {
    render(() => <TextPressure text="Hi" radius={100} />)
    const root = screen.getByLabelText("Hi")
    const letters = [...root.children] as HTMLElement[]
    expect(letters.map((l) => l.textContent)).toEqual(["H", "i"])
    expect(letters.every((l) => l.getAttribute("aria-hidden") === "true")).toBe(true)
    w.show()
    await w.frame(16)
    expect(letters[0].style.transform).toBe("scale(1)")
    fireEvent.pointerMove(window, { clientX: 0, clientY: 0 })
    await w.frame(32)
    expect(letters[0].style.transform).toBe("scale(1.6)")
    expect(letters[0].style.fontWeight).toBe("900")
  })

  it("lets go of the window when it leaves the page", () => {
    const off = vi.spyOn(window, "removeEventListener")
    const { unmount } = render(() => <TextPressure />)
    unmount()
    expect(off.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(["pointermove", "pointerleave"]))
  })
})
