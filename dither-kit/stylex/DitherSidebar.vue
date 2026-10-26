<!-- Generated from ../tailwind/DitherSidebar.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import type { InjectionKey, Ref } from "vue"
import * as stylex from "@stylexjs/stylex"

export type SidebarVariant = "default" | "floating" | "inset" | "washed"
export type SidebarCollapse = "rail" | "hide" | "none"
export type SidebarDensity = "default" | "compact"

/** True while the sidebar is showing its icon rail — items fold their labels. */
export const SIDEBAR_COLLAPSED: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar")
/** True when the sidebar asked its items for compact rows. */
export const SIDEBAR_COMPACT: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar-density")

const styles = stylex.create({
  aside: {
    display: "flex",
    height: "100%",
    flexShrink: "0",
    flexDirection: "column",
    padding: "0.5rem",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  gradient: { zIndex: "-10" },
  nav: {
    marginTop: "0.5rem",
    display: "grid",
    minHeight: "0px",
    flex: "1",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflowY: "auto",
  },
  button: {
    marginTop: "0.5rem",
    display: "flex",
    height: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--card)" } },
  },
  text: { fontSize: "13px" },
  width: { width: "0px", overflow: "hidden", borderColor: "transparent", padding: "0px" },
  width2: { width: "3.5rem" },
  width3: { width: "14rem" },
  chrome: {
    margin: "0.5rem",
    height: "calc(100% - 1rem)",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 50%, transparent)",
  },
  chrome2: { backgroundColor: "transparent" },
  chrome3: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  chrome4: {
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  borderL: { borderLeftStyle: "solid", borderLeftWidth: "1px" },
  borderR: { borderRightStyle: "solid", borderRightWidth: "1px" },
})
</script>

<script setup lang="ts">
import { computed, provide } from "vue"
import DitherGradient from "./DitherGradient.vue"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    /** Collapsed state (v-model). Meaning depends on `collapse` mode. */
    modelValue?: boolean
    label?: string
    /** default: edge panel · floating: detached card · inset: bare · washed: dither gradient chrome. */
    variant?: SidebarVariant
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    /** rail: folds to icons · hide: folds away entirely · none: no toggle. */
    collapse?: SidebarCollapse
    /** compact tightens rows — dense trees, inspector panels. */
    density?: SidebarDensity
    /** Hide the built-in rail toggle (permanent rail: collapse="rail" + :model-value="true"). */
    toggle?: boolean
    /** Wash color for variant="washed". */
    washColor?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  {
    modelValue: false,
    label: "Sidebar",
    variant: "default",
    side: "left",
    collapse: "rail",
    density: "default",
    toggle: true,
    washColor: "blue",
  },
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

/** Items only fold labels in rail mode — a hidden sidebar keeps full labels. */
const railCollapsed = computed(() => props.collapse === "rail" && props.modelValue)
provide(SIDEBAR_COLLAPSED, railCollapsed)
provide(
  SIDEBAR_COMPACT,
  computed(() => props.density === "compact"),
)

const hidden = computed(() => props.collapse === "hide" && props.modelValue)

const width = computed(() => {
  if (hidden.value) return styles.width
  if (railCollapsed.value) return styles.width2
  return styles.width3
})

const chrome = computed(() => {
  if (props.variant === "floating") return styles.chrome
  if (props.variant === "inset") return styles.chrome2
  const edge = props.side === "right" ? styles.borderL : styles.borderR
  if (props.variant === "washed") return [styles.chrome3, edge]
  return [edge, styles.chrome4]
})
</script>

<template>
  <aside :aria-label="props.label" :class="cn(styles.aside, chrome, width, props.xstyle, props.class)">
    <DitherGradient
      v-if="props.variant === 'washed' && !hidden"
      :from="props.washColor"
      to="transparent"
      direction="up"
      :opacity="0.12"
      :cell="4"
      :xstyle="styles.gradient"
    />
    <slot name="header" />
    <nav v-bind="stylex.attrs(styles.nav)">
      <slot />
    </nav>
    <slot name="footer" />
    <button
      v-if="props.collapse === 'rail' && props.toggle"
      type="button"
      v-bind="stylex.attrs(styles.button)"
      :aria-label="railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :aria-expanded="!railCollapsed"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span v-bind="stylex.attrs(styles.text)" aria-hidden="true">{{
        railCollapsed ? (props.side === "right" ? "‹" : "›") : props.side === "right" ? "›" : "‹"
      }}</span>
    </button>
  </aside>
</template>
