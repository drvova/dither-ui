/**
 * The page the browser benchmark runs (`browser-bench.mts` bundles it and
 * opens it in Chromium). Two measurements, each the one the kit's earlier
 * benchmark page made, on the Solid components:
 *
 *   mounts    a real component mounted in the DOM. Compute is mount to the
 *             next microtask (Solid renders and runs `onMount` in the call);
 *             full is mount to a canvas with pixels in it, the frame wait
 *             included.
 *   painters  the gradient painted cell by cell with `fillRect` against the
 *             RGBA compiler and one `putImageData`, and the button compiled
 *             into a fresh buffer against a reused one.
 */
import { createSignal, type JSX } from "solid-js"
import { render } from "solid-js/web"
import { renderDitherButton, renderDitherGradient } from "../src/engine/precompile"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "../src/engine/raster"
import DitherButton from "../src/solid/DitherButton"
import DitherGradient from "../src/solid/DitherGradient"
import DitherSpinner from "../src/solid/DitherSpinner"

export type Stats = { mean: number; median: number; p95: number }
export type MountRow = { name: string; notes: string; compute: Stats; full: Stats; painted: boolean }
export type PainterRow = Stats & { name: string; calls: number; allocations: number }
export type Bench = {
  mounts(runs: number, batches: number): Promise<MountRow[][]>
  painters(): Promise<PainterRow[]>
  renderer(): string
}

declare global {
  interface Window {
    ditherBench: Bench
  }
}

export function stats(values: number[]): Stats {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
  }
}

const WARMUPS = 3
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

// --- mounts ---------------------------------------------------------------

type Sample = { compute: number; full: number; painted: boolean }

/** Wait until a canvas inside `container` holds a pixel that is not empty:
 * the paint happened, not only the render. */
async function waitForPaint(container: HTMLElement, timeoutMs = 1500): Promise<boolean> {
  const deadline = performance.now() + timeoutMs
  while (performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    await frame()
    const canvas = container.querySelector("canvas")
    const ctx = canvas && canvas.width > 0 && canvas.height > 0 ? canvas.getContext("2d") : null
    if (!canvas || !ctx) continue
    const data = ctx.getImageData(0, 0, Math.min(canvas.width, 20), Math.min(canvas.height, 20)).data
    if (data.some((value) => value !== 0)) return true
  }
  return false
}

async function mountAndMeasure(container: HTMLElement, view: () => JSX.Element): Promise<Sample> {
  const t0 = performance.now()
  const dispose = render(view, container)
  await Promise.resolve()
  const computed = performance.now()
  const painted = await waitForPaint(container)
  const done = performance.now()
  dispose()
  container.textContent = ""
  return { compute: computed - t0, full: done - t0, painted }
}

const WASH = { position: "relative", width: "960px", height: "120px" } as const
const CENTRE = { display: "flex", "align-items": "center", "justify-content": "center", padding: "20px" } as const

const SCENARIOS: { name: string; notes: string; run: (container: HTMLElement) => Promise<Sample> }[] = [
  {
    name: "DitherGradient live mount",
    notes: "960x120, cell=3",
    run: (c) =>
      mountAndMeasure(c, () => (
        <div style={WASH}>
          <DitherGradient from="blue" to="transparent" direction="up" opacity={0.14} cell={3} />
        </div>
      )),
  },
  {
    name: "DitherGradient static mount",
    notes: "320x200 cap, cell=4, idle-deferred",
    run: (c) =>
      mountAndMeasure(c, () => (
        <div style={WASH}>
          <DitherGradient from="blue" to="transparent" direction="up" opacity={0.14} cell={4} renderMode="static" />
        </div>
      )),
  },
  {
    name: "DitherGradient live re-render",
    notes: "direction up to down",
    run: async (c) => {
      const [direction, setDirection] = createSignal<"up" | "down">("up")
      const dispose = render(
        () => (
          <div style={WASH}>
            <DitherGradient from="blue" to="transparent" direction={direction()} opacity={0.14} cell={3} />
          </div>
        ),
        c,
      )
      await Promise.resolve()
      await waitForPaint(c)
      const t0 = performance.now()
      setDirection("down")
      await Promise.resolve()
      const computed = performance.now()
      const painted = await waitForPaint(c)
      const done = performance.now()
      dispose()
      c.textContent = ""
      return { compute: computed - t0, full: done - t0, painted }
    },
  },
  {
    name: "DitherButton live mount",
    notes: "gradient variant, cell=2",
    run: (c) =>
      mountAndMeasure(c, () => (
        <div style={CENTRE}>
          <DitherButton color="blue" variant="gradient">
            Save
          </DitherButton>
        </div>
      )),
  },
  {
    name: "DitherButton static mount",
    notes: "320x200 cap, idle-deferred",
    run: (c) =>
      mountAndMeasure(c, () => (
        <div style={CENTRE}>
          <DitherButton color="blue" variant="gradient" renderMode="static">
            Save
          </DitherButton>
        </div>
      )),
  },
  {
    name: "DitherSpinner live mount",
    notes: "32px, RAF loop",
    run: (c) =>
      mountAndMeasure(c, () => (
        <div style={CENTRE}>
          <DitherSpinner size={32} />
        </div>
      )),
  },
  {
    name: "Raw raster gradient",
    notes: "480x300, no framework",
    run: async (c) => {
      const canvas = document.createElement("canvas")
      canvas.style.cssText = "display:block;width:480px;height:300px;image-rendering:pixelated"
      c.appendChild(canvas)
      const ctx = canvas.getContext("2d")!
      const t0 = performance.now()
      const raster = renderDitherGradient({ ...GRADIENT, seed: 42 })
      canvas.width = raster.width
      canvas.height = raster.height
      putRasterBuffer(ctx, raster)
      ctx.getImageData(0, 0, 1, 1)
      const elapsed = performance.now() - t0
      canvas.remove()
      return { compute: elapsed, full: elapsed, painted: true }
    },
  },
]

