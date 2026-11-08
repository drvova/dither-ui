// The kit's one piece of WebGL plumbing, shared by the GLSL surface
// (DitherShader) and the world's GPU rasterizer (world-gl.ts): an offscreen
// context at the cell resolution, program building with the first compiler
// line as the error, context-loss bookkeeping, a pixel readback, and the
// channel binding — how any kit surface, canvas, image or video becomes a
// texture (`iChannelN`, a world's skin) or a raster for the CPU engines. The
// GPU is only ever an evaluator here — every surface still dithers on the CPU.

import type { RasterBuffer } from "./raster"
import { type DitherSurface, surfaceOf } from "./use-dither-background"

export type Gl = WebGL2RenderingContext | WebGLRenderingContext

/** What a channel may be bound to: a kit surface (a component instance, its
 * exposed surface, or its canvas), or any canvas, image or video. */
export type ChannelInput =
  | DitherSurface
  | { surface?: DitherSurface; $el?: Element | null }
  | HTMLCanvasElement
  | HTMLImageElement
  | HTMLVideoElement
  | null
  | undefined

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
  /** Read the framebuffer back without waiting on the GPU: under WebGL2
   * the read goes to a pixel buffer behind a fence and comes back on a
   * later call, once the GPU is done (the pixels of an earlier draw, into
   * `out`), null until then; a draw while one is still in flight is not
   * read. Under WebGL1, `read`. A frame-exact caller (a paused surface, a
   * directed one) uses `read`. */
  readBehind: (out: Uint8Array) => Uint8Array | null
  /** Release the context (unmount). */
  dispose: () => void
}

const ATTRS: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: true,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: "low-power",
}

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
  const read = (out: Uint8Array) => {
    const n = canvas.width * canvas.height * 4
    const px = out.length === n ? out : new Uint8Array(n)
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px)
    return px
  }
  // The read in flight: its buffer, its size in bytes and its fence. A
  // synchronous read stalled the main thread until the GPU had drawn (the
  // landing's road shader, most of its paint).
  let pack: WebGLBuffer | null = null
  let packed = 0
  let fence: WebGLSync | null = null
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
    read,
    readBehind(out) {
      if (!gl2) return read(out)
      const n = canvas.width * canvas.height * 4
      let got: Uint8Array | null = null
      if (fence) {
        const state = gl2.clientWaitSync(fence, 0, 0)
        if (state === gl2.TIMEOUT_EXPIRED) return null
        gl2.deleteSync(fence)
        fence = null
        if (state !== gl2.WAIT_FAILED && packed === n) {
          got = out.length === n ? out : new Uint8Array(n)
          gl2.bindBuffer(gl2.PIXEL_PACK_BUFFER, pack)
          gl2.getBufferSubData(gl2.PIXEL_PACK_BUFFER, 0, got)
          gl2.bindBuffer(gl2.PIXEL_PACK_BUFFER, null)
        }
      }
      pack ??= gl2.createBuffer()
      gl2.bindBuffer(gl2.PIXEL_PACK_BUFFER, pack)
      if (packed !== n) {
        gl2.bufferData(gl2.PIXEL_PACK_BUFFER, n, gl2.STREAM_READ)
        packed = n
      }
      gl2.readPixels(0, 0, canvas.width, canvas.height, gl2.RGBA, gl2.UNSIGNED_BYTE, 0)
      gl2.bindBuffer(gl2.PIXEL_PACK_BUFFER, null)
      fence = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0)
      gl2.flush()
      return got
    },
    dispose() {
      if (gl2) {
        if (fence) gl2.deleteSync(fence)
        if (pack) gl2.deleteBuffer(pack)
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

/** A program the driver is still compiling and linking: nothing has asked
 * how it went, so nothing has waited on it. */
export type PendingProgram = { program: WebGLProgram; vertex: WebGLShader; fragment: WebGLShader }

/** Hand both stages and the link to the driver without asking how they went
 * (asking is what waits on the GPU); `attribs` pins attribute names to
 * locations. `finishProgram` collects the result; `programReady` says
 * whether collecting it would wait. */
export function startProgram(
  gl: Gl,
  vertex: string,
  fragment: string,
  attribs: string[] = [],
): PendingProgram | string {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    return "could not create a shader"
  }
  const p = gl.createProgram()
  if (!p) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return "could not create a program"
  }
  gl.shaderSource(vs, vertex)
  gl.compileShader(vs)
  gl.shaderSource(fs, fragment)
  gl.compileShader(fs)
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  attribs.forEach((name, i) => gl.bindAttribLocation(p, i, name))
  gl.linkProgram(p)
  return { program: p, vertex: vs, fragment: fs }
}

