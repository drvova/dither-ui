<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { isDirected, onSeek } from "../engine/clock"
import { gaugeAngle, gaugePoint, gaugeTicks, paintGauge } from "../engine/gauge"
import { clamp01, fillOf, pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
import { spring } from "../engine/spring"
import { useDitherMatrix } from "../engine/use-screen"
import { cn } from "./lib"

/** Gauge: an instrument dial reading a value, read-only (`role="meter"`).
 * A 240-degree band printed cell by cell through the threshold matrix,
 * filled to the needle, the zone past `warn` (a share of the scale; null
 * for none) in the warning ink; ticks and numerals on the scale, the
 * reading under the hub. The needle settles on the kit's spring when the
 * value changes; under reduced motion, or a director's clock, it stands on
 * the reading. Square, as wide as its box. */
const props = withDefaults(
  defineProps<{
    value: number
    min?: number
    max?: number
    /** Intervals between the major ticks. */
    ticks?: number
    /** Where the warning zone starts, as a share of the scale; null: none. */
    warn?: number | null
    /** What it reads, under the reading (also its accessible name). */
    label?: string
    decimals?: number
    color?: PixelColor
    warnColor?: PixelColor
    seed?: number
    class?: string
  }>(),
  { min: 0, max: 100, ticks: 10, warn: 0.8, decimals: 0, color: "grey", warnColor: "orange" },
)

const CELL = 2
const SETTLE_MS = 600

const target = computed(() => clamp01((props.value - props.min) / (props.max - props.min || 1)))
const shown = ref(target.value)
const matrix = useDitherMatrix(() => props.seed)

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let cells = 0

function paint() {
  const ctx = canvasRef.value?.getContext("2d", { willReadFrequently: true })
  if (!ctx || cells <= 0) return
  paintGauge(
    ctx,
    cells,
    fillOf(props.color),
    fillOf("grey"),
    fillOf(props.warnColor),
    shown.value,
    props.warn,
    matrix.value,
  )
}

function resize() {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return
  cells = Math.max(16, Math.round(root.getBoundingClientRect().width / CELL))
  canvas.width = cells
  canvas.height = cells
  paint()
}

// The needle: from where it stands to the reading on the spring.
let raf = 0
function settle() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  const from = shown.value
  const to = target.value
  if (from === to) return
  if (pixelPrefersReducedMotion() || isDirected()) {
    shown.value = to
    return
  }
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / SETTLE_MS)
    shown.value = from + (to - from) * spring(p)
    raf = p < 1 && !isDirected() ? requestAnimationFrame(step) : 0
    if (!raf) shown.value = to
  }
  raf = requestAnimationFrame(step)
}
const unseek = onSeek(() => {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  shown.value = target.value
})

watch(target, settle)
watch([shown, matrix, () => props.warn, () => props.color, () => props.warnColor], paint)

let ro: ResizeObserver | null = null
onMounted(() => {
  requestAnimationFrame(() => {
    resize()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize)
      if (rootRef.value) ro.observe(rootRef.value)
    }
  })
})
onBeforeUnmount(() => {
  unseek()
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
})

const format = (n: number) => n.toFixed(props.decimals)
const reading = computed(() => format(props.value))
/** Past six intervals a numeral goes on every other major, the ends always. */
const named = (i: number) => Math.round(props.ticks) <= 6 || i % 2 === 0
const scale = computed(() =>
  gaugeTicks(props.ticks).map((t, i) => {
    const a = gaugeAngle(t)
    const [x1, y1] = gaugePoint(a, 0.6)
    const [x2, y2] = gaugePoint(a, 0.69)
    const [nx, ny] = gaugePoint(a, 0.47)
    const n = props.min + (props.max - props.min) * t
    return { t, x1, y1, x2, y2, nx, ny, text: Number.isInteger(n) ? String(n) : n.toFixed(1), named: named(i) }
  }),
)
/** A minor tick halfway between each pair of majors. */
const minor = computed(() => {
  const n = Math.max(1, Math.round(props.ticks))
  return Array.from({ length: n }, (_, i) => {
    const a = gaugeAngle((i + 0.5) / n)
    const [x1, y1] = gaugePoint(a, 0.64)
    const [x2, y2] = gaugePoint(a, 0.69)
    return { x1, y1, x2, y2 }
  })
})
const needle = computed(() => {
  const a = gaugeAngle(shown.value)
  const [x1, y1] = gaugePoint(a + 180, 0.12)
  const [x2, y2] = gaugePoint(a, 0.84)
  return { x1, y1, x2, y2 }
})
const hub = computed(() => `rgb(${fillOf(props.warnColor).join(" ")})`)
const numerals = computed(() => Math.round(props.ticks) <= 12)
</script>

<template>
  <div
    ref="rootRef"
    role="meter"
    :aria-valuemin="props.min"
    :aria-valuemax="props.max"
    :aria-valuenow="props.value"
    :aria-valuetext="props.label ? `${reading} ${props.label}` : reading"
    :aria-label="props.label"
    :class="cn('relative aspect-square w-full text-foreground', props.class)"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
    <svg viewBox="0 0 100 100" aria-hidden="true" class="absolute inset-0 h-full w-full font-mono">
      <line
        v-for="m in minor"
        :key="`m${m.x1}`"
        :x1="m.x1"
        :y1="m.y1"
        :x2="m.x2"
        :y2="m.y2"
        stroke="currentColor"
        stroke-width="0.6"
        opacity="0.45"
      />
      <g v-for="s in scale" :key="s.t">
        <line :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" stroke="currentColor" stroke-width="1.2" />
        <text
          v-if="numerals && s.named"
          :x="s.nx"
          :y="s.ny"
          font-size="5.5"
          text-anchor="middle"
          dominant-baseline="central"
          fill="currentColor"
          opacity="0.7"
        >
          {{ s.text }}
        </text>
      </g>
      <line
        :x1="needle.x1"
        :y1="needle.y1"
        :x2="needle.x2"
        :y2="needle.y2"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <circle cx="50" cy="50" r="3.6" :fill="hub" />
      <text
        x="50"
        y="73"
        font-size="10"
        text-anchor="middle"
        dominant-baseline="central"
        fill="currentColor"
        style="font-variant-numeric: tabular-nums"
      >
        {{ reading }}
      </text>
      <text
        v-if="props.label"
        x="50"
        y="83"
        font-size="5"
        text-anchor="middle"
        dominant-baseline="central"
        fill="currentColor"
        opacity="0.6"
      >
        {{ props.label }}
      </text>
    </svg>
  </div>
</template>
