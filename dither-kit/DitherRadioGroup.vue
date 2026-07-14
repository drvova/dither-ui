<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01 } from "./pixel"

const CELL = 2

/** Paint one radio — a 1px pixel ring when unchecked, the ring in the accent
 * plus a dithered inner dot (distance check against the Bayer matrix) when
 * checked. */
function paintDot(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean
): void {
  ctx.clearRect(0, 0, n, n)
  const c = (n - 1) / 2
  const edge = n / 2
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - c, y - c)
      if (d > edge) continue
      if (d > edge - 1.2) {
        ctx.fillStyle = rgb(checked ? fill : muted, 1, 0.6)
        ctx.fillRect(x, y, 1, 1)
      } else if (checked && d <= edge - 2.4) {
        const density = 0.8
        const lit = density > BAYER4[y & 3][x & 3]
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
import { cn } from "./lib"
import { fillOf, type PixelColor } from "./pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string
    color?: PixelColor
    label?: string
    class?: string
  }>(),
  { color: "blue" }
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
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const n = Math.max(4, Math.round(canvas.getBoundingClientRect().width / CELL))
    canvas.width = n
    canvas.height = n
    paintDot(ctx, n, fill, muted, o.value === props.modelValue)
  })
}

function onKeydown(e: KeyboardEvent) {
  const dir =
    e.key === "ArrowDown" || e.key === "ArrowRight"
      ? 1
      : e.key === "ArrowUp" || e.key === "ArrowLeft"
        ? -1
        : 0
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

onMounted(paintAll)
watch(
  () => [props.modelValue, props.color, props.options],
  () => nextTick(paintAll)
)
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.label"
    :class="cn('grid gap-3', props.class)"
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
      class="inline-flex items-center gap-2 text-left focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      @click="emit('update:modelValue', o.value)"
    >
      <span class="relative size-4 shrink-0">
        <canvas
          :ref="(el) => setCanvasRef(el, i)"
          aria-hidden="true"
          class="absolute inset-0 h-full w-full"
          style="image-rendering: pixelated"
        />
      </span>
      <span class="text-[13px] text-foreground">{{ o.label }}</span>
    </button>
  </div>
</template>
