<!-- Generated from ../tailwind/DitherAccordion.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

export type AccordionItem = { value: string; title: string }

const CELL = 2
let uid = 0

/** Paint the 2px left rail — a vertical dither ramp fading downward,
 * the same recipe as DitherCollapsible. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const height = canvas.offsetHeight
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(0, y, fill, alpha)
  }
  px.flush()
}

const styles = stylex.create({
  box: {
    borderTopStyle: { default: "solid", ":first-child": "solid" },
    borderTopWidth: { default: "1px", ":first-child": "0px" },
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
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
  box2: { overflow: "hidden" },
  row: { display: "flex", gap: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.5rem" },
  frame: { position: "relative", width: "2px", alignSelf: "stretch" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  box3: {
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
    items: AccordionItem[]
    modelValue: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
  }>(),
  { type: "single", color: "blue" },
)
const emit = defineEmits<{ "update:modelValue": [value: string | string[]] }>()

const id = `dither-accordion-${++uid}`
const rails = ref<HTMLCanvasElement[]>([])

function setRail(el: unknown, i: number) {
  if (el instanceof HTMLCanvasElement) rails.value[i] = el
}

function isOpen(value: string): boolean {
  return Array.isArray(props.modelValue) ? props.modelValue.includes(value) : props.modelValue === value
}

function toggle(value: string) {
  if (props.type === "single") {
    emit("update:modelValue", isOpen(value) ? "" : value)
    return
  }
  const open = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []
  emit("update:modelValue", isOpen(value) ? open.filter((v) => v !== value) : [...open, value])
}

function paintAll() {
  for (const canvas of rails.value) if (canvas) paintRail(canvas, props.color)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  requestAnimationFrame(() => {
    paintAll()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) paintRail(entry.target as HTMLCanvasElement, props.color)
      })
      for (const canvas of rails.value) if (canvas) ro.observe(canvas)
    }
  })
})
watch(() => props.color, paintAll)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div>
    <div v-for="(item, i) in props.items" :key="item.value" v-bind="stylex.attrs(styles.box)">
      <button
        type="button"
        :aria-expanded="isOpen(item.value)"
        :aria-controls="`${id}-${i}`"
        v-bind="stylex.attrs(styles.button)"
        @click="toggle(item.value)"
      >
        <span>{{ item.title }}</span>
        <span aria-hidden="true" :class="cn(styles.text, isOpen(item.value) ? styles.text2 : null)"> › </span>
      </button>
      <div
        :id="`${id}-${i}`"
        :inert="!isOpen(item.value)"
        v-bind="stylex.attrs(styles.grid)"
        :style="{ gridTemplateRows: isOpen(item.value) ? '1fr' : '0fr' }"
      >
        <div v-bind="stylex.attrs(styles.box2)">
          <div v-bind="stylex.attrs(styles.row)">
            <div v-bind="stylex.attrs(styles.frame)">
              <canvas
                :ref="(el) => setRail(el, i)"
                aria-hidden="true"
                v-bind="stylex.attrs(styles.canvas)"
                style="image-rendering: pixelated"
              />
            </div>
            <div v-bind="stylex.attrs(styles.box3)">
              <slot :name="item.value" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
