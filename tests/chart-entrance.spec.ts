// @rstest-environment jsdom
// A chart's entrance plays to its end on its own. The paint loop skips a
// frame with nothing new to paint; it used to let go of the loop there too,
// so an entrance with a delay (or two frames on one timestamp) stopped part
// drawn until a hover woke it (the Svelte landing's area chart showed only
// January). The Svelte kit carries the same loop inline.
import { readFileSync } from "node:fs"
import { afterEach, expect, it } from "rstack/test"
import { startCartesianLoop } from "@dither-kit/engine/cartesian-canvas"

const frames: FrameRequestCallback[] = []
const realRaf = globalThis.requestAnimationFrame
const realCancel = globalThis.cancelAnimationFrame
afterEach(() => {
  globalThis.requestAnimationFrame = realRaf
  globalThis.cancelAnimationFrame = realCancel
  frames.length = 0
})

it("keeps painting through an entrance's delay until the entrance is done", () => {
  globalThis.requestAnimationFrame = (cb) => frames.push(cb)
  globalThis.cancelAnimationFrame = () => {}
  const ctx = {
    clearRect() {},
    fillRect() {},
    drawImage() {},
    putImageData() {},
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    fillStyle: "",
  }
  const canvas = { getContext: () => ctx, width: 0, height: 0 } as unknown as HTMLCanvasElement
  let done = false
  const state = {
    ready: true,
    animate: true,
    animationDuration: 400,
    animationDelay: 200,
    revision: 0,
    configKeys: [],
    config: {},
    seriesSpecs: {},
    sparkles: false,
    hoverLift: false,
    hoverStrength: 0,
    isMouseInChart: false,
    hovered: false,
    hoverIndex: null,
    markerIndex: null,
    selectedDataKey: null,
    focusDataKey: null,
    crosshair: false,
    bloom: "off",
    bloomOnHover: false,
    dimOpacity: 1,
    sparkleSpeed: 1,
    stackType: "default",
    chartType: "area",
    easing: "glide",
    dataLength: 0,
    markEntranceDone: () => (done = true),
  }
  const box = <T>(current: T) => ({ current })
  const loop = startCartesianLoop({
    canvas,
    bloomCanvas: null,
    visible: () => true,
    cols: 8,
    rows: 4,
    state: box(state) as never,
    targets: box({}),
    stars: box([]),
    spark: box({} as never),
    effect: box({} as never),
    glyph: box({} as never),
  })
  expect(loop).toBeDefined()
  // Run the frames the loop asks for, 16ms apart, for a second.
  for (let t = 16; t <= 1000 && frames.length; t += 16) frames.shift()!(t)
  expect(done).toBe(true)
})

it("keeps the Svelte kit's copy of the loop on the same rule", () => {
  const svelte = readFileSync("dither-kit-svelte/charts/CartesianCanvas.svelte", "utf8")
  expect(svelte).toContain("if (sparkleMotion || (animate && !entranceReported)) schedule()")
})
