// Text that arrives, the menus, the slider and what is built on it, and
// the small layout pieces: what each renders and names, what it reports
// through its callbacks, and the keys it answers.
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import BlurText from "../../src/solid/BlurText"
import Code from "../../src/solid/Code"
import CountUp from "../../src/solid/CountUp"
import DitherBreadcrumb from "../../src/solid/DitherBreadcrumb"
import DitherContextMenu from "../../src/solid/DitherContextMenu"
import DitherGrid from "../../src/solid/DitherGrid"
import DitherInfiniteCanvas from "../../src/solid/DitherInfiniteCanvas"
import DitherMenu from "../../src/solid/DitherMenu"
import DitherPagination, { pageList } from "../../src/solid/DitherPagination"
import DitherRating from "../../src/solid/DitherRating"
import DitherSlider from "../../src/solid/DitherSlider"
import DitherTimeline from "../../src/solid/DitherTimeline"
import DitherVideoPlayer from "../../src/solid/DitherVideoPlayer"
import DurationText from "../../src/solid/DurationText"
import EllipsisTooltip from "../../src/solid/EllipsisTooltip"
import GooeyMenu from "../../src/solid/GooeyMenu"
import Heading from "../../src/solid/Heading"
import InView from "../../src/solid/InView"
import PixelTransition from "../../src/solid/PixelTransition"
import ScrollFloat from "../../src/solid/ScrollFloat"
import Sequence from "../../src/solid/Sequence"
import SnapButton from "../../src/solid/SnapButton"
import Truncate from "../../src/solid/Truncate"
import { world } from "../support/world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  // jsdom has no pointer capture: every pointer is held.
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => true
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

/** A 200 x 20 box at the page's corner. */
const box = (el: Element) =>
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 20 } as DOMRect)
const MENU = [
  { label: "Rename" },
  { divider: true },
  { label: "Archive", disabled: true },
  { label: "Delete", danger: true },
]

describe("BlurText", () => {
  it("names its text once, and brings each part into focus once in view", () => {
    const { getByLabelText } = render(() => <BlurText text="Blur into focus" />)
    const parts = [...getByLabelText("Blur into focus").children]
    expect(parts.map((p) => p.textContent)).toEqual(["Blur", " ", "into", " ", "focus"])
    expect(parts.every((p) => p.getAttribute("aria-hidden") === "true")).toBe(true)
    expect(parts.some((p) => p.classList.contains("shown"))).toBe(false)
    w.show()
    expect(parts.every((p) => p.classList.contains("shown"))).toBe(true)
    expect((parts[2] as HTMLElement).style.transitionDelay).toBe("180ms")
  })

  it("splits by character when asked", () => {
    const { getByLabelText } = render(() => <BlurText text="ab" by="chars" />)
    expect(getByLabelText("ab").children.length).toBe(2)
  })
})

describe("Code", () => {
  it("renders its content in a code element, with the class it is given", () => {
    const { getByText } = render(() => <Code class="text-red-400">npm i</Code>)
    const code = getByText("npm i")
    expect(code.tagName).toBe("CODE")
    expect(code.className).toContain("text-red-400")
  })
})

describe("CountUp", () => {
  it("waits at its start, then counts to its end once in view", async () => {
    const { container } = render(() => <CountUp to={42} from={7} decimals={1} />)
    const el = container.firstElementChild!
    expect(el.textContent).toBe("7.0")
    w.show()
    await w.frame(100)
    expect(el.textContent).toBe("42.0")
  })
})

