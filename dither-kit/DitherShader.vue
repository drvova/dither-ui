<script lang="ts">
import { ditherShaderPixels, sampleShader, SHADER_UNIFORMS, wrapShader, type ShaderDither, type ShaderProgram } from "./shader"
export type { ShaderDither, ShaderProgram }
export { ditherShaderPixels, sampleShader, wrapShader }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, fillOf, type PixelColor, pixelMatrixFromSeed } from "./pixel"
import type { DitherRenderMode } from "./precompile"
import type { RasterBuffer } from "./raster"
import { useDitherBackground } from "./use-dither-background"

const props = withDefaults(
  defineProps<{
    /** URL of a .frag / .glsl file. */
    src?: string
    /** Inline GLSL — Shadertoy `mainImage` or a raw `main`; wins over `src`. */
    source?: string
    /** Tint of the mono mode. */
    color?: PixelColor
    /** Threshold luminance to 1 bit in `color` instead of keeping the shader's colours. */
    mono?: boolean
    /** 0 smooth → 1 fully quantized. */
    dither?: number
    /** Colour levels per channel (2 = the 8-colour look). */
    levels?: number
    /** Mono: alpha floor of the unlit cells, 0-1. */
    shade?: number
    /** Multiplies iTime. */
    speed?: number
    /** Seeds the dither matrix and, without src/source, the sample shader. */
    seed?: number
    /** Backing cell size in CSS px — bigger is chunkier. */
    cell?: number
    /** Feed the pointer to iMouse. */
    interactive?: boolean
    /** Accessible name. */
    label?: string
    paused?: boolean
    dpr?: number
    /** Stop-motion cadence in fps (0 = smooth) — see timing.ts. */
    frameRate?: number
    renderMode?: DitherRenderMode
    class?: string
  }>(),
  {
    src: "",
    source: "",
    color: "blue",
    mono: false,
    dither: 1,
    levels: 2,
    shade: 0,
    speed: 1,
    cell: 3,
    interactive: true,
    label: "Shader",
    paused: false,
    frameRate: 0,
    renderMode: "live",
  }
)

const MAX_COLS = 480
const MAX_ROWS = 320

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const code = ref("")
const status = ref<"ready" | "loading" | "error" | "unsupported">("ready")
const problem = ref("")
const note = computed(() =>
  status.value === "loading" ? "loading shader" : status.value === "unsupported" ? "WebGL is not available" : status.value === "error" ? problem.value : ""
)

// ---- source -------------------------------------------------------------------

let ctl: AbortController | null = null

function load() {
  ctl?.abort()
  ctl = null
  if (props.source) {
    code.value = props.source
    return
  }
  if (!props.src) {
    code.value = sampleShader(props.seed ?? 0)
    return
  }
  if (typeof fetch !== "function") {
    status.value = "error"
    problem.value = "could not load the shader"
    return
  }
  const c = new AbortController()
  ctl = c
  status.value = "loading"
  fetch(props.src, { signal: c.signal })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.text()
    })
    .then((text) => {
      if (c.signal.aborted) return
      status.value = "ready"
      code.value = text
    })
    .catch(() => {
      if (c.signal.aborted) return
      status.value = "error"
      problem.value = "could not load the shader"
      code.value = ""
    })
}

watch(() => [props.source, props.src, props.seed], load, { immediate: true })

// ---- the GPU half ---------------------------------------------------------------

type Gl = WebGL2RenderingContext | WebGLRenderingContext

let glCanvas: HTMLCanvasElement | null = null
let gl: Gl | null = null
let program: WebGLProgram | null = null
let compiled: string | null = null
let locations: Partial<Record<(typeof SHADER_UNIFORMS)[number], WebGLUniformLocation | null>> = {}
let pixels = new Uint8Array(0)
let lost = false
const mouse = { x: 0, y: 0, cx: 0, cy: 0, down: false }

function ensureGl(): Gl | null {
  if (gl && !lost) return gl
  if (typeof document === "undefined") return null
  if (!glCanvas) {
    glCanvas = document.createElement("canvas")
    glCanvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault()
      lost = true
      program = null
      compiled = null
    })
    glCanvas.addEventListener("webglcontextrestored", () => {
      lost = false
    })
  }
  if (lost) return null
  const attrs: WebGLContextAttributes = { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" }
  gl = (glCanvas.getContext("webgl2", attrs) as WebGL2RenderingContext | null) ?? (glCanvas.getContext("webgl", attrs) as WebGLRenderingContext | null)
  if (!gl) return null
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  return gl
}

function stage(ctx: Gl, kind: number, text: string): WebGLShader | string {
  const sh = ctx.createShader(kind)
  if (!sh) return "could not create a shader"
  ctx.shaderSource(sh, text)
  ctx.compileShader(sh)
  if (ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) return sh
  const log = ctx.getShaderInfoLog(sh) || "compile error"
  ctx.deleteShader(sh)
  return log.split("\n").find((l) => l.trim()) ?? log
}

