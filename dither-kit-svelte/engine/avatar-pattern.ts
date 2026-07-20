// Avatar pattern sources. The seeded derivation is the classic generative
// path; patternFromPixels/patternFromImage dither an image into the grid; a
// drawn pattern is just authored cells. All three produce the same shape.

import { fnv1a, xorshift32 } from "./pixel"

/** Explicit cell data — `on` accepts 0/1 for compact literals. */
export type AvatarPattern = {
  on: (boolean | 0 | 1)[]
  density?: number[]
}

export type SeededPattern = {
  on: boolean[]
  density: number[]
  drawnVertical: boolean
  drawnHue: number
}

/** The deterministic PRNG pattern behind seed-based avatars: half the cells
 * are free bits, folded across the mirror axis. */
export function seededPattern(
  name: string,
  gridProp: number,
  mirror: "auto" | "horizontal" | "vertical"
): SeededPattern {
  const grid = clampGrid(gridProp)
  const half = (grid * grid) / 2
  const rand = xorshift32(fnv1a(name))
  const bits = Array.from({ length: half }, () => rand() < 0.5)
  const drawnVertical = rand() < 0.5
  const drawnHue = Math.floor(rand() * 180) * 2
  const halfDensity = Array.from({ length: half }, () => 0.55 + rand() * 0.45)

  const vertical = mirror === "auto" ? drawnVertical : mirror === "vertical"
  const on = new Array<boolean>(grid * grid)
  const density = new Array<number>(grid * grid)
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const i = vertical
        ? Math.min(r, grid - 1 - r) * grid + c
        : r * (grid / 2) + Math.min(c, grid - 1 - c)
      on[r * grid + c] = bits[i]
      density[r * grid + c] = halfDensity[i]
    }
  }
  return { on, density, drawnVertical, drawnHue }
}

export const clampGrid = (g: number): number =>
  Math.max(4, Math.min(16, Math.round(g / 2) * 2))

/** Normalise an explicit pattern to the grid size (pad off / truncate). */
export function normalizePattern(
  pattern: AvatarPattern,
  grid: number
): { on: boolean[]; density: number[] } {
  const n = grid * grid
  const on = new Array<boolean>(n)
  const density = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    on[i] = !!pattern.on[i]
    density[i] = pattern.density?.[i] ?? 0.85
  }
  return { on, density }
}

/**
 * Map RGBA pixel data (grid×grid) to a pattern: cell luminance below the
 * threshold lights up (dark shapes on light photos read as the subject), and
 * darker cells paint denser. `invert` flips the mapping for dark images.
 */
export function patternFromPixels(
  rgba: Uint8ClampedArray | number[],
  grid: number,
  threshold = 0.5,
  invert = false
): { on: boolean[]; density: number[] } {
  const n = grid * grid
  const on = new Array<boolean>(n)
  const density = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const r = rgba[i * 4] ?? 0
    const g = rgba[i * 4 + 1] ?? 0
    const b = rgba[i * 4 + 2] ?? 0
    const a = (rgba[i * 4 + 3] ?? 0) / 255
    const lum = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * a
    const dark = 1 - lum
    const value = invert ? lum : dark
    on[i] = a > 0.05 && value > threshold
    // The further past the threshold, the denser the cell.
    density[i] = Math.min(1, 0.45 + value * 0.55)
  }
  return { on, density }
}

/** Browser path: load an image and dither it into the grid. */
export async function patternFromImage(
  src: string,
  grid: number,
  threshold = 0.5,
  invert = false
): Promise<{ on: boolean[]; density: number[] } | null> {
  const g = clampGrid(grid)
  const img = new Image()
  img.crossOrigin = "anonymous"
  const loaded = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
  if (!loaded) return null
  const canvas = document.createElement("canvas")
  canvas.width = g
  canvas.height = g
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  // cover-fit crop so the subject fills the grid
  const scale = Math.max(g / img.width, g / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (g - dw) / 2, (g - dh) / 2, dw, dh)
  try {
    const data = ctx.getImageData(0, 0, g, g).data
    return patternFromPixels(data, g, threshold, invert)
  } catch {
    return null // tainted canvas (CORS) — caller keeps the previous pattern
  }
}
