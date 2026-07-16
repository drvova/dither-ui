import {
  createRasterBuffer,
  putRasterBuffer,
  renderDitherButton,
  renderDitherGradient,
  type RasterBuffer,
} from "../dither-kit"

const WIDTH = 960
const HEIGHT = 600
const CELL = 2
const BUTTON_WIDTH = 240
const BUTTON_HEIGHT = 56
const WARMUPS = 3
const SAMPLES = 6
const REPS = 2

type Result = { name: string; mean: number; median: number; p95: number; calls: number; allocations: number }

function options() {
  return { width: WIDTH, height: HEIGHT, cell: CELL, from: "blue" as const, to: "transparent" as const, direction: "up" as const, opacity: 1 }
}

function legacyGradient(ctx: CanvasRenderingContext2D): number {
  const cols = Math.min(960, Math.max(4, Math.round(WIDTH / CELL)))
  const rows = Math.min(600, Math.max(4, Math.round(HEIGHT / CELL)))
  ctx.canvas.width = cols
  ctx.canvas.height = rows
  let calls = 0
  const matrix = [[0.03125, 0.53125, 0.15625, 0.65625], [0.78125, 0.28125, 0.90625, 0.40625], [0.21875, 0.71875, 0.09375, 0.59375], [0.96875, 0.46875, 0.84375, 0.34375]]
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t = 1 - (y + 0.5) / rows
      const density = 1 - t
      const lit = density > matrix[y & 3][x & 3]
      const alpha = (lit ? 0.35 + 0.65 * density : 0.12 * density)
      ctx.fillStyle = `rgba(53,143,243,${alpha})`
      ctx.fillRect(x, y, 1, 1)
      calls++
    }
  }
  return calls
}

function legacySample(): number {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  const start = performance.now()
  legacyGradient(ctx)
  return performance.now() - start
}

function rasterSample(image: { current?: ImageData }): number {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  const start = performance.now()
  const raster = renderDitherGradient(options())
  canvas.width = raster.width
  canvas.height = raster.height
  image.current = putRasterBuffer(ctx, raster, image.current)
  return performance.now() - start
}

function buttonFreshSample(): number {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  const start = performance.now()
  const raster = renderDitherButton({
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    color: "blue",
    variant: "gradient",
    intensity: 0.8,
    cell: 2,
    seed: 42,
  })
  canvas.width = raster.width
  canvas.height = raster.height
  putRasterBuffer(ctx, raster)
  return performance.now() - start
}

function buttonReuseSample(target: RasterBuffer, image: { current?: ImageData }): number {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  const start = performance.now()
  const raster = renderDitherButton({
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    color: "blue",
    variant: "gradient",
    intensity: 0.8,
    cell: 2,
    seed: 42,
  }, target)
  canvas.width = raster.width
  canvas.height = raster.height
  image.current = putRasterBuffer(ctx, raster, image.current)
  return performance.now() - start
}

function stats(values: number[], name: string, calls: number, allocations: number): Result {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    name,
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
    calls,
    allocations,
  }
}

async function run(): Promise<void> {
  const status = document.querySelector<HTMLElement>("#status")!
  const results = document.querySelector<HTMLTableSectionElement>("#results")!
  const button = document.querySelector<HTMLButtonElement>("#run")!
  button.disabled = true
  status.textContent = "Warming up..."
  const warmupRasterImage: { current?: ImageData } = {}
  const warmupButtonImage: { current?: ImageData } = {}
  for (let i = 0; i < WARMUPS; i++) {
    legacySample()
    rasterSample(warmupRasterImage)
    buttonFreshSample()
    buttonReuseSample(createRasterBuffer(Math.round(BUTTON_WIDTH / 2), Math.round(BUTTON_HEIGHT / 2)), warmupButtonImage)
  }
  const legacy: number[] = []
  const raster: number[] = []
  const buttonFresh: number[] = []
  const buttonReuse: number[] = []
  const rasterImage: { current?: ImageData } = {}
  const buttonImage: { current?: ImageData } = {}
  const buttonTarget = createRasterBuffer(Math.round(BUTTON_WIDTH / 2), Math.round(BUTTON_HEIGHT / 2))
  for (let batch = 0; batch < SAMPLES; batch++) {
    status.textContent = `Measured batch ${batch + 1} of ${SAMPLES}...`
    for (let rep = 0; rep < REPS; rep++) {
      legacy.push(legacySample())
      raster.push(rasterSample(rasterImage))
      buttonFresh.push(buttonFreshSample())
      buttonReuse.push(buttonReuseSample(buttonTarget, buttonImage))
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  const rows = [
    stats(legacy, "Gradient legacy fillRect", Math.round(WIDTH / CELL) * Math.round(HEIGHT / CELL), 0),
    stats(raster, "Gradient RGBA + putImageData", 1, raster.length + 1),
    stats(buttonFresh, "Button fresh RGBA buffer", 1, buttonFresh.length * 2),
    stats(buttonReuse, "Button reused RGBA buffer", 1, 2),
  ]
  results.innerHTML = rows.map((row) => `<tr><td>${row.name}</td><td>${row.mean.toFixed(2)}</td><td>${row.median.toFixed(2)}</td><td>${row.p95.toFixed(2)}</td><td>${row.calls.toLocaleString()}</td><td>${row.allocations.toLocaleString()}</td></tr>`).join("")
  status.textContent = `Completed ${SAMPLES} batches × ${REPS} repetitions after ${WARMUPS} warmups.`
  button.disabled = false
}

document.querySelector<HTMLButtonElement>("#run")!.addEventListener("click", () => void run())
