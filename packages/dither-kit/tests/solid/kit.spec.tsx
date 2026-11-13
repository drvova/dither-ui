// The Solid kit's first components, held to what their Vue twins did: each
// prints through the shared engine, follows its props, and lets go of what
// it listened to when it leaves.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal, type JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DitherAurora,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  DitherHeatTrail,
  DitherPoster,
  DitherScreen,
  DitherSpinner,
  surfaceOf,
} from "../../src/solid"
import * as aurora from "../../src/engine/aurora"
import { hexToRgb } from "../../src/engine/palette"
import { SCREENS, screenMatrix } from "../../src/engine/pixel"
import * as poster from "../../src/engine/poster"
import * as precompile from "../../src/engine/precompile"
import { world } from "../support/world"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

describe("DitherAurora", () => {
  it("paints its canvas once in view, and registers it as a surface", async () => {
    const { container } = render(() => <DitherAurora />)
    const canvas = container.querySelector("canvas")!
    w.show()
    await w.frame(100)
    expect(w.uploads).toContain(canvas)
    expect(surfaceOf(canvas)?.raster()).not.toBeNull()
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <DitherAurora precompiled="data:image/png;base64,AAAA" />)
    w.show()
    await w.frame(100)
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })

  it("holds while paused after its first frame, and runs again when the pause lifts", async () => {
    const [paused, setPaused] = createSignal(true)
    render(() => <DitherAurora paused={paused()} />)
    w.show()
    await w.frame(100)
    await w.frame(200)
    expect(w.uploads.length).toBe(1)
    setPaused(false)
    await w.frame(300)
    expect(w.uploads.length).toBe(2)
  })

  it("stops painting once it has left the page", async () => {
    const { unmount } = render(() => <DitherAurora />)
    w.show()
    await w.frame(100)
    unmount()
    await w.frame(200)
    expect(w.uploads.length).toBe(1)
  })
})

describe("a surface holding a still frame", () => {
  const still = async (ui: () => JSX.Element) => {
    const { container } = render(ui)
    w.show()
    await w.frame(100)
    await w.frame(200)
    return container
  }

  it("prints again when a colour it was printed from changes", async () => {
    const paint = vi.spyOn(aurora, "paintAurora")
    const [colors, setColors] = createSignal(["#ff0000", "#00ff00"])
    await still(() => <DitherAurora renderMode="static" colors={colors()} />)
    expect(w.uploads.length).toBe(1)
    const clock = paint.mock.lastCall?.[2]
    setColors(["#0000ff", "#ffffff"])
    await w.frame(300)
    expect(w.uploads.length).toBe(2)
    expect(paint.mock.lastCall?.[1].colors[0]).toEqual(hexToRgb("#0000ff"))
    // the same moment: the run did not start over
    expect(paint.mock.lastCall?.[2]).toBe(clock)
    await w.frame(400)
    expect(w.uploads.length).toBe(2)
  })

  it("prints again through the screen around it when that changes", async () => {
    const paint = vi.spyOn(aurora, "paintAurora")
    const [screen, setScreen] = createSignal<"line" | "dot">("line")
    await still(() => (
      <DitherScreen screen={screen()}>
        <DitherAurora renderMode="static" />
      </DitherScreen>
    ))
    expect(paint.mock.lastCall?.[3]).toBe(SCREENS.line)
    setScreen("dot")
    await w.frame(300)
    expect(w.uploads.length).toBe(2)
    expect(paint.mock.lastCall?.[3]).toBe(SCREENS.dot)
  })

  it("prints once for a change that also restarts it", async () => {
    const [seed, setSeed] = createSignal(1)
    await still(() => <DitherAurora renderMode="static" seed={seed()} />)
    setSeed(2)
    await w.frame(300)
    await w.frame(400)
    expect(w.uploads.length).toBe(2)
  })

  it("prints a paused surface again, once, and leaves it paused", async () => {
    const [colors, setColors] = createSignal(["#ff0000", "#00ff00"])
    await still(() => <DitherAurora paused colors={colors()} />)
    expect(w.uploads.length).toBe(1)
    setColors(["#0000ff", "#ffffff"])
    await w.frame(300)
    await w.frame(400)
    expect(w.uploads.length).toBe(2)
  })

  it("a running surface paints once a frame, whatever changes", async () => {
    const [colors, setColors] = createSignal(["#ff0000", "#00ff00"])
    await still(() => <DitherAurora colors={colors()} />)
    const before = w.uploads.length
    setColors(["#0000ff", "#ffffff"])
    await Promise.resolve()
    expect(w.uploads.length).toBe(before)
    await w.frame(300)
    expect(w.uploads.length).toBe(before + 1)
  })

  it("a static spinner and an avatar follow the screen around them, a gradient its seed", async () => {
    const gradient = vi.spyOn(precompile, "renderDitherGradient")
    const [screen, setScreen] = createSignal<"line" | "dot">("line")
    const [seed, setSeed] = createSignal(1)
    const container = await still(() => (
      <DitherScreen screen={screen()}>
        <DitherSpinner renderMode="static" />
        <DitherAvatar name="Ada" animate={false} />
        <DitherGradient from="blue" to="green" direction="up" cell={3} opacity={1} bloom="off" seed={seed()} />
      </DitherScreen>
    ))
    await new Promise((done) => setTimeout(done, 5))
    const [spinner, avatar] = [...container.querySelectorAll("canvas")]
    const prints = (canvas: HTMLCanvasElement) => w.uploads.filter((c) => c === canvas).length
    expect([prints(spinner), prints(avatar)]).toEqual([1, 1])
    setScreen("dot")
    await w.frame(300)
    expect([prints(spinner), prints(avatar)]).toEqual([2, 2])
    const before = gradient.mock.calls.length
    setSeed(2)
    expect(gradient.mock.calls.length).toBe(before + 1)
    expect(gradient.mock.lastCall?.[0].seed).toBe(2)
  })
})