describe("DitherBreadcrumb", () => {
  it("links every crumb but the last, which is the current page", () => {
    const { getByRole, getAllByRole, getByText } = render(() => (
      <DitherBreadcrumb items={[{ label: "Docs", href: "/docs" }, { label: "Kit" }, { label: "Slider", href: "/s" }]} />
    ))
    expect(getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy()
    expect(getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/docs"])
    expect(getByText("Slider").getAttribute("aria-current")).toBe("page")
    expect(getByText("Kit").getAttribute("aria-current")).toBeNull()
    expect(getAllByRole("listitem").length).toBe(3)
  })
})

describe("DitherContextMenu", () => {
  const open = async (onSelect = vi.fn()) => {
    const view = render(() => (
      <DitherContextMenu items={MENU} onSelect={onSelect}>
        <p>Canvas</p>
      </DitherContextMenu>
    ))
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 30 })
    view.getByText("Canvas").dispatchEvent(event)
    await Promise.resolve()
    // the panel is in the body, outside the mount: asked for on the screen
    return { getByText: view.getByText, getByRole: screen.getByRole, queryByRole: screen.queryByRole, event, onSelect }
  }

  it("opens where the press was, in place of the browser's menu, and takes the focus", async () => {
    const { getByText, queryByRole, event } = await open()
    expect(getByText("Canvas")).toBeTruthy()
    const menu = queryByRole("menu")!
    expect(event.defaultPrevented).toBe(true)
    expect(menu.style.left).toBe("40px")
    expect(menu.style.top).toBe("30px")
    expect(document.activeElement).toBe(menu)
  })

  it("walks its items with the arrows, around both ends", async () => {
    const { getByRole } = await open()
    const menu = getByRole("menu")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(document.activeElement).toBe(getByRole("menuitem", { name: "Rename" }))
    fireEvent.keyDown(menu, { key: "ArrowUp" })
    expect(document.activeElement).toBe(getByRole("menuitem", { name: "Delete" }))
  })

  it("reports the item picked and closes; a disabled one does neither", async () => {
    const { getByRole, queryByRole, onSelect } = await open()
    fireEvent.click(getByRole("menuitem", { name: "Archive" }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(getByRole("menuitem", { name: "Delete" }))
    expect(onSelect).toHaveBeenCalledWith("Delete")
    expect(queryByRole("menu")).toBeNull()
  })

  it("closes on Escape, and on a press anywhere else", async () => {
    const first = await open()
    fireEvent.keyDown(first.getByRole("menu"), { key: "Escape" })
    expect(first.queryByRole("menu")).toBeNull()
    cleanup()
    vi.useFakeTimers()
    const second = await open()
    vi.runAllTimers()
    vi.useRealTimers()
    fireEvent.pointerDown(second.getByRole("menu"))
    expect(second.queryByRole("menu")).not.toBeNull()
    fireEvent.pointerDown(document.body)
    expect(second.queryByRole("menu")).toBeNull()
  })
})

describe("DitherGrid", () => {
  it("fits columns by a minimum width, or holds a fixed count", () => {
    const [cols, setCols] = createSignal<number | undefined>()
    const { getByText } = render(() => (
      <DitherGrid cols={cols()} min={180}>
        <p>Card</p>
      </DitherGrid>
    ))
    const grid = getByText("Card").parentElement!
    expect(grid.style.gridTemplateColumns).toBe("repeat(auto-fit, minmax(min(100%, 180px), 1fr))")
    expect(grid.style.gap).toBe("0.75rem")
    setCols(3)
    expect(grid.style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))")
  })
})

describe("DitherInfiniteCanvas", () => {
  it("pans its content under a drag", () => {
    const { getByRole, getByText } = render(() => (
      <DitherInfiniteCanvas>
        <p>Node</p>
      </DitherInfiniteCanvas>
    ))
    const canvas = getByRole("group", { name: "Infinite canvas" })
    const layer = getByText("Node").parentElement!
    fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 10, clientY: 10 })
    expect(canvas.className).toContain("cursor-grabbing")
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 25 })
    expect(layer.style.transform).toBe("translate(30px, 15px) scale(1)")
    fireEvent.pointerUp(canvas, { pointerId: 1 })
    expect(canvas.className).toContain("cursor-grab")
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 90, clientY: 90 })
    expect(layer.style.transform).toBe("translate(30px, 15px) scale(1)")
  })

  it("zooms toward the cursor on the wheel, within its limits, and reports the zoom", () => {
    const zoomed = vi.fn()
    const { getByRole } = render(() => <DitherInfiniteCanvas maxZoom={1.2} onUpdateZoom={zoomed} />)
    const canvas = getByRole("group")
    box(canvas)
    const wheel = new WheelEvent("wheel", { deltaY: -100, clientX: 100, clientY: 10, bubbles: true, cancelable: true })
    canvas.dispatchEvent(wheel)
    expect(wheel.defaultPrevented).toBe(true)
    expect(zoomed.mock.lastCall?.[0]).toBeCloseTo(Math.exp(0.15))
    canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -1000, bubbles: true, cancelable: true }))
    expect(zoomed.mock.lastCall?.[0]).toBe(1.2)
  })
})

