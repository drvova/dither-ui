// dither-field: the landing's living-canvas engine. Vanilla — no framework
// imports, no kit imports — so the same module runs from a Vue mount, a
// Svelte action or a plain <script type="module"> on any page.
//
// The picture is a lattice of CELLS (default 3 css px). Every frame a
// luminance FIELD (seeded Gaussian bodies drifting on incommensurate clocks,
// plus the cursor's own body) is sampled once per cell, ordered-dithered
// through an 8x8 Bayer matrix onto a colour ramp, and written as packed
// 32-bit pixels into one ImageData the size of the lattice. That small
// bitmap is put on an offscreen canvas and blitted onto the visible one
// with image smoothing off — nearest-neighbour upscale is the whole
// "pixel" look, and it costs one drawImage instead of one fillRect per cell.
//
// Budget: the organism rides the page's ONE heartbeat (`senses`): no rAF,
// pointer, scroll, visibility or reduced-motion listener of its own — it
// reads the shared sensorium on each tick and paints at `fps` scaled by the
// metabolic `quality` tier and the `drowsy` hormone; `arousal` runs its
// clock faster (tempo). Offscreen (IntersectionObserver on its own canvas)
// it unsubscribes. DPR clamped; a static single frame under reduced
// motion. Field coordinates are CSS px of the canvas box — consumers anchor
// bodies by fractions of (w, h) and never meet the DPR. Every output is
// deterministic for a given (seed, size, t, pointer).

import { senses } from "./senses"

export type Body = {
  x: number // anchor, css px
  y: number
  r: number // radius, css px (the Gaussian's 2-sigma)
  fx: number // drift frequency, cycles per second
  fy: number
  px: number // drift phase
  py: number
  w: number // peak luminance contribution
}

export type Rect = { x: number; y: number; w: number; h: number }

export type FieldOptions = {
  /** Colour ramp, darkest first; a cell below the first level stays clear. */
  ramp: readonly string[]
  /** Optional second ramp for the hottest tones (above `hotAt`). */
  hot?: readonly string[]
  /** Field value (0–1) where `hot` takes over. Default 1 = never. */
  hotAt?: number
  /** CSS px per lattice cell. Default 3. */
  cell?: number
  /** Paint rate. Default 24. */
  fps?: number
  /** Bayer matrix size. Default 8. */
  matrix?: 4 | 8
  /** Generative seed: same seed, same creature. Default 1. */
  seed?: number
  /** Device-pixel-ratio clamp. Default 2. */
  maxDpr?: number
  /** Field multiplier at rest. Default 1. */
  density?: number
  /** Field multiplier while the pointer is over `pointerTarget`; eased. */
  hoverDensity?: number
  /** Peak luminance of the cursor body; 0 disables pointer tracking. Default 0.55. */
  pointer?: number
  /** Cursor body radius, css px. Default 56. */
  pointerRadius?: number
  /** Parallax: field y shifts by scrollY * scroll (read from senses). Default 0. */
  scroll?: number
  /** Threshold-edge flicker amount (0–1): cells sitting at a Bayer level
   * boundary sizzle between the two colours. Default 0.4. */
  sizzle?: number
  /** Body layout for a (w, h) box; `rand` is the seeded PRNG. Default: three
   * bodies scattered over the box. */
  bodies?: (w: number, h: number, rand: () => number) => Body[]
  /** Per-cell multiplier (0–1) for vertical melts, edge fades, etc. */
  mask?: (x: number, y: number, w: number, h: number) => number
  /** Element whose pointer events drive the cursor body and hover density.
   * Default: the canvas's parent. */
  pointerTarget?: HTMLElement | null
  /** Pause offscreen. Default true. */
  autoPause?: boolean
}

export type DitherField = {
  start(): void
  stop(): void
  destroy(): void
  /** Paint one frame at time `t` (seconds). Used by the loop and by tests. */
  paint(t: number): void
  /** Move the cursor body (css px of the canvas box); null releases it. */
  setPointer(p: { x: number; y: number } | null): void
  /** Set the rest density target (eased). */
  setDensity(d: number): void
  /** A soft exclusion (css px of the canvas box) the field fades out of —
   * the copy's own box, so art yields to text at every width. */
  setAvoid(rect: Rect | null, pad?: number): void
  readonly running: boolean
}

