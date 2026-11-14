// A fake WebGL2 whose driver compiles in the background and finishes when
// the spec says, and whose context can be lost and restored: shared by the
// engine's specs (`shader-compile.spec.ts`, `gl-context.spec.ts`) and the
// Solid component's (`solid/carried-shader.spec.tsx`).
import type { Gl } from "../../src/engine/gl"

const COMPLETION_STATUS_KHR = 0x91b1
const LINK_STATUS = 0x8b82
const COMPILE_STATUS = 0x8b81

/** A GL whose driver compiles in the background: `done` says it finished;
 * `waits` counts the questions that would have blocked until it had.
 * `deleted` lists every object deleted one by one (by the call), `programs` every
 * program made, `released` each `WEBGL_lose_context.loseContext()`;
 * `lose` and `restore` are the browser's, without their events (a test
 * sends those on the context's canvas). */
export function fakeGl(opts: { parallel?: boolean; broken?: "vertex" | "fragment" | "link" } = {}) {
  const state = { done: false, waits: 0, polls: 0, deleted: [] as string[], programs: 0, released: 0, lost: false }
  const shaders: { kind: number }[] = []
  const known: Record<string, unknown> = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    LINK_STATUS,
    COMPILE_STATUS,
    createShader: (kind: number) => (shaders.push({ kind }), shaders.at(-1)),
    createProgram: () => (state.programs++, {}),
    getExtension: (name: string) =>
      name === "KHR_parallel_shader_compile" && opts.parallel !== false
        ? { COMPLETION_STATUS_KHR }
        : name === "WEBGL_lose_context"
          ? { loseContext: () => (state.released++, (state.lost = true)), restoreContext: () => {} }
          : null,
    isContextLost: () => state.lost,
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
    getUniformLocation: () => ({}),
    createBuffer: () => ({}),
    fenceSync: () => ({}),
    clientWaitSync: () => 0x911a,
    ALREADY_SIGNALED: 0x911a,
  }
  const gl = new Proxy(known, {
    get: (t, k: string) =>
      k in t ? t[k] : k.startsWith("delete") ? () => void state.deleted.push(k) : () => undefined,
  }) as unknown as Gl
  return {
    gl,
    state,
    finish: () => (state.done = true),
    lose: () => (state.lost = true),
    restore: () => (state.lost = false),
  }
}