describe("DitherMenu", () => {
  const mount = (onSelect = vi.fn()) => ({
    ...render(() => (
      <DitherMenu items={MENU} onSelect={onSelect}>
        File
      </DitherMenu>
    )),
    onSelect,
  })

  it("opens from its trigger, which says so", async () => {
    const { getByRole, queryByRole, getAllByRole } = mount()
    const trigger = getByRole("button", { name: "File" })
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(queryByRole("menu")).toBeNull()
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(getAllByRole("menuitem").map((b) => b.textContent)).toEqual(["Rename", "Archive", "Delete"])
    expect((getByRole("menuitem", { name: "Archive" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("walks its items with the arrows, closes on Escape and gives the focus back", async () => {
    const { getByRole, queryByRole } = mount()
    const trigger = getByRole("button", { name: "File" })
    fireEvent.click(trigger)
    await Promise.resolve()
    fireEvent.keyDown(getByRole("menu"), { key: "ArrowDown" })
    expect(document.activeElement).toBe(getByRole("menuitem", { name: "Rename" }))
    fireEvent.keyDown(getByRole("menu"), { key: "ArrowUp" })
    expect(document.activeElement).toBe(getByRole("menuitem", { name: "Delete" }))
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(trigger)
    await w.frame(100)
    expect(queryByRole("menu")).toBeNull()
  })

  it("reports the item picked, closes, and gives the focus back", async () => {
    const { getByRole, onSelect } = mount()
    const trigger = getByRole("button", { name: "File" })
    fireEvent.click(trigger)
    fireEvent.click(getByRole("menuitem", { name: "Rename" }))
    expect(onSelect).toHaveBeenCalledWith("Rename")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(trigger)
  })

  it("closes on a press outside it, not on one inside", () => {
    vi.useFakeTimers()
    const { getByRole } = mount()
    const trigger = getByRole("button", { name: "File" })
    fireEvent.click(trigger)
    vi.runAllTimers()
    vi.useRealTimers()
    fireEvent.pointerDown(getByRole("menu"))
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    fireEvent.pointerDown(document.body)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })
})

describe("DitherPagination", () => {
  it("lists first, last, the current page and its neighbours", () => {
    expect(pageList(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageList(1, 20)).toEqual([1, 2, 3, 4, 5, "…", 20])
    expect(pageList(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20])
    expect(pageList(20, 20)).toEqual([1, "…", 16, 17, 18, 19, 20])
  })

  it("marks the current page and reports the page asked for", () => {
    const [page, setPage] = createSignal(1)
    const asked = vi.fn(setPage)
    const { getByRole } = render(() => <DitherPagination page={page()} total={20} onUpdatePage={asked} />)
    expect(getByRole("navigation", { name: "Pagination" })).toBeTruthy()
    expect((getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true)
    expect(getByRole("button", { name: "Page 1" }).getAttribute("aria-current")).toBe("page")
    fireEvent.click(getByRole("button", { name: "Page 1" }))
    expect(asked).not.toHaveBeenCalled()
    fireEvent.click(getByRole("button", { name: "Next page" }))
    expect(asked).toHaveBeenLastCalledWith(2)
    expect(getByRole("button", { name: "Page 2" }).getAttribute("aria-current")).toBe("page")
    fireEvent.click(getByRole("button", { name: "Page 20" }))
    expect(asked).toHaveBeenLastCalledWith(20)
    expect((getByRole("button", { name: "Next page" }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe("DitherRating", () => {
  it("is a slider that prints its stars at mount, and again as its value changes", () => {
    const [value, setValue] = createSignal(3)
    const { getByRole, container } = render(() => <DitherRating modelValue={value()} />)
    const rating = getByRole("slider", { name: "Rating" })
    expect(rating.getAttribute("aria-valuenow")).toBe("3")
    expect(rating.getAttribute("aria-valuemax")).toBe("5")
    expect(rating.getAttribute("aria-valuetext")).toBe("3 out of 5")
    const canvas = container.querySelector("canvas")!
    expect(w.uploads).toEqual([canvas])
    expect(canvas.width).toBe(55)
    setValue(4)
    expect(w.uploads.length).toBe(2)
  })

  it("answers the arrows, Home and End through its callback", () => {
    const changed = vi.fn()
    const { getByRole } = render(() => <DitherRating modelValue={3} onUpdateModelValue={changed} />)
    const rating = getByRole("slider")
    fireEvent.keyDown(rating, { key: "ArrowRight" })
    expect(changed).toHaveBeenLastCalledWith(4)
    fireEvent.keyDown(rating, { key: "ArrowDown" })
    expect(changed).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(rating, { key: "Home" })
    expect(changed).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(rating, { key: "End" })
    expect(changed).toHaveBeenLastCalledWith(5)
  })

  it("sets the star under a press, and clears one on the same star again", () => {
    const changed = vi.fn()
    const { getByRole } = render(() => <DitherRating modelValue={2} onUpdateModelValue={changed} />)
    const rating = getByRole("slider")
    box(rating)
    fireEvent.pointerDown(rating, { clientX: 150 })
    expect(changed).toHaveBeenLastCalledWith(4)
    fireEvent.pointerDown(rating, { clientX: 70 })
    expect(changed).toHaveBeenLastCalledWith(1)
  })

  it("read only, is an image that takes no input", () => {
    const changed = vi.fn()
    const { getByRole } = render(() => (
      <DitherRating modelValue={2} readonly label="Score" onUpdateModelValue={changed} />
    ))
    const rating = getByRole("img", { name: "Score" })
    expect(rating.hasAttribute("tabindex")).toBe(false)
    expect(rating.getAttribute("aria-readonly")).toBe("true")
    fireEvent.keyDown(rating, { key: "End" })
    expect(changed).not.toHaveBeenCalled()
  })
})

describe("DitherSlider", () => {
  it("prints its track in the first frame, and again as its value moves", async () => {
    const [value, setValue] = createSignal(20)
    const { container } = render(() => <DitherSlider modelValue={value()} label="Volume" />)
    const canvas = container.querySelector("canvas")!
    expect(w.uploads).toEqual([])
    await w.frame(100)
    expect(w.uploads).toEqual([canvas])
    setValue(30)
    expect(w.uploads.length).toBe(2)
  })

  it("names its thumb, and steps it with the keys within its range", () => {
    const [value, setValue] = createSignal<number | [number, number]>(98)
    const changed = vi.fn(setValue)
    const { getByRole } = render(() => (
      <DitherSlider modelValue={value()} step={5} label="Volume" onUpdateModelValue={changed} />
    ))
    const thumb = getByRole("slider", { name: "Volume" })
    expect(thumb.getAttribute("aria-valuenow")).toBe("98")
    expect(thumb.getAttribute("aria-valuemin")).toBe("0")
    expect(thumb.getAttribute("aria-valuemax")).toBe("100")
    thumb.focus()
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    expect(changed).toHaveBeenLastCalledWith(100)
    fireEvent.keyDown(thumb, { key: "ArrowLeft" })
    expect(changed).toHaveBeenLastCalledWith(95)
    fireEvent.keyDown(thumb, { key: "Home" })
    expect(changed).toHaveBeenLastCalledWith(0)
    // the same element through every move: the focus stays on it
    expect(getByRole("slider", { name: "Volume" })).toBe(thumb)
    expect(document.activeElement).toBe(thumb)
    expect(thumb.style.left).toBe("0%")
  })

  it("follows the pointer from a press to its release", () => {
    const changed = vi.fn()
    const { container } = render(() => <DitherSlider modelValue={0} onUpdateModelValue={changed} />)
    const root = container.firstElementChild!
    box(root)
    fireEvent.pointerDown(root, { pointerId: 1, clientX: 50 })
    expect(changed).toHaveBeenLastCalledWith(25)
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 120 })
    expect(changed).toHaveBeenLastCalledWith(60)
    fireEvent.pointerUp(root, { pointerId: 1 })
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 180 })
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it("as a range, has two named thumbs that meet but never cross", () => {
    const changed = vi.fn()
    const { getByRole, container } = render(() => (
      <DitherSlider modelValue={[20, 60]} label="Price" onUpdateModelValue={changed} />
    ))
    const lo = getByRole("slider", { name: "Price minimum" })
    const hi = getByRole("slider", { name: "Price maximum" })
    expect(lo.getAttribute("aria-valuemax")).toBe("60")
    expect(hi.getAttribute("aria-valuemin")).toBe("20")
    fireEvent.keyDown(lo, { key: "End" })
    expect(changed).toHaveBeenLastCalledWith([60, 60])
    fireEvent.keyDown(hi, { key: "ArrowRight" })
    expect(changed).toHaveBeenLastCalledWith([20, 61])
    // a press moves the nearer thumb
    const root = container.firstElementChild!
    box(root)
    fireEvent.pointerDown(root, { pointerId: 1, clientX: 20 })
    expect(changed).toHaveBeenLastCalledWith([10, 60])
  })

  it("disabled, takes no key, and shows its value only while a thumb is held", () => {
    const [disabled, setDisabled] = createSignal(true)
    const changed = vi.fn()
    const { getByRole, queryByText } = render(() => (
      <DitherSlider modelValue={42} label="Gain" showValue disabled={disabled()} onUpdateModelValue={changed} />
    ))
    const thumb = getByRole("slider", { name: "Gain" })
    expect(thumb.getAttribute("aria-disabled")).toBe("true")
    expect(thumb.tabIndex).toBe(-1)
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    expect(changed).not.toHaveBeenCalled()
    setDisabled(false)
    expect(queryByText("42")).toBeNull()
    fireEvent.focus(thumb)
    expect(queryByText("42")).not.toBeNull()
    fireEvent.blur(thumb)
    expect(queryByText("42")).toBeNull()
  })
})

describe("DitherTimeline", () => {
  it("lists its items, and prints a dot for each at mount", () => {
    const { getAllByRole, getByText, container } = render(() => (
      <DitherTimeline
        items={[
          { title: "Drafted", time: "09:00", body: "First pass." },
          { title: "Shipped", color: "green" },
        ]}
      />
    ))
    expect(getAllByRole("listitem").length).toBe(2)
    expect(getByText("Drafted")).toBeTruthy()
    expect(getByText("09:00")).toBeTruthy()
    expect(getByText("First pass.")).toBeTruthy()
    const dots = [...container.querySelectorAll("canvas")]
    expect(w.uploads).toEqual(dots)
    expect(dots[0].width).toBe(6)
  })
})

describe("DitherVideoPlayer", () => {
  it("without a source, shows an honest empty face and holds its controls", () => {
    const { getByRole, getByText, container } = render(() => <DitherVideoPlayer />)
    expect(getByRole("group", { name: "Video" })).toBeTruthy()
    expect(getByText("No source.")).toBeTruthy()
    expect(container.querySelector("video")).toBeNull()
    for (const name of ["Play", "Mute", "Playback speed 1x", "Fullscreen"])
      expect((getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true)
    expect(getByRole("slider", { name: "Seek" }).getAttribute("aria-disabled")).toBe("true")
  })

  it("plays and pauses from its key and from the keyboard, and follows the video", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
    const { getByRole, container } = render(() => <DitherVideoPlayer src="/film.mp4" label="Trailer" />)
    const host = getByRole("group", { name: "Trailer" })
    const video = container.querySelector("video")!
    expect(video.getAttribute("src")).toBe("/film.mp4")
    fireEvent.click(getByRole("button", { name: "Play" }))
    expect(play).toHaveBeenCalledTimes(1)
    fireEvent.play(video)
    expect(getByRole("button", { name: "Pause" })).toBeTruthy()
    vi.spyOn(video, "paused", "get").mockReturnValue(false)
    fireEvent.keyDown(host, { key: "k" })
    expect(pause).toHaveBeenCalledTimes(1)
    fireEvent.pause(video)
    expect(getByRole("button", { name: "Play" })).toBeTruthy()
    // a key a control inside owns is left to it
    fireEvent.keyDown(getByRole("button", { name: "Play" }), { key: " " })
    expect(pause).toHaveBeenCalledTimes(1)
  })

  it("mutes, changes speed and seeks", () => {
    const { getByRole, container } = render(() => <DitherVideoPlayer src="/film.mp4" />)
    const host = getByRole("group", { name: "Video" })
    const video = container.querySelector("video")!
    fireEvent.click(getByRole("button", { name: "Mute" }))
    expect(video.muted).toBe(true)
    expect(getByRole("button", { name: "Unmute" })).toBeTruthy()
    fireEvent.keyDown(host, { key: "m" })
    expect(video.muted).toBe(false)
    fireEvent.click(getByRole("button", { name: "Playback speed 1x" }))
    expect(video.playbackRate).toBe(1.25)
    expect(getByRole("button", { name: "Playback speed 1.25x" })).toBeTruthy()
    vi.spyOn(video, "duration", "get").mockReturnValue(60)
    fireEvent.durationChange(video)
    expect(getByRole("slider", { name: "Seek" }).getAttribute("aria-valuemax")).toBe("60")
    fireEvent.keyDown(getByRole("slider", { name: "Seek" }), { key: "End" })
    expect(video.currentTime).toBe(60)
    expect(getByRole("slider", { name: "Volume" })).toBeTruthy()
    fireEvent.keyDown(host, { key: "ArrowDown" })
    expect(video.volume).toBeCloseTo(0.9)
  })
})

describe("DurationText", () => {
  it("drops precision as the duration grows", () => {
    const [ms, setMs] = createSignal(500)
    const { container } = render(() => <DurationText ms={ms()} />)
    const read = (v: number) => (setMs(v), container.textContent)
    expect(container.textContent).toBe("500ms")
    expect(read(45_000)).toBe("45s")
    expect(read(125_000)).toBe("2m 5s")
    expect(read(80_400_000)).toBe("22h 20m")
    expect(read(90_000_000)).toBe("1d 1h")
  })
})

describe("EllipsisTooltip", () => {
  it("carries its full text as a title only while it is clipped", () => {
    const wide = vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(300)
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(120)
    const { getByText } = render(() => <EllipsisTooltip as="p"> A long file name </EllipsisTooltip>)
    const el = getByText("A long file name")
    expect(el.tagName).toBe("P")
    expect(el.getAttribute("title")).toBe("A long file name")
    wide.mockReturnValue(120)
    w.size()
    expect(el.hasAttribute("title")).toBe(false)
  })

  it("switched off, never takes a title", () => {
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(300)
    const { getByText } = render(() => <EllipsisTooltip enabled={false}>Name</EllipsisTooltip>)
    expect(getByText("Name").hasAttribute("title")).toBe(false)
  })
})

describe("GooeyMenu", () => {
  const ITEMS = [
    { value: "edit", label: "Edit" },
    { value: "share", label: "Share" },
  ]
  const mount = () => {
    const [open, setOpen] = createSignal(false)
    const changed = vi.fn(setOpen)
    const picked = vi.fn()
    return {
      ...render(() => <GooeyMenu items={ITEMS} modelValue={open()} onUpdateModelValue={changed} onSelect={picked} />),
      changed,
      picked,
    }
  }

  it("keeps its actions out of reach until its trigger opens it", () => {
    const { getByRole, changed } = mount()
    const trigger = getByRole("button", { name: "Actions" })
    const edit = getByRole("button", { name: "Edit" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(edit.tabIndex).toBe(-1)
    expect(edit.style.transform).toBe("translate(0px, 0px)")
    fireEvent.click(trigger)
    expect(changed).toHaveBeenLastCalledWith(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(edit.tabIndex).toBe(0)
    expect(edit.style.transform).toBe("translate(0px, -52px)")
    expect(getByRole("button", { name: "Share" }).style.transform).toBe("translate(0px, -104px)")
  })

  it("reports the action picked and closes; Escape closes too", () => {
    const { getByRole, changed, picked } = mount()
    const trigger = getByRole("button", { name: "Actions" })
    fireEvent.click(trigger)
    fireEvent.click(getByRole("button", { name: "Share" }))
    expect(picked).toHaveBeenCalledWith("share")
    expect(changed).toHaveBeenLastCalledWith(false)
    fireEvent.click(trigger)
    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(changed).toHaveBeenLastCalledWith(false)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("gives each menu a filter of its own", () => {
    const { container } = render(() => (
      <>
        <GooeyMenu items={ITEMS} />
        <GooeyMenu items={ITEMS} />
      </>
    ))
    const ids = [...container.querySelectorAll("filter")].map((f) => f.id)
    expect(new Set(ids).size).toBe(2)
    expect(ids.every((id) => id.startsWith("dk-goo-"))).toBe(true)
  })
})

describe("Heading", () => {
  it("is the heading of its level, level two unless told", () => {
    const { getByRole } = render(() => (
      <>
        <Heading>Kit</Heading>
        <Heading level="4" class="uppercase">
          Parts
        </Heading>
      </>
    ))
    expect(getByRole("heading", { level: 2, name: "Kit" }).className).toContain("text-lg")
    const parts = getByRole("heading", { level: 4, name: "Parts" })
    expect(parts.className).toContain("text-sm")
    expect(parts.className).toContain("uppercase")
  })
})

describe("InView", () => {
  it("tells its children when it comes into view, once", () => {
    const entered = vi.fn()
    const { getByText } = render(() => (
      <InView onEnter={entered}>{(scope) => <p>{scope.inView ? "seen" : "waiting"}</p>}</InView>
    ))
    expect(getByText("waiting")).toBeTruthy()
    w.show()
    expect(getByText("seen")).toBeTruthy()
    expect(entered).toHaveBeenCalledTimes(1)
  })

  it("without an observer, shows its children as in view", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const { getByText } = render(() => <InView>{(scope) => <p>{scope.inView ? "seen" : "waiting"}</p>}</InView>)
    expect(getByText("seen")).toBeTruthy()
  })
})

describe("PixelTransition", () => {
  it("covers its content with a cell for every square, each with its own delay", () => {
    const { getByText, container } = render(() => (
      <PixelTransition rows={2} cols={3} color="#abcdef">
        <p>Under</p>
      </PixelTransition>
    ))
    expect(getByText("Under")).toBeTruthy()
    const cells = [...container.querySelectorAll<HTMLElement>(".dither-cell")]
    expect(cells.length).toBe(6)
    expect(cells[0].style.transitionDelay).toBe("0ms")
    expect(new Set(cells.map((c) => c.style.transitionDelay)).size).toBe(6)
    expect(cells[0].parentElement!.getAttribute("aria-hidden")).toBe("true")
    expect(container.firstElementChild!.className).toContain("dither-pixeltrans")
  })
})

describe("ScrollFloat", () => {
  it("names its text once and floats each character in as the page scrolls to it", () => {
    vi.stubGlobal("innerHeight", 1000)
    const top = vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 750 } as DOMRect)
    const { getByLabelText, unmount } = render(() => <ScrollFloat text="a b" />)
    const chars = [...getByLabelText("a b").children] as HTMLElement[]
    expect(chars.map((c) => c.textContent)).toEqual(["a", " ", "b"])
    expect(chars[0].style.opacity).toBe("0.15")
    top.mockReturnValue({ top: 200 } as DOMRect)
    fireEvent.scroll(window)
    expect(chars[2].style.opacity).toBe("1")
    expect(chars[2].style.transform).toBe("translateY(0em)")
    unmount()
    top.mockClear()
    fireEvent.scroll(window)
    expect(top).not.toHaveBeenCalled()
  })
})

describe("Sequence", () => {
  const mount = (props: { paused?: boolean; onComplete?: () => void } = {}) =>
    render(() => (
      <Sequence as="ul" duration={0.1} stagger={0} {...props}>
        <li>One</li>
        <li>Two</li>
      </Sequence>
    ))

  it("plays its children once in view, and says when it is done", async () => {
    const done = vi.fn()
    const { getByText } = mount({ onComplete: done })
    const one = getByText("One")
    expect(one.parentElement!.tagName).toBe("UL")
    expect(one.parentElement!.className).toContain("dither-sequence")
    expect(one.hasAttribute("data-seq")).toBe(false)
    w.show()
    await w.frame(100)
    expect(one.style.getPropertyValue("--seq-p")).toBe("0.0000")
    expect(done).not.toHaveBeenCalled()
    await w.frame(150)
    await w.frame(250)
    expect(done).toHaveBeenCalledTimes(1)
    expect(one.style.getPropertyValue("--seq-p")).toBe("1.0000")
    expect(getByText("Two").style.getPropertyValue("--seq-p")).toBe("1.0000")
  })

  it("holds at its start while paused, and runs when the pause lifts", async () => {
    const [paused, setPaused] = createSignal(true)
    const done = vi.fn()
    const { getByText } = render(() => (
      <Sequence duration={0.1} stagger={0} paused={paused()} onComplete={done}>
        <p>One</p>
      </Sequence>
    ))
    w.show()
    await w.frame(100)
    await w.frame(400)
    expect(getByText("One").style.getPropertyValue("--seq-p")).toBe("0.0000")
    setPaused(false)
    await w.frame(500)
    await w.frame(600)
    await w.frame(700)
    expect(done).toHaveBeenCalledTimes(1)
  })
})

describe("SnapButton", () => {
  it("is a button with its default words, and fires from the keyboard", () => {
    const snapped = vi.fn()
    const { getByRole } = render(() => <SnapButton onSnap={snapped} aria-describedby="hint" />)
    const button = getByRole("button", { name: "Pull to confirm" }) as HTMLButtonElement
    expect(button.type).toBe("button")
    expect(button.getAttribute("aria-describedby")).toBe("hint")
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.keyDown(button, { key: " " })
    expect(snapped).toHaveBeenCalledTimes(2)
  })

  it("fires when a pull past its threshold lets go, and springs home from a short one", () => {
    const snapped = vi.fn()
    const { getByRole, queryByText } = render(() => <SnapButton onSnap={snapped}>Delete</SnapButton>)
    const button = getByRole("button", { name: "Delete" })
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 30, clientY: 40 })
    expect(button.style.transform).toBe("translate(30px, 0px)")
    expect(queryByText("armed, release to confirm")).toBeNull()
    fireEvent.pointerUp(button, { pointerId: 1 })
    expect(snapped).not.toHaveBeenCalled()
    expect(button.style.transform).toBe("translate(0px, 0px)")
    fireEvent.pointerDown(button, { pointerId: 2, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(button, { pointerId: 2, clientX: 80, clientY: 0 })
    expect(queryByText("armed, release to confirm")).not.toBeNull()
    fireEvent.pointerUp(button, { pointerId: 2 })
    expect(snapped).toHaveBeenCalledTimes(1)
  })

  it("disabled, answers neither the pull nor the keys", () => {
    const snapped = vi.fn()
    const { getByRole } = render(() => <SnapButton disabled onSnap={snapped} />)
    const button = getByRole("button") as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 90 })
    expect(button.style.transform).toBe("translate(0px, 0px)")
    expect(snapped).not.toHaveBeenCalled()
  })
})

describe("Truncate", () => {
  it("clips its content to one line in the element asked for, title and all", () => {
    const { getByText } = render(() => (
      <Truncate as="p" title="The whole name" class="w-20">
        The whole name
      </Truncate>
    ))
    const el = getByText("The whole name")
    expect(el.tagName).toBe("P")
    expect(el.getAttribute("title")).toBe("The whole name")
    expect(el.className).toContain("truncate")
    expect(el.className).toContain("w-20")
  })
})
