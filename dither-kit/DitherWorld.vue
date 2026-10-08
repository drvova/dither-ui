<script lang="ts">
import { externalResources, formatOf, parseWorld, type ModelFormat } from "./models"
import { packTarget, packUv, paintMaterial, paintTarget, paintWorld, rasterizeWorld, sampleWorld, type World, type WorldMesh, type WorldStyle, type WorldTarget, type WorldView } from "./world"
import { createWorldGpu, createWorldMaterial, type WorldGpu, type WorldMaterial } from "./world-gl"
export type { ModelFormat, World, WorldGpu, WorldMaterial, WorldMesh, WorldStyle, WorldTarget, WorldView }
export { createWorldGpu, createWorldMaterial, externalResources, formatOf, packTarget, packUv, paintMaterial, paintTarget, paintWorld, parseWorld, rasterizeWorld, sampleWorld }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue"
import { directedTime } from "./clock"
import { type ChannelInput, createGl, type GlHandle, rasterOf } from "./gl"
import { cn } from "./lib"
import { BAYER4, clamp01, fillOf, type PixelBloomInput, type PixelColor, pixelBloomStyle, pixelMatrixFromSeed } from "./pixel"
import type { DitherRenderMode } from "./precompile"
import type { RasterBuffer } from "./raster"
import { useDitherBackground } from "./use-dither-background"
import { createWorldTarget } from "./world"

const props = withDefaults(
  defineProps<{
    /** URL of a model: .wrl (VRML97 / 1.0), .x3d, .gltf / .glb, .obj (+ .mtl), .stl, .ply, .off. */
    src?: string
    /** Inline model text (VRML, X3D, glTF JSON, OBJ, ASCII STL / PLY, OFF) — wins over `src`. */
    source?: string
    /** File format; "auto" reads the name, then the bytes. */
    format?: ModelFormat | "auto"
    /** The file's up axis; "auto" is y, z for STL. */
    up?: "y" | "z" | "auto"
    /** Rasterizer: the CPU engine is byte-exact everywhere, the GPU engine
     * (WebGL) rasterizes big meshes fast; "auto" picks the GPU above ~40k triangles. */
    engine?: "auto" | "cpu" | "gpu"
    color?: PixelColor
    /** A toon ramp, dark to light: lighting picks the band, the Bayer cell dithers between bands. */
    colors?: PixelColor[]
    /** Ramp mode: 0 smooth → 1 fully banded. */
    dither?: number
    /** Seeds the dither matrix, the grain, and without src/source the sample world. */
    seed?: number
    /** Backing cell size in CSS px — bigger is chunkier. */
    cell?: number
    /** Orbit speed in degrees per second; 0 holds the pose. */
    autoRotate?: number
    /** Camera angles in degrees; unset, the file's Viewpoint decides. */
    yaw?: number
    pitch?: number
    zoom?: number
    /** Vertical field of view in degrees. */
    fov?: number
    /** Alpha of the unlit dither cells inside the silhouette, 0-1. */
    shade?: number
    /** Depth fade of the lighting, 0-1. */
    fog?: number
    /** Noise grain over the model's own space, 0-1 (`noise.ts` fbm). */
    grain?: number
    /** Grain frequency relative to the model's size. */
    grainScale?: number
    /** Use the file's own colours instead of `color`. */
    material?: boolean
    /** Draw polygon outlines, hidden lines removed. */
    wire?: boolean
    /** A GLSL material over the finished target: `mainMaterial(out vec4, in
     * vec2)` reading dk_shade / dk_depth / dk_covered / dk_color / dk_uv per
     * cell and returning rgb + the shade the Bayer cell thresholds (needs WebGL). */
    shader?: string
    /** Up to four sources — other kit surfaces (pulled at the same clock
     * time), canvases, images or videos. Without a shader the first wraps
     * the model through its texture coordinates (primitives, OBJ `vt`, glTF
     * `TEXCOORD_0`, VRML `TextureCoordinate`, PLY `s`/`t`) as its skin on
     * either engine; a shader reads them as `iChannel0..3` at `dk_uv(p)`. */
    channels?: ChannelInput[]
    /** Glow layer: a preset, a config, or a seed. */
    bloom?: PixelBloomInput
    /** Play the file's own animations (VRML ROUTEs, glTF) on the kit clock. */
    animate?: boolean
    /** Pin the animation to a moment in seconds instead of the clock. */
    time?: number
    /** Drag, or arrow keys when focused, to orbit. */
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
    format: "auto",
    up: "auto",
    engine: "auto",
    color: "blue",
    dither: 1,
    cell: 3,
    autoRotate: 12,
    fov: 40,
    shade: 0.18,
    fog: 0.3,
    grain: 0,
    grainScale: 4,
    material: false,
    wire: false,
    shader: "",
    bloom: "off",
    animate: true,
    interactive: true,
    label: "3D model",
    paused: false,
    frameRate: 0,
    renderMode: "live",
  }
)

