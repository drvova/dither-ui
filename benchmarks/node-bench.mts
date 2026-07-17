/**
 * Node.js micro-benchmark for dither-kit hot paths.
 *
 * Measures the actual pixel-level functions that dominate render time:
 *   1. blendRasterPixel (old) vs setOrBlendRasterPixel (new) — per-pixel
 *   2. renderDitherGradient with blendRasterPixel vs setOrBlendRasterPixel
 *   3. paintColumn into RasterBuffer
 *   4. JSON.stringify paintSig (per-frame overhead)
 *
 * Run: npx tsx benchmarks/node-bench.mts
 */

import {
  renderDitherGradient,
  renderDitherButton,
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
} from "../dither-kit/precompile"
import {
  createRasterBuffer,
  clearRasterBuffer,
  blendRasterPixel,
  setOrBlendRasterPixel,
} from "../dither-kit/raster"
import { paintColumn } from "../dither-kit/dither-paint"
import { fillOf } from "../dither-kit/pixel"
import { seedOfColor, type Seed } from "../dither-kit/palette"

type Stats = { mean: number; median: number; p95: number; min: number; max: number }

function measure(fn: () => void, warmups: number, batches: number): Stats {
  for (let i = 0; i < warmups; i++) fn()
  const times: number[] = []
  for (let i = 0; i < batches; i++) {
    const t0 = performance.now()
    fn()
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  const sum = times.reduce((a, b) => a + b, 0)
  return {
    mean: sum / times.length,
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
    min: times[0],
    max: times[times.length - 1],
  }
}

function fmt(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}µs` : `${ms.toFixed(2)}ms`
}

function pct(oldMs: number, newMs: number): string {
  const speedup = oldMs / newMs
  const reduction = ((oldMs - newMs) / oldMs) * 100
  return `${speedup.toFixed(1)}x speedup, ${reduction.toFixed(1)}% lower`
}

const WARMUPS = 3
const BATCHES = 20

console.log("=== dither-kit Node.js micro-benchmark ===")
console.log(`Warmups: ${WARMUPS}, Batches: ${BATCHES}`)
console.log()

// --- 1. Per-pixel: blendRasterPixel vs setOrBlendRasterPixel ---
console.log("--- 1. Per-pixel write: blend vs setOrBlend (cleared buffer) ---")
{
  const cols = 320, rows = 200
  const color = fillOf("blue")
  const buf1 = createRasterBuffer(cols, rows)
  const buf2 = createRasterBuffer(cols, rows)

  const blendFn = () => {
    buf1.data.fill(0)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        blendRasterPixel(buf1, x, y, color, 0.5)
  }
  const setOrBlendFn = () => {
    buf2.data.fill(0)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        setOrBlendRasterPixel(buf2, x, y, color, 0.5)
  }

  const blendStats = measure(blendFn, WARMUPS, BATCHES)
  const setOrBlendStats = measure(setOrBlendFn, WARMUPS, BATCHES)
  console.log(`  blendRasterPixel:       mean=${fmt(blendStats.mean)}  median=${fmt(blendStats.median)}  p95=${fmt(blendStats.p95)}`)
  console.log(`  setOrBlendRasterPixel:  mean=${fmt(setOrBlendStats.mean)}  median=${fmt(setOrBlendStats.median)}  p95=${fmt(setOrBlendStats.p95)}`)
  console.log(`  → ${pct(blendStats.mean, setOrBlendStats.mean)}`)
  console.log(`  Pixels per call: ${cols * rows}`)
}
console.log()

// --- 2. renderDitherGradient: blend vs setOrBlend ---
console.log("--- 2. renderDitherGradient (320x200, cell=3, no seed) ---")
{
  const gradFn = () => {
    renderDitherGradient({
      width: 960, height: 600, cell: 3, from: "blue", to: "transparent",
      opacity: 0.14, maxCols: 320, maxRows: 200,
    })
  }
  const stats = measure(gradFn, WARMUPS, BATCHES)
  console.log(`  renderDitherGradient:   mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Output: 320x200 = 64000 pixels`)
}
console.log()

// --- 3. renderDitherGradient at full live resolution ---
console.log("--- 3. renderDitherGradient (960x600, cell=2, seed=42) ---")
{
  const gradFn = () => {
    renderDitherGradient({
      width: 960, height: 600, cell: 2, from: "blue", to: "transparent",
      opacity: 1, seed: 42, maxCols: DEFAULT_MAX_COLS, maxRows: DEFAULT_MAX_ROWS,
    })
  }
  const stats = measure(gradFn, WARMUPS, BATCHES)
  console.log(`  renderDitherGradient:   mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Output: 480x300 = 144000 pixels`)
}
console.log()

// --- 4. renderDitherButton ---
console.log("--- 4. renderDitherButton (240x56, cell=2, variant=gradient) ---")
{
  const btnFn = () => {
    renderDitherButton({
      width: 240, height: 56, cell: 2, color: "blue", variant: "gradient",
    })
  }
  const stats = measure(btnFn, WARMUPS, BATCHES)
  console.log(`  renderDitherButton:     mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Output: 120x28 = 3360 pixels`)
}
console.log()

// --- 5. renderDitherButton with reuse ---
console.log("--- 5. renderDitherButton (240x56, cell=2, reused target) ---")
{
  const target = renderDitherButton({
    width: 240, height: 56, cell: 2, color: "blue", variant: "gradient",
  })
  const btnFn = () => {
    renderDitherButton({
      width: 240, height: 56, cell: 2, color: "blue", variant: "gradient",
    }, target)
  }
  const stats = measure(btnFn, WARMUPS, BATCHES)
  console.log(`  renderDitherButton:     mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Output: 120x28 = 3360 pixels (reused buffer)`)
}
console.log()

// --- 6. paintColumn into RasterBuffer (chart hot path) ---
console.log("--- 6. paintColumn into RasterBuffer (chart-scale 520x200) ---")
{
  const cols = 520, rows = 200
  const frame = createRasterBuffer(cols, rows)
  const seed: Seed = seedOfColor("blue")
  const paintFn = () => {
    clearRasterBuffer(frame)
    for (let x = 0; x < cols; x++) {
      paintColumn(frame, x, 10, rows - 10, seed, {
        variant: "gradient", intensity: 0, dim: 1, stacked: false,
      })
    }
  }
  const stats = measure(paintFn, WARMUPS, BATCHES)
  console.log(`  paintColumn x${cols}:    mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Pixels painted: ~${cols * (rows - 20)} per frame`)
}
console.log()

// --- 7. JSON.stringify paintSig overhead (per-frame) ---
console.log("--- 7. JSON.stringify paintSig overhead (per-frame) ---")
{
  const configKeys = ["desktop", "mobile"]
  const config: Record<string, any> = {
    desktop: { label: "Desktop", color: "blue" },
    mobile: { label: "Mobile", color: "purple" },
  }
  const seriesSpecs: Record<string, any> = {
    desktop: { variant: "gradient", kind: "area" },
    mobile: { variant: "hatched", kind: "area" },
  }
  const sigFn = () => {
    const sig = `${"default"}|${0.3}|${JSON.stringify(configKeys.map((k) => [k, config[k]?.color, seriesSpecs[k]]))}`
    return sig
  }
  const stats = measure(sigFn, WARMUPS, BATCHES * 10)
  console.log(`  JSON.stringify sig:      mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  Called once per frame in cartesian-canvas.ts draw()`)
}
console.log()

// --- 8. rgb() string allocation (sparkle path) ---
console.log("--- 8. rgb() string allocation (sparkle per-pixel) ---")
{
  const { rgb } = await import("../dither-kit/palette")
  const col = fillOf("blue")
  const rgbFn = () => {
    for (let i = 0; i < 100; i++) {
      rgb(col, 1, 0.5 + i * 0.005)
      // string is allocated and discarded — simulates sparkle fillStyle assignment
    }
  }
  const stats = measure(rgbFn, WARMUPS, BATCHES * 10)
  console.log(`  rgb() x100:              mean=${fmt(stats.mean)}  median=${fmt(stats.median)}  p95=${fmt(stats.p95)}`)
  console.log(`  100 string allocations per sparkle tick (typical: 20-40 stars × 3-5 glyph points)`)
}

console.log()
console.log("=== Done ===")
