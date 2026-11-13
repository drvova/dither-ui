// @rstest-environment jsdom
// The shader reads back without waiting on the GPU (`gl.ts` `readBehind`):
// a synchronous readPixels stalled the main thread until the GPU had drawn,
// most of the landing's road shader's paint. A fake WebGL2 whose GPU
// finishes when the test says so.
import { afterEach, describe, expect, it } from "rstack/test"
import { createGl } from "../src/engine/gl"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
})

function fakeGl2() {
  let done = false
  let drawn = 0
  const reads: string[] = []
  const gl = {
    PIXEL_PACK_BUFFER: 1,
    STREAM_READ: 2,
    RGBA: 3,
    UNSIGNED_BYTE: 4,
    SYNC_GPU_COMMANDS_COMPLETE: 5,
    TIMEOUT_EXPIRED: 10,
    ALREADY_SIGNALED: 11,
    WAIT_FAILED: 12,
    pending: 0,
    viewport() {},
    createBuffer: () => ({}),
    deleteBuffer() {},
    bindBuffer() {},
    bufferData() {},
    flush() {},
    readPixels(_x: number, _y: number, _w: number, _h: number, _f: number, _t: number, into: unknown) {
      // into the pack buffer (an offset) never blocks; into memory would
      reads.push(typeof into === "number" ? "behind" : "blocking")
      gl.pending = drawn
    },
    fenceSync: () => ({}),
    deleteSync() {},
    clientWaitSync: () => (done ? gl.ALREADY_SIGNALED : gl.TIMEOUT_EXPIRED),
    getBufferSubData(_t: number, _o: number, out: Uint8Array) {
      out.fill(gl.pending)
    },
    getExtension: () => null,
  }
  return {
    gl,
    reads,
    draw: (n: number) => {
      drawn = n
      done = false
    },
    finish: () => (done = true),
  }
}

describe("reading a shader back", () => {
  it("never waits on the GPU: an earlier draw's pixels once it is done, null till then", () => {
    const fake = fakeGl2()
    HTMLCanvasElement.prototype.getContext = ((kind: string) =>
      kind === "webgl2" ? fake.gl : null) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const h = createGl()!
    h.size(2, 2)
    fake.draw(1)
    expect(h.readBehind(new Uint8Array(16))).toBeNull()
    // still drawing: nothing back, and no second read queued behind it
    fake.draw(2)
    expect(h.readBehind(new Uint8Array(16))).toBeNull()
    expect(fake.reads).toEqual(["behind"])
    // done: the first draw's pixels come back, and this frame's read goes in
    fake.finish()
    expect([...h.readBehind(new Uint8Array(16))!].every((v) => v === 1)).toBe(true)
    fake.finish()
    expect([...h.readBehind(new Uint8Array(16))!].every((v) => v === 2)).toBe(true)
    expect(fake.reads.every((r) => r === "behind")).toBe(true)
    // the frame-exact read still reads at once
    h.read(new Uint8Array(16))
    expect(fake.reads.at(-1)).toBe("blocking")
  })

  it("drops a read whose size went stale", () => {
    const fake = fakeGl2()
    HTMLCanvasElement.prototype.getContext = ((kind: string) =>
      kind === "webgl2" ? fake.gl : null) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const h = createGl()!
    h.size(2, 2)
    expect(h.readBehind(new Uint8Array(16))).toBeNull()
    h.size(4, 4)
    fake.finish()
    // the 2x2 read is let go; the 4x4 one goes in
    expect(h.readBehind(new Uint8Array(64))).toBeNull()
    fake.finish()
    expect(h.readBehind(new Uint8Array(64))?.length).toBe(64)
  })
})
