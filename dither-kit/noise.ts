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
