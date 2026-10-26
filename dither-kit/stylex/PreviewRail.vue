<!-- Generated from ../tailwind/PreviewRail.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  nav: {
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    gap: "0.25rem",
    paddingBlock: "0.25rem",
  },
  button: {
    display: "flex",
    height: "1rem",
    width: "2.25rem",
    alignItems: "center",
    borderRadius: "var(--radius)",
    paddingInline: "0.25rem",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  justifyEnd: { justifyContent: "flex-end" },
  justifyStart: { justifyContent: "flex-start" },
  text: {
    height: "0.125rem",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    zIndex: "10",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    whiteSpace: "nowrap",
    transitionProperty: { default: "top", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  rightFull: { right: "100%", marginRight: "0.5rem" },
  leftFull: { left: "100%", marginLeft: "0.5rem" },
  box: { fontSize: "12px", fontWeight: "500", color: "var(--foreground)" },
  p: { marginTop: "0.125rem", fontSize: "11px", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { POPOVER } from "./control"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import type { PixelColor } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"

export type PreviewRailItem = { value: string; label: string; hint?: string; color?: PixelColor }

/** Codex-style navigation rail — compact ticks swell into a pyramid around
 * the pointer and float a destination preview beside the hovered or focused
 * tick. Reduced motion keeps the ticks still; the preview remains. */
const props = withDefaults(
  defineProps<{
    items: PreviewRailItem[]
    modelValue?: string
    /** Pyramid falloff radius in px. */
    range?: number
    /** Screen edge the rail hugs; the preview floats toward the other side. */
    side?: "left" | "right"
    class?: string
    xstyle?: StyleProp
  }>(),
  { range: 56, side: "left" },
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const rail = ref<HTMLElement | null>(null)
const py = ref<number | null>(null)
const focusIndex = ref<number | null>(null)
const still = pixelPrefersReducedMotion()

function track(e: PointerEvent) {
  const r = rail.value?.getBoundingClientRect()
  if (r) py.value = e.clientY - r.top
}
function onFocusin(e: FocusEvent) {
  const b = (e.target as HTMLElement).closest("button")
  focusIndex.value = b ? Number(b.dataset.i) : null
}

const centerOf = (i: number) => {
  const b = rail.value?.querySelectorAll("button")[i] as HTMLElement | undefined
  return b ? b.offsetTop + b.offsetHeight / 2 : null
}
const widthOf = computed(() => (i: number) => {
  const rest = props.items[i]?.value === props.modelValue ? 16 : 10
  if (still || py.value === null) return rest
  const c = centerOf(i)
  const w = c === null ? 0 : Math.max(0, 1 - Math.abs(py.value - c) / props.range)
  return rest + 16 * w
})
const previewIndex = computed(() => {
  if (focusIndex.value !== null) return focusIndex.value
  if (py.value === null) return null
  let best: number | null = null
  let bd = Infinity
  for (let i = 0; i < props.items.length; i++) {
    const c = centerOf(i)
    if (c === null) continue
    const d = Math.abs(py.value - c)
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return best
})
const preview = computed(() => (previewIndex.value === null ? null : (props.items[previewIndex.value] ?? null)))
const previewTop = computed(() => (previewIndex.value === null ? 0 : (centerOf(previewIndex.value) ?? 0)))
</script>

<template>
  <nav
    ref="rail"
    :class="cn(styles.nav, props.xstyle, props.class)"
    aria-label="Preview rail"
    @pointermove="track"
    @pointerleave="py = null"
    @focusin="onFocusin"
    @focusout="focusIndex = null"
  >
    <button
      v-for="(it, i) in props.items"
      :key="it.value"
      type="button"
      :data-i="i"
      :aria-label="it.hint ? `${it.label} — ${it.hint}` : it.label"
      :aria-current="it.value === props.modelValue ? 'page' : undefined"
      :class="cn(styles.button, props.side === 'right' ? styles.justifyEnd : styles.justifyStart)"
      @click="emit('update:modelValue', it.value)"
    >
      <span
        aria-hidden="true"
        v-bind="stylex.attrs(styles.text)"
        :style="{
          width: `${widthOf(i)}px`,
          ...(it.value === props.modelValue ? { background: cssColor(it.color ?? 'blue') } : {}),
        }"
      />
    </button>
    <div
      v-if="preview"
      aria-hidden="true"
      :class="cn(POPOVER, styles.layer, props.side === 'right' ? styles.rightFull : styles.leftFull)"
      :style="{ top: `${previewTop}px`, transform: 'translateY(-50%)' }"
    >
      <slot name="preview" :item="preview">
        <div v-bind="stylex.attrs(styles.box)">{{ preview.label }}</div>
        <p v-if="preview.hint" v-bind="stylex.attrs(styles.p)">{{ preview.hint }}</p>
      </slot>
    </div>
  </nav>
</template>
