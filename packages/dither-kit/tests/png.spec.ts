// A still surface's frame as a PNG at a pixel a cell (`engine/png.ts`): the
// bytes zlib inflates back to exactly the raster, indexed or RGBA.
import { crc32 as zlibCrc, inflateSync } from "node:zlib"
import { describe, expect, it } from "rstack/test"
import { crc32, deflate, pngBytes, rasterSrc } from "../src/engine/png"
import { renderDitherGradient } from "../src/engine/precompile"
import { paintPoster, posterLayout } from "../src/engine/poster"
import { fillOf } from "../src/engine/pixel"
import { createRasterBuffer, type RasterBuffer } from "../src/engine/raster"

/** The PNG back to straight RGBA, each chunk's CRC checked against zlib's. */
function decode(bytes: Uint8Array): RasterBuffer {
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  const depth = bytes[24]
  const indexed = bytes[25] === 3
  let at = 8
  const idat: Uint8Array[] = []
  let plte = new Uint8Array()
  let trns = new Uint8Array()
  while (at < bytes.length) {
    const length = view.getUint32(at)
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8))
    expect(view.getUint32(at + 8 + length)).toBe(zlibCrc(bytes.subarray(at + 4, at + 8 + length)))
    const data = bytes.subarray(at + 8, at + 8 + length)
    if (type === "IDAT") idat.push(data)
    if (type === "PLTE") plte = data
    if (type === "tRNS") trns = data
    at += 12 + length
  }
  const rows = inflateSync(Buffer.concat(idat))
  const out = createRasterBuffer(width, height)
  const stride = indexed ? Math.ceil((width * depth) / 8) + 1 : width * 4 + 1
  for (let y = 0; y < height; y++) {
    expect(rows[y * stride]).toBe(0)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (!indexed) {
        out.data.set(rows.subarray(y * stride + 1 + x * 4, y * stride + 5 + x * 4), i)
        continue
      }
      const bit = x * depth
      const k = (rows[y * stride + 1 + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1)
      const a = k < trns.length ? trns[k] : 255
      // A transparent entry carries no colour: the raster's is zero there too.
      out.data.set(a === 0 ? [0, 0, 0, 0] : [plte[k * 3], plte[k * 3 + 1], plte[k * 3 + 2], a], i)
    }
  }
  return out
}

describe("the cell image", () => {
  it("is zlib's CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926)
  })

  it("deflates to what zlib inflates, runs and noise alike", () => {
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) / 65536
    for (const n of [0, 1, 2, 3, 258, 259, 4000, 70000]) {
      const input = new Uint8Array(n)
      for (let i = 0; i < n; i++) input[i] = rand() < 0.6 && i > 4 ? input[i - 1 - (i % 4)] : (rand() * 5) | 0
      expect(Buffer.compare(inflateSync(deflate(input)), Buffer.from(input))).toBe(0)
    }
  })

  it("holds a print's raster exactly, indexed at the depth its colours need", () => {
    const gradient = renderDitherGradient({ width: 120, height: 60, from: "blue", to: "#101214", cell: 3 })
    const poster = createRasterBuffer(120, 150)
    paintPoster(
      poster,
      posterLayout(5, 3),
      { inks: (["blue", "orange", "grey"] as const).map((c) => fillOf(c)), ground: null, screen: "bayer", speed: 0 },
      0,
    )
    const faded = renderDitherGradient({ width: 200, height: 90, from: "orange", cell: 2 })
    for (const raster of [gradient, poster, faded]) {
      const bytes = pngBytes(raster.width, raster.height, raster.data)
      expect(bytes[25]).toBe(3)
      expect(Buffer.compare(Buffer.from(decode(bytes).data), Buffer.from(raster.data))).toBe(0)
    }
    expect(pngBytes(gradient.width, gradient.height, gradient.data)[24]).toBe(1)
  })

  it("falls back to RGBA past 256 colours", () => {
    const raster = createRasterBuffer(32, 32)
    for (let i = 0; i < 32 * 32; i++) raster.data.set([i & 255, i >> 2, 7, 255], i * 4)
    const bytes = pngBytes(32, 32, raster.data)
    expect([bytes[24], bytes[25]]).toEqual([8, 6])
    expect(Buffer.compare(Buffer.from(decode(bytes).data), Buffer.from(raster.data))).toBe(0)
  })

  it("is an image source of those bytes", () => {
    const raster = renderDitherGradient({ width: 40, height: 40, cell: 4 })
    const src = rasterSrc(raster)
    expect(src.startsWith("data:image/png;base64,")).toBe(true)
    const bytes = Buffer.from(src.slice(22), "base64")
    expect(Buffer.compare(bytes, Buffer.from(pngBytes(raster.width, raster.height, raster.data)))).toBe(0)
  })
})
