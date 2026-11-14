// @rstest-environment jsdom
// A chart reprints when the screen around it changes. Its loop keeps the
// fill it last printed and sleeps on it; the matrix a series thresholds
// through is part of what that fill was printed from, so a new matrix makes
// it stale on the next wake and the same matrix leaves it standing.
import { afterEach, beforeEach, describe, expect, it } from "rstack/test"
import { startBarLoop } from "../src/engine/bar-loop"
import { startCartesianLoop } from "../src/engine/cartesian-loop"
import { startPieLoop } from "../src/engine/pie-loop"
import { startRadarLoop } from "../src/engine/radar-loop"
import { seedFromColor } from "../src/engine/palette"
import { SCREENS } from "../src/engine/pixel"

const COLS = 16
const ROWS = 16
const frames: FrameRequestCallback[] = []
const realRaf = globalThis.requestAnimationFrame
const realCancel = globalThis.cancelAnimationFrame
beforeEach(() => {
  globalThis.requestAnimationFrame = (cb) => frames.push(cb)
  globalThis.cancelAnimationFrame = () => {}
})
afterEach(() => {
  globalThis.requestAnimationFrame = realRaf
  globalThis.cancelAnimationFrame = realCancel
  frames.length = 0
})

type Loop = { stop: () => void; wake: () => void } | undefined
type Start = (canvas: HTMLCanvasElement, screen: { matrix: number[][] }) => Loop

const box = <T>(current: T) => ({ current })
const span = (v: number) => Array.from({ length: COLS }, () => v)
const size = { canvas: null, bloomCanvas: null, visible: () => true, cols: COLS, rows: ROWS, width: COLS, height: ROWS }

/** What every chart's state shares: one still series, nothing hovered. */
const still = (screen: { matrix: number[][] }) => ({
  ready: true,
  animate: false,
  animationDuration: 1,
  animationDelay: 0,
  revision: 0,
  easing: "glide",
  configKeys: ["a"],
  config: { a: { color: "blue" } },
  dataLength: 2,
  hoverLift: false,
  hoverStrength: 0,
  isMouseInChart: false,
  hovered: false,
  hoverIndex: null,
  selectedDataKey: null,
  focusDataKey: null,
  bloom: "off",
  bloomOnHover: false,
  dimOpacity: 1,
  seedOf: () => seedFromColor("blue"),
  matrixOf: () => screen.matrix,
})
const series = {
  seriesSpecs: { a: { dataKey: "a", kind: "area", variant: "gradient", strokeVariant: "solid", opacity: 1 } },
  stackType: "default",
}
const polar = { center: { x: COLS / 2, y: ROWS / 2 }, outerRadius: 7, innerRadius: 0, variantOf: () => "gradient" }

const loops: Record<string, Start> = {
  cartesian: (canvas, screen) =>
    startCartesianLoop({
      ...size,
      canvas,
      state: box({
        ...still(screen),
        ...series,
        chartType: "area",
        sparkles: false,
        sparkleSpeed: 1,
        markerIndex: null,
        crosshair: false,
        markEntranceDone() {},
      }) as never,
      targets: box({ a: { top: span(0), floor: span(ROWS - 1) } }),
      stars: box([]),
      spark: box({} as never),
      effect: box({} as never),
      glyph: box({} as never),
    }),
  bar: (canvas, screen) =>
    startBarLoop({
      ...size,
      canvas,
      state: box({
        ...still(screen),
        ...series,
        stagger: 0,
        barSlot: (i: number) => ({ x: i * 8, width: 8 }),
      }) as never,
      targets: box({ a: { top: [0, 0], base: [ROWS - 1, ROWS - 1] } }),
    }),
  pie: (canvas, screen) =>
    startPieLoop({
      ...size,
      canvas,
      state: box({
        ...still(screen),
        ...polar,
        popOut: 0,
        rimWidth: 1,
        pie: [{ name: "a", value: 1, start: -Math.PI / 2, end: (3 * Math.PI) / 2, mid: Math.PI / 2 }],
      }) as never,
    }),
  radar: (canvas, screen) =>
    startRadarLoop({
      ...size,
      canvas,
      state: box({
        ...still(screen),
        ...polar,
        falloff: 1,
        data: [{ a: 1 }, { a: 1 }, { a: 1 }],
        radar: { axes: [0, 1, 2].map((i) => ({ label: String(i), angle: (i * 2 * Math.PI) / 3 })), max: 1 },
      }) as never,
    }),
}

describe("a chart loop's cached fill and the matrix it was printed through", () => {
  for (const [kind, start] of Object.entries(loops)) {
    it(`${kind}: a new matrix reprints the fill, the same matrix leaves it`, () => {
      const prints: string[] = []
      const ctx = {
        clearRect() {},
        fillRect() {},
        drawImage() {},
        putImageData: (image: ImageData) => prints.push(image.data.join()),
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        fillStyle: "",
      }
      const canvas = { getContext: () => ctx, width: 0, height: 0 } as unknown as HTMLCanvasElement
      const screen = { matrix: SCREENS.bayer }
      const loop = start(canvas, screen)!
      const settle = () => {
        for (let t = 16; frames.length; t += 16) frames.shift()!(t)
      }
      settle()
      expect(prints.length).toBeGreaterThan(0)
      const printed = prints.length
      const bayer = prints[printed - 1]

      // Asleep on its fill: a wake with nothing changed prints nothing.
      loop.wake()
      settle()
      expect(prints.length).toBe(printed)

      screen.matrix = SCREENS.line
      loop.wake()
      settle()
      expect(prints.length).toBe(printed + 1)
      expect(prints[printed]).not.toBe(bayer)

      loop.wake()
      settle()
      expect(prints.length).toBe(printed + 1)
      loop.stop()
    })
  }
})
