<!-- Generated from ../tailwind/DitherCollapsible.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { rgb } from "../engine/palette"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

const CELL = 2
let uid = 0

/** Paint the 2px left rail — a vertical dither ramp fading downward. */
function paintRail(canvas: HTMLCanvasElement, height: number, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  ctx.clearRect(0, 0, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    ctx.fillStyle = rgb(fill, 1, alpha)
    ctx.fillRect(0, y, 1, 1)
  }
}

const styles = stylex.create({
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 40%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  text: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text2: { rotate: "90deg" },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box: { overflow: "hidden" },
  row: { display: "flex", gap: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.5rem" },
  frame: { position: "relative", width: "2px", alignSelf: "stretch" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  box2: {
    minWidth: "0px",
    flex: "1",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    title: string
    modelValue?: boolean
    color?: PixelColor
  }>(),
  { modelValue: false, color: "blue" },
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
  requestAnimationFrame(() => {
    paint()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(paint)
      if (railRef.value) ro.observe(railRef.value)
    }
  })
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
      v-bind="stylex.attrs(styles.button)"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span>{{ props.title }}</span>
      <span aria-hidden="true" :class="cn(styles.text, props.modelValue ? styles.text2 : null)"> › </span>
    </button>
    <div
      :id="id"
      :inert="!props.modelValue"
      v-bind="stylex.attrs(styles.grid)"
      :style="{ gridTemplateRows: props.modelValue ? '1fr' : '0fr' }"
    >
      <div v-bind="stylex.attrs(styles.box)">
        <div v-bind="stylex.attrs(styles.row)">
          <div v-bind="stylex.attrs(styles.frame)">
            <canvas
              ref="railRef"
              aria-hidden="true"
              v-bind="stylex.attrs(styles.canvas)"
              style="image-rendering: pixelated"
            />
          </div>
          <div v-bind="stylex.attrs(styles.box2)">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