/** mulberry32 — a tiny deterministic PRNG for layout params. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable per-cell noise (hash, not PRNG state) for the threshold sizzle. */
export function cellHash(x: number, y: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** The ordered-dither threshold matrix (n = 4 or 8), as a flat row-major
 * Float32Array of (rank + 0.5) / n² thresholds — the textbook recursive
 * Bayer construction, so the 4x4 is exactly the kit's gradient matrix. */
export function bayerMatrix(n: 4 | 8): Float32Array {
  let m = [[0, 2], [3, 1]]
  while (m.length < n) {
    const k = m.length
    const next: number[][] = Array.from({ length: k * 2 }, () => new Array<number>(k * 2).fill(0))
    for (let y = 0; y < k; y++)
      for (let x = 0; x < k; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + k] = v + 2
        next[y + k][x] = v + 3
        next[y + k][x + k] = v + 1
      }
    m = next
  }
  const out = new Float32Array(n * n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[y * n + x] = (m[y][x] + 0.5) / (n * n)
  return out
}

// ImageData is RGBA bytes; a Uint32 view packs them in platform order.
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([0x0a0b0c0d]).buffer)[0] === 0x0d

/** Pack a `#rrggbb` (or `#rgb`) colour as an opaque ImageData pixel. */
export function packColor(hex: string): number {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h.slice(0, 6), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return LITTLE_ENDIAN ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0 : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0
}

/** Ordered-dither a tone (0–1) onto a ramp of `levels` colours: the index
 * (1-based, 0 = clear) of the colour this cell shows. `th` is the cell's
 * Bayer threshold. Cells step up to the next colour when the tone's
 * fractional part beats the threshold — the kit's own rule. */
export function quantize(tone: number, levels: number, th: number): number {
  const v = (tone < 0 ? 0 : tone > 1 ? 1 : tone) * levels
  const base = Math.floor(v)
  const i = base + (v - base > th ? 1 : 0)
  return i > levels ? levels : i
}

/** Default layout: three bodies scattered across the box, radii keyed to
 * its short side, incommensurate drift clocks (nothing visibly repeats). */
export function scatterBodies(w: number, h: number, rand: () => number, count = 3): Body[] {
  const dim = Math.min(w, h)
  const bodies: Body[] = []
  for (let i = 0; i < count; i++) {
    bodies.push({
      x: (0.15 + rand() * 0.7) * w,
      y: (0.15 + rand() * 0.7) * h,
      r: dim * (0.18 + rand() * 0.16),
      fx: 0.05 + rand() * 0.07,
      fy: 0.04 + rand() * 0.06,
      px: rand() * Math.PI * 2,
      py: rand() * Math.PI * 2,
      w: 0.8 + rand() * 0.3,
    })
  }
  return bodies
}

/** A body's luminance at (x, y) and time t: a Gaussian whose centre drifts
 * on a Lissajous path and whose radius breathes. */
export function bodyField(b: Body, x: number, y: number, t: number): number {
  const bx = b.x + Math.sin(t * b.fx * Math.PI * 2 + b.px) * b.r * 0.5
  const by = b.y + Math.cos(t * b.fy * Math.PI * 2 + b.py) * b.r * 0.3
  const r = b.r * (1 + Math.sin(t * 0.21 + b.px) * 0.1)
  const dx = x - bx
  const dy = y - by
  const s = r * 0.5
  return b.w * Math.exp(-(dx * dx + dy * dy) / (2 * s * s))
}

/** Soft exclusion: 1 well outside the rect, 0 inside, smoothstep across
 * `pad` px of margin. */
export function avoidFactor(x: number, y: number, r: Rect, pad: number): number {
  const dx = x < r.x ? r.x - x : x > r.x + r.w ? x - r.x - r.w : 0
  const dy = y < r.y ? r.y - y : y > r.y + r.h ? y - r.y - r.h : 0
  if (dx === 0 && dy === 0) return 0
  const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / pad)
  return d * d * (3 - 2 * d)
}

export type RasterInput = {
  cols: number
  rows: number
  cell: number // css px per cell
  matrix: Float32Array
  matrixSize: number
  ramp: Uint32Array
  hot: Uint32Array
  hotAt: number
  sizzle: number
  density: number
  bodies: readonly Body[]
  pointer: { x: number; y: number; w: number; r: number } | null
  avoid: { rect: Rect; pad: number } | null
  scrollShift: number
  mask?: (x: number, y: number, w: number, h: number) => number
}

/** The pure raster: fill `buf` (cols × rows packed pixels, cleared here)
 * for time `t`. Everything the loop does per frame lives in this function,
 * so a test can run it headless and assert on bytes. */
