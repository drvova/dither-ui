import { fillOf, pixelMatrixFromSeed, BAYER4, type PixelColor } from "./pixel"
import type { RasterBuffer } from "./raster"
import { blendRasterPixel, clearRasterBuffer, createRasterBuffer } from "./raster"

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
}

const MAX_COLS = 960
const MAX_ROWS = 600

/**
 * Compile a deterministic dither gradient without DOM or canvas APIs.
 *
 * The returned RGBA buffer is suitable for a Node image encoder, for example:
 * `sharp(Buffer.from(data), { raw: { width, height, channels: 4 } }).png()`.
 */
export function renderDitherGradient(options: GradientRasterOptions): RasterBuffer {
  const width = Math.max(0, Math.round(options.width))
  const height = Math.max(0, Math.round(options.height))
  const cell = Math.max(1, options.cell ?? 3)
  const cols = Math.min(MAX_COLS, Math.max(4, Math.round(width / cell)))
  const rows = Math.min(MAX_ROWS, Math.max(4, Math.round(height / cell)))
  const from = fillOf(options.from ?? "blue")
  const to = options.to === "transparent" || options.to === undefined
    ? null
    : fillOf(options.to)
  const direction = options.direction ?? "up"
  const opacity = Math.max(0, Math.min(1, options.opacity ?? 1))
  const matrix = options.seed === undefined ? BAYER4 : pixelMatrixFromSeed(options.seed)
  const buffer = createRasterBuffer(cols, rows)

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
      const alpha = to
        ? opacity
        : (lit ? 0.35 + 0.65 * density : 0.12 * density) * opacity
      blendRasterPixel(buffer, x, y, lit || !to ? from : to, alpha)
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
}

/** Compile a static dither button backing store without canvas APIs. */
export function renderDitherButton(
  options: ButtonRasterOptions,
  target?: RasterBuffer
): RasterBuffer {
  const cols = Math.min(MAX_COLS, Math.max(4, Math.round(options.width / Math.max(1, options.cell ?? 2))))
  const rows = Math.min(MAX_ROWS, Math.max(4, Math.round(options.height / Math.max(1, options.cell ?? 2))))
  const fill = fillOf(options.color ?? "blue")
  const variant = options.variant ?? "gradient"
  const intensity = options.intensity ?? 0
  const matrix = options.seed === undefined ? BAYER4 : pixelMatrixFromSeed(options.seed)
  const buffer = target?.width === cols && target.height === rows
    ? target
    : createRasterBuffer(cols, rows)
  clearRasterBuffer(buffer)
  const bias = variant === "dotted" ? 0.12 : 0

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
      blendRasterPixel(buffer, x, y, fill, Math.max(0, Math.min(1, lit ? k : k * 0.4)))
    }
  }
  const edgeAlpha = Math.max(0, Math.min(1, 0.5 + 0.25 * intensity))
  for (let x = 0; x < cols; x++) {
    blendRasterPixel(buffer, x, 0, fill, edgeAlpha)
    blendRasterPixel(buffer, x, rows - 1, fill, edgeAlpha)
  }
  for (let y = 0; y < rows; y++) {
    blendRasterPixel(buffer, 0, y, fill, edgeAlpha)
    blendRasterPixel(buffer, cols - 1, y, fill, edgeAlpha)
  }
  return buffer
}

/** Resolve a packaged source from either the short string or metadata form. */
export function precompiledSrc(value: PrecompiledDither | undefined): string | undefined {
  return typeof value === "string" ? value : value?.src
}
