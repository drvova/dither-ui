<script lang="ts">
import { ditherShaderPixels, sampleShader, SHADER_UNIFORMS, wrapShader, type ShaderDither, type ShaderProgram } from "./shader"
export type { ShaderDither, ShaderProgram }
export { ditherShaderPixels, sampleShader, wrapShader }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { buildProgram, createGl, type GlHandle } from "./gl"
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
    /** Tint of the mono mode, and `iColor` in the shader. */
    color?: PixelColor
    /** A palette ramp, dark to light: luminance picks the band, the Bayer cell dithers between bands. */
    colors?: PixelColor[]
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
    /** Seeds the dither matrix, `iSeed`, and without src/source the sample shader. */
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

let handle: GlHandle | null | undefined
let program: WebGLProgram | null = null
let compiled: string | null = null
let locations: Partial<Record<(typeof SHADER_UNIFORMS)[number], WebGLUniformLocation | null>> = {}
let pixels = new Uint8Array(0)
const mouse = { x: 0, y: 0, cx: 0, cy: 0, down: false }

/** Build the program for `source`; sets `program` or the error note. */
function compile(h: GlHandle, source: string): void {
  const gl = h.gl
  if (program) gl.deleteProgram(program)
  program = null
  locations = {}
  compiled = source
  const built = wrapShader(source, h.webgl2)
  if (built.version === 2 && !h.webgl2) {
    status.value = "error"
    problem.value = "this shader needs WebGL2"
    return
  }
  const p = buildProgram(gl, built.vertex, built.fragment, ["p"])
  if (typeof p === "string") {
    status.value = "error"
    problem.value = p
    return
  }
  program = p
  for (const name of SHADER_UNIFORMS) locations[name] = gl.getUniformLocation(p, name)
  status.value = "ready"
  problem.value = ""
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
}

const dither = computed<ShaderDither>(() => ({
  matrix: props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4,
  dither: clamp01(props.dither),
  levels: Math.max(2, Math.round(props.levels)),
  mono: props.mono ? fillOf(props.color) : null,
  shade: clamp01(props.shade),
  palette: props.colors && props.colors.length >= 2 ? props.colors.map(fillOf) : null,
}))

function draw(buffer: RasterBuffer, clock: number, dt: number) {
  if (handle === undefined) handle = createGl()
  if (!handle || handle.lost()) {
    buffer.data.fill(0)
    if (status.value === "ready") status.value = "unsupported"
    return
  }
  if (!code.value) {
    buffer.data.fill(0)
    return
  }
  if (compiled !== code.value) compile(handle, code.value)
  if (!program) {
    buffer.data.fill(0)
    return
  }
  const gl = handle.gl
  const w = buffer.width
  const h = buffer.height
  handle.size(w, h)
  gl.useProgram(program)
  const t = clock * props.speed
  const u = locations
  const now = new Date()
  const [cr, cg, cb] = fillOf(props.color)
  if (u.iResolution) gl.uniform3f(u.iResolution, w, h, 1)
  if (u.iTime) gl.uniform1f(u.iTime, t)
  if (u.iTimeDelta) gl.uniform1f(u.iTimeDelta, dt)
  if (u.iFrame) gl.uniform1i(u.iFrame, Math.round(t * 60))
  if (u.iMouse) gl.uniform4f(u.iMouse, mouse.x * w, mouse.y * h, mouse.down ? mouse.cx * w : 0, mouse.down ? mouse.cy * h : 0)
  if (u.iDate) gl.uniform4f(u.iDate, now.getFullYear(), now.getMonth(), now.getDate(), t)
  if (u.iColor) gl.uniform3f(u.iColor, cr / 255, cg / 255, cb / 255)
  if (u.iSeed) gl.uniform1f(u.iSeed, props.seed ?? 0)
  if (u.resolution) gl.uniform2f(u.resolution, w, h)
  if (u.u_resolution) gl.uniform2f(u.u_resolution, w, h)
  if (u.time) gl.uniform1f(u.time, t)
  if (u.u_time) gl.uniform1f(u.u_time, t)
  if (u.mouse) gl.uniform2f(u.mouse, mouse.x, mouse.y)
  if (u.u_mouse) gl.uniform2f(u.u_mouse, mouse.x * w, mouse.y * h)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  pixels = handle.read(pixels)
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
  if (handle && program) handle.gl.deleteProgram(program)
  program = null
  handle?.dispose()
  handle = null
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
  restart: () => [props.renderMode, props.dpr, props.cell, code.value, props.seed, props.color, props.colors, props.mono, props.dither, props.levels, props.shade, props.speed],
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
