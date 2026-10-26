<!-- Generated from ../tailwind/Dock.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    alignItems: "flex-end",
    gap: "0.375rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
  },
  button: {
    display: "grid",
    width: "2.25rem",
    height: "2.25rem",
    transformOrigin: "bottom",
    placeItems: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--card) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--card)" },
    },
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
    willChange: "transform",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

export type DockItem = { value: string; label: string; color?: PixelColor }

/** Hover-magnifying dock — items swell on a gaussian falloff around the
 * pointer and settle when it leaves. Reduced motion keeps the row still and
 * marks hover by color alone. */
const props = withDefaults(
  defineProps<{
    items: DockItem[]
    /** Peak scale over the pointer. */
    magnify?: number
    /** Falloff radius in px. */
    range?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { magnify: 1.7, range: 80 },
)
const emit = defineEmits<{ select: [value: string] }>()

const px = ref<number | null>(null)
const bar = ref<HTMLDivElement | null>(null)
const still = pixelPrefersReducedMotion()

function track(e: PointerEvent) {
  if (still) return
  const r = bar.value?.getBoundingClientRect()
  if (r) px.value = e.clientX - r.left
}

const scaleOf = computed(() => (i: number) => {
  if (px.value === null || !bar.value) return 1
  const buttons = bar.value.querySelectorAll("button")
  const b = buttons[i] as HTMLElement | undefined
  if (!b) return 1
  const center = b.offsetLeft + b.offsetWidth / 2
  const d = Math.abs(px.value - center)
  const g = Math.exp(-(d * d) / (2 * props.range * props.range))
  return 1 + (props.magnify - 1) * g
})
</script>

<template>
  <div
    ref="bar"
    :class="cn(styles.row, props.xstyle, props.class)"
    role="group"
    aria-label="Dock"
    @pointermove="track"
    @pointerleave="px = null"
  >
    <button
      v-for="(it, i) in props.items"
      :key="it.value"
      type="button"
      :aria-label="it.label"
      :title="it.label"
      v-bind="stylex.attrs(styles.button)"
      :style="{ transform: `scale(${scaleOf(i)})` }"
      @click="emit('select', it.value)"
    >
      <span
        aria-hidden="true"
        v-bind="stylex.attrs(styles.text)"
        :style="{ background: cssColor(it.color ?? 'blue') }"
      />
    </button>
  </div>
</template>
