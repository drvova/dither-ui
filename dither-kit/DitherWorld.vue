<script lang="ts">
import { formatOf, parseWorld, type ModelFormat } from "./models"
import { paintWorld, sampleWorld, type World, type WorldMesh, type WorldStyle, type WorldView } from "./world"
export type { ModelFormat, World, WorldMesh, WorldStyle, WorldView }
export { formatOf, paintWorld, parseWorld, sampleWorld }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, fillOf, type PixelColor, pixelMatrixFromSeed } from "./pixel"
import type { DitherRenderMode } from "./precompile"
import type { RasterBuffer } from "./raster"
import { useDitherBackground } from "./use-dither-background"

const props = withDefaults(
  defineProps<{
    /** URL of a .wrl (VRML97 or VRML 1.0), .obj or .stl file. */
    src?: string
    /** Inline model text (VRML, OBJ or ASCII STL) — wins over `src`. */
    source?: string
    /** File format; "auto" reads the name, then the bytes. */
    format?: ModelFormat | "auto"
    /** The file's up axis; "auto" is y, z for STL. */
    up?: "y" | "z" | "auto"
    color?: PixelColor
    /** Seeds the dither matrix and, without src/source, the sample world. */
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
    /** Use the file's material colours instead of `color`. */
    material?: boolean
    /** Draw polygon outlines, hidden lines removed. */
    wire?: boolean
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
    color: "blue",
    cell: 3,
    autoRotate: 12,
    fov: 40,
    shade: 0.18,
    fog: 0.3,
    material: false,
    wire: false,
    interactive: true,
    label: "3D model",
    paused: false,
    frameRate: 0,
    renderMode: "live",
  }
)

const MAX_COLS = 480
const MAX_ROWS = 320

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const world = shallowRef<World | null>(null)
const status = ref<"ready" | "loading" | "empty" | "error">("ready")
const note = computed(() =>
  status.value === "loading" ? "loading model" : status.value === "error" ? "could not load the model" : status.value === "empty" ? "no geometry" : ""
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
  const format = props.format === "auto" ? (formatOf(props.src) ?? "auto") : props.format
  fetch(props.src, { signal: c.signal })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.arrayBuffer()
    })
    .then((bytes) => {
      if (!c.signal.aborted) setWorld(parseWorld(bytes, format, { up: upOf() }))
    })
    .catch(() => {
      if (!c.signal.aborted) fail()
    })
}

watch(() => [props.source, props.src, props.format, props.up, props.seed], load, { immediate: true })
onBeforeUnmount(() => ctl?.abort())

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
})

const style = computed<WorldStyle>(() => ({
  fill: fillOf(props.color),
  matrix: props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4,
  shade: clamp01(props.shade),
  material: props.material,
  wire: props.wire,
  fog: clamp01(props.fog),
}))

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
  restart: () => [
    props.renderMode, props.dpr, props.cell, world.value, orbit.yaw, orbit.pitch,
    props.yaw, props.pitch, props.zoom, props.fov, props.color, props.seed, props.shade, props.fog, props.material, props.wire,
  ],
  frameRate: () => props.frameRate,
  staticClock: 0,
  render: (buffer: RasterBuffer, clock: number) => {
    const w = world.value
    if (!w) {
      buffer.data.fill(0)
      return
    }
    paintWorld(buffer, w, viewAt(clock), style.value)
  },
})
</script>

<template>
  <div
    ref="wrapRef"
    role="img"
    :aria-label="label"
    :tabindex="interactive ? 0 : undefined"
    :data-state="status"
    :class="cn('relative block h-full w-full select-none overflow-hidden', interactive && 'cursor-grab active:cursor-grabbing', props.class)"
    :style="interactive ? { touchAction: 'pan-y' } : undefined"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @keydown="onKey"
  >
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" style="image-rendering: pixelated" />
    <p v-if="note" class="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] text-muted-foreground" aria-live="polite">{{ note }}</p>
  </div>
</template>
