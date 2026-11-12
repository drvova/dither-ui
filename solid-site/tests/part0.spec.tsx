// The Solid kit's backgrounds from Balatro to Ferrofluid, the shader and
// the world, held to what their Vue twins do: each paints through the
// shared loop once in view, gives way to a precompiled image, follows the
// pointer where its twin does, and lets go of what it listened to.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as ballpit from "../../dither-kit/engine/ballpit"
import * as dotField from "../../dither-kit/engine/dot-field"
import * as dotGrid from "../../dither-kit/engine/dot-grid"
import * as evilEye from "../../dither-kit/engine/evil-eye"
import * as faultyTerminal from "../../dither-kit/engine/faulty-terminal"
import * as ferrofluid from "../../dither-kit/engine/ferrofluid"
import type { GlHandle } from "../../dither-kit/engine/gl"
import type { PrecompiledDither } from "../../dither-kit/engine/precompile"
import Balatro from "../../dither-kit/solid/Balatro"
import Ballpit from "../../dither-kit/solid/Ballpit"
import Beams from "../../dither-kit/solid/Beams"
import Circuit from "../../dither-kit/solid/Circuit"
import ColorBends from "../../dither-kit/solid/ColorBends"
import Cubes from "../../dither-kit/solid/Cubes"
import DarkVeil from "../../dither-kit/solid/DarkVeil"
import Dither from "../../dither-kit/solid/Dither"
import DitherShader, { type DitherShaderApi } from "../../dither-kit/solid/DitherShader"
import DitherWorld, { type DitherWorldApi } from "../../dither-kit/solid/DitherWorld"
import DotField from "../../dither-kit/solid/DotField"
import DotGrid from "../../dither-kit/solid/DotGrid"
import EvilEye from "../../dither-kit/solid/EvilEye"
import FaultyTerminal from "../../dither-kit/solid/FaultyTerminal"
import Ferrofluid from "../../dither-kit/solid/Ferrofluid"
import { surfaceOf } from "../../dither-kit/solid/runtime/surface"
import { world } from "./world"

// The GPU the shader draws on: none unless a spec hands one over.
const gpu = vi.hoisted(() => ({ handle: null as unknown }))
vi.mock("../../dither-kit/engine/gl", async (original) => ({
  ...(await original<typeof import("../../dither-kit/engine/gl")>()),
  createGl: () => gpu.handle,
  startProgram: () => ({}),
  programReady: () => true,
  finishProgram: () => ({}),
  dropProgram: () => {},
}))

/** A context that takes every call and names each uniform's location after
 * the uniform, with the handle around it. */
function fakeGl() {
  const calls: Record<string, ReturnType<typeof vi.fn>> = {}
  const gl = new Proxy(
    {},
    {
      get: (_, key: string) =>
        key === "getUniformLocation" ? (_p: unknown, name: string) => name : (calls[key] ??= vi.fn()),
    },
  )
  const disposed = vi.fn()
  const pixels = (out: Uint8Array) => out
  const handle = {
    gl,
    webgl2: true,
    lost: () => false,
    size: (width: number, height: number) => (handle.cells = width * height),
    cells: 0,
    read: () => new Uint8Array(handle.cells * 4),
    readBehind: () => pixels(new Uint8Array(handle.cells * 4)),
    dispose: disposed,
  }
  gpu.handle = handle as unknown as GlHandle
  return { calls, disposed }
}

/** The last value sent to the uniform `name` through `call`. */
const sent = (call: ReturnType<typeof vi.fn>, name: string) => call.mock.calls.filter((args) => args[0] === name).at(-1)

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  gpu.handle = null
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

const IMAGE = "data:image/png;base64,AAAA"
const box = (el: Element) =>
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 200 } as DOMRect)

const BACKGROUNDS: [string, (props: { precompiled?: PrecompiledDither }) => JSX.Element][] = [
  ["Balatro", Balatro],
  ["Ballpit", Ballpit],
  ["Beams", Beams],
  ["Circuit", Circuit],
  ["ColorBends", ColorBends],
  ["Cubes", Cubes],
  ["DarkVeil", DarkVeil],
  ["Dither", Dither],
  ["DotField", DotField],
  ["DotGrid", DotGrid],
  ["EvilEye", EvilEye],
  ["FaultyTerminal", FaultyTerminal],
  ["Ferrofluid", Ferrofluid],
]

