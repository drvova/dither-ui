<!-- Generated from ../tailwind/ListBox.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  ul: {
    display: "grid",
    maxHeight: "14rem",
    width: "100%",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus-visible": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.25rem",
    outlineStyle: "none",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  li: {
    cursor: "pointer",
    borderRadius: "0.25rem",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "13px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  li2: {
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  bgAccent10: {
    backgroundColor: "color-mix(in oklab, var(--accent) 10%, transparent)",
    color: "var(--foreground)",
  },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

/** Single-select listbox with roving focus (the WAI-ARIA keyboard contract):
 * arrows move, Home/End jump, Enter/Space select, the active option carries
 * `aria-activedescendant`. Options are plain strings; `value` is the picked
 * one. Emits `select` on commit so click-vs-keyboard converge. */
const props = withDefaults(
  defineProps<{
    options?: string[]
    value?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { options: () => [], disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "select", value: string): void
}>()

const active = ref(-1)
const rootId = `dk-listbox-${Math.random().toString(36).slice(2, 9)}`

function optionId(i: number): string {
  return `${rootId}-opt-${i}`
}

function choose(i: number) {
  const option = props.options[i]
  if (option === undefined) return
  active.value = i
  emit("update:modelValue", option)
  emit("select", option)
}

function onKeydown(e: KeyboardEvent) {
  if (props.options.length === 0) return
  if (e.key === "ArrowDown") {
    e.preventDefault()
    active.value = Math.min(props.options.length - 1, active.value + 1)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    active.value = Math.max(0, active.value - 1)
  } else if (e.key === "Home") {
    e.preventDefault()
    active.value = 0
  } else if (e.key === "End") {
    e.preventDefault()
    active.value = props.options.length - 1
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    if (active.value >= 0) choose(active.value)
  } else {
    return
  }
}

const describedBy = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))
</script>

<template>
  <ul
    role="listbox"
    :aria-activedescendant="describedBy"
    :aria-disabled="props.disabled || undefined"
    :tabindex="props.disabled ? -1 : 0"
    :class="cn(styles.ul, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)"
    @keydown="onKeydown"
  >
    <li
      v-for="(option, i) in props.options"
      :id="optionId(i)"
      :key="option"
      role="option"
      :aria-selected="option === props.value"
      :class="
        cn(
          styles.li,
          option === props.value ? styles.li2 : i === active ? styles.bgAccent10 : styles.textMutedForeground,
        )
      "
      @mousemove="active = i"
      @click="choose(i)"
    >
      {{ option }}
    </li>
  </ul>
</template>
