// A raster reaches the GPU with its rows flipped by the kit, never by
// `UNPACK_FLIP_Y_WEBGL`: Gecko deprecates that flag for array uploads and
// warned on every frame of every shader channel and GPU world. A fake GL
// that records what it is told.
import { describe, expect, it } from "rstack/test"
import { createChannels, type GlHandle, uploadRows } from "../src/engine/gl"
import type { DitherSurface } from "../src/engine/surface-loop"

function fakeGl() {
  const flips: number[] = []
  const uploads: number[][] = []
  const gl = {
    TEXTURE_2D: 1,
    TEXTURE0: 100,
    RGBA: 2,
    UNSIGNED_BYTE: 3,
    UNPACK_FLIP_Y_WEBGL: 4,
    TEXTURE_MIN_FILTER: 5,
    TEXTURE_MAG_FILTER: 6,
    TEXTURE_WRAP_S: 7,
    TEXTURE_WRAP_T: 8,
    NEAREST: 9,
    CLAMP_TO_EDGE: 10,
    flip: 0,
    pixelStorei(name: number, value: number) {
      if (name === gl.UNPACK_FLIP_Y_WEBGL) gl.flip = value
    },
    texImage2D(...args: unknown[]) {
      const data = args[args.length - 1]
      if (ArrayBuffer.isView(data)) {
        flips.push(gl.flip)
        uploads.push(Array.from(data as Uint8Array))
      }
    },
    activeTexture() {},
    bindTexture() {},
    createTexture: () => ({}),
    texParameteri() {},
    deleteTexture() {},
  }
  return { gl, flips, uploads }
}

// Three rows of one pixel: the top row 1s, then 2s, then 3s.
const rows = () => new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
const bottomUp = [3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1]

describe("uploading a raster", () => {
  it("sends its rows bottom-up with the flip flag off, reusing the scratch", () => {
    const { gl, flips, uploads } = fakeGl()
    const scratch = uploadRows(gl as never, 1, 3, rows())
    expect(uploads[0]).toEqual(bottomUp)
    expect(flips).toEqual([0])
    expect(uploadRows(gl as never, 1, 3, rows(), scratch)).toBe(scratch)
  })

  it("binds a kit surface as a channel the same way", () => {
    const { gl, flips, uploads } = fakeGl()
    const raster = { width: 1, height: 3, data: rows() }
    const surface: DitherSurface = {
      raster: () => raster as never,
      pull: () => raster as never,
      version: () => 1,
      canvas: () => null,
    }
    const channels = createChannels({ gl } as unknown as GlHandle)
    const { res } = channels.upload([surface], 0, 0, null)
    expect(uploads[0]).toEqual(bottomUp)
    expect(flips.every((f) => f === 0)).toBe(true)
    expect(Array.from(res.slice(0, 3))).toEqual([1, 3, 1])
  })
})
