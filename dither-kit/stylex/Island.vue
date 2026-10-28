<!-- Generated from ../tailwind/Island.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    display: "inline-block",
    overflow: "hidden",
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 80%, transparent)",
    fontFamily: "var(--font-mono)",
  },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    paddingInline: "0.875rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "12px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 40%, transparent)",
      },
    },
  },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "calc(infinity * 1px)",
    animation: { default: null, "@media (prefers-reduced-motion: reduce)": "none" },
  },
  text2: { animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
  text3: {
    marginLeft: "auto",
    paddingLeft: "0.75rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text4: { rotate: "180deg" },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box2: { minHeight: "0px", overflow: "hidden" },
  box3: {
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
    paddingInline: "0.875rem",
    paddingBlock: "0.625rem",
    fontSize: "11px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { cssColor } from "../engine/palette"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Morphing status pill — a compact row that stays visible while the detail
 * panel unfolds beneath it through the house 0fr -> 1fr grid trick. Escape
 * collapses; reduced motion snaps. */
const props = withDefaults(
  defineProps<{
    /** Expanded state (v-model). */
    modelValue?: boolean
    label?: string
    color?: PixelColor
    /** Pulse the status dot while collapsed. */
    live?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: false, label: "Status", color: "green", live: true },
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()
</script>

<template>
  <div :class="cn(styles.box, props.xstyle, props.class)" @keydown.escape="emit('update:modelValue', false)">
    <button
      type="button"
      v-bind="stylex.attrs(styles.button)"
      :aria-expanded="props.modelValue"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span
        aria-hidden="true"
        :class="cn(styles.text, props.live && !props.modelValue ? styles.text2 : null)"
        :style="{ background: cssColor(props.color) }"
      />
      <slot name="compact">{{ props.label }}</slot>
      <span aria-hidden="true" :class="cn(styles.text3, props.modelValue ? styles.text4 : null)">▾</span>
    </button>
    <div v-bind="stylex.attrs(styles.grid)" :style="{ gridTemplateRows: props.modelValue ? '1fr' : '0fr' }">
      <div v-bind="stylex.attrs(styles.box2)" :inert="!props.modelValue">
        <div v-bind="stylex.attrs(styles.box3)">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
