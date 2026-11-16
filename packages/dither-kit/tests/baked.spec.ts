// A frame the build baked into the page (`baked.ts`): the canvas's own
// first upload, through the one upload every raster surface makes, takes
// it off in the same call, and only a settled bake says the entrance has
// played.
import { describe, expect, it } from "rstack/test"
import { BAKED_ATTR, bakedSettled } from "../src/engine/baked"
import { createRasterBuffer, putRasterBuffer } from "../src/engine/raster"

function fakeCanvas(value: string | null) {
  const attrs = new Map<string, string>(value === null ? [] : [[BAKED_ATTR, value]])
  const order: string[] = []
  const canvas = {
    getAttribute: (n: string) => attrs.get(n) ?? null,
    hasAttribute: (n: string) => attrs.has(n),
    removeAttribute: (n: string) => {
      order.push("released")
      attrs.delete(n)
    },
  }
  const ctx = {
    canvas,
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => order.push("put"),
  } as unknown as CanvasRenderingContext2D
  return { canvas, ctx, order }
}

describe("baked frames", () => {
  it("comes off as the canvas's own pixels go up, before them", () => {
    const { canvas, ctx, order } = fakeCanvas("s:abc")
    expect(bakedSettled(canvas)).toBe(true)
    putRasterBuffer(ctx, createRasterBuffer(2, 2))
    expect(order).toEqual(["released", "put"])
    expect(bakedSettled(canvas)).toBe(false)
    putRasterBuffer(ctx, createRasterBuffer(2, 2))
    expect(order).toEqual(["released", "put", "put"])
  })

  it("plays the entrance under a first frame or no bake", () => {
    expect(bakedSettled(fakeCanvas("f:abc").canvas)).toBe(false)
    expect(bakedSettled(fakeCanvas(null).canvas)).toBe(false)
    expect(bakedSettled(null)).toBe(false)
  })
})
