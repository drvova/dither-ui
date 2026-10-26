<!-- Generated from ../tailwind/MultiSelect.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
  row: { display: "flex", flexWrap: "wrap", gap: "0.375rem" },
  row2: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "12px",
  },
  button: {
    borderRadius: "0.25rem",
    padding: "0.125rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  input: { minHeight: "2rem", paddingBlock: "0.25rem" },
  ul: { display: "grid", maxHeight: "11rem", gap: "0.125rem", overflow: "auto" },
  li: {
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  label: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "13px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  label2: { color: "var(--foreground)" },
  label3: { color: "var(--muted-foreground)" },
  input2: { width: "0.875rem", height: "0.875rem", accentColor: "currentColor" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Multi-select as chips + a filterable option list: native checkboxes carry
 * semantics (keyboard for free), the query narrows the pool, selected chips
 * stay visible and individually removable. `value` is the picked set. */
const props = withDefaults(
  defineProps<{
    options?: string[]
    value?: string[]
    placeholder?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Search…", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
  (e: "search", query: string): void
}>()

const query = ref("")

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const pool = props.options ?? []
  return q === "" ? pool : pool.filter((o) => o.toLowerCase().includes(q))
})
const selected = computed(() => props.value ?? [])

function isChecked(option: string): boolean {
  return selected.value.includes(option)
}

function toggle(option: string, checked: boolean) {
  const next = checked ? [...selected.value, option] : selected.value.filter((o) => o !== option)
  emit("update:modelValue", next)
}

function remove(option: string) {
  emit(
    "update:modelValue",
    selected.value.filter((o) => o !== option),
  )
}
</script>

<template>
  <div :class="cn(styles.grid, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)">
    <div v-if="selected.length > 0" v-bind="stylex.attrs(styles.row)">
      <span v-for="option in selected" :key="option" v-bind="stylex.attrs(styles.row2)">
        {{ option }}
        <button
          type="button"
          :aria-label="`Remove ${option}`"
          v-bind="stylex.attrs(styles.button)"
          @click="remove(option)"
        >
          <Icon name="Close" :size="10" />
        </button>
      </span>
    </div>

    <DitherInput
      v-model="query"
      type="search"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :xstyle="styles.input"
      @update:model-value="emit('search', $event)"
    />

    <ul v-bind="stylex.attrs(styles.ul)">
      <li v-if="filtered.length === 0" v-bind="stylex.attrs(styles.li)">No matches</li>
      <li v-for="option in filtered" :key="option">
        <label :class="cn(styles.label, isChecked(option) ? styles.label2 : styles.label3)">
          <input
            type="checkbox"
            v-bind="stylex.attrs(styles.input2)"
            :checked="isChecked(option)"
            :disabled="props.disabled"
            @change="toggle(option, ($event.target as HTMLInputElement).checked)"
          />
          {{ option }}
        </label>
      </li>
    </ul>
  </div>
</template>
