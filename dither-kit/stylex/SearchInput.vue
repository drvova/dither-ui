<!-- Generated from ../tailwind/SearchInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  icon: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "0.625rem",
    zIndex: "10",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    color: "var(--muted-foreground)",
  },
  input: {
    paddingRight: "2rem",
    paddingLeft: "2rem",
    "::-webkit-search-cancel-button": { appearance: "none" },
  },
  button: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.375rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { type StyleProp } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Search field: leading glyph, one-click clear (shown only when there is
 * something to clear), Escape empties the field. */
const props = defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "clear"): void
}>()
</script>

<template>
  <div v-bind="stylex.attrs(styles.frame)">
    <Icon name="Search" :size="14" :xstyle="styles.icon" />
    <DitherInput
      v-bind="$attrs"
      type="search"
      :model-value="props.modelValue ?? ''"
      :placeholder="props.placeholder ?? 'Search…'"
      :disabled="props.disabled"
      :xstyle="[styles.input, props.xstyle, props.class]"
      @update:model-value="emit('update:modelValue', $event)"
      @keydown.esc.stop="
        () => {
          emit('update:modelValue', '')
          emit('clear')
        }
      "
    />
    <button
      v-if="props.modelValue"
      type="button"
      aria-label="Clear search"
      v-bind="stylex.attrs(styles.button)"
      @click="
        () => {
          emit('update:modelValue', '')
          emit('clear')
        }
      "
    >
      <Icon name="Close" :size="13" />
    </button>
  </div>
</template>
