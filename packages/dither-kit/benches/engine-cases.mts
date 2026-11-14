/**
 * The engine paths the landing and the docs lean on most, each a fixed
 * input and one frame of work: what `node-bench.mts` times and what an
 * output oracle hashes, so a speed-up is measured and checked on the same
 * frames. A case returns what it painted (a raster's bytes, a mask's
 * strings), the same bytes for the same inputs.
 */

import { paintAurora } from "../src/engine/aurora"
import { paintCircuit } from "../src/engine/circuit"
import { paintColumn } from "../src/engine/dither-paint"
import { paintFerrofluid } from "../src/engine/ferrofluid"
import { createTrail, paintTrail, trailTo } from "../src/engine/heat-trail"
import { parseWorld } from "../src/engine/models"
import { fbm } from "../src/engine/noise"
import { hexToRgb, seedOfColor, type Rgb } from "../src/engine/palette"
import { BAYER4, screenMatrix } from "../src/engine/pixel"
import { paintPoster, posterLayout } from "../src/engine/poster"
import { renderDitherGradient } from "../src/engine/precompile"
import { cellCanvas, clearRasterBuffer, createRasterBuffer } from "../src/engine/raster"
import { paintSilk } from "../src/engine/silk"
import { paintSoftAurora } from "../src/engine/soft-aurora"
import { wipeStyle } from "../src/engine/wipe"
import { paintWorld, sampleWorld, type WorldStyle, type WorldView } from "../src/engine/world"

export type EngineCase = {
  name: string
  /** One frame of work; `frame` moves the clock so a cache sees motion. */
  run(frame: number): Uint8ClampedArray | Uint8Array | string
}

const INKS: Rgb[] = ["#e4e1d8", "#ff6a2b", "#4b7bff", "#25292d"].map(hexToRgb)
const RAMP: Rgb[] = ["#101214", "#4b7bff", "#ff6a2b", "#e4e1d8"].map(hexToRgb)

/** A canvas context that only takes uploads: what `cellCanvas` needs. */
function uploadContext(): CanvasRenderingContext2D {
  let last: Uint8ClampedArray | null = null
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: (image: ImageData) => {
      last = image.data
    },
    get last() {
      return last
    },
  }
  return ctx as unknown as CanvasRenderingContext2D
}

function posterCase(name: string, cols: number, rows: number, seed: number, ground: Rgb | null): EngineCase {
  const buffer = createRasterBuffer(cols, rows)
  const layout = posterLayout(seed, INKS.length)
  return {
    name,
    run(frame) {
      paintPoster(buffer, layout, { inks: INKS, ground, screen: "diagonal", speed: 6 }, frame / 60)
      return buffer.data
    },
  }
}

function worldCase(name: string, cols: number, rows: number, style: Partial<WorldStyle>): EngineCase {
  const buffer = createRasterBuffer(cols, rows)
  const world = parseWorld(sampleWorld(7), "vrml")
  const full: WorldStyle = {
    fill: INKS[1],
    matrix: screenMatrix("bayer", 7),
    shade: 0.2,
    material: false,
    wire: false,
    fog: 0.3,
    ...style,
  }
  return {
    name,
    run(frame) {
      const view: WorldView = { yaw: 30 + frame * 3, pitch: 18, zoom: 1, fov: 40, time: frame / 60 }
      paintWorld(buffer, world, view, full)
      return buffer.data
    },
  }
}

