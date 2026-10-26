<!-- Generated from ../tailwind/DitherToggleGroup.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    gap: "0.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "0.25rem",
  },
  button: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 40%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  button2: { borderColor: "transparent", color: "var(--foreground)" },
  button3: {
    borderColor: "transparent",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  frame: { position: "relative" },
})
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
import { paintToggleCanvas } from "./DitherToggle.vue"
import { cn, type StyleProp } from "./lib"
import { fillOf, type PixelColor } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  { type: "single", color: "blue" },
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
  return Array.isArray(props.modelValue) ? props.modelValue.includes(o.value) : props.modelValue === o.value
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
    emit("update:modelValue", cur.includes(o.value) ? cur.filter((v) => v !== o.value) : [...cur, o.value])
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
  () => requestAnimationFrame(paintAll),
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="rootRef"
    :role="props.type === 'single' ? 'radiogroup' : 'group'"
    :class="cn(styles.row, props.xstyle, props.class)"
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
      :class="cn(styles.button, isOn(o) ? styles.button2 : styles.button3)"
      @click="pick(o)"
    >
      <canvas
        v-show="isOn(o)"
        :ref="(el) => setCanvasRef(el, i)"
        aria-hidden="true"
        v-bind="stylex.attrs(styles.canvas)"
        style="image-rendering: pixelated"
      />
      <span v-bind="stylex.attrs(styles.frame)">{{ o.label }}</span>
    </button>
  </div>
</template>
