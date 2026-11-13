// The Solid ports of the field backgrounds from Plasma to Waves, held to
// what their Vue twins did: each paints its canvas once in view, shows a
// precompiled image in its place, and the ones that follow the pointer
// listen on the window only while they are on the page.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { Component } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as ribbons from "@dither-kit/engine/ribbons"
import * as shapeBlur from "@dither-kit/engine/shape-blur"
import * as waves from "@dither-kit/engine/waves"
import Plasma from "../../dither-kit/solid/Plasma"
import PlasmaWave from "../../dither-kit/solid/PlasmaWave"
import Prism from "../../dither-kit/solid/Prism"
import PrismaticBurst from "../../dither-kit/solid/PrismaticBurst"
import RadarSweep from "../../dither-kit/solid/RadarSweep"
import Ribbons from "../../dither-kit/solid/Ribbons"
import RippleGrid from "../../dither-kit/solid/RippleGrid"
import { surfaceOf } from "../../dither-kit/solid/runtime/surface"
import ShapeBlur from "../../dither-kit/solid/ShapeBlur"
import ShapeGrid from "../../dither-kit/solid/ShapeGrid"
import SideRays from "../../dither-kit/solid/SideRays"
import Silk from "../../dither-kit/solid/Silk"
import SoftAurora from "../../dither-kit/solid/SoftAurora"
import Strands from "../../dither-kit/solid/Strands"
import Threads from "../../dither-kit/solid/Threads"
import Waves from "../../dither-kit/solid/Waves"
import { world } from "./world"

type Background = Component<{ precompiled?: string; mouseInteraction?: boolean }>
type Pointer = { x: number; y: number } | null

const BACKGROUNDS: Record<string, Background> = {
  Plasma,
  PlasmaWave,
  Prism,
  PrismaticBurst,
  RadarSweep,
  Ribbons,
  RippleGrid,
  ShapeBlur,
  ShapeGrid,
  SideRays,
  Silk,
  SoftAurora,
  Strands,
  Threads,
  Waves,
}

/** The backgrounds that lean to the pointer, each with a spy on its painter. */
const POINTED: Record<string, { Background: Background; paint: () => { mock: { lastCall?: unknown[] } } }> = {
  Ribbons: { Background: Ribbons, paint: () => vi.spyOn(ribbons, "paintRibbons") },
  ShapeBlur: { Background: ShapeBlur, paint: () => vi.spyOn(shapeBlur, "paintShapeBlur") },
  Waves: { Background: Waves, paint: () => vi.spyOn(waves, "paintWaves") },
}

let w: ReturnType<typeof world>
// The kit's paints share one budget per frame, booked by the frame's stamp
// (`engine/frame-budget.ts`): every frame here carries its own, so one
// spec's paint never counts against the next one's.
let now = 0
const tick = () => w.frame((now += 100))
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

describe.each(Object.entries(BACKGROUNDS))("%s", (_name, Background) => {
  it("paints its canvas once in view, and registers it as a surface", async () => {
    const { container } = render(() => <Background />)
    const canvas = container.querySelector("canvas")!
    expect(w.uploads).toEqual([])
    w.show()
    await tick()
    expect(w.uploads).toContain(canvas)
    expect(surfaceOf(canvas)?.raster()).not.toBeNull()
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <Background precompiled="data:image/png;base64,AAAA" />)
    w.show()
    await tick()
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })

  it("stops painting once it has left the page", async () => {
    const { unmount } = render(() => <Background />)
    w.show()
    await tick()
    unmount()
    await tick()
    expect(w.uploads.length).toBe(1)
  })
})

describe.each(Object.entries(POINTED))("%s under the pointer", (_name, { Background, paint }) => {
  const over = (el: Element) =>
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 200 } as DOMRect)
  const pointer = (spy: { mock: { lastCall?: unknown[] } }) => spy.mock.lastCall?.[4] as Pointer

  it("hands its painter the pointer as a fraction of the canvas, from the centre until it moves", async () => {
    const spy = paint()
    const { container } = render(() => <Background />)
    over(container.querySelector("canvas")!)
    w.show()
    await tick()
    expect(pointer(spy)).toEqual({ x: 0.5, y: 0.5 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 150 })
    await tick()
    expect(pointer(spy)).toEqual({ x: 0.25, y: 0.75 })
  })

  it("paints without a pointer when the interaction is off", async () => {
    const spy = paint()
    render(() => <Background mouseInteraction={false} />)
    w.show()
    await tick()
    expect(pointer(spy)).toBeNull()
  })

  it("stops listening when it leaves the page", () => {
    const { container, unmount } = render(() => <Background />)
    const box = over(container.querySelector("canvas")!)
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
    expect(box).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
    expect(box).toHaveBeenCalledTimes(1)
  })
})