async function mounts(runs: number, batches: number): Promise<MountRow[][]> {
  const container = document.querySelector<HTMLElement>("#stage")!
  const all: MountRow[][] = []
  for (let run = 0; run < runs; run++) {
    const rows: MountRow[] = []
    for (const scenario of SCENARIOS) {
      const samples: Sample[] = []
      for (let i = 0; i < WARMUPS + batches; i++) {
        const sample = await scenario.run(container)
        if (i >= WARMUPS) samples.push(sample)
      }
      rows.push({
        name: scenario.name,
        notes: scenario.notes,
        compute: stats(samples.map((s) => s.compute)),
        full: stats(samples.map((s) => s.full)),
        painted: samples.every((s) => s.painted),
      })
    }
    all.push(rows)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return all
}

// --- painters -------------------------------------------------------------

const WIDTH = 960
const HEIGHT = 600
const CELL = 2
const SAMPLES = 6
const REPS = 2
const GRADIENT = {
  width: WIDTH,
  height: HEIGHT,
  cell: CELL,
  from: "blue",
  to: "transparent",
  direction: "up",
  opacity: 1,
} as const
const BUTTON = {
  width: 240,
  height: 56,
  color: "blue",
  variant: "gradient",
  intensity: 0.8,
  cell: 2,
  seed: 42,
} as const
const BAYER = [
  [0.03125, 0.53125, 0.15625, 0.65625],
  [0.78125, 0.28125, 0.90625, 0.40625],
  [0.21875, 0.71875, 0.09375, 0.59375],
  [0.96875, 0.46875, 0.84375, 0.34375],
]

type Held = { current?: ImageData }

/** Time one paint into a canvas made for it. */
function timed(paint: (ctx: CanvasRenderingContext2D) => void): number {
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  const start = performance.now()
  paint(ctx)
  return performance.now() - start
}

function upload(ctx: CanvasRenderingContext2D, raster: RasterBuffer, image?: Held): void {
  ctx.canvas.width = raster.width
  ctx.canvas.height = raster.height
  const used = putRasterBuffer(ctx, raster, image?.current)
  if (image) image.current = used
}

/** The painter the kit had before its RGBA compiler: one `fillRect` a cell. */
const legacySample = () =>
  timed((ctx) => {
    const cols = Math.min(960, Math.max(4, Math.round(WIDTH / CELL)))
    const rows = Math.min(600, Math.max(4, Math.round(HEIGHT / CELL)))
    ctx.canvas.width = cols
    ctx.canvas.height = rows
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const density = (y + 0.5) / rows
        const lit = density > BAYER[y & 3][x & 3]
        ctx.fillStyle = `rgba(53,143,243,${lit ? 0.35 + 0.65 * density : 0.12 * density})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  })
const rasterSample = (image: Held) => timed((ctx) => upload(ctx, renderDitherGradient(GRADIENT), image))
const buttonFreshSample = () => timed((ctx) => upload(ctx, renderDitherButton(BUTTON)))
const buttonReuseSample = (target: RasterBuffer, image: Held) =>
  timed((ctx) => upload(ctx, renderDitherButton(BUTTON, target), image))
const buttonTarget = () => createRasterBuffer(Math.round(BUTTON.width / 2), Math.round(BUTTON.height / 2))

async function painters(): Promise<PainterRow[]> {
  const warmRaster: Held = {}
  const warmButton: Held = {}
  for (let i = 0; i < WARMUPS; i++) {
    legacySample()
    rasterSample(warmRaster)
    buttonFreshSample()
    buttonReuseSample(buttonTarget(), warmButton)
  }
  const legacy: number[] = []
  const raster: number[] = []
  const fresh: number[] = []
  const reuse: number[] = []
  const rasterImage: Held = {}
  const buttonImage: Held = {}
  const target = buttonTarget()
  for (let batch = 0; batch < SAMPLES; batch++) {
    for (let rep = 0; rep < REPS; rep++) {
      legacy.push(legacySample())
      raster.push(rasterSample(rasterImage))
      fresh.push(buttonFreshSample())
      reuse.push(buttonReuseSample(target, buttonImage))
    }
    await frame()
  }
  const cells = Math.round(WIDTH / CELL) * Math.round(HEIGHT / CELL)
  return [
    { name: "Gradient legacy fillRect", ...stats(legacy), calls: cells, allocations: 0 },
    { name: "Gradient RGBA + putImageData", ...stats(raster), calls: 1, allocations: raster.length + 1 },
    { name: "Button fresh RGBA buffer", ...stats(fresh), calls: 1, allocations: fresh.length * 2 },
    { name: "Button reused RGBA buffer", ...stats(reuse), calls: 1, allocations: 2 },
  ]
}

/** The GL renderer the browser reports: says whether a GPU did the work. */
function renderer(): string {
  const gl = document.createElement("canvas").getContext("webgl")
  const info = gl?.getExtension("WEBGL_debug_renderer_info")
  return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "none"
}

window.ditherBench = { mounts, painters, renderer }
