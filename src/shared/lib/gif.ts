// Animated GIF (89a) the kit's way: every frame quantized to ONE palette
// (the frames' own colours when they are few enough, else a median cut over
// samples of all frames) and, given a threshold matrix, ordered-dithered by
// it, so a recording of a dithered UI stays crisp and stable from frame to
// frame instead of crawling with error-diffusion noise. After the first
// frame only what changed is written (the changed box, the rest of it
// transparent over the frame before), so a loop whose art moves in cells
// costs a fraction of its full frames. Pure and import-free: RGBA in, bytes
// out. The og card renderer carries these functions inline (crawler-files.ts
// writes their source into its page), so each one is a plain declaration
// that names only the others.

export type Frame = Uint8ClampedArray

/** `matrix` ordered-dithers each pixel by up to ±`spread`/2 before it is
 * matched (default 24 with a matrix); without one every pixel takes its
 * nearest palette colour. `keep` are colours (RGB triples) the palette holds
 * exactly however few pixels wear them: a design's own colours, which a
 * sample of a large frame can miss (a one-glyph accent). */
export type GifOptions = { matrix?: number[][]; spread?: number; keep?: number[][] }

/** The palette slot a delta frame leaves see-through. */
export const TRANSPARENT = 255

/** A growable byte buffer. */
export function byteBuffer() {
  let buf = new Uint8Array(1 << 16)
  let length = 0
  const room = (n: number) => {
    if (length + n <= buf.length) return
    let size = buf.length * 2
    while (size < length + n) size *= 2
    const next = new Uint8Array(size)
    next.set(buf.subarray(0, length))
    buf = next
  }
  const byte = (b: number) => {
    room(1)
    buf[length++] = b
  }
  return {
    byte,
    word(w: number) {
      byte(w & 255)
      byte((w >> 8) & 255)
    },
    text(s: string) {
      for (const ch of s) byte(ch.charCodeAt(0))
    },
    bytes(src: ArrayLike<number>) {
      room(src.length)
      buf.set(src, length)
      length += src.length
    },
    done() {
      return buf.slice(0, length)
    },
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

/** The sampled colours themselves, when there are at most `max` of them. */
export function distinctColours(pixels: number[], max = 256): number[][] | null {
  const seen = new Set<number>()
  for (const p of pixels) {
    seen.add(p)
    if (seen.size > max) return null
  }
  return [...seen].sort((a, b) => a - b).map((p) => [(p >> 16) & 255, (p >> 8) & 255, p & 255])
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

/** One frame's palette indices. With a threshold `matrix` each pixel is
 * nudged by its cell's threshold (± spread/2) first, so flat tones between
 * two palette colours become the matrix's pattern; the nearest colour is
 * cached per 6-bit RGB. */
export function quantize(
  frame: Frame,
  width: number,
  palette: number[][],
  matrix: number[][] | null = null,
  spread = 24,
  cache = new Int16Array(1 << 18).fill(-1),
): Uint8Array {
  const n = matrix ? matrix.length : 1
  const out = new Uint8Array(frame.length / 4)
  for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
    const t = matrix ? (matrix[Math.floor(p / width) % n][(p % width) % n] - 0.5) * spread : 0
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
  const out = byteBuffer()
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

/** The box of `next` that differs from `prev`, every unchanged pixel in it
 * see-through; a 1×1 see-through box when nothing changed. */
export function deltaBox(prev: Uint8Array, next: Uint8Array, width: number) {
  const height = next.length / width
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0, p = 0; y < height; y++)
    for (let x = 0; x < width; x++, p++)
      if (prev[p] !== next[p]) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        y1 = y
      }
  if (x1 < 0) return { x: 0, y: 0, w: 1, h: 1, indices: Uint8Array.of(TRANSPARENT) }
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  const indices = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y0 + y) * width + x0 + x
      indices[y * w + x] = prev[p] === next[p] ? TRANSPARENT : next[p]
    }
  return { x: x0, y: y0, w, h, indices }
}

/** A looping GIF of RGBA frames, `delay` centiseconds apart. */
export function encodeGif(
  frames: Frame[],
  width: number,
  height: number,
  delay: number,
  { matrix, spread = matrix ? 24 : 0, keep = [] }: GifOptions = {},
): Uint8Array {
  // 255 colours: the last slot is the delta frames' see-through.
  const pixels = sample(frames)
  const room = TRANSPARENT - keep.length
  const palette = [...keep, ...(distinctColours(pixels, room) ?? medianCut(pixels, room))]
  while (palette.length < 256) palette.push([0, 0, 0])
  const out = byteBuffer()
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
  let prev: Uint8Array | null = null
  for (const frame of frames) {
    const indices = quantize(frame, width, palette, matrix ?? null, spread, cache)
    const box = prev ? deltaBox(prev, indices, width) : { x: 0, y: 0, w: width, h: height, indices }
    // Graphic control: each frame stays under the next (disposal 1); a
    // delta frame's see-through slot shows the one before through it.
    out.bytes([0x21, 0xf9, 0x04, prev ? 0x05 : 0x04])
    out.word(delay)
    out.bytes([TRANSPARENT, 0x00])
    out.byte(0x2c)
    out.word(box.x)
    out.word(box.y)
    out.word(box.w)
    out.word(box.h)
    out.byte(0)
    out.bytes(lzw(box.indices))
    prev = indices
  }
  out.byte(0x3b)
  return out.done()
}
