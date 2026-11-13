/** The mascot as a capture: its cells (`mascot.ts`) grown into a body of
 * Gaussians, thick at its heart and thin at its edges like a cut stone,
 * the ember parts in the ember and three electrons' orbits ringing it, as
 * a `.splat` file (the 32-byte record the kit's `engine/splats.ts` reads).
 * Our own capture, never a scan of someone else's: the docs' World section
 * prints it and the build serves it at CAPTURE_PATH
 * (`solid-site/site-files.ts`). Seeded, so every build writes the same
 * bytes. Node-side too: the build's config loads it under Node's own
 * TypeScript, so its imports carry `.ts`. `tests/splats.spec.ts` reads it. */
import { EYE, MASCOT_H, MASCOT_W, mascotCells, OPTIC } from "./mascot.ts"

export const CAPTURE_PATH = "models/mascot.splat"

const BONE = [228, 225, 216]
const EMBER = [255, 106, 43]
const OBSIDIAN = [16, 18, 20]
/** Gaussians per cell, and per orbit. */
const PER_CELL = 18
const PER_ORBIT = 420

function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

type Gaussian = { p: number[]; s: number; rgb: number[]; a: number }

/** The capture's Gaussians, y up, a cell 0.1 across. */
export function captureGaussians(): Gaussian[] {
  const rand = rng(0x5eed)
  const unit = 0.1
  const cx = (MASCOT_W - 1) / 2
  const cy = (MASCOT_H - 1) / 2
  const out: Gaussian[] = []
  // a cut stone: thick at the heart, thin at the edges
  const halfOf = (x: number, y: number) =>
    (y < 2 || y > 12 ? 0.5 : 0.6 + Math.max(0, 5 - Math.abs(x - cx) - Math.abs(y - 7)) * 0.45) * unit
  for (const c of mascotCells("idle")) {
    const half = halfOf(c.x, c.y)
    const ink = c.ink === "ember" ? EMBER : BONE
    for (let k = 0; k < PER_CELL; k++) {
      const shade = 0.82 + rand() * 0.18
      out.push({
        p: [(c.x - cx + rand() - 0.5) * unit, (cy - c.y + rand() - 0.5) * unit, (rand() * 2 - 1) * half],
        s: unit * (0.28 + rand() * 0.12),
        rgb: ink.map((v) => v * shade),
        a: 0.85,
      })
    }
  }
  // its eye dark and its optic a lens of ember, on both faces, so they read
  // from the front and the back
  for (const [[ex, ey], rgb] of [
    [EYE, OBSIDIAN],
    [OPTIC, EMBER],
  ] as const)
    for (const face of [-1, 1])
      for (let k = 0; k < 6; k++)
        out.push({
          p: [
            (ex - cx + (rand() - 0.5) * 0.6) * unit,
            (cy - ey + (rand() - 0.5) * 0.6) * unit,
            face * (halfOf(ex, ey) + unit * 0.05),
          ],
          s: unit * 0.3,
          rgb: [...rgb],
          a: 1,
        })
  // three orbits, each tilted its own way about the body
  const radius = 0.95
  for (let o = 0; o < 3; o++) {
    const tilt = (o * Math.PI) / 3
    for (let k = 0; k < PER_ORBIT; k++) {
      const t = (k / PER_ORBIT) * Math.PI * 2
      const x = Math.cos(t) * radius
      const y = Math.sin(t) * radius * 0.32
      const head = ((k / PER_ORBIT + o / 3) % 1) ** 6 // the electron and its trail
      out.push({
        p: [
          x * Math.cos(tilt) - y * Math.sin(tilt),
          x * Math.sin(tilt) + y * Math.cos(tilt),
          Math.sin(t) * radius * 0.3,
        ],
        s: unit * (0.1 + head * 0.25),
        rgb: EMBER,
        a: 0.25 + head * 0.75,
      })
    }
  }
  return out
}

/** The capture as `.splat` bytes. */
export function mascotCapture(): Uint8Array {
  const gs = captureGaussians()
  const out = new Uint8Array(gs.length * 32)
  const view = new DataView(out.buffer)
  gs.forEach((g, i) => {
    const o = i * 32
    g.p.forEach((v, a) => view.setFloat32(o + a * 4, v, true))
    for (let a = 0; a < 3; a++) view.setFloat32(o + 12 + a * 4, g.s, true)
    out.set([...g.rgb.map((v) => Math.round(Math.min(255, v))), Math.round(g.a * 255), 255, 128, 128, 128], o + 24)
  })
  return out
}
