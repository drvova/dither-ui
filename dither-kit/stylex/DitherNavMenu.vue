<!-- Generated from ../tailwind/DitherNavMenu.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

export type NavMenuItem = { label: string; href?: string }

const CELL = 2

/** Paint the 2px underline — the same horizontal dither ramp as DitherTabs. */
function paintUnderline(
  canvas: HTMLCanvasElement,
  width: number,
  color: PixelColor,
  matrix: number[][] = BAYER4,
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || width <= 0) return
  const cols = Math.max(4, Math.round(width / CELL))
  canvas.width = cols
  canvas.height = 1
  const fill = fillOf(color)
  const px = cellCanvas(ctx, cols, 1)
  for (let x = 0; x < cols; x++) {
    const density = (x + 0.5) / cols
    const lit = density > matrix[0][x & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(x, 0, fill, alpha)
  }
  px.flush()
}

const styles = stylex.create({
  nav: { position: "relative" },
  row: { display: "flex", gap: "1rem" },
  a: {
    paddingBottom: "0.5rem",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 40%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  a2: { color: "var(--foreground)" },
  a3: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  canvas: {
    position: "absolute",
    bottom: "0px",
    height: "2px",
    transitionProperty: { default: "left, width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
})
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    items: NavMenuItem[]
    modelValue: string
    color?: PixelColor
  }>(),
  { color: "blue" },
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
  const active = itemRefs.value[props.items.findIndex((it) => it.label === props.modelValue)]
  if (!active) return
  underline.value = { left: active.offsetLeft, width: active.offsetWidth }
  if (canvasRef.value) paintUnderline(canvasRef.value, active.offsetWidth, props.color)
}

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
  () => [props.modelValue, props.items, props.color],
  () => nextTick(measure),
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <nav v-bind="stylex.attrs(styles.nav)">
    <div ref="listRef" v-bind="stylex.attrs(styles.row)">
      <a
        v-for="(item, i) in props.items"
        :key="item.label"
        :ref="(el) => setItemRef(el, i)"
        :href="item.href ?? '#'"
        :aria-current="item.label === props.modelValue ? 'page' : undefined"
        :class="cn(styles.a, item.label === props.modelValue ? styles.a2 : styles.a3)"
        @click.prevent="emit('update:modelValue', item.label)"
      >
        {{ item.label }}
      </a>
    </div>
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas)"
      :style="{
        left: underline.left + 'px',
        width: underline.width + 'px',
        imageRendering: 'pixelated',
      }"
    />
  </nav>
</template>
