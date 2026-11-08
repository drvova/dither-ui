<!-- Generated from ../tailwind/DitherWorld.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { externalResources, formatOf, parseWorld, type ModelFormat } from "../engine/models"
import {
  packTarget,
  packUv,
  paintMaterial,
  paintTarget,
  paintWorld,
  rasterizeWorld,
  sampleWorld,
  type World,
  type WorldMesh,
  type WorldStyle,
  type WorldTarget,
  type WorldView,
} from "../engine/world"
import { createWorldGpu, createWorldMaterial, type WorldGpu, type WorldMaterial } from "../engine/world-gl"
import { type Assembly, type AssemblyState, createAssembly } from "../engine/assemble"
import * as stylex from "@stylexjs/stylex"

export type {
  Assembly,
  AssemblyState,
  ModelFormat,
  World,
  WorldGpu,
  WorldMaterial,
  WorldMesh,
  WorldStyle,
  WorldTarget,
  WorldView,
}
export {
  createAssembly,
  createWorldGpu,
  createWorldMaterial,
  externalResources,
  formatOf,
  packTarget,
  packUv,
  paintMaterial,
  paintTarget,
  paintWorld,
  parseWorld,
  rasterizeWorld,
  sampleWorld,
}

const styles = stylex.create({
  frame: {
    position: "relative",
    display: "block",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  cursorGrab: { cursor: { default: "grab", ":active": "grabbing" }, outlineStyle: "none" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  canvas2: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
  p: {
    position: "absolute",
    insetInline: "0px",
    bottom: "0.5rem",
    paddingInline: "0.5rem",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    overflowWrap: "break-word",
    color: "var(--muted-foreground)",
  },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    boxShadow: "inset 0 0 0 calc(2px + 0px) color-mix(in oklab, var(--foreground) 60%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue"
import { directedTime, isDirected } from "../engine/clock"
import { type ChannelInput, createGl, type GlHandle, rasterOf } from "../engine/gl"
import { cn, type StyleProp } from "./lib"
import { clamp01, fillOf, type PixelBloomInput, type PixelColor, pixelBloomStyle } from "../engine/pixel"
import type { DitherRenderMode } from "../engine/precompile"
import type { RasterBuffer } from "../engine/raster"
import { useDitherBackground } from "../engine/use-dither-background"
import { cameraOf, createWorldTarget } from "../engine/world"
import { useDitherMatrix } from "../engine/use-screen"
import { offloadWorld, spawnWorldWorker } from "../engine/world-offload"

const props = withDefaults(
  defineProps<{
    /** URL of a model: .wrl (VRML97 / 1.0), .x3d, .gltf / .glb, .obj (+ .mtl), .stl, .ply, .off, or a
     * Gaussian capture (.splat, or a trained capture's .ply). */
    src?: string
    /** Inline model text (VRML, X3D, glTF JSON, OBJ, ASCII STL / PLY, OFF) — wins over `src`. */
    source?: string
    /** File format; "auto" reads the name, then the bytes. */
    format?: ModelFormat | "auto"
    /** The file's up axis; "auto" is y, z for STL, -y (a capture's camera space) for splats. */
    up?: "y" | "z" | "-y" | "auto"
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
    /** The model as a build, 0-1: its separate pieces rise from a dotted
     * wire cage bottom to top, each flying in hot (`heat`) until it lands. */
    build?: number
    /** Blow the pieces apart, 0 together → 1 apart (turned as they go). */
    scatter?: number
    /** The colour a piece glows in while it flies in. */
    heat?: PixelColor
    /** Pieces under the pointer lean away from it, and settle back after. */
    nudge?: boolean
    /** Accessible name. */
    label?: string
    paused?: boolean
    dpr?: number
    /** Stop-motion cadence in fps (0 = smooth) — see timing.ts. */
    frameRate?: number
    renderMode?: DitherRenderMode
    class?: string
    xstyle?: StyleProp
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
    build: 1,
    scatter: 0,
    heat: "orange",
    nudge: false,
    label: "3D model",
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const MAX_COLS = 480
const MAX_ROWS = 320
/** Above this many triangles "auto" prefers the GPU engine. */
const GPU_FROM = 40000

const wrapRef = ref<HTMLDivElement | null>(null)
// Keyboard focus draws a ring over the canvases (an outline sits under
// them, and the well around a world clips an outer one).
const ring = ref(false)
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
            : "",
)

// ---- loading ----------------------------------------------------------------

let ctl: AbortController | null = null
const upOf = () => (props.up === "auto" ? undefined : props.up)

function setWorld(w: World) {
  world.value = w
  status.value = w.meshes.length || w.splats?.count ? "ready" : "empty"
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
    }),
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

const matrix = useDitherMatrix(() => props.seed)
const style = computed<WorldStyle>(() => ({
  fill: fillOf(props.color),
  matrix: matrix.value,
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
/** Where a pointer passes over the model, 0-1 across the box; null when away. */
let hover: { x: number; y: number } | null = null

function onHover(e: PointerEvent) {
  const r = wrapRef.value?.getBoundingClientRect()
  hover =
    r && r.width > 0 && r.height > 0 ? { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } : null
}

function onLeave() {
  hover = null
}

function onDown(e: PointerEvent) {
  if (!props.interactive || e.button !== 0) return
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
  wrapRef.value?.setPointerCapture?.(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (props.nudge) onHover(e)
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

/** The model taken apart into its pieces, made once per model and heat
 * when a build, a scatter or a nudge asks for it. */
let assembly: { of: World; heat: string; seed: number; a: Assembly } | null = null
const assembling = () => props.build < 1 || props.scatter > 0 || props.nudge
function assemblyOf(w: World): Assembly {
  const heat = String(props.heat)
  const seed = props.seed ?? 0
  if (!assembly || assembly.of !== w || assembly.heat !== heat || assembly.seed !== seed)
    assembly = { of: w, heat, seed, a: createAssembly(w, fillOf(props.heat), seed) }
  return assembly.a
}

/** One WebGL context per component, shared by the GPU engine and the material pass. */
const glHandle = () => (gl === undefined ? (gl = createGl()) : gl)

const triangles = (w: World) => w.meshes.reduce((n, m) => n + (m.kind === "faces" ? m.indices.length / 3 : 0), 0)

function wantsGpu(w: World): boolean {
  if (props.engine === "cpu") return false
  if (props.engine === "gpu") return true
  return triangles(w) >= GPU_FROM
}

/** The build's state at this paint, null for the model whole and still. */
function stateFor(cols: number, rows: number): AssemblyState | null {
  if (!assembling()) return null
  const nudge =
    props.nudge && hover
      ? { x: hover.x * cols, y: hover.y * rows, radius: Math.min(cols, rows) * 0.22, amount: 1 }
      : null
  return { build: props.build, scatter: props.scatter, nudge }
}

// The CPU engine's plain case (no GPU, no GLSL material, no channels, not
// directed, running) paints in a worker (`world-offload.ts`): the page shows
// its latest moment and asks for the one due at the next paint.
const offload = offloadWorld(spawnWorldWorker)
const offloadable = (w: World) =>
  !wantsGpu(w) && !props.shader && !props.channels?.length && !isDirected() && !props.paused

function render(buffer: RasterBuffer, clock: number, dt: number) {
  const w = world.value
  if (!w) {
    buffer.data.fill(0)
    return
  }
  if (!offloadable(w)) return paint(buffer, w, clock, dt)
  const step = props.frameRate > 0 ? 1 / props.frameRate : 1 / 30
  offload.paint(
    buffer,
    {
      world: w,
      view: viewAt(clock + step),
      state: stateFor(buffer.width, buffer.height),
      heat: fillOf(props.heat),
      seed: props.seed ?? 0,
      dt: step,
      style: style.value,
    },
    () => paint(buffer, w, clock, dt),
  )
  engineUsed.value = "cpu"
}

/** Paint the moment here, on whichever engine the model wants. */
function paint(buffer: RasterBuffer, model: World, clock: number, dt: number) {
  let w = model
  const v = viewAt(clock)
  const st = style.value
  const state = stateFor(buffer.width, buffer.height)
  if (state) w = assemblyOf(w).frame(v, cameraOf(w, v, buffer.width, buffer.height), state, dt)
  if (!target || target.width !== buffer.width || target.height !== buffer.height)
    target = createWorldTarget(buffer.width, buffer.height)
  let drawn = false
  if (wantsGpu(w)) {
    const h = glHandle()
    if (h) {
      gpu = gpu ?? createWorldGpu(h)
      drawn = gpu.rasterize(w, v, target, st)
      gpuProblem.value = drawn ? "" : gpu.problem()
    } else gpuProblem.value = "WebGL is not available"
  }
  if (!drawn) rasterizeWorld(w, v, target, st)
  engineUsed.value = drawn ? "gpu" : "cpu"
  const moment = directedTime()
  if (props.shader) {
    const h = glHandle()
    const rgba = h
      ? (materialPass = materialPass ?? createWorldMaterial(h)).shade(props.shader, target, w, v, {
          time: v.time ?? 0,
          color: fillOf(props.color),
          seed: props.seed ?? 0,
          channels: props.channels,
          moment,
        })
      : null
    materialProblem.value = rgba
      ? ""
      : h
        ? materialPass?.problem() || "the material did not compile"
        : "WebGL is not available"
    if (rgba) {
      paintMaterial(buffer, target, w, v, st, rgba)
      return
    }
  }
  // The first channel is the model's skin: sampled per cell through the uvs.
  const texture = props.channels?.length ? rasterOf(props.channels[0], moment) : null
  paintTarget(buffer, target, w, v, texture ? { ...st, texture } : st)
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
  offload.stop()
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
    props.renderMode,
    props.dpr,
    props.cell,
    world.value,
    orbit.yaw,
    orbit.pitch,
    props.engine,
    props.yaw,
    props.pitch,
    props.zoom,
    props.fov,
    props.color,
    props.colors,
    props.dither,
    props.seed,
    props.shade,
    props.fog,
    props.grain,
    props.grainScale,
    props.material,
    props.wire,
    props.shader,
    props.bloom,
    props.animate,
    props.time,
    props.channels,
    // Read every frame; in the restart too, so a still surface repaints them.
    props.build,
    props.scatter,
    props.heat,
    props.nudge,
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
    :class="cn(styles.frame, interactive && styles.cursorGrab, props.xstyle, props.class)"
    :style="interactive ? { touchAction: 'pan-y' } : undefined"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @pointerleave="onLeave"
    @keydown="onKey"
    @focus="ring = ($event.currentTarget as Element).matches(':focus-visible')"
    @blur="ring = false"
  >
    <canvas ref="canvasRef" v-bind="stylex.attrs(styles.canvas)" style="image-rendering: pixelated" />
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas2)"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
    <p v-if="note" v-bind="stylex.attrs(styles.p)" aria-live="polite">
      {{ note }}
    </p>
    <span v-if="ring" aria-hidden="true" v-bind="stylex.attrs(styles.layer)" />
  </div>
</template>
