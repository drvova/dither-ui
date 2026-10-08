// pixel-shake: hover disturbance for a pixel image. Vanilla — no framework
// or kit imports — a sibling of dither-field on the same Bayer rules.
//
// The image is held at its NATIVE crop resolution (one art pixel = one
// cell). While the cursor is over it, every frame re-samples the source
// through a displacement field centred on the pointer: cells inside the
// pool are pushed outward and shaken side to side, the push scaled by the
// pool's Gaussian falloff and by the shake's ENERGY, which the pointer tops
// up and which decays every frame — lift the cursor and the cells spring
// home, cell by cell. The pool is ordered-dithered: a cell moves only when
// its Bayer threshold falls under the local strength, so the disturbance is
// dense at the cursor and thins to single scattered pixels at the fringe
// (a smooth warp would read as a lens; the dither reads as pixels).
//
// Budget: the loop runs ONLY while energy is above the floor — at rest no
// rAF exists; one lattice-sized ImageData rewritten per frame and blitted
// nearest-neighbour; DPR clamped; nothing under prefers-reduced-motion
// (the image simply stays). Deterministic for (source, pointer, energy, t).

import { bayerMatrix, cellHash } from "./dither-field"

export type ShakeOptions = {
  /** Pool radius in art px (the Gaussian's 2-sigma). Default 18. */
  radius?: number
  /** Peak displacement in art px. Default 5. */
  amplitude?: number
  /** Energy retained per frame (at 60fps). Default 0.9. */
  decay?: number
  /** Energy the pointer adds per move, before the speed bonus. Default 0.22. */
  kick?: number
  /** Bayer matrix size. Default 8. */
  matrix?: 4 | 8
  maxDpr?: number
  /** Element whose pointer events drive the pool. Default: the canvas's parent. */
  target?: HTMLElement | null
}

export type PixelShake = {
  /** Add energy at a point (css px of the canvas box). */
  disturb(x: number, y: number, strength?: number): void
  /** Repaint the pristine image (after a source change). */
  reset(): void
  destroy(): void
  readonly energy: number
}

export type ShakeInput = {
  w: number
  h: number
  src: Uint32Array
  matrix: Float32Array
  matrixSize: number
  pointer: { x: number; y: number } // art px
  energy: number // 0–1
  radius: number
  amplitude: number
  t: number // seconds
}

/** The pure raster: write the disturbed image into `out` (w × h packed
 * pixels; 0 = transparent). Energy 0 is the identity. */
export function shakeRaster(out: Uint32Array, inp: ShakeInput): void {
  const { w, h, src, matrix, matrixSize, pointer, energy, radius, amplitude, t } = inp
  if (energy <= 0.001) {
    out.set(src)
    return
  }
  const mmask = matrixSize - 1
  const sigma2 = 2 * radius * radius
  const wobble = Math.sin(t * 46) // the shake: a fast side-to-side clock
  for (let y = 0; y < h; y++) {
    const mrow = (y & mmask) * matrixSize
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const dx = x + 0.5 - pointer.x
      const dy = y + 0.5 - pointer.y
      const d2 = dx * dx + dy * dy
      const inf = Math.exp(-d2 / sigma2)
      const strength = inf * energy
      // Ordered gate: the cell moves only when the local strength beats its
      // Bayer threshold — dense at the core, scattered singles at the edge.
      if (strength < 0.02 || matrix[mrow + (x & mmask)] > strength * 1.6) {
        out[i] = src[i]
        continue
      }
      const d = Math.sqrt(d2) || 1
      const hsh = cellHash(x, y)
      const a = hsh * Math.PI * 2
      const push = amplitude * strength
      // Outward from the cursor, plus a per-cell shake direction riding the
      // wobble clock so neighbours jitter against each other.
      const ox = (dx / d) * push * 0.7 + Math.cos(a) * push * wobble
      const oy = (dy / d) * push * 0.7 + Math.sin(a) * push * wobble
      const sx = Math.round(x - ox)
      const sy = Math.round(y - oy)
      out[i] = sx < 0 || sy < 0 || sx >= w || sy >= h ? 0 : src[sy * w + sx]
    }
  }
}

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

/** Mount on a canvas whose CSS size the host owns; `crop` is the source
 * rectangle of `image` (a sprite sheet) drawn at native resolution. */
export function createPixelShake(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  crop: { x: number; y: number; w: number; h: number },
  opts: ShakeOptions = {},
): PixelShake {
  const radius = opts.radius ?? 18
  const amplitude = opts.amplitude ?? 5
  const decay = opts.decay ?? 0.9
  const kick = opts.kick ?? 0.22
  const matrixSize = opts.matrix ?? 8
  const matrix = bayerMatrix(matrixSize)
  const maxDpr = opts.maxDpr ?? 3
  const target = opts.target === undefined ? canvas.parentElement : opts.target
  const { w, h } = crop

  const off = document.createElement("canvas")
  off.width = w
  off.height = h
  const octx = off.getContext("2d", { willReadFrequently: true })
  const ctx = canvas.getContext("2d")
  let src = new Uint32Array(0)
  let image32: ImageData | null = null
  let out = new Uint32Array(0)
  if (octx) {
    octx.drawImage(image, crop.x, crop.y, w, h, 0, 0, w, h)
    src = new Uint32Array(octx.getImageData(0, 0, w, h).data.buffer)
    image32 = octx.createImageData(w, h)
    out = new Uint32Array(image32.data.buffer)
  }

  const reduced = reducedMotion()
  const pointer = { x: w / 2, y: h / 2 }
  let energy = 0
  let raf = 0
  let last = 0
  let clock = 0
  let lastMove = 0
  let lx = 0
  let ly = 0

  function blit() {
    if (!ctx || !octx || !image32) return
    const box = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    const W = Math.max(1, Math.round((box.width || w) * dpr))
    const H = Math.max(1, Math.round((box.height || h) * dpr))
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
    }
    octx.putImageData(image32, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, w, h, 0, 0, W, H)
  }

  function paint() {
    shakeRaster(out, { w, h, src, matrix, matrixSize, pointer, energy, radius, amplitude, t: clock })
    blit()
  }

  function tick(now: number) {
    raf = 0
    if (!last) last = now
    const dt = Math.min(now - last, 100)
    last = now
    clock += dt / 1000
    // Frame-rate independent decay: `decay` is per 60fps frame.
    energy *= Math.pow(decay, dt / (1000 / 60))
    if (energy < 0.01) {
      energy = 0
      paint() // the pristine frame, exactly
      last = 0
      return
    }
    paint()
    raf = requestAnimationFrame(tick)
  }

  function disturb(x: number, y: number, strength = kick) {
    if (reduced || src.length === 0) return
    const box = canvas.getBoundingClientRect()
    pointer.x = (x / (box.width || w)) * w
    pointer.y = (y / (box.height || h)) * h
    energy = Math.min(1, energy + strength)
    if (!raf) raf = requestAnimationFrame(tick)
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    const r = canvas.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    // Faster strokes shake harder: the kick grows with pointer speed.
    const now = e.timeStamp
    const speed = lastMove ? Math.hypot(x - lx, y - ly) / Math.max(1, now - lastMove) : 0
    lastMove = now
    lx = x
    ly = y
    disturb(x, y, kick + Math.min(0.3, speed * 0.25))
  }

  if (!reduced) target?.addEventListener("pointermove", onMove, { passive: true })
  paint()

  return {
    disturb,
    reset() {
      energy = 0
      paint()
    },
    get energy() {
      return energy
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      target?.removeEventListener("pointermove", onMove)
    },
  }
}
