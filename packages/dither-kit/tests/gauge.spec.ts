// The gauge: its dial's geometry (a 240-degree sweep from the lower left,
// the gap at the bottom), the band it prints (filled to the needle, the
// zone past `warn` in the warning ink, a faint track beyond, nothing in the
// gap) and the component as a meter: valued, named and read out.
import { describe, expect, it } from "rstack/test"
import { gaugeAlong, gaugeAngle, gaugePoint, gaugeTicks, paintGauge } from "../src/engine/gauge"
import { BAYER4 } from "../src/engine/pixel"

/** A 2D context with just what cellCanvas uses: ImageData in, one upload out. */
function fakeContext() {
  const uploads: ImageData[] = []
  const ctx = {
    createImageData: (w: number, h: number) =>
      ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) as unknown as ImageData,
    putImageData: (image: ImageData) => uploads.push(image),
  } as unknown as CanvasRenderingContext2D
  return { ctx, uploads }
}

const INK: [number, number, number] = [200, 200, 200]
const TRACK: [number, number, number] = [90, 90, 90]
const WARN: [number, number, number] = [255, 120, 40]

describe("the dial", () => {
  it("sweeps 240 degrees clockwise from the lower left", () => {
    expect(gaugeAngle(0)).toBe(150)
    expect(gaugeAngle(0.5)).toBe(270) // straight up
    expect(gaugeAngle(1)).toBe(390)
    expect(gaugeAngle(2)).toBe(390) // clamped to the scale
    const [x, y] = gaugePoint(gaugeAngle(0.5), 1)
    expect(x).toBeCloseTo(50)
    expect(y).toBeCloseTo(0)
  })
  it("marks ticks + 1 majors, ends included", () => {
    expect(gaugeTicks(4)).toEqual([0, 0.25, 0.5, 0.75, 1])
  })
  it("knows how far along the sweep a point sits, and the gap below has none", () => {
    expect(gaugeAlong(0, -1)).toBeCloseTo(0.5) // the top
    expect(gaugeAlong(0, 1)).toBeNull() // the bottom: the gap
    expect(gaugeAlong(-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6))).toBeCloseTo(0) // the start
  })
})

describe("the band", () => {
  const CELLS = 40
  const paint = (ratio: number, warn: number | null) => {
    const { ctx, uploads } = fakeContext()
    paintGauge(ctx, CELLS, INK, TRACK, WARN, ratio, warn, BAYER4)
    const img = uploads[0]
    // a cell on the band's mid radius at a share `t` of the sweep
    return (t: number) => {
      const [px, py] = gaugePoint(gaugeAngle(t), 0.83)
      const x = Math.floor((px / 100) * CELLS)
      const y = Math.floor((py / 100) * CELLS)
      // the brightest of its 2x2 neighbourhood, so the matrix's holes do not decide
      const near = [0, 1].flatMap((dy) => [0, 1].map((dx) => ((y + dy) * CELLS + x + dx) * 4))
      return near
        .map((i) => [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]])
        .sort((a, b) => b[3] - a[3])[0]
    }
  }

  it("fills to the needle in the ink and leaves a faint track past it", () => {
    const at = paint(0.5, null)
    const filled = at(0.3)
    const track = at(0.8)
    expect(filled.slice(0, 3)).toEqual(INK)
    expect(track.slice(0, 3)).toEqual(TRACK)
    expect(filled[3]).toBeGreaterThan(track[3])
  })
  it("prints the zone past warn in the warning ink, filled or not", () => {
    expect(paint(0.95, 0.8)(0.9).slice(0, 3)).toEqual(WARN)
    expect(paint(0.3, 0.8)(0.9).slice(0, 3)).toEqual(WARN)
  })
  it("leaves the gap at the bottom and the face inside the band empty", () => {
    const { ctx, uploads } = fakeContext()
    paintGauge(ctx, CELLS, INK, TRACK, WARN, 1, 0.8, BAYER4)
    const alpha = (x: number, y: number) => uploads[0].data[(y * CELLS + x) * 4 + 3]
    expect(alpha(CELLS / 2, CELLS - 2)).toBe(0) // the gap
    expect(alpha(CELLS / 2, CELLS / 2)).toBe(0) // the face
  })
})
