<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

export type NavMenuItem = { label: string; href?: string }

const CELL = 2

/** Paint the 2px underline — the same horizontal dither ramp as DitherTabs. */
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
    items: NavMenuItem[]
    modelValue: string
    color?: PixelColor
  }>(),
  { color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const listRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const itemRefs = ref<HTMLAnchorElement[]>([])
const underline = ref({ left: 0, width: 0 })

function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLAnchorElement) itemRefs.value[i] = el
}

function measure() {
  const active =
    itemRefs.value[props.items.findIndex((it) => it.label === props.modelValue)]
  if (!active) return
  underline.value = { left: active.offsetLeft, width: active.offsetWidth }
  if (canvasRef.value)
    paintUnderline(canvasRef.value, active.offsetWidth, props.color)
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
  () => [props.modelValue, props.items, props.color],
  () => nextTick(measure)
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <nav class="relative">
    <div ref="listRef" class="flex gap-4">
      <a
        v-for="(item, i) in props.items"
        :key="item.label"
        :ref="(el) => setItemRef(el, i)"
        :href="item.href ?? '#'"
        :aria-current="item.label === props.modelValue ? 'page' : undefined"
        class="pb-2 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        :class="
          item.label === props.modelValue
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click.prevent="emit('update:modelValue', item.label)"
      >
        {{ item.label }}
      </a>
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
  </nav>
</template>