export const ENGINE_CASES: EngineCase[] = [
  posterCase("paintPoster 480x270, clear ground (the hero)", 480, 270, 3, null),
  posterCase("paintPoster 64x80, papered (a share card's print)", 64, 80, 11, INKS[3]),
  worldCase("paintWorld 240x160, fill + fog (the #build lockup)", 240, 160, {}),
  worldCase("paintWorld 240x160, ramp + grain + wire", 240, 160, { ramp: RAMP, grain: 0.5, wire: true, dither: 0.6 }),
  (() => {
    const buffer = createRasterBuffer(320, 200)
    return {
      name: "paintAurora 320x200 (fbm twice a cell)",
      run(frame: number) {
        paintAurora(
          buffer,
          { colors: RAMP, amplitude: 1, blend: 0.5, speed: 1, opacity: 1, dither: 1 },
          frame / 60,
          BAYER4,
        )
        return buffer.data
      },
    }
  })(),
  (() => {
    const buffer = createRasterBuffer(320, 200)
    return {
      name: "paintSoftAurora 320x200, 3 bands",
      run(frame: number) {
        paintSoftAurora(
          buffer,
          { colors: RAMP, bands: 3, amplitude: 1, blend: 0.5, speed: 1, opacity: 1, dither: 0.4 },
          frame / 60,
          BAYER4,
        )
        return buffer.data
      },
    }
  })(),
  (() => {
    const buffer = createRasterBuffer(320, 200)
    return {
      name: "paintSilk 320x200 (fbm once a cell)",
      run(frame: number) {
        paintSilk(
          buffer,
          {
            colors: RAMP,
            scale: 2,
            speed: 1,
            noiseIntensity: 1.5,
            rotation: 0.4,
            sharpness: 1.5,
            opacity: 1,
            dither: 1,
          },
          frame / 60,
          BAYER4,
        )
        return buffer.data
      },
    }
  })(),
  (() => {
    const buffer = createRasterBuffer(240, 160)
    return {
      name: "paintFerrofluid 240x160",
      run(frame: number) {
        paintFerrofluid(
          buffer,
          {
            colors: RAMP,
            speed: 1,
            scale: 1,
            turbulence: 0.6,
            fluidity: 0.3,
            rimWidth: 0.1,
            sharpness: 2,
            shimmer: 0.4,
            glow: 0.5,
            flowX: 0.3,
            flowY: 0.1,
            opacity: 1,
            dither: 1,
            mouseStrength: 0,
            mouseRadius: 0.2,
          },
          frame / 60,
          BAYER4,
          null,
        )
        return buffer.data
      },
    }
  })(),
  {
    name: "fbm 320x200 field",
    run(frame) {
      const out = new Uint8Array(320 * 200)
      for (let y = 0; y < 200; y++)
        for (let x = 0; x < 320; x++) out[y * 320 + x] = fbm(x * 0.03, y * 0.03, frame * 0.01) * 255
      return out
    },
  },
  (() => {
    const buffer = createRasterBuffer(320, 200)
    const trail = createTrail(320, 200)
    for (let s = 0; s <= 40; s++) trailTo(trail, s / 40, 0.5 + 0.4 * Math.sin(s / 6), 6)
    return {
      name: "paintTrail 320x200 (the landing's heat)",
      run() {
        paintTrail(buffer, trail, { inks: RAMP, cool: 1.2, size: 6 }, BAYER4)
        return buffer.data
      },
    }
  })(),
  (() => {
    const buffer = createRasterBuffer(320, 200)
    const p = { ink: INKS[0], pulse: INKS[1], density: 0.6, speed: 12, pitch: 4, seed: 5 }
    return {
      name: "paintCircuit 320x200",
      run(frame: number) {
        paintCircuit(buffer, p, frame / 60, BAYER4)
        return buffer.data
      },
    }
  })(),
  {
    name: "wipeStyle iris, ink pair, 1 frame (a page transition)",
    run(frame) {
      const p = ((frame % 60) + 0.5) / 60
      const wipe = { direction: "iris" as const, cell: 6, band: 10, width: 1280, height: 800 }
      const a = wipeStyle(Math.min(1, p * 1.2), { ...wipe, invert: true })
      const b = wipeStyle(Math.max(0, p * 1.2 - 0.2), wipe)
      return `${a?.image ?? ""}${b?.image ?? ""}`
    },
  },
  {
    name: "wipeStyle dissolve, seeded, 1 frame (DitherReveal)",
    run(frame) {
      const p = ((frame % 60) + 0.5) / 60
      return wipeStyle(p, { cell: 4, seed: 9 })?.image ?? ""
    },
  },
  (() => {
    const ctx = uploadContext()
    const color = INKS[1]
    return {
      name: "cellCanvas 160x80, a cell each (a control's fill)",
      run(frame: number) {
        const c = cellCanvas(ctx, 160, 80)
        for (let y = 0; y < 80; y++)
          for (let x = 0; x < 160; x++) c.cell(x, y, color, ((x + y + frame) & 7) / 7, (x & 1) + 0.5)
        c.flush()
        return (ctx as unknown as { last: Uint8ClampedArray }).last
      },
    }
  })(),
  (() => {
    const frame = createRasterBuffer(520, 200)
    const seed = seedOfColor("blue")
    return {
      name: "paintColumn x520 (a chart frame)",
      run(f: number) {
        clearRasterBuffer(frame)
        for (let x = 0; x < 520; x++)
          paintColumn(frame, x, 10 + ((x * 7 + f) % 90), 190, seed, {
            variant: x % 3 === 0 ? "dotted" : "gradient",
            intensity: 0,
            dim: 1,
            stacked: false,
          })
        return frame.data
      },
    }
  })(),
  (() => {
    const frame = createRasterBuffer(300, 120)
    const seed = seedOfColor("orange")
    const variants = ["gradient", "dotted", "hatched", "solid", 17, { hatch: 3, ramp: 0.5, gaps: true }] as const
    return {
      name: "paintColumn x300, every texture, hovered and stacked",
      run(f: number) {
        clearRasterBuffer(frame)
        for (let x = -2; x < 302; x++)
          paintColumn(frame, x, ((x * 13 + f) % 140) - 10, 125 - (x % 7), seed, {
            variant: variants[(x + f) % variants.length],
            intensity: (x % 5) / 4,
            dim: x % 9 === 0 ? 0.3 : 1,
            stacked: x % 2 === 0,
            sparse: (x % 3) * 0.1,
          })
        return frame.data
      },
    }
  })(),
  {
    name: "renderDitherGradient 960x600 cell 2 seed 42",
    run() {
      return renderDitherGradient({
        width: 960,
        height: 600,
        cell: 2,
        from: "blue",
        to: "transparent",
        opacity: 1,
        seed: 42,
      }).data
    },
  },
  {
    name: "renderDitherGradient 999x231 cell 3, every direction",
    run(frame) {
      const out: Uint8ClampedArray[] = []
      for (const direction of ["up", "down", "left", "right"] as const) {
        const { data } = renderDitherGradient({
          width: 999 - (frame % 5),
          height: 231,
          cell: 3,
          direction,
          from: "purple",
          to: direction === "left" ? "orange" : "transparent",
          opacity: 0.14 + (frame % 3) * 0.4,
          screen: direction === "right" ? "dot" : "bayer",
          seed: direction === "down" ? undefined : 7,
        })
        out.push(data)
      }
      const all = new Uint8ClampedArray(out.reduce((n, d) => n + d.length, 0))
      out.reduce((at, d) => (all.set(d, at), at + d.length), 0)
      return all
    },
  },
]
