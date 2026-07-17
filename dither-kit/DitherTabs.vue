<script lang="ts">
import type { InjectionKey, Ref } from "vue"
import { rgb } from "./palette"
import { BAYER4, fillOf, pixelMatrixFromSeed, type PixelColor } from "./pixel"

export type TabsVariant = "underline" | "segmented" | "washed"
export type TabItem = {
  value: string
  label?: string
  badge?: string | number
  disabled?: boolean
}

export type TabsContext = { active: Ref<string>; idBase: string }
export const TABS_CTX: InjectionKey<TabsContext> = Symbol("dither-tabs")

let counter = 0
const CELL = 2

/** Underline: a dither ramp along the run (same recipe as the gradient fade). */
function paintUnderline(canvas: HTMLCanvasElement, length: number, color: PixelColor, vertical: boolean, matrix: number[][]) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || length <= 0) return
  const cells = Math.max(4, Math.round(length / CELL))
  canvas.width = vertical ? 1 : cells
  canvas.height = vertical ? cells : 1
  const fill = fillOf(color)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < cells; i++) {
    const density = (i + 0.5) / cells
    const lit = density > matrix[0][i & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    ctx.fillStyle = rgb(fill, 1, alpha)
    if (vertical) ctx.fillRect(0, i, 1, 1)
    else ctx.fillRect(i, 0, 1, 1)
  }
}

/** Washed: a quiet rest-intensity fill behind the active tab. */
function paintWash(canvas: HTMLCanvasElement, w: number, h: number, color: PixelColor, matrix: number[][]) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || w <= 0 || h <= 0) return
  const cols = Math.max(4, Math.round(w / CELL))
  const rows = Math.max(4, Math.round(h / CELL))
  canvas.width = cols
  canvas.height = rows
  const fill = fillOf(color)
  ctx.clearRect(0, 0, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = 0.2 + 0.5 * ((y + 0.5) / rows)
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      ctx.fillStyle = rgb(fill, 1, lit ? 0.32 : 0.08)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = rgb(fill, 1, 0.5)
  ctx.fillRect(0, rows - 1, cols, 1)
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, toRef, watch } from "vue"
import { cn } from "./lib"
import { kitFromSeed } from "./dither-paint"

const props = withDefaults(
  defineProps<{
    /** Plain strings or { value, label, badge, disabled } items. */
    tabs: (string | TabItem)[]
    modelValue: string
    color?: PixelColor
    /** underline: moving dither strip · segmented: boxed chips · washed: dither fill. */
    variant?: TabsVariant
    orientation?: "horizontal" | "vertical"
    seed?: number
    class?: string
  }>(),
  { variant: "underline", orientation: "horizontal" }
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const effColor = computed(() => props.color ?? s.value?.hue ?? "blue")
const matrix = computed(() => props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4)

const idBase = `dk-tabs-${counter++}`
provide(TABS_CTX, { active: toRef(props, "modelValue"), idBase })

const items = computed<TabItem[]>(() =>
  props.tabs.map((t) => (typeof t === "string" ? { value: t } : t))
)
const vertical = computed(() => props.orientation === "vertical")

const listRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const tabRefs = ref<HTMLButtonElement[]>([])
const marker = ref({ left: 0, top: 0, width: 0, height: 0 })

function setTabRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) tabRefs.value[i] = el
}

function measure() {
  if (props.variant === "segmented") return
  const i = items.value.findIndex((t) => t.value === props.modelValue)
  const btn = tabRefs.value[i]
  const canvas = canvasRef.value
  if (!btn || !canvas) return
  marker.value = { left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight }
  if (props.variant === "washed") paintWash(canvas, btn.offsetWidth, btn.offsetHeight, effColor.value, matrix.value)
  else paintUnderline(canvas, vertical.value ? btn.offsetHeight : btn.offsetWidth, effColor.value, vertical.value, matrix.value)
}

function select(value: string) {
  emit("update:modelValue", value)
}

function onKeydown(e: KeyboardEvent) {
  const fwd = vertical.value ? "ArrowDown" : "ArrowRight"
  const back = vertical.value ? "ArrowUp" : "ArrowLeft"
  let next = -1
  const enabled = items.value.map((t, i) => ({ t, i })).filter(({ t }) => !t.disabled)
  const pos = enabled.findIndex(({ t }) => t.value === props.modelValue)
  if (e.key === fwd) next = (pos + 1) % enabled.length
  else if (e.key === back) next = (pos - 1 + enabled.length) % enabled.length
  else if (e.key === "Home") next = 0
  else if (e.key === "End") next = enabled.length - 1
  else return
  e.preventDefault()
  const target = enabled[next]
  select(target.t.value)
  nextTick(() => tabRefs.value[target.i]?.focus())
}

const markerStyle = computed(() => {
  if (props.variant === "washed")
    return {
      left: `${marker.value.left}px`,
      top: `${marker.value.top}px`,
      width: `${marker.value.width}px`,
      height: `${marker.value.height}px`,
    }
  return vertical.value
    ? { left: "0px", top: `${marker.value.top}px`, width: "2px", height: `${marker.value.height}px` }
    : { left: `${marker.value.left}px`, bottom: "0px", width: `${marker.value.width}px`, height: "2px" }
})

let ro: ResizeObserver | null = null
onMounted(() => {
  requestAnimationFrame(() => {
    measure()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure)
      if (listRef.value) ro.observe(listRef.value)
    }
  })
})
watch(
  () => [props.modelValue, props.tabs, effColor.value, props.variant, props.orientation, matrix.value],
  () => nextTick(measure)
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div :class="cn('relative', vertical ? 'flex gap-4' : '', props.class)">
    <div
      ref="listRef"
      role="tablist"
      :aria-orientation="props.orientation"
      :class="[
        vertical ? 'flex flex-col' : 'flex',
        props.variant === 'segmented'
          ? 'gap-1 rounded-md border border-border/60 p-1' + (vertical ? '' : ' items-center')
          : props.variant === 'underline'
            ? vertical
              ? 'gap-1 pl-3'
              : 'gap-4'
            : 'gap-1',
      ]"
      @keydown="onKeydown"
    >
      <button
        v-for="(t, i) in items"
        :key="t.value"
        :id="`${idBase}-tab-${t.value}`"
        :ref="(el) => setTabRef(el, i)"
        type="button"
        role="tab"
        :aria-selected="t.value === props.modelValue"
        :aria-controls="`${idBase}-panel-${t.value}`"
        :tabindex="t.value === props.modelValue ? 0 : -1"
        :disabled="t.disabled"
        class="relative z-10 flex items-center gap-1.5 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        :class="[
          props.variant === 'underline'
            ? vertical
              ? 'rounded-md px-2 py-1.5 text-left'
              : 'pb-2'
            : 'rounded px-2.5 py-1 text-left',
          t.value === props.modelValue
            ? props.variant === 'segmented'
              ? 'bg-card text-foreground'
              : 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        ]"
        @click="select(t.value)"
      >
        {{ t.label ?? t.value }}
        <span
          v-if="t.badge !== undefined"
          class="rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums"
        >{{ t.badge }}</span>
      </button>
    </div>
    <canvas
      v-if="props.variant !== 'segmented'"
      ref="canvasRef"
      aria-hidden="true"
      class="absolute transition-[left,top,width,height] duration-200 motion-reduce:transition-none"
      :class="props.variant === 'washed' ? 'rounded' : ''"
      :style="{ ...markerStyle, imageRendering: 'pixelated' }"
    />
    <!-- Panels: put DitherTabPanel children here so they inherit the context. -->
    <slot />
  </div>
</template>
