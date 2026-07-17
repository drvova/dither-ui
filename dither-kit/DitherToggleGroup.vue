<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
import { paintToggleCanvas } from "./DitherToggle.vue"
import { cn } from "./lib"
import { fillOf, type PixelColor } from "./pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
    class?: string
  }>(),
  { type: "single", color: "blue" }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[]): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const btnRefs = ref<HTMLButtonElement[]>([])
const canvasRefs = ref<HTMLCanvasElement[]>([])
let ro: ResizeObserver | null = null

function setBtnRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) btnRefs.value[i] = el
}
function setCanvasRef(el: unknown, i: number) {
  if (el instanceof HTMLCanvasElement) canvasRefs.value[i] = el
}

function isOn(o: Option): boolean {
  return Array.isArray(props.modelValue)
    ? props.modelValue.includes(o.value)
    : props.modelValue === o.value
}

const activeIndex = computed(() => {
  if (Array.isArray(props.modelValue)) return 0
  const i = props.options.findIndex((o) => o.value === props.modelValue)
  return i >= 0 ? i : 0
})

function pick(o: Option) {
  if (o.disabled) return
  if (props.type === "multiple") {
    const cur = Array.isArray(props.modelValue) ? props.modelValue : []
    emit(
      "update:modelValue",
      cur.includes(o.value)
        ? cur.filter((v) => v !== o.value)
        : [...cur, o.value]
    )
  } else {
    emit("update:modelValue", o.value)
  }
}

function paintAll() {
  const fill = fillOf(props.color)
  props.options.forEach((o, i) => {
    const btn = btnRefs.value[i]
    const canvas = canvasRefs.value[i]
    if (!btn || !canvas || !isOn(o)) return
    paintToggleCanvas(btn, canvas, fill)
  })
}

function onKeydown(e: KeyboardEvent) {
  if (props.type !== "single") return
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

onMounted(() => {
  // Defer to rAF to avoid forced reflow from getBoundingClientRect()
  // inside paintToggleCanvas during Vue's flushJobs.
  requestAnimationFrame(paintAll)
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => requestAnimationFrame(paintAll))
    if (rootRef.value) ro.observe(rootRef.value)
  }
})
watch(
  () => [props.modelValue, props.color, props.options],
  () => requestAnimationFrame(paintAll)
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="rootRef"
    :role="props.type === 'single' ? 'radiogroup' : 'group'"
    :class="cn('inline-flex gap-1 rounded-md border border-border/60 p-1', props.class)"
    @keydown="onKeydown"
  >
    <button
      v-for="(o, i) in props.options"
      :key="o.value"
      :ref="(el) => setBtnRef(el, i)"
      type="button"
      :role="props.type === 'single' ? 'radio' : undefined"
      :aria-checked="props.type === 'single' ? isOn(o) : undefined"
      :aria-pressed="props.type === 'multiple' ? isOn(o) : undefined"
      :tabindex="props.type === 'single' ? (i === activeIndex ? 0 : -1) : undefined"
      :disabled="o.disabled"
      class="relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      :class="
        isOn(o)
          ? 'border-transparent text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      "
      @click="pick(o)"
    >
      <canvas
        v-show="isOn(o)"
        :ref="(el) => setCanvasRef(el, i)"
        aria-hidden="true"
        class="absolute inset-0 -z-10 h-full w-full"
        style="image-rendering: pixelated"
      />
      <span class="relative">{{ o.label }}</span>
    </button>
  </div>
</template>
