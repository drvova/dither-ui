// Shared 2D value-noise primitives for the kit's generative canvas surfaces
// (faulty-terminal, ferrofluid). Deterministic and dependency-free so the same
// seed draws the same field in a browser, SSR, or a worker.

/** Classic GLSL 2D hash — deterministic value in [0, 1). */
export function hash21(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Lattice value noise with smoothstep interpolation, output in [0, 1]. */
export function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash21(xi, yi)
  const b = hash21(xi + 1, yi)
  const c = hash21(xi, yi + 1)
  const d = hash21(xi + 1, yi + 1)
  const u = smooth(xf)
  const v = smooth(yf)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

/** Three-octave fbm, drifted by time. */
export function fbm(x: number, y: number, t: number): number {
  let sum = 0
  let amp = 0.5
  let fx = x
  let fy = y
  let ft = t
  for (let o = 0; o < 3; o++) {
    sum += amp * valueNoise(fx + ft, fy - ft * 0.5)
    fx *= 2
    fy *= 2
    ft *= 1.7
    amp *= 0.5
  }
  return sum
}

/* ------------------------------- simplex 2D ------------------------------- */

// Gustavson's 2D simplex: gradient noise with continuous derivatives, the
// organic end of the kit's noise family (value noise reads blocky under
// advection; simplex flows). Deterministic per seed — the permutation table
// is a seeded Fisher-Yates shuffle, so the same seed draws the same field in
// a browser, SSR, or a worker.

const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
] as const

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

/** Mulberry32 — tiny deterministic rng. Shared by the seeded noise tables and
 * any painter that needs stable scatter. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0 || 1
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function simplex2DFactory(seed = 0): (x: number, y: number) => number {
  // Seeded permutation table 0..255, doubled to avoid the wrap branch.
  const rand = mulberry32(seed)
  const perm = new Uint8Array(512)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) base[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = base[i]
    base[i] = base[j]
    base[j] = tmp
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]

  return function simplex2D(xin: number, yin: number): number {
    const sKew = (xin + yin) * F2
    const i = Math.floor(xin + sKew)
    const j = Math.floor(yin + sKew)
    const t = (i + j) * G2
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255
    let n = 0
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 > 0) {
      const g = GRAD2[perm[ii + perm[jj]] & 7]
      t0 *= t0
      n += t0 * t0 * (g[0] * x0 + g[1] * y0)
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 > 0) {
      const g = GRAD2[perm[ii + i1 + perm[jj + j1]] & 7]
      t1 *= t1
      n += t1 * t1 * (g[0] * x1 + g[1] * y1)
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 > 0) {
      const g = GRAD2[perm[ii + 1 + perm[jj + 1]] & 7]
      t2 *= t2
      n += t2 * t2 * (g[0] * x2 + g[1] * y2)
    }
    return 70 * n // ~[-1, 1]
  }
}
