// The Solid kit's backgrounds, second sheet: each mounts and prints through
// the shared surface loop once in view, shows a precompiled image in place
// of its canvas, and the grid that leans from the pointer lets go of it.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { Component } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as gridDistortion from "../../src/engine/grid-distortion"
import * as flowField from "../../src/engine/flow-field"
import type { PrecompiledDither } from "../../src/engine/precompile"
import FloatingLines from "../../src/solid/FloatingLines"
import FlowField from "../../src/solid/FlowField"
import Galaxy from "../../src/solid/Galaxy"
import GradientBlinds from "../../src/solid/GradientBlinds"
import Grainient from "../../src/solid/Grainient"
import GridDistortion from "../../src/solid/GridDistortion"
import GridMotion from "../../src/solid/GridMotion"
import GridScan from "../../src/solid/GridScan"
import Hyperspeed from "../../src/solid/Hyperspeed"
import Iridescence from "../../src/solid/Iridescence"
import LaserFlow from "../../src/solid/LaserFlow"
import LetterGlitch from "../../src/solid/LetterGlitch"
import LightPillar from "../../src/solid/LightPillar"
import { surfaceOf } from "../../src/solid/runtime/surface"
import { world } from "../support/world"

const BACKGROUNDS: Record<string, Component<{ precompiled?: PrecompiledDither }>> = {
  FloatingLines,
  FlowField,
  Galaxy,
  GradientBlinds,
  Grainient,
  GridDistortion,
  GridMotion,
  GridScan,
  Hyperspeed,
  Iridescence,
  LaserFlow,
  LetterGlitch,
  LightPillar,
}

let w: ReturnType<typeof world>
// The kit books every surface's paint against one budget per frame stamp
// (`engine/frame-budget.ts`), so each spec paints in a frame of its own.
let stamp = 0
const next = () => (stamp += 100)
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
    w.show()
    await w.frame(next())
    expect(w.uploads).toContain(canvas)
    expect(surfaceOf(canvas)?.raster()).not.toBeNull()
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <Background precompiled="data:image/png;base64,AAAA" />)
    w.show()
    await w.frame(next())
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AAAA")
    expect(w.uploads).toEqual([])
  })
})

describe("FlowField", () => {
  it("fades its edges through the mask it is given, on the wrapper", () => {
    const { container } = render(() => <FlowField mask="linear" mixBlendMode="screen" />)
    const wrap = container.firstElementChild as HTMLElement
    expect(wrap.style.maskImage || wrap.style.getPropertyValue("mask-image")).toContain("linear-gradient")
    expect(wrap.style.mixBlendMode).toBe("screen")
  })

  it("hands the painter its seed, the frame's step and the time run", async () => {
    const paint = vi.spyOn(flowField, "paintFlowField")
    render(() => <FlowField seed={7} />)
    w.show()
    await w.frame(next())
    expect(paint.mock.lastCall?.[1].seed).toBe(7)
    expect(paint.mock.lastCall?.length).toBe(6)
  })
})

describe("GridDistortion", () => {
  const over = (el: Element) =>
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 200 } as DOMRect)

  it("leans from the pointer, as a fraction of its canvas", async () => {
    const paint = vi.spyOn(gridDistortion, "paintGridDistortion")
    const { container } = render(() => <GridDistortion />)
    over(container.querySelector("canvas")!)
    fireEvent.pointerMove(window, { clientX: 100, clientY: 150 })
    w.show()
    await w.frame(next())
    expect(paint.mock.lastCall?.[4]).toEqual({ x: 0.25, y: 0.75 })
  })

  it("paints without a pointer when the interaction is off", async () => {
    const paint = vi.spyOn(gridDistortion, "paintGridDistortion")
    render(() => <GridDistortion mouseInteraction={false} />)
    w.show()
    await w.frame(next())
    expect(paint.mock.lastCall?.[4]).toBeNull()
  })

  it("stops listening when it leaves the page", () => {
    const { container, unmount } = render(() => <GridDistortion />)
    const box = over(container.querySelector("canvas")!)
    unmount()
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
    expect(box).not.toHaveBeenCalled()
  })
})