const MAX_COLS = 480
const MAX_ROWS = 320
/** Above this many triangles "auto" prefers the GPU engine. */
const GPU_FROM = 40000

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const world = shallowRef<World | null>(null)
const status = ref<"ready" | "loading" | "empty" | "error">("ready")
const engineUsed = ref<"cpu" | "gpu">("cpu")
const gpuProblem = ref("")
const materialProblem = ref("")
const note = computed(() =>
  status.value === "loading"
    ? "loading model"
    : status.value === "error"
      ? "could not load the model"
      : status.value === "empty"
        ? "no geometry"
        : props.engine === "gpu" && gpuProblem.value
          ? gpuProblem.value
          : props.shader && materialProblem.value
            ? materialProblem.value
            : ""
)

// ---- loading ----------------------------------------------------------------

let ctl: AbortController | null = null
const upOf = () => (props.up === "auto" ? undefined : props.up)

function setWorld(w: World) {
  world.value = w
  status.value = w.meshes.length ? "ready" : "empty"
}

function fail() {
  world.value = null
  status.value = "error"
}

async function fetchModel(src: string, signal: AbortSignal): Promise<World> {
  const head = await fetch(src, { signal })
  if (!head.ok) throw new Error(String(head.status))
  const bytes = await head.arrayBuffer()
  const format = props.format === "auto" ? (formatOf(src) ?? "auto") : props.format
  const resources: Record<string, ArrayBuffer> = {}
  const base = typeof location !== "undefined" ? new URL(src, location.href) : new URL(src)
  await Promise.all(
    externalResources(bytes, format).map(async (uri) => {
      try {
        const r = await fetch(new URL(uri, base).href, { signal })
        if (r.ok) resources[uri] = await r.arrayBuffer()
      } catch {
        // A missing side file costs its colours or buffers, not the model.
      }
    })
  )
  return parseWorld(bytes, format, { up: upOf(), resources })
}

function load() {
  ctl?.abort()
  ctl = null
  try {
    if (props.source) return setWorld(parseWorld(props.source, props.format, { up: upOf() }))
    if (!props.src) return setWorld(parseWorld(sampleWorld(props.seed ?? 0), "vrml"))
  } catch {
    return fail()
  }
  if (typeof fetch !== "function") return fail()
  const c = new AbortController()
  ctl = c
  status.value = "loading"
  fetchModel(props.src, c.signal)
    .then((w) => {
      if (!c.signal.aborted) setWorld(w)
    })
    .catch(() => {
      if (!c.signal.aborted) fail()
    })
}

watch(() => [props.source, props.src, props.format, props.up, props.seed], load, { immediate: true })

// ---- the camera -------------------------------------------------------------