describe.each(BACKGROUNDS)("%s", (_name, Background) => {
  it("paints its canvas once in view, registers it as a surface, and stops once it has left", async () => {
    const { container, unmount } = render(() => <Background />)
    const canvas = container.querySelector("canvas")!
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true")
    await w.frame(50)
    expect(w.uploads).toEqual([])
    w.show()
    await w.frame(100)
    expect(w.uploads).toContain(canvas)
    expect(surfaceOf(canvas)?.raster()).not.toBeNull()
    const painted = w.uploads.length
    unmount()
    await w.frame(200)
    expect(w.uploads.length).toBe(painted)
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <Background precompiled={IMAGE} />)
    w.show()
    await w.frame(100)
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe(IMAGE)
    expect(w.uploads).toEqual([])
  })
})

type Follower = (props: { mouseInteraction?: boolean }) => JSX.Element
const FOLLOWERS: [string, Follower, () => ReturnType<typeof vi.spyOn>][] = [
  ["Ballpit", Ballpit, () => vi.spyOn(ballpit, "paintBallpit")],
  ["DotField", DotField, () => vi.spyOn(dotField, "paintDotField")],
  ["DotGrid", DotGrid, () => vi.spyOn(dotGrid, "paintDotGrid")],
  ["EvilEye", EvilEye, () => vi.spyOn(evilEye, "paintEvilEye")],
  [
    "FaultyTerminal",
    (props) => <FaultyTerminal mouseReact={props.mouseInteraction} />,
    () => vi.spyOn(faultyTerminal, "paintFaultyTerminal"),
  ],
  [
    "Ferrofluid",
    (props) => <Ferrofluid mouseDampening={0} mouseInteraction={props.mouseInteraction} />,
    () => vi.spyOn(ferrofluid, "paintFerrofluid"),
  ],
]

describe.each(FOLLOWERS)("%s and the pointer", (_name, Background, spy) => {
  it("paints with the pointer where it is over the canvas, from the centre until it moves", async () => {
    const paint = spy()
    const { container } = render(() => <Background />)
    box(container.querySelector("canvas")!)
    w.show()
    await w.frame(100)
    expect(paint.mock.lastCall?.[4]).toEqual({ x: 0.5, y: 0.5 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 50 })
    await w.frame(200)
    expect(paint.mock.lastCall?.[4]).toEqual({ x: 0.25, y: 0.25 })
  })

  it("paints without a pointer when told not to follow it", async () => {
    const paint = spy()
    render(() => <Background mouseInteraction={false} />)
    w.show()
    await w.frame(100)
    expect(paint).toHaveBeenCalled()
    expect(paint.mock.lastCall?.[4]).toBeNull()
  })

  it("stops listening to the window when it leaves the page", () => {
    const { container, unmount } = render(() => <Background />)
    const read = box(container.querySelector("canvas")!)
    fireEvent.pointerMove(window, { clientX: 100, clientY: 50 })
    expect(read).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 })
    expect(read).toHaveBeenCalledTimes(1)
  })
})

describe("FaultyTerminal", () => {
  it("fades in from black on a page load animation, by the time since it started", async () => {
    const paint = vi.spyOn(faultyTerminal, "paintFaultyTerminal")
    // The run starts on the page's own clock: here, a second into this
    // world's frame stamps.
    let origin = 0
    requestAnimationFrame((stamp) => (origin = stamp))
    await w.frame(0)
    vi.stubGlobal("performance", { now: () => origin + 1000 })
    render(() => <FaultyTerminal pageLoadAnimation />)
    w.show()
    await w.frame(1090)
    expect(paint.mock.lastCall?.[5]).toBeCloseTo(0.1)
    await w.frame(1450)
    expect(paint.mock.lastCall?.[5]).toBeCloseTo(0.5)
    await w.frame(2000)
    expect(paint.mock.lastCall?.[5]).toBe(1)
  })

  it("holds while its `pause` is set", async () => {
    render(() => <FaultyTerminal pause />)
    w.show()
    await w.frame(100)
    await w.frame(200)
    expect(w.uploads.length).toBe(1)
  })
})

