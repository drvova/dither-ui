<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

const CELL = 2
let uid = 0

/** Paint the 2px left rail — a vertical dither ramp fading downward. */
function paintRail(
  canvas: HTMLCanvasElement,
  height: number,
  color: PixelColor
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  ctx.clearRect(0, 0, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > BAYER4[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    ctx.fillStyle = rgb(fill, 1, alpha)
    ctx.fillRect(0, y, 1, 1)
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    title: string
    modelValue?: boolean
    color?: PixelColor
  }>(),
  { modelValue: false, color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>()

const id = `dither-collapsible-${++uid}`
const railRef = ref<HTMLCanvasElement | null>(null)

function paint() {
  const canvas = railRef.value
  if (canvas) paintRail(canvas, canvas.offsetHeight, props.color)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (railRef.value) ro.observe(railRef.value)
  }
})
watch(() => props.color, paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div>
    <button
      type="button"
      :aria-expanded="props.modelValue"
      :aria-controls="id"
      class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span>{{ props.title }}</span>
      <span
        aria-hidden="true"
        class="text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
        :class="props.modelValue ? 'rotate-90' : ''"
      >
        ›
      </span>
    </button>
    <div
      :id="id"
      :inert="!props.modelValue"
      class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
      :style="{ gridTemplateRows: props.modelValue ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden">
        <div class="flex gap-3 pt-1 pb-2">
          <canvas
            ref="railRef"
            aria-hidden="true"
            class="w-[2px] self-stretch"
            style="image-rendering: pixelated"
          />
          <div class="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