describe("DitherScreen", () => {
  it("hands the surfaces inside it its screen, and follows a change", async () => {
    const paint = vi.spyOn(poster, "paintPoster")
    const [screen, setScreen] = createSignal<"line" | "dot">("line")
    render(() => (
      <DitherScreen screen={screen()}>
        <DitherPoster />
      </DitherScreen>
    ))
    w.show()
    await w.frame(100)
    expect(paint.mock.lastCall?.[2].screen).toBe("line")
    setScreen("dot")
    await w.frame(200)
    await w.frame(300)
    expect(paint.mock.lastCall?.[2].screen).toBe("dot")
  })

  it("leaves a surface outside any screen on the Bayer matrix", async () => {
    const paint = vi.spyOn(poster, "paintPoster")
    render(() => <DitherPoster />)
    w.show()
    await w.frame(100)
    expect(paint.mock.lastCall?.[2].screen).toBe("bayer")
    expect(screenMatrix("bayer", undefined).length).toBe(4)
  })
})

describe("DitherHeatTrail", () => {
  const over = (el: Element) =>
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 200 } as DOMRect)

  it("prints nothing until the pointer moves over it, then paints while it cools", async () => {
    const { container } = render(() => <DitherHeatTrail cool={0.2} />)
    over(container.firstElementChild!)
    w.show()
    await w.frame(100)
    const still = w.uploads.length
    await w.frame(200)
    expect(w.uploads.length).toBe(still)
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100, pointerType: "mouse" })
    await w.frame(300)
    expect(w.uploads.length).toBeGreaterThan(still)
  })

  it("leaves a finger to scroll, and stops listening when it leaves the page", async () => {
    const { container, unmount } = render(() => <DitherHeatTrail />)
    const box = over(container.firstElementChild!)
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100, pointerType: "touch" })
    expect(box).not.toHaveBeenCalled()
    unmount()
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100, pointerType: "mouse" })
    expect(box).not.toHaveBeenCalled()
  })
})

describe("DitherButton", () => {
  it("is a real button: its label, its type, and every listener and ARIA name it is given", () => {
    const pressed = vi.fn()
    const { getByRole } = render(() => (
      <DitherButton onClick={pressed} aria-label="Save the frame">
        Save
      </DitherButton>
    ))
    const button = getByRole("button", { name: "Save the frame" }) as HTMLButtonElement
    expect(button.type).toBe("button")
    expect(button.textContent).toBe("Save")
    fireEvent.click(button)
    expect(pressed).toHaveBeenCalledTimes(1)
  })

  it("cannot be pressed while loading, and says it is busy", () => {
    const pressed = vi.fn()
    const { getByRole } = render(() => (
      <DitherButton loading onClick={pressed}>
        Save
      </DitherButton>
    ))
    const button = getByRole("button") as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute("aria-busy")).toBe("true")
    fireEvent.click(button)
    expect(pressed).not.toHaveBeenCalled()
  })

  it("prints its fill at the size the observer reports, never from a layout read", async () => {
    const { getByRole } = render(() => <DitherButton cell={2}>Save</DitherButton>)
    const button = getByRole("button")
    const read = vi.spyOn(button, "getBoundingClientRect")
    await w.frame(16)
    w.size()
    const canvas = button.querySelector("canvas")!
    expect([canvas.width, canvas.height]).toEqual([48, 20])
    expect(w.uploads).toContain(canvas)
    expect(read).not.toHaveBeenCalled()
  })

  it("sizes its canvas to the capped raster, so none of it is left unpainted", async () => {
    const { getByRole } = render(() => (
      <DitherButton cell={2} maxCols={16} maxRows={8}>
        Save
      </DitherButton>
    ))
    await w.frame(16)
    w.size()
    const canvas = getByRole("button").querySelector("canvas")!
    expect([canvas.width, canvas.height]).toEqual([16, 8])
  })

  it("prints again when only its seed changes", async () => {
    const [seed, setSeed] = createSignal(1)
    const { getByRole } = render(() => (
      <DitherButton color="blue" variant="gradient" bloom="off" cell={2} seed={seed()}>
        Save
      </DitherButton>
    ))
    await w.frame(16)
    w.size()
    const canvas = getByRole("button").querySelector("canvas")!
    const before = w.uploads.filter((c) => c === canvas).length
    setSeed(2)
    await w.frame(32)
    w.size()
    expect(w.uploads.filter((c) => c === canvas).length).toBeGreaterThan(before)
  })

  it("keeps the focus ring in the theme's ring ink", () => {
    const { getByRole } = render(() => <DitherButton>Save</DitherButton>)
    expect(getByRole("button").className).toContain("focus-visible:ring-ring")
  })
})
