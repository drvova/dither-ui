import type { Rgb } from "./palette"

/** A portable RGBA backing store usable in browsers, SSR, and Node workers. */
export type RasterBuffer = {
  width: number
  height: number
  data: Uint8ClampedArray
}

export function createRasterBuffer(width: number, height: number): RasterBuffer {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) }
}

export function clearRasterBuffer(buffer: RasterBuffer): void {
  buffer.data.fill(0)
}

/** Source-over blend a pixel without going through the canvas 2D API. */
export function blendRasterPixel(
  buffer: RasterBuffer,
  x: number,
  y: number,
  color: Rgb,
  alpha: number
): void {
  if (x < 0 || y < 0 || x >= buffer.width || y >= buffer.height || alpha <= 0) return
  const a = Math.max(0, Math.min(1, alpha))
  const i = (y * buffer.width + x) * 4
  const da = buffer.data[i + 3] / 255
  const outA = a + da * (1 - a)
  if (outA <= 0) return
  buffer.data[i] = Math.round((color[0] * a + buffer.data[i] * da * (1 - a)) / outA)
  buffer.data[i + 1] = Math.round((color[1] * a + buffer.data[i + 1] * da * (1 - a)) / outA)
  buffer.data[i + 2] = Math.round((color[2] * a + buffer.data[i + 2] * da * (1 - a)) / outA)
  buffer.data[i + 3] = Math.round(outA * 255)
}

/** Upload a portable raster in one browser call. */
export function putRasterBuffer(
  ctx: CanvasRenderingContext2D,
  buffer: RasterBuffer,
  image?: ImageData
): ImageData {
  const target =
    image?.width === buffer.width && image.height === buffer.height
      ? image
      : ctx.createImageData(buffer.width, buffer.height)
  target.data.set(buffer.data)
  ctx.putImageData(target, 0, 0)
  return target
}
