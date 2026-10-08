// The kit's one piece of WebGL plumbing, shared by the GLSL surface
// (DitherShader) and the world's GPU rasterizer (world-gl.ts): an offscreen
// context at the cell resolution, program building with the first compiler
// line as the error, context-loss bookkeeping, a pixel readback. The GPU is
// only ever an evaluator here — every surface still dithers on the CPU.

export type Gl = WebGL2RenderingContext | WebGLRenderingContext

export type GlHandle = {
  canvas: HTMLCanvasElement
  gl: Gl
  webgl2: boolean
  /** True after `webglcontextlost` until the context is restored. */
  lost: () => boolean
  /** Resize the drawing buffer (no-op when unchanged). */
  size: (width: number, height: number) => void
  /** Read the whole framebuffer (RGBA, rows bottom-up) into `out`, reallocating it as needed. */
  read: (out: Uint8Array) => Uint8Array
  /** Release the context (unmount). */
  dispose: () => void
}

const ATTRS: WebGLContextAttributes = { alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" }

/** An offscreen WebGL2 (or WebGL1) context, null without WebGL or a DOM. */
export function createGl(): GlHandle | null {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  const gl2 = canvas.getContext("webgl2", ATTRS) as WebGL2RenderingContext | null
  const gl: Gl | null = gl2 ?? (canvas.getContext("webgl", ATTRS) as WebGLRenderingContext | null)
  if (!gl) return null
  let lost = false
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault()
    lost = true
  })
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false
  })
  return {
    canvas,
    gl,
    webgl2: !!gl2,
    lost: () => lost,
    size(width, height) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
    },
    read(out) {
      const n = canvas.width * canvas.height * 4
      const px = out.length === n ? out : new Uint8Array(n)
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px)
      return px
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

function stage(gl: Gl, kind: number, text: string): WebGLShader | string {
  const sh = gl.createShader(kind)
  if (!sh) return "could not create a shader"
  gl.shaderSource(sh, text)
  gl.compileShader(sh)
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh
  const log = gl.getShaderInfoLog(sh) || "compile error"
  gl.deleteShader(sh)
  return log.split("\n").find((l) => l.trim()) ?? log
}

/** Link a program; `attribs` pins attribute names to locations. Returns the
 * program or the first line of the compiler's complaint. */
export function buildProgram(gl: Gl, vertex: string, fragment: string, attribs: string[] = []): WebGLProgram | string {
  const vs = stage(gl, gl.VERTEX_SHADER, vertex)
  const fs = stage(gl, gl.FRAGMENT_SHADER, fragment)
  if (typeof vs === "string" || typeof fs === "string") {
    if (typeof vs !== "string") gl.deleteShader(vs)
    if (typeof fs !== "string") gl.deleteShader(fs)
    return typeof fs === "string" ? fs : (vs as string)
  }
  const p = gl.createProgram()
  if (!p) return "could not create a program"
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  attribs.forEach((name, i) => gl.bindAttribLocation(p, i, name))
  gl.linkProgram(p)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p
  const log = (gl.getProgramInfoLog(p) || "link error").split("\n")[0]
  gl.deleteProgram(p)
  return log
}
