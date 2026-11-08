// @rstest-environment jsdom
// A shader's program compiles in the background (`gl.ts` `startProgram`,
// `programReady`, `finishProgram`): asking how a compile went waited on the
// GPU driver until it was done, the largest main-thread stall left on the
// landing. A fake WebGL2 whose driver finishes compiling when the test says.
import { afterEach, describe, expect, it, rs } from "rstack/test"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { buildProgram, finishProgram, type Gl, programReady, startProgram } from "../dither-kit/engine/gl"
import DitherShader from "../dither-kit/tailwind/DitherShader.vue"

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  rs.unstubAllGlobals()
})

const COMPLETION_STATUS_KHR = 0x91b1
const LINK_STATUS = 0x8b82
const COMPILE_STATUS = 0x8b81

/** A GL whose driver compiles in the background: `done` says it finished;
 * `waits` counts the questions that would have blocked until it had. */
function fakeGl(opts: { parallel?: boolean; broken?: "vertex" | "fragment" | "link" } = {}) {
  const state = { done: false, waits: 0, polls: 0, deleted: 0 }
  const shaders: { kind: number }[] = []
  const known: Record<string, unknown> = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    LINK_STATUS,
    COMPILE_STATUS,
    createShader: (kind: number) => (shaders.push({ kind }), shaders.at(-1)),
    createProgram: () => ({}),
    getExtension: (name: string) =>
      name === "KHR_parallel_shader_compile" && opts.parallel !== false ? { COMPLETION_STATUS_KHR } : null,
    getProgramParameter: (_p: unknown, what: number) => {
      if (what === COMPLETION_STATUS_KHR) return (state.polls++, state.done)
      if (!state.done) state.waits++
      state.done = true
      return opts.broken === undefined
    },
    getShaderParameter: (sh: { kind: number }, what: number) => {
      if (what !== COMPILE_STATUS) return null
      if (!state.done) state.waits++
      state.done = true
      return !(opts.broken === "vertex" ? sh.kind === 1 : opts.broken === "fragment" ? sh.kind === 2 : false)
    },
    getShaderInfoLog: (sh: { kind: number }) => (sh.kind === 1 ? "\nvertex: bad" : "fragment: bad\nmore"),
    getProgramInfoLog: () => "link: bad\nmore",
    deleteProgram: () => state.deleted++,
    getUniformLocation: () => ({}),
    createBuffer: () => ({}),
    fenceSync: () => ({}),
    clientWaitSync: () => 0x911a,
    ALREADY_SIGNALED: 0x911a,
  }
  const gl = new Proxy(known, {
    get: (t, k: string) => (k in t ? t[k] : () => undefined),
  }) as unknown as Gl
  return { gl, state, finish: () => (state.done = true) }
}

describe("starting a program", () => {
  it("never asks how the compile went, so it never waits", () => {
    const fake = fakeGl()
    const started = startProgram(fake.gl, "v", "f", ["p"])
    expect(typeof started).toBe("object")
    expect(fake.state.waits).toBe(0)
    if (typeof started === "string") return
    expect(programReady(fake.gl, started)).toBe(false)
    expect(fake.state.waits).toBe(0)
    fake.finish()
    expect(programReady(fake.gl, started)).toBe(true)
    expect(typeof finishProgram(fake.gl, started)).toBe("object")
  })

  it("is ready at once where the driver cannot say, collected the only way there is", () => {
    const fake = fakeGl({ parallel: false })
    const started = startProgram(fake.gl, "v", "f")
    if (typeof started === "string") throw new Error(started)
    expect(programReady(fake.gl, started)).toBe(true)
  })

  it("reports the compiler's first line as building at once did: fragment, vertex, then link", () => {
    expect(buildProgram(fakeGl({ broken: "fragment" }).gl, "v", "f")).toBe("fragment: bad")
    expect(buildProgram(fakeGl({ broken: "vertex" }).gl, "v", "f")).toBe("vertex: bad")
    expect(buildProgram(fakeGl({ broken: "link" }).gl, "v", "f")).toBe("link: bad")
  })
})

describe("a running shader whose program is compiling", () => {
  it("holds its raster and asks again each frame, never waiting on the driver", async () => {
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
    rs.stubGlobal("requestIdleCallback", () => 1)
    rs.stubGlobal("cancelIdleCallback", () => {})
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    rs.stubGlobal("cancelAnimationFrame", (n: number) => frames.delete(n))
    const fake = fakeGl()
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string) {
      if (kind.startsWith("webgl")) return fake.gl
      return {
        canvas: this,
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {},
      }
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    const w = mount(DitherShader, { props: { source: "void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }" } })
    await nextTick()
    const run = async (n: number, from: number) => {
      for (let f = 0; f < n; f++) {
        const due = [...frames.values()]
        frames.clear()
        for (const cb of due) cb((from + f) * 100)
        await nextTick()
      }
    }
    await run(6, 1)
    expect(fake.state.polls).toBeGreaterThan(1)
    expect(fake.state.waits).toBe(0)
    expect(w.find("[data-state]").attributes("data-state")).toBe("ready")
    // the driver finishes: the next frame collects it without a wait
    fake.finish()
    const polled = fake.state.polls
    await run(3, 7)
    expect(fake.state.waits).toBe(0)
    expect(fake.state.polls).toBe(polled + 1)
    w.unmount()
  })
})
