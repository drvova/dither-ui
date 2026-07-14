<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

const CELL = 2

/** Paint the 2px underline — a horizontal dither ramp in the tab color,
 * same recipe as DitherGradient's transparent fade. */
function paintUnderline(
  canvas: HTMLCanvasElement,
  width: number,
  color: PixelColor
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx || width <= 0) return
  const cols = Math.max(4, Math.round(width / CELL))
  canvas.width = cols
  canvas.height = 1
  const fill = fillOf(color)
  ctx.clearRect(0, 0, cols, 1)
  for (let x = 0; x < cols; x++) {
    const density = (x + 0.5) / cols
    const lit = density > BAYER4[0][x & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    ctx.fillStyle = rgb(fill, 1, alpha)
    ctx.fillRect(x, 0, 1, 1)
  }
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    tabs: string[]
    modelValue: string
    color?: PixelColor
  }>(),
  { color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const listRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const tabRefs = ref<HTMLButtonElement[]>([])
const underline = ref({ left: 0, width: 0 })

function setTabRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) tabRefs.value[i] = el
}

function measure() {
  const btn = tabRefs.value[props.tabs.indexOf(props.modelValue)]
  if (!btn) return
  underline.value = { left: btn.offsetLeft, width: btn.offsetWidth }
  if (canvasRef.value) paintUnderline(canvasRef.value, btn.offsetWidth, props.color)
}

function onKeydown(e: KeyboardEvent) {
  const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const i = props.tabs.indexOf(props.modelValue)
  const next = (i + dir + props.tabs.length) % props.tabs.length
  emit("update:modelValue", props.tabs[next])
  nextTick(() => tabRefs.value[next]?.focus())
}

let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(measure)
    if (listRef.value) ro.observe(listRef.value)
  }
})
watch(
  () => [props.modelValue, props.tabs, props.color],
  () => nextTick(measure)
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div class="relative">
    <div ref="listRef" role="tablist" class="flex gap-4" @keydown="onKeydown">
      <button
        v-for="(t, i) in props.tabs"
        :key="t"
        :ref="(el) => setTabRef(el, i)"
        type="button"
        role="tab"
        :aria-selected="t === props.modelValue"
        :tabindex="t === props.modelValue ? 0 : -1"
        class="pb-2 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        :class="
          t === props.modelValue
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="emit('update:modelValue', t)"
      >
        {{ t }}
      </button>
    </div>
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute bottom-0 h-[2px] transition-[left,width] duration-200 motion-reduce:transition-none"
      :style="{
        left: underline.left + 'px',
        width: underline.width + 'px',
        imageRendering: 'pixelated',
      }"
    />
  </div>
</template>
