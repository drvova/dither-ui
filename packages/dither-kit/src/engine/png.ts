// A raster as a PNG at one pixel a cell, written synchronously in any
// runtime (a server render, a browser, Node): what a still surface shows in
// an <img> scaled `pixelated`, so its cells stay crisp at every pixel
// density with no canvas, no devicePixelRatio read and no script. Indexed
// (1, 2, 4 or 8 bits, alpha in tRNS) when the raster holds 256 colours or
// fewer, which every dither print does; RGBA past that. The bytes inflate
// to exactly the raster's RGBA. Deflate is LZ77 over fixed Huffman codes:
// a print's rows repeat every four cells, so matches carry nearly all of it.
// Framework-free, no imports at run time.

import type { RasterBuffer } from "./raster"

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

/** CRC-32 (IEEE), as PNG chunks and zip entries carry it. */
export function crc32(bytes: Uint8Array): number {
  let c = ~0
  for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8)
  return ~c >>> 0
}

const LEN_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258,
]
const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577,
]
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
const WINDOW = 32768
const CHAIN = 32

/** zlib stream of `input`: one final block of fixed Huffman codes. */
export function deflate(input: Uint8Array): Uint8Array {
  const out: number[] = [0x78, 0x01]
  let bits = 0
  let count = 0
  const put = (value: number, n: number) => {
    bits |= value << count
    count += n
    while (count >= 8) {
      out.push(bits & 255)
      bits >>>= 8
      count -= 8
    }
  }
  // A Huffman code goes in most significant bit first.
  const code = (value: number, n: number) => {
    let r = 0
    for (let i = 0; i < n; i++) r |= ((value >>> i) & 1) << (n - 1 - i)
    put(r, n)
  }
  const literal = (v: number) => {
    if (v < 144) code(0x30 + v, 8)
    else if (v < 256) code(0x190 + v - 144, 9)
    else if (v < 280) code(v - 256, 7)
    else code(0xc0 + v - 280, 8)
  }
  const match = (length: number, distance: number) => {
    let l = LEN_BASE.length - 1
    while (LEN_BASE[l] > length) l--
    literal(257 + l)
    if (LEN_EXTRA[l]) put(length - LEN_BASE[l], LEN_EXTRA[l])
    let d = DIST_BASE.length - 1
    while (DIST_BASE[d] > distance) d--
    code(d, 5)
    if (DIST_EXTRA[d]) put(distance - DIST_BASE[d], DIST_EXTRA[d])
  }
  put(1, 1) // final block
  put(1, 2) // fixed Huffman
  const n = input.length
  const head = new Int32Array(1 << 15).fill(-1)
  const prev = new Int32Array(n)
  const hash = (i: number) => ((input[i] << 10) ^ (input[i + 1] << 5) ^ input[i + 2]) & 0x7fff
  const insert = (i: number) => {
    if (i + 2 >= n) return
    const h = hash(i)
    prev[i] = head[h]
    head[h] = i
  }
  let i = 0
  while (i < n) {
    let best = 0
    let dist = 0
    if (i + 2 < n) {
      let j = head[hash(i)]
      for (let step = 0; j >= 0 && i - j <= WINDOW && step < CHAIN; step++, j = prev[j]) {
        let len = 0
        const max = Math.min(258, n - i)
        while (len < max && input[j + len] === input[i + len]) len++
        if (len > best) {
          best = len
          dist = i - j
          if (len === max) break
        }
      }
    }
    if (best >= 3) {
      match(best, dist)
      for (let k = 0; k < best; k++) insert(i + k)
      i += best
    } else {
      literal(input[i])
      insert(i)
      i++
    }
  }
  literal(256)
  if (count) out.push(bits & 255)
  let a = 1
  let b = 0
  for (let k = 0; k < n; k++) {
    a = (a + input[k]) % 65521
    b = (b + a) % 65521
  }
  const adler = ((b << 16) | a) >>> 0
  out.push(adler >>> 24, (adler >>> 16) & 255, (adler >>> 8) & 255, adler & 255)
  return Uint8Array.from(out)
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let k = 0; k < 4; k++) out[4 + k] = type.charCodeAt(k)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** RGBA pixels (`width * height * 4`, straight alpha) as PNG bytes. */
export function pngBytes(width: number, height: number, rgba: Uint8Array | Uint8ClampedArray): Uint8Array {
  const total = width * height
  // The palette, transparent cells as one entry; null past 256 colours.
  let palette: Map<number, number> | null = new Map()
  const index = new Uint8Array(total)
  for (let p = 0; p < total; p++) {
    const a = rgba[p * 4 + 3]
    const key = a === 0 ? 0 : ((rgba[p * 4] << 24) | (rgba[p * 4 + 1] << 16) | (rgba[p * 4 + 2] << 8) | a) >>> 0
    let k = palette.get(key)
    if (k === undefined) {
      if (palette.size === 256) {
        palette = null
        break
      }
      palette.set(key, (k = palette.size))
    }
    index[p] = k
  }
  const head = new Uint8Array(13)
  new DataView(head.buffer).setUint32(0, width)
  new DataView(head.buffer).setUint32(4, height)
  const chunks: Uint8Array[] = []
  let rows: Uint8Array
  if (palette) {
    // Translucent entries first, so tRNS stops where the opaque ones begin.
    const keys = [...palette.keys()].sort((x, y) => (x & 255) - (y & 255))
    const order = new Uint8Array(256)
    for (const [key, k] of palette) order[k] = keys.indexOf(key)
    const depth = keys.length <= 2 ? 1 : keys.length <= 4 ? 2 : keys.length <= 16 ? 4 : 8
    head.set([depth, 3, 0, 0, 0], 8)
    const stride = Math.ceil((width * depth) / 8) + 1
    rows = new Uint8Array(stride * height)
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const bit = x * depth
        rows[y * stride + 1 + (bit >> 3)] |= order[index[y * width + x]] << (8 - depth - (bit & 7))
      }
    const plte = new Uint8Array(keys.length * 3)
    const alpha: number[] = []
    keys.forEach((key, n) => {
      plte.set([key >>> 24, (key >>> 16) & 255, (key >>> 8) & 255], n * 3)
      alpha.push(key & 255)
    })
    while (alpha.length && alpha[alpha.length - 1] === 255) alpha.pop()
    chunks.push(chunk("PLTE", plte))
    if (alpha.length) chunks.push(chunk("tRNS", Uint8Array.from(alpha)))
  } else {
    head.set([8, 6, 0, 0, 0], 8)
    const stride = width * 4 + 1
    rows = new Uint8Array(stride * height)
    for (let y = 0; y < height; y++) rows.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1)
  }
  const parts = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    ...chunks,
    chunk("IDAT", deflate(rows)),
    chunk("IEND", new Uint8Array()),
  ]
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/** A raster as an <img> source: a PNG data URI at one pixel a cell. */
export function rasterSrc(raster: RasterBuffer): string {
  const bytes = pngBytes(raster.width, raster.height, raster.data)
  let s = ""
  for (let k = 0; k < bytes.length; k += 0x8000) s += String.fromCharCode(...bytes.subarray(k, k + 0x8000))
  return `data:image/png;base64,${btoa(s)}`
}
