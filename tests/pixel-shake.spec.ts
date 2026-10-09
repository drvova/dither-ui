import { describe, expect, it } from "vitest"
import { bayerMatrix } from "@/pages/landing/dither-field"
import { shakeRaster, type ShakeInput } from "@/pages/landing/pixel-shake"

const W = 40
const H = 30

// A deterministic "sprite": every pixel a distinct opaque value.
const src = Uint32Array.from({ length: W * H }, (_, i) => (0xff000000 | (i * 2654435761)) >>> 0)

function input(over: Partial<ShakeInput> = {}): ShakeInput {
  return {
    w: W,
    h: H,
    src,
    matrix: bayerMatrix(8),
    matrixSize: 8,
    pointer: { x: 20, y: 15 },
    energy: 1,
    radius: 6,
    amplitude: 4,
    t: 0.3,
    ...over,
  }
}

describe("pixel shake", () => {
  it("is the identity at zero energy", () => {
    const out = new Uint32Array(W * H)
    shakeRaster(out, input({ energy: 0 }))
    expect(out).toEqual(src)
  })

  it("moves cells only inside the pointer's pool", () => {
    const out = new Uint32Array(W * H)
    shakeRaster(out, input())
    let moved = 0
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (out[i] === src[i]) continue
        moved++
        // Nothing moves beyond ~3 sigma of the pool.
        expect(Math.hypot(x + 0.5 - 20, y + 0.5 - 15)).toBeLessThan(6 * 3)
      }
    expect(moved).toBeGreaterThan(10)
    expect(moved).toBeLessThan((W * H) / 2)
  })

  it("thins with the Bayer gate as energy drops, and is deterministic", () => {
    const count = (energy: number) => {
      const out = new Uint32Array(W * H)
      shakeRaster(out, input({ energy }))
      return out.reduce((n, v, i) => n + (v !== src[i] ? 1 : 0), 0)
    }
    expect(count(0.3)).toBeLessThan(count(1))
    expect(count(0.05)).toBeLessThan(count(0.3))
    const a = new Uint32Array(W * H)
    const b = new Uint32Array(W * H)
    shakeRaster(a, input())
    shakeRaster(b, input())
    expect(a).toEqual(b)
  })
})
