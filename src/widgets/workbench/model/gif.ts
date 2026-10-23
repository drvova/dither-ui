// Animated GIF (89a) the kit's way: every frame quantized to ONE 256-colour
// palette (median cut over samples of all frames) and ordered-dithered with
// the kit's own Bayer matrix — so a recording of a dithered UI stays crisp
// and stable from frame to frame instead of crawling with error-diffusion
// noise. Pure: RGBA in, bytes out.
import { bayerMatrix } from "@dither-kit"

export type Frame = Uint8ClampedArray

/** A growable byte buffer. */
class Bytes {
  buf = new Uint8Array(1 << 16)
  length = 0
  private room(n: number) {
    if (this.length + n <= this.buf.length) return
    let size = this.buf.length * 2
    while (size < this.length + n) size *= 2
    const next = new Uint8Array(size)
    next.set(this.buf.subarray(0, this.length))
    this.buf = next
  }
  byte(b: number) {
    this.room(1)
    this.buf[this.length++] = b
  }
  word(w: number) {
    this.byte(w & 255)
    this.byte((w >> 8) & 255)
  }
  text(s: string) {
    for (const ch of s) this.byte(ch.charCodeAt(0))
  }
  bytes(src: ArrayLike<number>) {
    this.room(src.length)
    this.buf.set(src, this.length)
    this.length += src.length
  }
  done() {
    return this.buf.slice(0, this.length)
  }
}

/** Median cut: up to `max` colours (RGB triples) for the sampled pixels
 * (packed 0xRRGGBB). Splits the box with the widest channel range at its
 * median until there are enough boxes; each box's mean is a colour. */
export function medianCut(pixels: number[], max = 256): number[][] {
  const ch = (p: number, c: number) => (p >> (16 - c * 8)) & 255
  let boxes: number[][] = pixels.length ? [pixels] : [[0]]
  while (boxes.length < max) {
    let best = -1
    let bestRange = 0
    let bestChannel = 0
    boxes.forEach((box, i) => {
      if (box.length < 2) return
      for (let c = 0; c < 3; c++) {
        let lo = 255
        let hi = 0
        for (const p of box) {
          const v = ch(p, c)
          if (v < lo) lo = v
          if (v > hi) hi = v
        }
        if (hi - lo > bestRange) {
          bestRange = hi - lo
          best = i
          bestChannel = c
        }
      }
    })
    if (best < 0) break
    const box = boxes[best].sort((a, b) => ch(a, bestChannel) - ch(b, bestChannel))
    const mid = box.length >> 1
    boxes = [...boxes.slice(0, best), box.slice(0, mid), box.slice(mid), ...boxes.slice(best + 1)]
  }
  return boxes.map((box) => {
    const sum = [0, 0, 0]
    for (const p of box) for (let c = 0; c < 3; c++) sum[c] += ch(p, c)
    return sum.map((s) => Math.round(s / box.length))
  })
}

/** Pixels sampled across every frame (at most ~`budget`), packed RGB. */
export function sample(frames: Frame[], budget = 60000): number[] {
  const total = frames.reduce((n, f) => n + f.length / 4, 0)
  const step = Math.max(1, Math.floor(total / budget))
  const out: number[] = []
  for (const f of frames)
    for (let i = 0; i < f.length; i += 4 * step) out.push((f[i] << 16) | (f[i + 1] << 8) | f[i + 2])
  return out
}

/** One frame's palette indices, ordered-dithered by the Bayer matrix:
 * each pixel nudged by its cell's threshold (± spread/2) before the
 * nearest palette colour is found (cached per 6-bit RGB). */
export function quantize(
  frame: Frame,
  width: number,
  palette: number[][],
  spread = 24,
  cache = new Int16Array(1 << 18).fill(-1),
): Uint8Array {
  const m = bayerMatrix(8)
  const out = new Uint8Array(frame.length / 4)
  for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
    const t = (m[Math.floor(p / width) & 7][(p % width) & 7] - 0.5) * spread
    const r = Math.min(255, Math.max(0, frame[i] + t))
    const g = Math.min(255, Math.max(0, frame[i + 1] + t))
    const b = Math.min(255, Math.max(0, frame[i + 2] + t))
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2)
    let idx = cache[key]
    if (idx < 0) {
      let best = Infinity
      for (let k = 0; k < palette.length; k++) {
        const [pr, pg, pb] = palette[k]
        const d = (r - pr) ** 2 * 0.3 + (g - pg) ** 2 * 0.59 + (b - pb) ** 2 * 0.11
        if (d < best) {
          best = d
          idx = k
        }
      }
      cache[key] = idx
    }
    out[p] = idx
  }
  return out
}

/** GIF's variable-width LZW over palette indices, in ≤255-byte sub-blocks
 * ending with the zero block. */
export function lzw(indices: Uint8Array, minCodeSize = 8): Uint8Array {
  const out = new Bytes()
  out.byte(minCodeSize)
  const clear = 1 << minCodeSize
  const eoi = clear + 1
  let size = minCodeSize + 1
  let next = eoi + 1
  let table = new Map<number, number>()
  let cur = 0
  let shift = 0
  const block: number[] = []
  const flush = () => {
    out.byte(block.length)
    out.bytes(block)
    block.length = 0
  }
  const emit = (code: number) => {
    cur |= code << shift
    shift += size
    while (shift >= 8) {
      block.push(cur & 255)
      cur >>>= 8
      shift -= 8
      if (block.length === 255) flush()
    }
  }
  emit(clear)
  let prefix = indices[0] ?? 0
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i]
    const key = (prefix << 8) | k
    const code = table.get(key)
    if (code !== undefined) {
      prefix = code
      continue
    }
    emit(prefix)
    if (next === 4096) {
      emit(clear)
      table = new Map()
      next = eoi + 1
      size = minCodeSize + 1
    } else {
      if (next >= 1 << size) size++
      table.set(key, next++)
    }
    prefix = k
  }
  emit(prefix)
  emit(eoi)
  if (shift > 0) block.push(cur & 255)
  if (block.length) flush()
  out.byte(0)
  return out.done()
}

/** A looping GIF of RGBA frames, `delay` centiseconds apart. */
export function encodeGif(frames: Frame[], width: number, height: number, delay: number): Uint8Array {
  const palette = medianCut(sample(frames), 256)
  while (palette.length < 256) palette.push([0, 0, 0])
  const out = new Bytes()
  out.text("GIF89a")
  out.word(width)
  out.word(height)
  out.byte(0xf7) // global colour table, 8 bits per channel, 256 entries
  out.byte(0)
  out.byte(0)
  for (const [r, g, b] of palette) {
    out.byte(r)
    out.byte(g)
    out.byte(b)
  }
  // Loop forever (NETSCAPE2.0).
  out.bytes([0x21, 0xff, 0x0b])
  out.text("NETSCAPE2.0")
  out.bytes([0x03, 0x01, 0x00, 0x00, 0x00])
  const cache = new Int16Array(1 << 18).fill(-1)
  for (const frame of frames) {
    out.bytes([0x21, 0xf9, 0x04, 0x00])
    out.word(delay)
    out.bytes([0x00, 0x00])
    out.byte(0x2c)
    out.word(0)
    out.word(0)
    out.word(width)
    out.word(height)
    out.byte(0)
    out.bytes(lzw(quantize(frame, width, palette, 24, cache)))
  }
  out.byte(0x3b)
  return out.done()
}
