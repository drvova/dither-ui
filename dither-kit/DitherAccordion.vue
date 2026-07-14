<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

export type AccordionItem = { value: string; title: string }

const CELL = 2
let uid = 0

/** Paint the 2px left rail — a vertical dither ramp fading downward,
 * the same recipe as DitherCollapsible. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor): void {
  const ctx = canvas.getContext("2d")
  const height = canvas.offsetHeight
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
    items: AccordionItem[]
    modelValue: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
  }>(),
  { type: "single", color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [value: string | string[]] }>()

const id = `dither-accordion-${++uid}`
const rails = ref<HTMLCanvasElement[]>([])

function setRail(el: unknown, i: number) {
  if (el instanceof HTMLCanvasElement) rails.value[i] = el
}

function isOpen(value: string): boolean {
  return Array.isArray(props.modelValue)
    ? props.modelValue.includes(value)
    : props.modelValue === value
}

function toggle(value: string) {
  if (props.type === "single") {
    emit("update:modelValue", isOpen(value) ? "" : value)
    return
  }
  const open = Array.isArray(props.modelValue)
    ? props.modelValue
    : props.modelValue
      ? [props.modelValue]
      : []
  emit(
    "update:modelValue",
    isOpen(value) ? open.filter((v) => v !== value) : [...open, value]
  )
}

function paintAll() {
  for (const canvas of rails.value) if (canvas) paintRail(canvas, props.color)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  paintAll()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver((entries) => {
      for (const entry of entries)
        paintRail(entry.target as HTMLCanvasElement, props.color)
    })
    for (const canvas of rails.value) if (canvas) ro.observe(canvas)
  }
})
watch(() => props.color, paintAll)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div>
    <div
      v-for="(item, i) in props.items"
      :key="item.value"
      class="border-t border-border/40 first:border-t-0"
    >
      <button
        type="button"
        :aria-expanded="isOpen(item.value)"
        :aria-controls="`${id}-${i}`"
        class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        @click="toggle(item.value)"
      >
        <span>{{ item.title }}</span>
        <span
          aria-hidden="true"
          class="text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
          :class="isOpen(item.value) ? 'rotate-90' : ''"
        >
          ›
        </span>
      </button>
      <div
        :id="`${id}-${i}`"
        :inert="!isOpen(item.value)"
        class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
        :style="{ gridTemplateRows: isOpen(item.value) ? '1fr' : '0fr' }"
      >
        <div class="overflow-hidden">
          <div class="flex gap-3 pt-1 pb-2">
            <canvas
              :ref="(el) => setRail(el, i)"
              aria-hidden="true"
              class="w-[2px] self-stretch"
              style="image-rendering: pixelated"
            />
            <div class="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
              <slot :name="item.value" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
