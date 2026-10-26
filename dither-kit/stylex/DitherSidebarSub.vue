<!-- Generated from ../tailwind/DitherSidebarSub.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

let counter = 0

const styles = stylex.create({
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    borderRadius: "var(--radius)",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  button2: { height: "1.75rem", gap: "0.5rem", paddingInline: "0.5rem", fontSize: "11px" },
  button3: { height: "2rem", gap: "0.625rem", paddingInline: "0.625rem", fontSize: "12px" },
  grid: { display: "grid", width: "1rem", height: "1rem", flexShrink: "0", placeItems: "center" },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "70%",
  },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
    fontSize: "11px",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text4: { rotate: "90deg" },
  grid2: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box: { gridTemplateRows: "1fr" },
  box2: { gridTemplateRows: "0fr" },
  box3: { overflow: "hidden" },
  grid3: {
    marginLeft: "1.125rem",
    display: "grid",
    gap: "0.125rem",
    borderLeftStyle: "solid",
    borderLeftWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingBlock: "0.125rem",
    paddingLeft: "0.375rem",
  },
})
</script>

<script setup lang="ts">
import { inject, ref } from "vue"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar.vue"
import { cn } from "./lib"

/** Collapsible sub-menu: a parent row plus indented children behind a rail.
 * On the icon rail only the parent icon remains (children need the width). */
const props = withDefaults(
  defineProps<{
    label: string
    /** Open state (v-model). */
    modelValue?: boolean
  }>(),
  { modelValue: false },
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
const compact = inject(SIDEBAR_COMPACT, ref(false))
const id = `dk-sidebar-sub-${counter++}`
</script>

<template>
  <div>
    <button
      type="button"
      :aria-expanded="props.modelValue"
      :aria-controls="id"
      :title="collapsed ? props.label : undefined"
      :class="cn(styles.button, compact ? styles.button2 : styles.button3)"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span v-bind="stylex.attrs(styles.grid)" aria-hidden="true">
        <slot name="icon">
          <span v-bind="stylex.attrs(styles.text)" />
        </slot>
      </span>
      <span v-if="!collapsed" v-bind="stylex.attrs(styles.text2)">{{ props.label }}</span>
      <span v-if="!collapsed" aria-hidden="true" :class="cn(styles.text3, props.modelValue ? styles.text4 : null)"
        >›</span
      >
    </button>
    <div v-if="!collapsed" :id="id" :class="cn(styles.grid2, props.modelValue ? styles.box : styles.box2)">
      <div v-bind="stylex.attrs(styles.box3)" :inert="!props.modelValue">
        <div v-bind="stylex.attrs(styles.grid3)">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