export function rasterize(buf: Uint32Array, inp: RasterInput, t: number): void {
  buf.fill(0)
  const { cols, rows, cell, matrix, matrixSize, ramp, hot, hotAt, sizzle, density, bodies, pointer, avoid, mask } = inp
  const w = cols * cell
  const h = rows * cell
  const levels = ramp.length
  const hotLevels = hot.length
  const mmask = matrixSize - 1
  // Clear floor: below one Bayer step of the first level nothing can light,
  // so skip the quantize for the dark sea between bodies.
  const floor = 1 / (levels * matrixSize * matrixSize)
  for (let cy = 0; cy < rows; cy++) {
    const y = (cy + 0.5) * cell
    const fy = y + inp.scrollShift
    const mrow = (cy & mmask) * matrixSize
    for (let cx = 0; cx < cols; cx++) {
      const x = (cx + 0.5) * cell
      let L = 0
      for (let i = 0; i < bodies.length; i++) L += bodyField(bodies[i], x, fy, t)
      if (pointer && pointer.w > 0.005) {
        const dx = x - pointer.x
        const dy = y - pointer.y
        const s = pointer.r * 0.5
        L += pointer.w * Math.exp(-(dx * dx + dy * dy) / (2 * s * s))
      }
      L *= density
      if (mask) L *= mask(x, y, w, h)
      if (avoid) L *= avoidFactor(x, y, avoid.rect, avoid.pad)
      if (L <= floor) continue
      if (L > 1) L = 1
      const th = matrix[mrow + (cx & mmask)]
      if (sizzle > 0) {
        // Only cells near a level boundary flicker: the nudge is scaled by
        // how close the tone sits to its boundary, and gated by a stable
        // per-cell hash so the same third of cells always carries it.
        const hsh = cellHash(cx, cy)
        if (hsh < 0.3) {
          const v = L * levels
          const near = 1 - Math.abs(v - Math.floor(v) - 0.5) * 2
          L += (hsh / 0.3 - 0.5) * sizzle * 0.1 * near * Math.sin(t * 6 + hsh * 40)
        }
      }
      if (hotLevels > 0 && L > hotAt) {
        const i = quantize((L - hotAt) / (1 - hotAt), hotLevels, th)
        buf[cy * cols + cx] = i > 0 ? hot[i - 1] : ramp[levels - 1]
      } else {
        const i = quantize(L, levels, th)
        if (i > 0) buf[cy * cols + cx] = ramp[i - 1]
      }
    }
  }
}

/** Mount the engine on a canvas. The canvas is sized from its CSS box (keep
 * it `display:block; width:100%; height:100%` in the host's styles). */
