<!-- Generated from ../tailwind/IconPicker.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  input: {
    minHeight: "2rem",
    width: "100%",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":focus-visible": "color-mix(in oklab, var(--accent) 70%, transparent)",
    },
    backgroundColor: "transparent",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    fontSize: "12.5px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--muted-foreground)" },
    transitionProperty: { default: null, "@media (prefers-reduced-motion: reduce)": "none" },
  },
  grid2: {
    display: "grid",
    maxHeight: "12rem",
    gridTemplateColumns: {
      default: "repeat(6, minmax(0, 1fr))",
      "@media (width >= 40rem)": "repeat(8, minmax(0, 1fr))",
    },
    gap: "0.25rem",
    overflow: "auto",
  },
  label: {
    display: "grid",
    aspectRatio: "1 / 1",
    cursor: "pointer",
    placeItems: "center",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  label2: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  label3: {
    borderColor: {
      default: "transparent",
      ":hover": { default: null, "@media (hover: hover)": "var(--border)" },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  input2: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  p: {
    gridColumn: "1 / -1",
    paddingInline: "0.25rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { ICONS } from "../engine/icons"
import Icon from "./Icon.vue"

/** Icon picker over the kit's own glyph set: a filter field over the names
 * and a radio grid (native radio semantics — arrow keys navigate the whole
 * grid, one tab stop). Value = the icon name. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    size?: number
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Filter icons…", size: 16, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const query = ref("")
const names = Object.keys(ICONS) as Array<keyof typeof ICONS> // Object.keys widens to string

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q === "" ? names : names.filter((n) => n.toLowerCase().includes(q))
})
</script>

<template>
  <div :class="cn(styles.grid, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)">
    <input
      v-model="query"
      type="search"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      v-bind="stylex.attrs(styles.input)"
    />
    <div v-bind="stylex.attrs(styles.grid2)">
      <label
        v-for="name in filtered"
        :key="name"
        :title="name"
        :class="cn(styles.label, modelValue === name ? styles.label2 : styles.label3)"
      >
        <input
          v-bind="stylex.attrs(styles.input2)"
          type="radio"
          name="dk-icon-picker"
          :aria-label="name"
          :value="name"
          :checked="modelValue === name"
          :disabled="props.disabled"
          @change="emit('update:modelValue', name)"
        />
        <Icon :name="name" :size="props.size" />
      </label>
      <p v-if="filtered.length === 0" v-bind="stylex.attrs(styles.p)">No icons match “{{ query }}”</p>
    </div>
  </div>
</template>
