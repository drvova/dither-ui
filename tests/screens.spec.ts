// @rstest-environment jsdom
// Print screens: each is a permutation of the 16 ranks that grows its own
// shape (a line, a hatch, a dot, a cross) as density rises; the Bayer one
// seeded is the old seeded matrix, bit for bit; and a `DitherScreen`
// reaches every surface and chart series below it through one function.
import { describe, expect, it } from "rstack/test"
import { defineComponent, h } from "vue"
import { mount } from "@vue/test-utils"
import { matrixFromSeed, type VariantInput } from "../dither-kit/engine/dither-paint"
import {
  BAYER4,
  pixelMatrixFromSeed,
  SCREEN_KINDS,
  SCREENS,
  screenMatrix,
  type ScreenKind,
} from "../dither-kit/engine/pixel"
import { useDitherMatrix, useLabelMatrix, useVariantMatrix } from "../dither-kit/engine/use-screen"
import DitherScreen from "../dither-kit/tailwind/DitherScreen.vue"

/** The cells a density lights, as "x,y". */
const lit = (m: number[][], density: number) =>
  m.flatMap((row, y) => row.flatMap((t, x) => (density > t ? [`${x},${y}`] : []))).sort()

describe("print screens", () => {
  it("are each a 4x4 permutation of the 16 ranks", () => {
    for (const kind of SCREEN_KINDS) {
      const ranks = SCREENS[kind].flat().map((t) => t * 16 - 0.5)
      expect(
        ranks.sort((a, b) => a - b),
        kind,
      ).toEqual([...Array(16).keys()])
    }
    expect(SCREENS.bayer).toBe(BAYER4)
  })

  it("grow their own shapes", () => {
    // A quarter of the ranks: one line, one falling hatch line, the centre dot.
    expect(lit(SCREENS.line, 4 / 16)).toEqual(["0,1", "1,1", "2,1", "3,1"])
    expect(lit(SCREENS.diagonal, 4 / 16)).toEqual(["0,0", "1,1", "2,2", "3,3"])
    expect(lit(SCREENS.dot, 4 / 16)).toEqual(["1,1", "1,2", "2,1", "2,2"])
    // Half: the line doubled to two rows; the cross has both hatch lines.
    expect(lit(SCREENS.line, 8 / 16)).toEqual(["0,1", "0,2", "1,1", "1,2", "2,1", "2,2", "3,1", "3,2"])
    expect(lit(SCREENS.cross, 8 / 16)).toEqual(["0,0", "0,3", "1,1", "1,2", "2,1", "2,2", "3,0", "3,3"])
  })

  it("seed the way the Bayer matrix always was", () => {
    for (const seed of [0, 7, 1984, -3, 123456]) {
      expect(screenMatrix("bayer", seed)).toEqual(pixelMatrixFromSeed(seed))
      expect(pixelMatrixFromSeed(seed)).toEqual(matrixFromSeed(seed))
      expect(screenMatrix("line", seed)).toEqual(screenMatrix("line", seed))
      expect(screenMatrix("line", seed)).not.toEqual(SCREENS.line)
    }
    expect(screenMatrix("dot")).toBe(SCREENS.dot)
  })
})

describe("DitherScreen", () => {
  type ProbeApi = { matrix: number[][]; label: number[][]; ofVariant: (v: VariantInput) => number[][] }
  let seen: ProbeApi | undefined
  const Probe = defineComponent({
    props: { seed: Number },
    setup(props) {
      const matrix = useDitherMatrix(() => props.seed)
      const ofVariant = useVariantMatrix()
      const label = useLabelMatrix(() => props.seed)
      seen = {
        get matrix() {
          return matrix.value
        },
        get label() {
          return label.value
        },
        ofVariant,
      }
      return () => h("i")
    },
  })
  const probe = (screen?: ScreenKind, seed?: number): ProbeApi => {
    const child = () => h(Probe, { seed })
    mount(defineComponent({ render: () => (screen ? h(DitherScreen, { screen }, { default: child }) : child()) }))
    return seen!
  }

  it("prints everything below it through its screen", () => {
    expect(probe().matrix).toBe(BAYER4)
    expect(probe("line").matrix).toBe(SCREENS.line)
    expect(probe("dot", 5).matrix).toEqual(screenMatrix("dot", 5))
    // Chart series: a numeric variant seeds the screen; a named one takes it plain.
    expect(probe("cross").ofVariant(9)).toEqual(screenMatrix("cross", 9))
    expect(probe("cross").ofVariant("gradient")).toBe(SCREENS.cross)
    expect(probe().ofVariant(9)).toEqual(matrixFromSeed(9))
  })

  it("leaves a fill that carries a label on the Bayer matrix", () => {
    expect(probe("diagonal").label).toBe(BAYER4)
    expect(probe("dot", 5).label).toEqual(pixelMatrixFromSeed(5))
  })
})