/** Where the file's Viewpoint stood, as orbit angles, when the props leave it open. */
const pose = computed(() => {
  const w = world.value
  const vp = w?.viewpoint
  if (!w || !vp) return { yaw: 30, pitch: 20, zoom: 1 }
  const dx = vp.position[0] - w.center[0]
  const dy = vp.position[1] - w.center[1]
  const dz = vp.position[2] - w.center[2]
  const d = Math.hypot(dx, dy, dz)
  if (d < 1e-6) return { yaw: 30, pitch: 20, zoom: 1 }
  const fov = (Math.min(150, Math.max(5, props.fov)) * Math.PI) / 180
  return {
    yaw: (Math.atan2(-dx, dz) * 180) / Math.PI,
    pitch: (Math.asin(Math.max(-1, Math.min(1, dy / d))) * 180) / Math.PI,
    zoom: Math.max(0.3, Math.min(4, ((w.radius / Math.sin(fov / 2)) * 1.08) / d)),
  }
})

/** Pointer and keyboard orbit, added on top of the props. */
const orbit = reactive({ yaw: 0, pitch: 0 })

const viewAt = (clock: number): WorldView => ({
  yaw: (props.yaw ?? pose.value.yaw) + orbit.yaw + props.autoRotate * clock,
  pitch: Math.max(-89, Math.min(89, (props.pitch ?? pose.value.pitch) + orbit.pitch)),
  zoom: props.zoom ?? pose.value.zoom,
  fov: props.fov,
  time: props.animate ? (props.time ?? clock) : 0,
})

const style = computed<WorldStyle>(() => ({
  fill: fillOf(props.color),
  matrix: props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4,
  shade: clamp01(props.shade),
  material: props.material,
  wire: props.wire,
  fog: clamp01(props.fog),
  ramp: props.colors && props.colors.length >= 2 ? props.colors.map(fillOf) : null,
  dither: clamp01(props.dither),
  grain: clamp01(props.grain),
  grainScale: Math.max(0.1, props.grainScale),
  seed: props.seed ?? 0,
}))

const bloomStyle = computed(() => pixelBloomStyle(props.bloom))

let drag: { id: number; x: number; y: number } | null = null

function onDown(e: PointerEvent) {
  if (!props.interactive || e.button !== 0) return
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
  wrapRef.value?.setPointerCapture?.(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.id) return
  // A drag across the whole width turns half a revolution.
  const k = 180 / Math.max(1, wrapRef.value?.getBoundingClientRect().width ?? 320)
  orbit.yaw += (e.clientX - drag.x) * k
  orbit.pitch += (e.clientY - drag.y) * k
  drag.x = e.clientX
  drag.y = e.clientY
}

function onUp(e: PointerEvent) {
  if (drag?.id === e.pointerId) drag = null
}

function onKey(e: KeyboardEvent) {
  if (!props.interactive) return
  const step = e.shiftKey ? 30 : 10
  if (e.key === "ArrowLeft") orbit.yaw -= step
  else if (e.key === "ArrowRight") orbit.yaw += step
  else if (e.key === "ArrowUp") orbit.pitch += step
  else if (e.key === "ArrowDown") orbit.pitch -= step
  else if (e.key === "Home") {
    orbit.yaw = 0
    orbit.pitch = 0
  } else return
  e.preventDefault()
}

// ---- the engines --------------------------------------------------------------

let target: WorldTarget | null = null
let gl: GlHandle | null | undefined
let gpu: WorldGpu | null = null
let materialPass: WorldMaterial | null = null

/** One WebGL context per component, shared by the GPU engine and the material pass. */
const glHandle = () => (gl === undefined ? (gl = createGl()) : gl)

const triangles = (w: World) => w.meshes.reduce((n, m) => n + (m.kind === "faces" ? m.indices.length / 3 : 0), 0)

function wantsGpu(w: World): boolean {
  if (props.engine === "cpu") return false
  if (props.engine === "gpu") return true
  return triangles(w) >= GPU_FROM
}