export function createDitherField(canvas: HTMLCanvasElement, opts: FieldOptions): DitherField {
  const baseCell = opts.cell ?? 3
  const fps = opts.fps ?? 24
  const matrixSize = opts.matrix ?? 8
  const matrix = bayerMatrix(matrixSize)
  const seed = opts.seed ?? 1
  const maxDpr = opts.maxDpr ?? 2
  const restDensity = opts.density ?? 1
  const hoverDensity = opts.hoverDensity ?? restDensity
  const pointerWeight = opts.pointer ?? 0.55
  const pointerRadius = opts.pointerRadius ?? 56
  const parallax = opts.scroll ?? 0
  const autoPause = opts.autoPause ?? true
  const layout = opts.bodies ?? ((w, h, rand) => scatterBodies(w, h, rand))
  const ramp = Uint32Array.from(opts.ramp, packColor)
  const hot = Uint32Array.from(opts.hot ?? [], packColor)
  const target = opts.pointerTarget === undefined ? canvas.parentElement : opts.pointerTarget
  const body = senses()

  const ctx = canvas.getContext("2d")
  const off = document.createElement("canvas")
  const octx = off.getContext("2d")
  let image: ImageData | null = null
  let buf = new Uint32Array(0)
  let cols = 0
  let rows = 0
  let W = 0
  let H = 0
  let cellCss = baseCell
  let quality = body.quality
  let bodies: Body[] = []
  let running = false
  let unsubscribe: (() => void) | null = null
  let acc = 0
  let clock = 0
  let density = restDensity
  let avoid: { rect: Rect; pad: number } | null = null
  let visible = !autoPause
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, w: 0, inside: false }

  const input = (): RasterInput => ({
    cols,
    rows,
    cell: cellCss,
    matrix,
    matrixSize,
    ramp,
    hot,
    hotAt: opts.hotAt ?? 1,
    // Detail is the first thing metabolism spends: no sizzle at half quality.
    sizzle: body.reduced || quality <= 0.5 ? 0 : (opts.sizzle ?? 0.4),
    density,
    bodies,
    pointer: pointerWeight > 0 ? { x: pointer.x, y: pointer.y, w: pointer.w, r: pointerRadius } : null,
    avoid,
    scrollShift: body.scrollY * parallax,
    mask: opts.mask,
  })

  function paint(t: number) {
    if (!ctx || !octx || !image || cols === 0) return
    rasterize(buf, input(), t)
    octx.putImageData(image, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, cols, rows, 0, 0, W, H)
  }

  function resize() {
    const box = canvas.getBoundingClientRect()
    if (box.width < 4 || box.height < 4) return
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    W = Math.round(box.width * dpr)
    H = Math.round(box.height * dpr)
    canvas.width = W
    canvas.height = H
    // Half quality coarsens the lattice by a cell: a quarter of the samples.
    cellCss = quality <= 0.5 ? baseCell + 1 : baseCell
    cols = Math.max(1, Math.round(box.width / cellCss))
    rows = Math.max(1, Math.round(box.height / cellCss))
    off.width = cols
    off.height = rows
    image = octx ? octx.createImageData(cols, rows) : null
    buf = image ? new Uint32Array(image.data.buffer) : new Uint32Array(0)
    bodies = layout(cols * cellCss, rows * cellCss, mulberry32(seed))
    paint(body.reduced ? 0 : clock)
  }

  // Where the shared pointer sits relative to this canvas, and whether it
  // is over the hover target — the organism's own proprioception.
  function sense() {
    if (pointerWeight <= 0) return
    const p = body.pointer
    const over = p.inside && target ? contains(target.getBoundingClientRect(), p.x, p.y) : false
    if (over) {
      const r = canvas.getBoundingClientRect()
      pointer.tx = p.x - r.left
      pointer.ty = p.y - r.top
      if (!pointer.inside) {
        pointer.x = pointer.tx
        pointer.y = pointer.ty
      }
    }
    pointer.inside = over
  }

  function tick(dt: number, tempo: number) {
    if (body.reduced) {
      paint(0)
      return
    }
    if (body.quality !== quality) {
      quality = body.quality
      resize()
    }
    sense()
    const h = body.hormones
    // Eases run every beat so the cursor body and the hover density glide
    // between paints instead of stepping at the paint rate.
    const pw = pointer.inside ? pointerWeight : 0
    pointer.w += (pw - pointer.w) * 0.07
    if (pointer.inside) {
      pointer.x += (pointer.tx - pointer.x) * 0.16
      pointer.y += (pointer.ty - pointer.y) * 0.16
    }
    const rest = restDensity * (1 - 0.35 * h.drowsy)
    density += ((pointer.inside ? hoverDensity : rest) - density) * 0.08
    clock += (dt * tempo) / 1000
    acc += dt
    // Metabolism: frame rate scales with quality and sinks while drowsy.
    const frameMs = 1000 / Math.max(6, fps * quality * (1 - 0.5 * h.drowsy))
    if (acc >= frameMs) {
      paint(clock)
      acc %= frameMs
    }
  }

  function start() {
    if (running) return
    running = true
    acc = 0
    unsubscribe = body.subscribe({ tick })
  }

  function stop() {
    running = false
    unsubscribe?.()
    unsubscribe = null
  }

  let io: IntersectionObserver | null = null
  let ro: ResizeObserver | null = null
  let roRaf = 0

  resize()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => {
      // Coalesce RO bursts; rebuild the lattice at most once per frame.
      if (roRaf) return
      roRaf = requestAnimationFrame(() => {
        roRaf = 0
        resize()
      })
    })
    ro.observe(canvas)
  }
  if (autoPause && typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting)
        if (visible) start()
        else stop()
      },
      { threshold: 0.02 },
    )
    io.observe(canvas)
  } else {
    visible = true
    start()
  }

  return {
    start,
    stop,
    paint,
    setPointer(p) {
      if (!p) {
        pointer.inside = false
        return
      }
      pointer.tx = p.x
      pointer.ty = p.y
      if (!pointer.inside) {
        pointer.x = p.x
        pointer.y = p.y
      }
      pointer.inside = true
    },
    setDensity(d) {
      density = d
    },
    setAvoid(rect, pad = 48) {
      avoid = rect ? { rect, pad } : null
      if (body.reduced || !running) paint(body.reduced ? 0 : clock)
    },
    get running() {
      return running
    },
    destroy() {
      stop()
      io?.disconnect()
      ro?.disconnect()
      if (roRaf) cancelAnimationFrame(roRaf)
    },
  }
}

const contains = (r: DOMRect, x: number, y: number) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
