<!-- Generated from ../tailwind/DitherTabs.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import type { InjectionKey, Ref } from "vue"
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf, pixelMatrixFromSeed, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

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
function paintUnderline(
  canvas: HTMLCanvasElement,
  length: number,
  color: PixelColor,
  vertical: boolean,
  matrix: number[][],
) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || length <= 0) return
  const cells = Math.max(4, Math.round(length / CELL))
  canvas.width = vertical ? 1 : cells
  canvas.height = vertical ? cells : 1
  const fill = fillOf(color)
  const px = cellCanvas(ctx, canvas.width, canvas.height)
  for (let i = 0; i < cells; i++) {
    const density = (i + 0.5) / cells
    const lit = density > matrix[0][i & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    if (vertical) px.cell(0, i, fill, alpha)
    else px.cell(i, 0, fill, alpha)
  }
  px.flush()
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
  const px = cellCanvas(ctx, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = 0.2 + 0.5 * ((y + 0.5) / rows)
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      px.cell(x, y, fill, lit ? 0.32 : 0.08)
    }
  }
  // The rule along the foot, over the wash.
  px.rect(0, rows - 1, cols, 1, fill, 0.5)
  px.flush()
}

const styles = stylex.create({
  frame: { position: "relative" },
  flex: { display: "flex", gap: "1rem" },
  relative: { position: "relative", display: "flex", flexDirection: "column" },
  relative2: { position: "relative", display: "flex" },
  gap1: {
    gap: "0.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "0.25rem",
  },
  itemsCenter: { alignItems: "center" },
  gap12: { gap: "0.25rem", paddingLeft: "0.75rem" },
  gap4: { gap: "1rem" },
  gap13: { gap: "0.25rem" },
  button: {
    position: "relative",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
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
  roundedMd: {
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
  },
  pb2: { paddingBottom: "0.5rem" },
  rounded: { borderRadius: "0.25rem", paddingInline: "0.625rem", paddingBlock: "0.25rem", textAlign: "left" },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  text: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  canvas: {
    position: "absolute",
    transitionProperty: { default: "left, top, width, height", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  canvas2: { borderRadius: "0.25rem" },
})
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, toRef, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { kitFromSeed } from "../engine/dither-paint"

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
    xstyle?: StyleProp
  }>(),
  { variant: "underline", orientation: "horizontal" },
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const effColor = computed(() => props.color ?? s.value?.hue ?? "blue")
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))

const idBase = `dk-tabs-${counter++}`
provide(TABS_CTX, { active: toRef(props, "modelValue"), idBase })

const items = computed<TabItem[]>(() => props.tabs.map((t) => (typeof t === "string" ? { value: t } : t)))
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
  else
    paintUnderline(
      canvas,
      vertical.value ? btn.offsetHeight : btn.offsetWidth,
      effColor.value,
      vertical.value,
      matrix.value,
    )
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
    : // On the tab's own floor, not the container's: panels nest inside it.
      {
        left: `${marker.value.left}px`,
        top: `${marker.value.top + marker.value.height - 2}px`,
        width: `${marker.value.width}px`,
        height: "2px",
      }
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
  () => nextTick(measure),
)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div :class="cn(styles.frame, vertical ? styles.flex : null, props.xstyle, props.class)">
    <div
      ref="listRef"
      role="tablist"
      :aria-orientation="props.orientation"
      :class="
        cn([
          vertical ? styles.relative : styles.relative2,
          props.variant === 'segmented'
            ? [styles.gap1, !vertical && styles.itemsCenter]
            : props.variant === 'underline'
              ? vertical
                ? styles.gap12
                : styles.gap4
              : styles.gap13,
        ])
      "
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
        :class="
          cn(styles.button, [
            props.variant === 'underline' ? (vertical ? styles.roundedMd : styles.pb2) : styles.rounded,
            t.value === props.modelValue
              ? props.variant === 'segmented'
                ? styles.bgCard
                : styles.textForeground
              : styles.textMutedForeground,
          ])
        "
        @click="select(t.value)"
      >
        {{ t.label ?? t.value }}
        <span v-if="t.badge !== undefined" v-bind="stylex.attrs(styles.text)">{{ t.badge }}</span>
      </button>
      <!-- The marker lives in the list, so a list that scrolls (more tabs
           than width) carries it with its tab and clips it at its edges. -->
      <canvas
        v-if="props.variant !== 'segmented'"
        ref="canvasRef"
        aria-hidden="true"
        :class="cn(styles.canvas, props.variant === 'washed' ? styles.canvas2 : null)"
        :style="{ ...markerStyle, imageRendering: 'pixelated' }"
      />
    </div>
    <!-- Panels: put DitherTabPanel children here so they inherit the context. -->
    <slot />
  </div>
</template>
