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
export function blendRasterPixel(buffer: RasterBuffer, x: number, y: number, color: Rgb, alpha: number): void {
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

/** Opaque set a pixel using a Uint32Array view for ~1.5x faster writes.
 *  Use when alpha is 1 (no blending needed) — the common case for lit dither cells. */
export function setRasterPixel32(
  view: Uint32Array,
  width: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void {
  // Little-endian ABGR pack (browsers are LE on all major platforms)
  view[y * width + x] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0
}

/** Fast first-write set — skips blend math when the target pixel is transparent.
 *  If the pixel already has content, falls back to source-over blend. */
export function setOrBlendRasterPixel(buffer: RasterBuffer, x: number, y: number, color: Rgb, alpha: number): void {
  if (x < 0 || y < 0 || x >= buffer.width || y >= buffer.height || alpha <= 0) return
  const i = (y * buffer.width + x) * 4
  // Fast path: target is transparent — direct set, no compositing math.
  if (buffer.data[i + 3] === 0) {
    const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
    buffer.data[i] = Math.round(color[0] * a)
    buffer.data[i + 1] = Math.round(color[1] * a)
    buffer.data[i + 2] = Math.round(color[2] * a)
    buffer.data[i + 3] = Math.round(a * 255)
    return
  }
  // Slow path: target has content — source-over blend.
  const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
  const da = buffer.data[i + 3] / 255
  const outA = a + da * (1 - a)
  if (outA <= 0) return
  buffer.data[i] = Math.round((color[0] * a + buffer.data[i] * da * (1 - a)) / outA)
  buffer.data[i + 1] = Math.round((color[1] * a + buffer.data[i + 1] * da * (1 - a)) / outA)
  buffer.data[i + 2] = Math.round((color[2] * a + buffer.data[i + 2] * da * (1 - a)) / outA)
  buffer.data[i + 3] = Math.round(outA * 255)
}

/** Upload a portable raster in one browser call. */
export function putRasterBuffer(ctx: CanvasRenderingContext2D, buffer: RasterBuffer, image?: ImageData): ImageData {
  const target =
    image?.width === buffer.width && image.height === buffer.height
      ? image
      : ctx.createImageData(buffer.width, buffer.height)
  target.data.set(buffer.data)
  ctx.putImageData(target, 0, 0)
  return target
}

/** A canvas painted a cell at a time at memory speed: `cell` lays one cell
 * exactly as `fillStyle = rgb(color, k, alpha)` and a 1x1 `fillRect` over a
 * cleared canvas would (the colour as given, its alpha beside it, a second
 * write blended source-over), into one raster per canvas that is reused
 * frame to frame; `flush` uploads it in a single call. The fillStyle string
 * and fillRect it replaces cost 13-100x more per cell in Chromium (a 120x4
 * bar 0.97ms against 0.074ms, a 160x80 surface 16.5ms against 0.16ms). */
export type CellCanvas = {
  cell(x: number, y: number, color: Rgb, alpha: number, k?: number): void
  /** A `fillRect` of whole cells, each laid as `cell` lays one. */
  rect(x: number, y: number, w: number, h: number, color: Rgb, alpha: number, k?: number): void
  flush(): void
}

const cellSlots = new WeakMap<CanvasRenderingContext2D, { buffer: RasterBuffer; image?: ImageData }>()

/** Start a frame of `cols` x `rows` cells on `ctx`, cleared. */
export function cellCanvas(ctx: CanvasRenderingContext2D, cols: number, rows: number): CellCanvas {
  let slot = cellSlots.get(ctx)
  if (!slot || slot.buffer.width !== cols || slot.buffer.height !== rows) {
    slot = { buffer: createRasterBuffer(cols, rows) }
    cellSlots.set(ctx, slot)
  } else slot.buffer.data.fill(0)
  const frame = slot
  const d = frame.buffer.data
  const writer: CellCanvas = {
    cell(x, y, color, alpha, k = 1) {
      if (x < 0 || y < 0 || x >= cols || y >= rows || !(alpha > 0)) return
      const a = alpha > 1 ? 1 : alpha
      const i = (y * cols + x) * 4
      const r = Math.round(color[0] * k)
      const g = Math.round(color[1] * k)
      const b = Math.round(color[2] * k)
      const da = d[i + 3] / 255
      if (da === 0) {
        d[i] = r
        d[i + 1] = g
        d[i + 2] = b
        d[i + 3] = Math.round(a * 255)
        return
      }
      const out = a + da * (1 - a)
      d[i] = Math.round((r * a + d[i] * da * (1 - a)) / out)
      d[i + 1] = Math.round((g * a + d[i + 1] * da * (1 - a)) / out)
      d[i + 2] = Math.round((b * a + d[i + 2] * da * (1 - a)) / out)
      d[i + 3] = Math.round(out * 255)
    },
    rect(x, y, w, h, color, alpha, k = 1) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) writer.cell(xx, yy, color, alpha, k)
    },
    flush() {
      frame.image = putRasterBuffer(ctx, frame.buffer, frame.image)
    },
  }
  return writer
}
