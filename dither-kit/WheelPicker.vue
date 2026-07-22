<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { project, velocityFrom, type VelocitySample } from "./gesture"
import { cssColor } from "./palette"
import { pixelPrefersReducedMotion } from "./pixel"
import type { PixelColor } from "./pixel"
import { cn } from "./lib"

export type WheelOption = string | { value: string; label: string }

const ITEM = 28

/** iOS-style picker wheel — a 3D drum on native momentum scroll that snaps to
 * the nearest notch. Wheel, drag (mouse via gesture projection, touch native)
 * and spinbutton keys all steer it; wheels compose side by side for date and
 * time pickers. Reduced motion flattens the drum and stills the glides. */
const props = withDefaults(
  defineProps<{
    options: WheelOption[]
    modelValue?: string
    /** Visible rows (odd). */
    rows?: number
    /** Accessible name for the wheel. */
    label?: string
    color?: PixelColor
    class?: string
  }>(),
  { rows: 5, label: "Wheel picker", color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const scroller = ref<HTMLElement | null>(null)
const st = ref(0)
const still = pixelPrefersReducedMotion()
let settle: ReturnType<typeof setTimeout> | undefined
let samples: VelocitySample[] = []
let dragging = false
let moved = false

const opts = computed(() => props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)))
const rowCount = computed(() => Math.max(3, props.rows | 1))
const clampIndex = (i: number) => Math.max(0, Math.min(opts.value.length - 1, i))
const index = computed(() => clampIndex(Math.round(st.value / ITEM)))

const styleOf = computed(() => (i: number) => {
  const d = (i * ITEM - st.value) / ITEM
  const opacity = String(Math.max(0.15, 1 - Math.abs(d) * 0.22))
  if (still) return { opacity }
  const a = Math.max(-64, Math.min(64, d * -16))
  return { opacity, transform: `perspective(560px) rotateX(${a}deg)` }
})

function commit() {
  const el = scroller.value
  if (!el || dragging) return
  const i = clampIndex(Math.round(el.scrollTop / ITEM))
  if (Math.abs(el.scrollTop - i * ITEM) > 1) el.scrollTo({ top: i * ITEM, behavior: still ? "auto" : "smooth" })
  el.style.scrollSnapType = ""
  const v = opts.value[i]?.value
  if (v !== undefined && v !== props.modelValue) emit("update:modelValue", v)
}
function onScroll() {
  const el = scroller.value
  if (!el) return
  st.value = el.scrollTop
  clearTimeout(settle)
  settle = setTimeout(commit, 120)
}
function go(i: number) {
  const el = scroller.value
  if (!el) return
  const j = clampIndex(i)
  el.scrollTo({ top: j * ITEM, behavior: still ? "auto" : "smooth" })
  const v = opts.value[j]?.value
  if (v !== undefined && v !== props.modelValue) emit("update:modelValue", v)
}
function onKeydown(e: KeyboardEvent) {
  const step = ({ ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 } as Record<string, number>)[e.key]
  if (step !== undefined) { e.preventDefault(); go(index.value + step); return }
  if (e.key === "Home") { e.preventDefault(); go(0) }
  else if (e.key === "End") { e.preventDefault(); go(opts.value.length - 1) }
}
function onPointerdown(e: PointerEvent) {
  if (e.pointerType !== "mouse" || e.button !== 0) return
  const el = scroller.value
  if (!el) return
  e.preventDefault()
  el.focus()
  el.setPointerCapture(e.pointerId)
  el.style.scrollSnapType = "none"
  dragging = true
  moved = false
  samples = [{ t: e.timeStamp, p: e.clientY }]
}
function onPointermove(e: PointerEvent) {
  if (!dragging) return
  const el = scroller.value
  const prev = samples[samples.length - 1]
  if (!el || !prev) return
  if (Math.abs(e.clientY - samples[0].p) > 4) moved = true
  el.scrollTop -= e.clientY - prev.p
  samples.push({ t: e.timeStamp, p: e.clientY })
  if (samples.length > 6) samples.shift()
}
function onPointerup(e: PointerEvent) {
  if (!dragging || e.pointerType !== "mouse") return
  dragging = false
  const el = scroller.value
  if (!el) return
  const dest = el.scrollTop - project(still ? 0 : velocityFrom(samples))
  go(Math.round(dest / ITEM))
  clearTimeout(settle)
  settle = setTimeout(commit, 120)
}

const indexOfValue = (v: string | undefined) => opts.value.findIndex((o) => o.value === v)
watch(() => props.modelValue, (v) => {
  const i = indexOfValue(v)
  if (i >= 0 && i !== index.value && !dragging) scroller.value?.scrollTo({ top: i * ITEM, behavior: still ? "auto" : "smooth" })
})
onMounted(() => {
  const el = scroller.value
  if (!el) return
  el.scrollTop = Math.max(0, indexOfValue(props.modelValue)) * ITEM
  st.value = el.scrollTop
})
</script>

<template>
  <div :class="cn('relative inline-block', props.class)">
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-7 -translate-y-1/2 rounded-md border-y border-border/70 bg-foreground/[0.04]" />
    <div
      ref="scroller"
      role="spinbutton"
      tabindex="0"
      :aria-label="props.label"
      :aria-valuemin="0"
      :aria-valuemax="opts.length - 1"
      :aria-valuenow="index"
      :aria-valuetext="opts[index]?.label"
      class="snap-y snap-mandatory select-none overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :style="{ height: `${rowCount * ITEM}px`, paddingBlock: `${((rowCount - 1) / 2) * ITEM}px` }"
      @scroll="onScroll"
      @keydown="onKeydown"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
    >
      <div
        v-for="(o, i) in opts"
        :key="o.value"
        aria-hidden="true"
        class="flex h-7 snap-center items-center justify-center px-3 text-[13px] tabular-nums"
        :class="i === index ? 'font-medium' : 'text-muted-foreground/80'"
        :style="{ ...styleOf(i), ...(i === index ? { color: cssColor(props.color) } : {}) }"
        @click="!moved && go(i)"
      >{{ o.label }}</div>
    </div>
  </div>
</template>