/** Build the program for `source`; sets `program` or the error note. */
function compile(ctx: Gl, source: string): void {
  if (program) ctx.deleteProgram(program)
  program = null
  locations = {}
  compiled = source
  const built = wrapShader(source, ctx instanceof WebGL2RenderingContext)
  if (built.version === 2 && !(ctx instanceof WebGL2RenderingContext)) {
    status.value = "error"
    problem.value = "this shader needs WebGL2"
    return
  }
  const vs = stage(ctx, ctx.VERTEX_SHADER, built.vertex)
  const fs = stage(ctx, ctx.FRAGMENT_SHADER, built.fragment)
  if (typeof vs === "string" || typeof fs === "string") {
    status.value = "error"
    problem.value = typeof fs === "string" ? fs : (vs as string)
    return
  }
  const p = ctx.createProgram()
  if (!p) return
  ctx.attachShader(p, vs)
  ctx.attachShader(p, fs)
  ctx.bindAttribLocation(p, 0, "p")
  ctx.linkProgram(p)
  ctx.deleteShader(vs)
  ctx.deleteShader(fs)
  if (!ctx.getProgramParameter(p, ctx.LINK_STATUS)) {
    status.value = "error"
    problem.value = (ctx.getProgramInfoLog(p) || "link error").split("\n")[0]
    ctx.deleteProgram(p)
    return
  }
  program = p
  for (const name of SHADER_UNIFORMS) locations[name] = ctx.getUniformLocation(p, name)
  status.value = "ready"
  problem.value = ""
}

const dither = computed<ShaderDither>(() => ({
  matrix: props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4,
  dither: clamp01(props.dither),
  levels: Math.max(2, Math.round(props.levels)),
  mono: props.mono ? fillOf(props.color) : null,
  shade: clamp01(props.shade),
}))

function draw(buffer: RasterBuffer, clock: number, dt: number) {
  const ctx = ensureGl()
  if (!ctx || !glCanvas) {
    buffer.data.fill(0)
    if (status.value === "ready") status.value = "unsupported"
    return
  }
  if (!code.value) {
    buffer.data.fill(0)
    return
  }
  if (compiled !== code.value) compile(ctx, code.value)
  if (!program) {
    buffer.data.fill(0)
    return
  }
  const w = buffer.width
  const h = buffer.height
  if (glCanvas.width !== w || glCanvas.height !== h) {
    glCanvas.width = w
    glCanvas.height = h
    pixels = new Uint8Array(w * h * 4)
  }
  ctx.viewport(0, 0, w, h)
  ctx.useProgram(program)
  const t = clock * props.speed
  const u = locations
  const now = new Date()
  if (u.iResolution) ctx.uniform3f(u.iResolution, w, h, 1)
  if (u.iTime) ctx.uniform1f(u.iTime, t)
  if (u.iTimeDelta) ctx.uniform1f(u.iTimeDelta, dt)
  if (u.iFrame) ctx.uniform1i(u.iFrame, Math.round(t * 60))
  if (u.iMouse) ctx.uniform4f(u.iMouse, mouse.x * w, mouse.y * h, mouse.down ? mouse.cx * w : 0, mouse.down ? mouse.cy * h : 0)
  if (u.iDate) ctx.uniform4f(u.iDate, now.getFullYear(), now.getMonth(), now.getDate(), t)
  if (u.resolution) ctx.uniform2f(u.resolution, w, h)
  if (u.u_resolution) ctx.uniform2f(u.u_resolution, w, h)
  if (u.time) ctx.uniform1f(u.time, t)
  if (u.u_time) ctx.uniform1f(u.u_time, t)
  if (u.mouse) ctx.uniform2f(u.mouse, mouse.x, mouse.y)
  if (u.u_mouse) ctx.uniform2f(u.u_mouse, mouse.x * w, mouse.y * h)
  ctx.drawArrays(ctx.TRIANGLES, 0, 3)
  ctx.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels)
  ditherShaderPixels(pixels, buffer, dither.value)
}

function pointer(e: PointerEvent) {
  const box = wrapRef.value?.getBoundingClientRect()
  if (!box || !box.width || !box.height) return
  mouse.x = clamp01((e.clientX - box.left) / box.width)
  mouse.y = clamp01(1 - (e.clientY - box.top) / box.height)
}

function onDown(e: PointerEvent) {
  if (!props.interactive || e.button !== 0) return
  pointer(e)
  mouse.down = true
  mouse.cx = mouse.x
  mouse.cy = mouse.y
  wrapRef.value?.setPointerCapture?.(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (props.interactive) pointer(e)
}

function onUp() {
  mouse.down = false
}

onBeforeUnmount(() => {
  ctl?.abort()
  if (gl && program) gl.deleteProgram(program)
  program = null
  const ext = gl?.getExtension("WEBGL_lose_context")
  ext?.loseContext()
  gl = null
})

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: () => Math.max(1, props.cell),
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => props.dpr,
  paused: () => props.paused,
  renderMode: () => props.renderMode,
  precompiled: () => undefined,
  restart: () => [props.renderMode, props.dpr, props.cell, code.value, props.seed, props.color, props.mono, props.dither, props.levels, props.shade, props.speed],
  frameRate: () => props.frameRate,
  render: draw,
})
</script>

<template>
  <div
    ref="wrapRef"
    role="img"
    :aria-label="label"
    :data-state="status"
    :class="cn('relative block h-full w-full overflow-hidden', props.class)"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @pointerleave="onUp"
  >
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" style="image-rendering: pixelated" />
    <p v-if="note" class="absolute inset-x-0 bottom-2 px-2 text-center font-mono text-[10px] break-words text-muted-foreground" aria-live="polite">{{ note }}</p>
  </div>
</template>
