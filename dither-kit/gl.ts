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
  upload: (inputs: ChannelInput[] | undefined, first: number, t: number, ms: number | null) => { res: Float32Array; times: Float32Array }
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
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, raster.width, raster.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, raster.data)
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
  const h = el instanceof HTMLVideoElement ? el.videoHeight : el instanceof HTMLImageElement ? el.naturalHeight : el.height
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
