import { fillOf, pixelMatrixFromSeed, BAYER4, type PixelColor } from "./pixel"
import type { RasterBuffer } from "./raster"
import { clearRasterBuffer, createRasterBuffer } from "./raster"

export type DitherRenderMode = "live" | "static"
export type PrecompiledDither = string | { src: string; width?: number; height?: number }
export type GradientDirection = "up" | "down" | "left" | "right"

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"

export type GradientRasterOptions = {
  width: number
  height: number
  from?: PixelColor
  to?: PixelColor | "transparent"
  direction?: GradientDirection
  cell?: number
  opacity?: number
  seed?: number
  maxCols?: number
  maxRows?: number
}

/** Default backing-resolution caps for live (interactive) gradients. */
export const DEFAULT_MAX_COLS = 960
export const DEFAULT_MAX_ROWS = 600

/** Default backing-resolution caps for static (decorative) gradients.
 *  At low opacity the visual difference is imperceptible but compute is 4x lower. */
export const STATIC_DEFAULT_MAX_COLS = 320
export const STATIC_DEFAULT_MAX_ROWS = 200

function finiteNumber(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
  return value
}

function finiteOptional(value: number | undefined, name: string, fallback: number): number {
  return finiteNumber(value ?? fallback, name)
}

/**
 * Compile a deterministic dither gradient without DOM or canvas APIs.
 *
 * The returned RGBA buffer is suitable for a Node image encoder, for example:
 * `sharp(Buffer.from(data), { raw: { width, height, channels: 4 } }).png()`.
 */
export function renderDitherGradient(options: GradientRasterOptions): RasterBuffer {
  const width = Math.max(0, Math.round(finiteNumber(options.width, "width")))
  const height = Math.max(0, Math.round(finiteNumber(options.height, "height")))
  const cell = Math.max(1, finiteOptional(options.cell, "cell", 3))
  const maxCols = Math.max(4, finiteOptional(options.maxCols, "maxCols", DEFAULT_MAX_COLS))
  const maxRows = Math.max(4, finiteOptional(options.maxRows, "maxRows", DEFAULT_MAX_ROWS))
  const cols = Math.min(maxCols, Math.max(4, Math.round(width / cell)))
  const rows = Math.min(maxRows, Math.max(4, Math.round(height / cell)))
  const from = fillOf(options.from ?? "blue")
  const to = options.to === "transparent" || options.to === undefined
    ? null
    : fillOf(options.to)
  const direction = options.direction ?? "up"
  const opacity = Math.max(0, Math.min(1, options.opacity ?? 1))
  const matrix = options.seed === undefined ? BAYER4 : pixelMatrixFromSeed(options.seed)
  const buffer = createRasterBuffer(cols, rows)
  const data = buffer.data
  const w = cols

  // Inline pixel write — no function call per pixel, no blend (buffer is zeroed).
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t =
        direction === "up"
          ? 1 - (y + 0.5) / rows
          : direction === "down"
            ? (y + 0.5) / rows
            : direction === "left"
              ? 1 - (x + 0.5) / cols
              : (x + 0.5) / cols
      const density = 1 - t
      const lit = density > matrix[y & 3][x & 3]
      const useFrom = lit || !to
      const c = useFrom ? from : (to as [number, number, number])
      const alpha = to
        ? opacity
        : (lit ? 0.35 + 0.65 * density : 0.12 * density) * opacity
      if (alpha <= 0) continue
      const a = alpha > 1 ? 1 : alpha
      const i = (y * w + x) * 4
      data[i] = (c[0] * a + 0.5) | 0
      data[i + 1] = (c[1] * a + 0.5) | 0
      data[i + 2] = (c[2] * a + 0.5) | 0
      data[i + 3] = (a * 255 + 0.5) | 0
    }
  }
  return buffer
}

export type ButtonRasterOptions = {
  width: number
  height: number
  color?: PixelColor
  variant?: ButtonVariant
  cell?: number
  intensity?: number
  seed?: number
  maxCols?: number
  maxRows?: number
}

/** Compile a static dither button backing store without canvas APIs. */
export function renderDitherButton(
  options: ButtonRasterOptions,
  target?: RasterBuffer
): RasterBuffer {
  const width = finiteNumber(options.width, "width")
  const height = finiteNumber(options.height, "height")
  const cell = Math.max(1, finiteOptional(options.cell, "cell", 2))
  const maxCols = Math.max(4, finiteOptional(options.maxCols, "maxCols", DEFAULT_MAX_COLS))
  const maxRows = Math.max(4, finiteOptional(options.maxRows, "maxRows", DEFAULT_MAX_ROWS))
  const cols = Math.min(maxCols, Math.max(4, Math.round(width / cell)))
  const rows = Math.min(maxRows, Math.max(4, Math.round(height / cell)))
  const fill = fillOf(options.color ?? "blue")
  const variant = options.variant ?? "gradient"
  const intensity = options.intensity ?? 0
  const matrix = options.seed === undefined ? BAYER4 : pixelMatrixFromSeed(options.seed)
  const buffer = target?.width === cols && target.height === rows
    ? target
    : createRasterBuffer(cols, rows)
  clearRasterBuffer(buffer)
  const data = buffer.data
  const w = cols
  const bias = variant === "dotted" ? 0.12 : 0
  // Precompute fill channels to avoid array dereference in the inner loop.
  const r0 = fill[0], g0 = fill[1], b0 = fill[2]

  for (let y = 0; y < rows; y++) {
    const density =
      variant === "gradient"
        ? 0.25 + 0.75 * ((y + 0.5) / rows)
        : variant === "dotted"
          ? 0.5
          : 0.75
    for (let x = 0; x < cols; x++) {
      if (variant === "hatched" && ((x + y) & 3) >= 2) continue
      const lit =
        variant === "solid" ||
        density > matrix[y & 3][x & 3] - 0.1 * intensity - bias
      if (variant === "dotted" && !lit) continue
      const k = (0.3 + density * 0.7) * (1 + 0.22 * intensity)
      const a = lit ? k : k * 0.4
      if (a <= 0) continue
      const ac = a > 1 ? 1 : a
      const i = (y * w + x) * 4
      data[i] = (r0 * ac + 0.5) | 0
      data[i + 1] = (g0 * ac + 0.5) | 0
      data[i + 2] = (b0 * ac + 0.5) | 0
      data[i + 3] = (ac * 255 + 0.5) | 0
    }
  }
  // Edge outline — inline writes.
  const edgeAlpha = Math.max(0, Math.min(1, 0.5 + 0.25 * intensity))
  const ea = edgeAlpha * 255 + 0.5 | 0
  const er = (r0 * edgeAlpha + 0.5) | 0
  const eg = (g0 * edgeAlpha + 0.5) | 0
  const eb = (b0 * edgeAlpha + 0.5) | 0
  for (let x = 0; x < cols; x++) {
    let i = x * 4; data[i] = er; data[i+1] = eg; data[i+2] = eb; data[i+3] = ea
    i = ((rows - 1) * w + x) * 4; data[i] = er; data[i+1] = eg; data[i+2] = eb; data[i+3] = ea
  }
  for (let y = 0; y < rows; y++) {
    let i = (y * w) * 4; data[i] = er; data[i+1] = eg; data[i+2] = eb; data[i+3] = ea
    i = (y * w + cols - 1) * 4; data[i] = er; data[i+1] = eg; data[i+2] = eb; data[i+3] = ea
  }
  return buffer
}

/** Resolve a packaged source from either the short string or metadata form. */
export function precompiledSrc(value: PrecompiledDither | undefined): string | undefined {
  return typeof value === "string" ? value : value?.src
}