/** Whether `finishProgram` would return without waiting: the driver says so
 * where it compiles in the background (KHR_parallel_shader_compile); where
 * it cannot say, collecting is the only way to know, so it is ready. */
export function programReady(gl: Gl, pending: PendingProgram): boolean {
  const ext = gl.getExtension("KHR_parallel_shader_compile")
  return !ext || gl.getProgramParameter(pending.program, ext.COMPLETION_STATUS_KHR) !== false
}

/** Collect a started program: the program, or the first line of the
 * compiler's complaint (the fragment stage's first, then the vertex's, then
 * the link's). Waits on the driver if it is not `programReady`. */
export function finishProgram(gl: Gl, pending: PendingProgram): WebGLProgram | string {
  const { program: p, vertex: vs, fragment: fs } = pending
  const linked = gl.getProgramParameter(p, gl.LINK_STATUS)
  let note = ""
  if (!linked) {
    const failed = [fs, vs].find((sh) => !gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    if (failed) {
      const log = gl.getShaderInfoLog(failed) || "compile error"
      note = log.split("\n").find((l) => l.trim()) ?? log
    } else note = (gl.getProgramInfoLog(p) || "link error").split("\n")[0]
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (linked) return p
  gl.deleteProgram(p)
  return note
}

/** Let go of a started program nobody will collect. */
export function dropProgram(gl: Gl, pending: PendingProgram): void {
  gl.deleteShader(pending.vertex)
  gl.deleteShader(pending.fragment)
  gl.deleteProgram(pending.program)
}

/** Link a program at once, waiting on the driver; `attribs` pins attribute
 * names to locations. Returns the program or the first line of the
 * compiler's complaint. */
export function buildProgram(gl: Gl, vertex: string, fragment: string, attribs: string[] = []): WebGLProgram | string {
  const started = startProgram(gl, vertex, fragment, attribs)
  return typeof started === "string" ? started : finishProgram(gl, started)
}

// ---- channels ---------------------------------------------------------------------

type Bound = { surface: DitherSurface | null; element: TexImageSource | null }

/** A channel input → the surface to pull, or the element to upload (neither while it has nothing to show). */
export function bindChannel(input: ChannelInput): Bound {
  if (!input) return { surface: null, element: null }
  if (typeof (input as DitherSurface).pull === "function") return { surface: input as DitherSurface, element: null }
  const inst = input as { surface?: DitherSurface; $el?: Element | null }
  if (inst.surface && typeof inst.surface.pull === "function") return { surface: inst.surface, element: null }
  const el = input instanceof Element ? input : inst.$el instanceof Element ? inst.$el : null
  if (!el) return { surface: null, element: null }
  if (el instanceof HTMLImageElement) return { surface: null, element: el.complete && el.naturalWidth ? el : null }
  if (el instanceof HTMLVideoElement) return { surface: null, element: el.readyState >= 2 ? el : null }
  const canvas = el instanceof HTMLCanvasElement ? el : el.querySelector("canvas")
  if (!canvas) return { surface: null, element: null }
  return { surface: surfaceOf(canvas), element: canvas }
}

export type Channels = {
  /** Upload up to four inputs onto texture units `first..first + 3` for the
   * moment `ms` (directed time, or null free-running) — a kit surface is
   * pulled at that moment, so it reads at the consumer's own time stamp.
   * Returns `iChannelResolution` (xyz per channel) and `iChannelTime` (`t`
   * per bound channel). Uploads are flipped so the textures read upright. */
  upload: (
    inputs: ChannelInput[] | undefined,
    first: number,
    t: number,
    ms: number | null,
  ) => { res: Float32Array; times: Float32Array }
  dispose: () => void
}

/** The four channel textures of one program, re-uploaded only when a surface painted. */
export function createChannels(h: GlHandle): Channels {
  const gl = h.gl
  const slots = [0, 1, 2, 3].map(() => ({ tex: null as WebGLTexture | null, version: -1, w: 0, h: 0 }))
  return {
    upload(inputs, first, t, ms) {
      const res = new Float32Array(12)
      const times = new Float32Array(4)
      for (let i = 0; i < 4; i++) {
        const slot = slots[i]
        const { surface, element } = bindChannel(inputs?.[i])
        gl.activeTexture(gl.TEXTURE0 + first + i)
        if (!surface && !element) {
          gl.bindTexture(gl.TEXTURE_2D, null)
          continue
        }
        if (!slot.tex) {
          slot.tex = gl.createTexture()
          gl.bindTexture(gl.TEXTURE_2D, slot.tex)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          slot.version = -1
        } else gl.bindTexture(gl.TEXTURE_2D, slot.tex)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
        if (surface) {
          const raster = surface.pull(ms)
          if (raster && (surface.version() !== slot.version || slot.w !== raster.width || slot.h !== raster.height)) {
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              raster.width,
              raster.height,
              0,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              raster.data,
            )
            slot.version = surface.version()
            slot.w = raster.width
            slot.h = raster.height
          }
        } else if (element) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element)
          slot.w = (element as HTMLCanvasElement).width ?? 0
          slot.h = (element as HTMLCanvasElement).height ?? 0
        }
        res[i * 3] = slot.w
        res[i * 3 + 1] = slot.h
        res[i * 3 + 2] = 1
        times[i] = t
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      return { res, times }
    },
    dispose() {
      for (const slot of slots) {
        if (slot.tex) gl.deleteTexture(slot.tex)
        slot.tex = null
      }
    },
  }
}

