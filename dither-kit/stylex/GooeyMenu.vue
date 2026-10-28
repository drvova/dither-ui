<!-- Generated from ../tailwind/GooeyMenu.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type GooeyItem = { value: string; label: string; color?: PixelColor }
let gooeyCount = 0

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  svg: { position: "absolute", width: "0px", height: "0px" },
  button: {
    position: "absolute",
    top: "0px",
    left: "0px",
    display: "grid",
    width: "2.75rem",
    height: "2.75rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    transitionProperty: { default: "transform, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  opacity100: { opacity: "100%" },
  pointerEventsNone: { pointerEvents: "none", opacity: "0%" },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  button2: {
    position: "relative",
    display: "grid",
    width: "2.75rem",
    height: "2.75rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
  },
  text2: {
    fontSize: "15px",
    lineHeight: "1",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  text3: { rotate: "45deg" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Action buttons that melt out of one trigger — the classic SVG goo filter
 * (blur + alpha contrast) fuses the circles while they travel. Reduced
 * motion drops the travel; items simply appear. */
const props = withDefaults(
  defineProps<{
    items: GooeyItem[]
    /** Expanded state (v-model). */
    modelValue?: boolean
    direction?: "up" | "down" | "left" | "right"
    /** Gap between item centers, px. */
    spacing?: number
    label?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: false, direction: "up", spacing: 52, label: "Actions" },
)
const emit = defineEmits<{ "update:modelValue": [boolean]; select: [value: string] }>()

const id = `dk-goo-${gooeyCount++}`
const VEC: Record<"up" | "down" | "left" | "right", [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
const offset = computed(() => (i: number) => {
  if (!props.modelValue) return "translate(0px, 0px)"
  const [vx, vy] = VEC[props.direction]
  const d = props.spacing * (i + 1)
  return `translate(${vx * d}px, ${vy * d}px)`
})
function pick(value: string) {
  emit("select", value)
  emit("update:modelValue", false)
}
</script>

<template>
  <div :class="cn(styles.frame, props.xstyle, props.class)" @keydown.escape="emit('update:modelValue', false)">
    <svg v-bind="stylex.attrs(styles.svg)" aria-hidden="true">
      <defs>
        <filter :id="id">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
    <div :style="{ filter: `url(#${id})` }">
      <button
        v-for="(it, i) in props.items"
        :key="it.value"
        type="button"
        :aria-label="it.label"
        :title="it.label"
        :tabindex="props.modelValue ? 0 : -1"
        :class="cn(styles.button, CONTROL_BUTTON, props.modelValue ? styles.opacity100 : styles.pointerEventsNone)"
        :style="{ transform: offset(i), transitionDelay: props.modelValue ? `${i * 40}ms` : '0ms' }"
        @click="pick(it.value)"
      >
        <span
          aria-hidden="true"
          v-bind="stylex.attrs(styles.text)"
          :style="{ background: cssColor(it.color ?? 'blue') }"
        />
      </button>
      <button
        type="button"
        :aria-label="props.label"
        :aria-expanded="props.modelValue"
        :class="cn(styles.button2, CONTROL_BUTTON)"
        @click="emit('update:modelValue', !props.modelValue)"
      >
        <span aria-hidden="true" :class="cn(styles.text2, props.modelValue ? styles.text3 : null)">+</span>
      </button>
    </div>
  </div>
</template>
