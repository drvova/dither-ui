<!-- Generated from ../tailwind/NotificationStack.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type NotificationItem = {
  id: string
  title: string
  body?: string
  time?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
}

const CARD = 64
const GAP = 8

/** Collapsed silhouettes — one expansion mechanism, three summaries. */
const VARIANTS = {
  stack: { peek: 10, origin: "50% 0%", at: (i: number) => `translateY(${i * 10}px) scale(${1 - i * 0.04})` },
  fan: {
    peek: 7,
    origin: "50% 130%",
    at: (i: number) => `translateY(${i * 7}px) rotate(${(i % 2 ? -1 : 1) * i * 2.2}deg) scale(${1 - i * 0.03})`,
  },
  condensed: { peek: 4, origin: "50% 0%", at: (i: number) => `translateY(${i * 4}px) scale(${1 - i * 0.07})` },
} as const
export type NotificationStackVariant = keyof typeof VARIANTS

const styles = stylex.create({
  box: { width: "18rem", fontFamily: "var(--font-mono)", WebkitUserSelect: "none", userSelect: "none" },
  row: {
    display: "flex",
    height: "1.75rem",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingInline: "0.25rem",
  },
  row2: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
  text: {
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.375rem",
    fontSize: "9px",
    fontVariantNumeric: "   tabular-nums ",
  },
  button: {
    borderRadius: "var(--radius)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  row3: {
    display: "flex",
    height: "4rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  frame: {
    position: "relative",
    transitionProperty: { default: "height", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  component: {
    position: "absolute",
    insetInline: "0px",
    top: "0px",
    display: "flex",
    height: "4rem",
    alignItems: "center",
    gap: "0.625rem",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.75rem",
    textAlign: "left",
    transitionProperty: { default: "transform, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    fontSize: "13px",
  },
  text2: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  text3: { minWidth: "0px", flex: "1" },
  row4: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" },
  text4: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12px",
    color: "var(--foreground)",
  },
  text5: { flexShrink: "0", fontSize: "9px", color: "var(--muted-foreground)" },
  text6: {
    marginTop: "0.125rem",
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Compact notification cards that spring from a stacked summary into a
 * readable list on hover, focus or tap — tap pins the list open (v-model),
 * hover and focus expand transiently. Three collapsed silhouettes share one
 * expansion: stack (peeked edges), fan (rotated hand), condensed (tight
 * slivers). Cards fan out on the house bouncy bezier with a per-card
 * stagger; reduced motion snaps. */
const props = withDefaults(
  defineProps<{
    items: NotificationItem[]
    /** Pinned-open state (v-model); hover and focus expand transiently. */
    modelValue?: boolean
    maxVisible?: number
    collapsedLabel?: string
    expandedLabel?: string
    emptyLabel?: string
    variant?: NotificationStackVariant
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  {
    modelValue: false,
    maxVisible: 3,
    collapsedLabel: "Notifications",
    expandedLabel: "View all",
    emptyLabel: "All caught up",
    variant: "stack",
    color: "blue",
  },
)
const emit = defineEmits<{ "update:modelValue": [expanded: boolean]; viewall: [] }>()

const hovering = ref(false)
const focused = ref(false)
const visible = computed(() => props.items.slice(0, Math.max(1, props.maxVisible)))
const expanded = computed(() => props.modelValue || hovering.value || focused.value)
const height = computed(() => {
  const n = visible.value.length
  if (!n) return CARD
  return expanded.value ? n * (CARD + GAP) - GAP : CARD + (n - 1) * VARIANTS[props.variant].peek
})
const cardStyle = computed(() => (i: number) => ({
  transform: expanded.value ? `translateY(${i * (CARD + GAP)}px)` : VARIANTS[props.variant].at(i),
  transformOrigin: expanded.value ? "50% 0%" : VARIANTS[props.variant].origin,
  opacity: expanded.value ? 1 : String(Math.max(0.35, 1 - i * 0.25)),
  zIndex: String(visible.value.length - i),
  transitionDelay: `${(expanded.value ? i : visible.value.length - 1 - i) * 40}ms`,
}))
</script>

<template>
  <div
    :class="cn(styles.box, props.xstyle, props.class)"
    role="group"
    :aria-label="props.collapsedLabel"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <div v-bind="stylex.attrs(styles.row)">
      <span v-bind="stylex.attrs(styles.row2)">
        {{ props.collapsedLabel }}
        <span v-if="props.items.length" v-bind="stylex.attrs(styles.text)">{{ props.items.length }}</span>
      </span>
      <Transition name="dk-ns-fade">
        <button
          v-if="expanded && props.items.length > 0"
          type="button"
          :class="cn(CONTROL_BUTTON, styles.button)"
          @click="emit('viewall')"
        >
          {{ props.expandedLabel }} →
        </button>
      </Transition>
    </div>

    <div v-if="!visible.length" v-bind="stylex.attrs(styles.row3)">
      {{ props.emptyLabel }}
    </div>

    <div
      v-else
      v-bind="stylex.attrs(styles.frame)"
      :style="{ height: `${height}px`, transitionTimingFunction: 'cubic-bezier(0.2, 1.4, 0.4, 1)' }"
    >
      <component
        :is="i === 0 ? 'button' : 'div'"
        v-for="(item, i) in visible"
        :key="item.id"
        v-bind="
          i === 0 ? { type: 'button', 'aria-expanded': props.modelValue, 'aria-label': props.collapsedLabel } : {}
        "
        :class="cn(styles.component, i === 0 ? CONTROL_BUTTON : null)"
        :style="{ ...cardStyle(i), transitionTimingFunction: 'cubic-bezier(0.2, 1.4, 0.4, 1)' }"
        :aria-hidden="i > 0 && !expanded ? 'true' : undefined"
        @click="i === 0 && emit('update:modelValue', !props.modelValue)"
      >
        <span
          aria-hidden="true"
          v-bind="stylex.attrs(styles.grid)"
          :style="{ color: cssColor(item.color ?? props.color) }"
        >
          <template v-if="item.icon">{{ item.icon }}</template>
          <span
            v-else
            v-bind="stylex.attrs(styles.text2)"
            :style="{ background: cssColor(item.color ?? props.color) }"
          />
        </span>
        <span v-bind="stylex.attrs(styles.text3)">
          <span v-bind="stylex.attrs(styles.row4)">
            <span v-bind="stylex.attrs(styles.text4)">{{ item.title }}</span>
            <span v-if="item.time" v-bind="stylex.attrs(styles.text5)">{{ item.time }}</span>
          </span>
          <span v-if="item.body" v-bind="stylex.attrs(styles.text6)">{{ item.body }}</span>
        </span>
      </component>
    </div>
  </div>
</template>

<style scoped>
.dk-ns-fade-enter-active,
.dk-ns-fade-leave-active {
  transition: opacity 160ms ease;
}
.dk-ns-fade-enter-from,
.dk-ns-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dk-ns-fade-enter-active,
  .dk-ns-fade-leave-active {
    transition: none;
  }
}
</style>