describe("DitherShader", () => {
  it("is a named image that paints once in view, and says so where there is no WebGL", async () => {
    const { getByRole } = render(() => <DitherShader label="Plasma" />)
    const shader = getByRole("img", { name: "Plasma" })
    expect(shader.getAttribute("data-state")).toBe("ready")
    w.show()
    await w.frame(100)
    expect(w.uploads).toContain(shader.querySelector("canvas"))
    expect(shader.getAttribute("data-state")).toBe("unsupported")
    expect(shader.querySelector("p")?.textContent).toBe("WebGL is not available")
  })

  it("hands its surface to its ref", async () => {
    let api: DitherShaderApi | undefined
    const { container } = render(() => <DitherShader ref={(a) => (api = a)} />)
    w.show()
    await w.frame(100)
    expect(api?.surface.raster()).not.toBeNull()
    expect(api?.surface).toBe(surfaceOf(container.querySelector("canvas")!))
  })

  it("draws its program with the clock and the pointer, and lets the context go when it leaves", async () => {
    const { calls, disposed } = fakeGl()
    const { getByRole, unmount } = render(() => <DitherShader source="void main(){}" speed={2} />)
    const shader = getByRole("img")
    box(shader)
    w.show()
    await w.frame(100)
    expect(calls.drawArrays).toHaveBeenCalled()
    expect(shader.getAttribute("data-state")).toBe("ready")
    expect(shader.querySelector("p")).toBeNull()
    fireEvent.pointerMove(shader, { clientX: 100, clientY: 50 })
    await w.frame(200)
    const [, cols, rows] = sent(calls.uniform3f, "iResolution") as number[]
    // GLSL's origin is the bottom left: a quarter down is three quarters up.
    expect(sent(calls.uniform4f, "iMouse")).toEqual(["iMouse", 0.25 * cols, 0.75 * rows, 0, 0])
    expect(sent(calls.uniform1f, "iTime")).toEqual(["iTime", (sent(calls.uniform1f, "time") as number[])[1]])
    unmount()
    expect(disposed).toHaveBeenCalledTimes(1)
  })

  it("leaves the pointer alone when it is not interactive", async () => {
    const { calls } = fakeGl()
    const { getByRole } = render(() => <DitherShader interactive={false} />)
    const shader = getByRole("img")
    box(shader)
    w.show()
    fireEvent.pointerMove(shader, { clientX: 100, clientY: 50 })
    await w.frame(100)
    expect(sent(calls.uniform4f, "iMouse")).toEqual(["iMouse", 0, 0, 0, 0])
  })

  it("fetches a file once mounted, saying it is loading, then that it could not", async () => {
    let reject: (e: Error) => void = () => {}
    const fetched = vi.fn(() => new Promise<Response>((_, no) => (reject = no)))
    vi.stubGlobal("fetch", fetched)
    const { getByRole } = render(() => <DitherShader src="/shaders/plasma.frag" />)
    const shader = getByRole("img")
    expect(fetched).toHaveBeenCalledTimes(1)
    expect(fetched.mock.lastCall?.[0 as never]).toBe("/shaders/plasma.frag")
    expect(shader.getAttribute("data-state")).toBe("loading")
    expect(shader.querySelector("p")?.textContent).toBe("loading shader")
    reject(new Error("offline"))
    await vi.waitFor(() => expect(shader.getAttribute("data-state")).toBe("error"))
    expect(shader.querySelector("p")?.textContent).toBe("could not load the shader")
  })
})

