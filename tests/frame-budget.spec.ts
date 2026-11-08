// @rstest-environment jsdom
// One paint budget a frame for every kit surface (`engine/frame-budget.ts`):
// where several surfaces' cadences met in one frame their paints overran it
// together and the page hitched. Past the budget a paint waits one frame; one
// that waited always paints, so none runs more than a frame late.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { FRAME_BUDGET_MS, mayPaint, spend } from "../dither-kit/engine/frame-budget"
import { useDitherBackground } from "../dither-kit/engine/use-dither-background"

afterEach(() => rs.unstubAllGlobals())

describe("the frame's paint budget", () => {
  it("lets paints run until the frame has spent it, then only one that waited", () => {
    expect(mayPaint(1000, false)).toBe(true)
    spend(1000, FRAME_BUDGET_MS - 1)
    expect(mayPaint(1000, false)).toBe(true)
    spend(1000, 2)
    expect(mayPaint(1000, false)).toBe(false)
    expect(mayPaint(1000, true)).toBe(true)
    // a new frame starts with the whole budget
    expect(mayPaint(1016, false)).toBe(true)
  })
})

describe("two heavy surfaces in one frame", () => {
  it("never paint together past the budget, and neither waits two frames running", async () => {
    rs.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    const fake = { ms: 0 }
    rs.spyOn(performance, "now").mockImplementation(() => fake.ms)
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      return {
        canvas: this,
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {},
      }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    // each paint costs more than the whole budget
    const painted: string[][] = []
    let frame = 0
    const surface = (name: string) =>
      defineComponent({
        setup() {
          const wrapRef = ref<HTMLElement | null>(null)
          const canvasRef = ref<HTMLCanvasElement | null>(null)
          useDitherBackground({
            wrapRef,
            canvasRef,
            cell: 4,
            maxCols: 8,
            maxRows: 8,
            dpr: () => 1,
            paused: () => false,
            renderMode: () => "live",
            precompiled: () => undefined,
            restart: () => null,
            render: () => {
              fake.ms += FRAME_BUDGET_MS + 2
              ;(painted[frame] ??= []).push(name)
            },
          })
          return () => h("div", { ref: wrapRef }, [h("canvas", { ref: canvasRef })])
        },
      })
    const a = mount(surface("a"))
    const b = mount(surface("b"))
    await nextTick()
    for (frame = 1; frame <= 12; frame++) {
      const due = [...frames.values()]
      frames.clear()
      for (const cb of due) cb(frame * 40)
      await nextTick()
    }
    const rows = painted.slice(1)
    // one heavy paint a frame, never two, and every frame paints
    for (const row of rows) expect(row?.length ?? 0).toBeLessThanOrEqual(2)
    for (const row of rows) expect(row?.length ?? 0).toBeGreaterThan(0)
    // a frame of two holds one that waited: never two fresh paints over budget
    for (let f = 1; f < rows.length; f++) if (rows[f]?.length === 2) expect(rows[f - 1]?.length ?? 0).toBe(1)
    // neither surface waits two frames running
    for (const name of ["a", "b"])
      for (let f = 2; f < rows.length; f++)
        expect(rows[f]?.includes(name) || rows[f - 1]?.includes(name), `${name} at ${f}`).toBe(true)
    a.unmount()
    b.unmount()
  })
})
