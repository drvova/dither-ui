// The backgrounds from LightRays to PixelSnow, held to what their Vue twins
// did: each paints its canvas once in view, gives way to a precompiled image,
// and the three that follow the pointer hand their painter where it is.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import LightRays from "../../dither-kit/solid/LightRays"
import Lightfall from "../../dither-kit/solid/Lightfall"
import Lightning from "../../dither-kit/solid/Lightning"
import LineWaves from "../../dither-kit/solid/LineWaves"
import LiquidChrome from "../../dither-kit/solid/LiquidChrome"
import * as liquidEtherEngine from "../../dither-kit/engine/liquid-ether"
import LiquidEther from "../../dither-kit/solid/LiquidEther"
import * as metaBallsEngine from "../../dither-kit/engine/meta-balls"
import MetaBalls from "../../dither-kit/solid/MetaBalls"
import MetallicPaint from "../../dither-kit/solid/MetallicPaint"
import Noise from "../../dither-kit/solid/Noise"
import Orb from "../../dither-kit/solid/Orb"
import * as particlesEngine from "../../dither-kit/engine/particles"
import Particles from "../../dither-kit/solid/Particles"
import PixelBlast from "../../dither-kit/solid/PixelBlast"
import PixelSnow from "../../dither-kit/solid/PixelSnow"
import { surfaceOf } from "../../dither-kit/solid/runtime/surface"
import { world } from "./world"

let w: ReturnType<typeof world>
// Each spec steps frames of its own: every surface's paint in one frame
// shares a budget keyed by the frame's stamp, which a stamp reused across
// specs would carry over.
let at = 0
beforeEach(() => {
  w = world()
  at += 1000
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

const IMAGE = "data:image/png;base64,AAAA"

describe.each([
  ["LightRays", LightRays],
  ["Lightfall", Lightfall],
  ["Lightning", Lightning],
  ["LineWaves", LineWaves],
  ["LiquidChrome", LiquidChrome],
  ["LiquidEther", LiquidEther],
  ["MetaBalls", MetaBalls],
  ["MetallicPaint", MetallicPaint],
  ["Noise", Noise],
  ["Orb", Orb],
  ["Particles", Particles],
  ["PixelBlast", PixelBlast],
  ["PixelSnow", PixelSnow],
] as const)("%s", (_name, Component) => {
  it("paints its canvas once in view, and registers it as a surface", async () => {
    const { container } = render(() => <Component />)
    const canvas = container.querySelector("canvas")!
    w.show()
    await w.frame(at)
    expect(w.uploads).toContain(canvas)
    expect(surfaceOf(canvas)?.raster()).not.toBeNull()
  })

  it("shows a precompiled image in place of the canvas, and paints nothing", async () => {
    const { container } = render(() => <Component precompiled={IMAGE} />)
    w.show()
    await w.frame(at)
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("src")).toBe(IMAGE)
    expect(w.uploads).toEqual([])
  })

  it("stops painting once it has left the page", async () => {
    const { unmount } = render(() => <Component />)
    w.show()
    await w.frame(at)
    unmount()
    await w.frame(at + 100)
    expect(w.uploads.length).toBe(1)
  })
})

/** A canvas that measures 200 by 100 at the page's corner. */
function box(canvas: HTMLCanvasElement) {
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
}

describe.each([
  ["LiquidEther", LiquidEther, liquidEtherEngine, "paintLiquidEther"],
  ["MetaBalls", MetaBalls, metaBallsEngine, "paintMetaBalls"],
  ["Particles", Particles, particlesEngine, "paintParticles"],
] as const)("%s and the pointer", (_name, Component, engine, painter) => {
  it("hands its painter where the pointer is over its canvas", async () => {
    const paint = vi.spyOn(engine as Record<string, (...args: unknown[]) => void>, painter)
    const { container } = render(() => <Component />)
    box(container.querySelector("canvas")!)
    fireEvent.pointerMove(window, { clientX: 50, clientY: 75 })
    w.show()
    await w.frame(at)
    expect(paint.mock.calls.at(-1)?.[4]).toEqual({ x: 0.25, y: 0.75 })
  })

  it("hands it no pointer with mouseInteraction off", async () => {
    const paint = vi.spyOn(engine as Record<string, (...args: unknown[]) => void>, painter)
    render(() => <Component mouseInteraction={false} />)
    w.show()
    await w.frame(at)
    expect(paint.mock.calls.at(-1)?.[4]).toBeNull()
  })

  it("stops following the pointer once it has left the page", async () => {
    const paint = vi.spyOn(engine as Record<string, (...args: unknown[]) => void>, painter)
    const { container, unmount } = render(() => <Component />)
    box(container.querySelector("canvas")!)
    w.show()
    await w.frame(at)
    const mouse = paint.mock.calls.at(-1)?.[4]
    unmount()
    fireEvent.pointerMove(window, { clientX: 50, clientY: 75 })
    expect(mouse).toEqual({ x: 0.5, y: 0.5 })
  })
})