function render(buffer: RasterBuffer, clock: number) {
  const w = world.value
  if (!w) {
    buffer.data.fill(0)
    return
  }
  const v = viewAt(clock)
  if (!target || target.width !== buffer.width || target.height !== buffer.height) target = createWorldTarget(buffer.width, buffer.height)
  let drawn = false
  if (wantsGpu(w)) {
    const h = glHandle()
    if (h) {
      gpu = gpu ?? createWorldGpu(h)
      drawn = gpu.rasterize(w, v, target, style.value)
      gpuProblem.value = drawn ? "" : gpu.problem()
    } else gpuProblem.value = "WebGL is not available"
  }
  if (!drawn) rasterizeWorld(w, v, target, style.value)
  engineUsed.value = drawn ? "gpu" : "cpu"
  const moment = directedTime()
  if (props.shader) {
    const h = glHandle()
    const rgba = h
      ? (materialPass = materialPass ?? createWorldMaterial(h)).shade(props.shader, target, w, v, { time: v.time ?? 0, color: fillOf(props.color), seed: props.seed ?? 0, channels: props.channels, moment })
      : null
    materialProblem.value = rgba ? "" : h ? materialPass?.problem() || "the material did not compile" : "WebGL is not available"
    if (rgba) {
      paintMaterial(buffer, target, w, v, style.value, rgba)
      return
    }
  }
  // The first channel is the model's skin: sampled per cell through the uvs.
  const texture = props.channels?.length ? rasterOf(props.channels[0], moment) : null
  paintTarget(buffer, target, w, v, texture ? { ...style.value, texture } : style.value)
}

function afterPaint(canvas: HTMLCanvasElement) {
  const bloom = bloomRef.value
  const ctx = bloom?.getContext("2d")
  if (!bloom || !ctx) return
  if (bloom.width !== canvas.width || bloom.height !== canvas.height) {
    bloom.width = canvas.width
    bloom.height = canvas.height
  }
  ctx.clearRect(0, 0, bloom.width, bloom.height)
  ctx.drawImage(canvas, 0, 0)
}

onBeforeUnmount(() => {
  ctl?.abort()
  gpu?.dispose()
  gpu = null
  materialPass?.dispose()
  materialPass = null
  gl?.dispose()
  gl = null
})

const surface = useDitherBackground({
  wrapRef,
  canvasRef,
  cell: () => Math.max(1, props.cell),
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => props.dpr,
  paused: () => props.paused,
  renderMode: () => props.renderMode,
  precompiled: () => undefined,
  restart: () => [
    props.renderMode, props.dpr, props.cell, world.value, orbit.yaw, orbit.pitch, props.engine,
    props.yaw, props.pitch, props.zoom, props.fov, props.color, props.colors, props.dither, props.seed, props.shade, props.fog,
    props.grain, props.grainScale, props.material, props.wire, props.shader, props.bloom, props.animate, props.time, props.channels,
  ],
  frameRate: () => props.frameRate,
  staticClock: 0,
  render,
  afterPaint,
})

defineExpose({ surface })
</script>

<template>
  <div
    ref="wrapRef"
    role="img"
    :aria-label="label"
    :tabindex="interactive ? 0 : undefined"
    :data-state="status"
    :data-engine="engineUsed"
    :class="cn('relative block h-full w-full select-none overflow-hidden', interactive && 'cursor-grab active:cursor-grabbing', props.class)"
    :style="interactive ? { touchAction: 'pan-y' } : undefined"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @keydown="onKey"
  >
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" style="image-rendering: pixelated" />
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 h-full w-full"
      :style="{ filter: bloomStyle.filter, opacity: bloomStyle.opacity, mixBlendMode: bloomStyle.mixBlendMode, imageRendering: bloomStyle.imageRendering }"
    />
    <p v-if="note" class="absolute inset-x-0 bottom-2 px-2 text-center font-mono text-[10px] break-words text-muted-foreground" aria-live="polite">{{ note }}</p>
  </div>
</template>