describe("DitherWorld", () => {
  it("is a named, focusable image of the sample model, painted on the CPU once in view", async () => {
    const { getByRole } = render(() => <DitherWorld label="A teapot" />)
    const model = getByRole("img", { name: "A teapot" })
    expect(model.getAttribute("data-state")).toBe("ready")
    expect(model.tabIndex).toBe(0)
    expect(model.querySelectorAll("canvas").length).toBe(1)
    w.show()
    await w.frame(100)
    expect(w.uploads).toContain(model.querySelector("canvas"))
    expect(model.getAttribute("data-engine")).toBe("cpu")
    expect(model.querySelector("p")).toBeNull()
  })

  it("hands its surface to its ref", async () => {
    let api: DitherWorldApi | undefined
    const { container } = render(() => <DitherWorld ref={(a) => (api = a)} />)
    w.show()
    await w.frame(100)
    expect(api?.surface.raster()).not.toBeNull()
    expect(api?.surface).toBe(surfaceOf(container.querySelector("canvas")!))
  })

  it("says when a model has no geometry", () => {
    const { getByRole } = render(() => <DitherWorld source="#VRML V2.0 utf8" format="vrml" />)
    const model = getByRole("img")
    expect(model.getAttribute("data-state")).toBe("empty")
    expect(model.querySelector("p")?.textContent).toBe("no geometry")
  })

  it("turns under the arrow keys and repaints, and leaves other keys to the page", async () => {
    const { getByRole } = render(() => <DitherWorld paused autoRotate={0} />)
    const model = getByRole("img")
    w.show()
    await w.frame(100)
    await w.frame(200)
    expect(w.uploads.length).toBe(1)
    expect(fireEvent.keyDown(model, { key: "ArrowLeft" })).toBe(false)
    await w.frame(300)
    await w.frame(400)
    expect(w.uploads.length).toBe(2)
    expect(fireEvent.keyDown(model, { key: "a" })).toBe(true)
  })

  it("turns under a drag across it", async () => {
    const { getByRole } = render(() => <DitherWorld paused autoRotate={0} />)
    const model = getByRole("img")
    box(model)
    w.show()
    await w.frame(100)
    fireEvent.pointerDown(model, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(model, { pointerId: 1, clientX: 180, clientY: 100 })
    fireEvent.pointerUp(model, { pointerId: 1 })
    await w.frame(200)
    await w.frame(300)
    expect(w.uploads.length).toBe(2)
    fireEvent.pointerMove(model, { pointerId: 1, clientX: 260, clientY: 100 })
    await w.frame(400)
    await w.frame(500)
    expect(w.uploads.length).toBe(2)
  })

  it("is out of the tab order, and holds its pose, when it is not interactive", () => {
    const { getByRole } = render(() => <DitherWorld interactive={false} />)
    const model = getByRole("img")
    expect(model.hasAttribute("tabindex")).toBe(false)
    expect(fireEvent.keyDown(model, { key: "ArrowLeft" })).toBe(true)
  })

  it("copies each paint onto a glow layer when it blooms", async () => {
    const { getByRole } = render(() => <DitherWorld bloom="low" />)
    const [canvas, glow] = getByRole("img").querySelectorAll("canvas")
    expect(glow.getAttribute("aria-hidden")).toBe("true")
    expect(glow.style.mixBlendMode).toBe("plus-lighter")
    w.show()
    await w.frame(100)
    expect([glow.width, glow.height]).toEqual([canvas.width, canvas.height])
  })

  it("fetches a file once mounted, saying it is loading, then that it could not", async () => {
    let reject: (e: Error) => void = () => {}
    const fetched = vi.fn(() => new Promise<Response>((_, no) => (reject = no)))
    vi.stubGlobal("fetch", fetched)
    const { getByRole } = render(() => <DitherWorld src="/models/teapot.obj" />)
    const model = getByRole("img")
    expect(fetched).toHaveBeenCalledTimes(1)
    expect(model.getAttribute("data-state")).toBe("loading")
    expect(model.querySelector("p")?.textContent).toBe("loading model")
    reject(new Error("offline"))
    await vi.waitFor(() => expect(model.getAttribute("data-state")).toBe("error"))
    expect(model.querySelector("p")?.textContent).toBe("could not load the model")
  })
})