let scratch: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null
const stills = new WeakMap<HTMLImageElement, RasterBuffer>()

/** A channel input as a raster for the CPU engines (a world's texture): a
 * kit surface's own raster at the moment, or an image, canvas or video read
 * through a 2D context at up to 512 px on the long side (a texture is
 * sampled per cell, never per pixel; images are read once). */
export function rasterOf(input: ChannelInput, ms: number | null): RasterBuffer | null {
  const { surface, element } = bindChannel(input)
  if (surface) return surface.pull(ms)
  if (!element || typeof document === "undefined") return null
  const el = element as HTMLCanvasElement | HTMLImageElement | HTMLVideoElement
  const still = el instanceof HTMLImageElement ? stills.get(el) : undefined
  if (still) return still
  const w = el instanceof HTMLVideoElement ? el.videoWidth : el instanceof HTMLImageElement ? el.naturalWidth : el.width
  const h =
    el instanceof HTMLVideoElement ? el.videoHeight : el instanceof HTMLImageElement ? el.naturalHeight : el.height
  if (!w || !h) return null
  if (!scratch) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    scratch = { canvas, ctx }
  }
  const k = Math.min(1, 512 / Math.max(w, h))
  const rw = Math.max(1, Math.round(w * k))
  const rh = Math.max(1, Math.round(h * k))
  scratch.canvas.width = rw
  scratch.canvas.height = rh
  scratch.ctx.clearRect(0, 0, rw, rh)
  try {
    scratch.ctx.drawImage(el, 0, 0, rw, rh)
  } catch {
    return null
  }
  const out: RasterBuffer = { width: rw, height: rh, data: scratch.ctx.getImageData(0, 0, rw, rh).data }
  if (el instanceof HTMLImageElement) stills.set(el, out)
  return out
}
