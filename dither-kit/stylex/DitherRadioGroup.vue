<!-- Generated from ../tailwind/DitherRadioGroup.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { type Rgb } from "../engine/palette"
import { cellCanvas } from "../engine/raster"
import { BAYER4, clamp01 } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

const CELL = 2

/** Paint one radio — a 1px pixel ring when unchecked, the ring in the accent
 * plus a dithered inner dot (distance check against the Bayer matrix) when
 * checked. */
function paintDot(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, n, n)
  const c = (n - 1) / 2
  const edge = n / 2
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - c, y - c)
      if (d > edge) continue
      if (d > edge - 1.2) {
        px.cell(x, y, checked ? fill : muted, 0.6)
      } else if (checked && d <= edge - 2.4) {
        const density = 0.8
        const lit = density > matrix[y & 3][x & 3]
        const k = 0.3 + density * 0.7
        px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
      }
    }
  }
  px.flush()
}

const styles = stylex.create({
  grid: { display: "grid", gap: "0.75rem" },
  button: {
    display: "inline-flex",
    minHeight: "1.5rem",
    alignItems: "center",
    gap: "0.5rem",
    textAlign: "left",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  frame: { position: "relative", width: "1rem", height: "1rem", flexShrink: "0" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  text: { fontSize: "13px", color: "var(--foreground)" },
})
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
import { cn, type StyleProp } from "./lib"
import { fillOf, type PixelColor } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string
    color?: PixelColor
    label?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "blue" },
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const btnRefs = ref<HTMLButtonElement[]>([])
const canvasRefs = ref<HTMLCanvasElement[]>([])

function setBtnRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) btnRefs.value[i] = el
}
function setCanvasRef(el: unknown, i: number) {
  if (el instanceof HTMLCanvasElement) canvasRefs.value[i] = el
}

const activeIndex = computed(() => {
  const i = props.options.findIndex((o) => o.value === props.modelValue)
  return i >= 0 ? i : 0
})

function paintAll() {
  const fill = fillOf(props.color)
  const muted = fillOf("grey")
  props.options.forEach((o, i) => {
    const canvas = canvasRefs.value[i]
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!canvas || !ctx) return
    const n = Math.max(4, Math.round(canvas.getBoundingClientRect().width / CELL))
    canvas.width = n
    canvas.height = n
    paintDot(ctx, n, fill, muted, o.value === props.modelValue)
  })
}

function onKeydown(e: KeyboardEvent) {
  const dir =
    e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const n = props.options.length
  let i = activeIndex.value
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!props.options[i].disabled) {
      emit("update:modelValue", props.options[i].value)
      nextTick(() => btnRefs.value[i]?.focus())
      return
    }
  }
}

onMounted(() => requestAnimationFrame(paintAll))
watch(
  () => [props.modelValue, props.color, props.options],
  () => nextTick(paintAll),
)
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.label"
    :class="cn(styles.grid, props.xstyle, props.class)"
    @keydown="onKeydown"
  >
    <button
      v-for="(o, i) in props.options"
      :key="o.value"
      :ref="(el) => setBtnRef(el, i)"
      type="button"
      role="radio"
      :aria-checked="o.value === props.modelValue"
      :tabindex="i === activeIndex ? 0 : -1"
      :disabled="o.disabled"
      v-bind="stylex.attrs(styles.button)"
      @click="emit('update:modelValue', o.value)"
    >
      <span v-bind="stylex.attrs(styles.frame)">
        <canvas
          :ref="(el) => setCanvasRef(el, i)"
          aria-hidden="true"
          v-bind="stylex.attrs(styles.canvas)"
          style="image-rendering: pixelated"
        />
      </span>
      <span v-bind="stylex.attrs(styles.text)">{{ o.label }}</span>
    </button>
  </div>
</template>
