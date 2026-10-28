<!-- Generated from ../tailwind/DatePicker.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  button: {
    display: "flex",
    minHeight: "2.5rem",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "color-mix(in oklab, var(--accent) 70%, transparent)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--muted-foreground)" },
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(2px + 0px) color-mix(in oklab, var(--accent) 20%, transparent)",
    },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  text: { flex: "1" },
  text2: { color: "var(--muted-foreground)" },
  icon: { flexShrink: "0", color: "var(--muted-foreground)" },
  layer: {
    position: "absolute",
    top: "100%",
    left: "0px",
    zIndex: "30",
    marginTop: "0.25rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import ClickOutside from "./ClickOutside.vue"
import Calendar from "./Calendar.vue"
import Icon from "./Icon.vue"

/** Date field + calendar popover: the input shows the ISO value in a human
 * format, the calendar opens on click/focus, select closes, Escape and
 * outside-click dismiss (ClickOutside, capture-phase). The model stays ISO
 * YYYY-MM-DD. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    min?: string
    max?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "YYYY-MM-DD", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "select", value: string): void
}>()

const open = ref(false)

const human = computed(() => {
  if (!props.modelValue) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) return props.modelValue
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${props.modelValue}T00:00:00`),
  )
})

function onSelect(value: string) {
  emit("select", value)
  open.value = false
}
</script>

<template>
  <ClickOutside :enabled="open" @outside="open = false">
    <div :class="cn(styles.frame, props.xstyle, props.class)" @keydown.esc.stop="open = false">
      <button
        type="button"
        :disabled="props.disabled"
        aria-haspopup="dialog"
        :aria-expanded="open"
        v-bind="stylex.attrs(styles.button)"
        @click="open = !open"
        @focus="open = true"
      >
        <span :class="cn(styles.text, !props.modelValue && styles.text2)">
          {{ human || props.placeholder }}
        </span>
        <Icon name="Calendar" :size="14" :xstyle="styles.icon" />
      </button>
      <div v-if="open" role="dialog" aria-label="Pick a date" v-bind="stylex.attrs(styles.layer)">
        <Calendar
          :model-value="props.modelValue"
          :min="props.min"
          :max="props.max"
          @update:model-value="emit('update:modelValue', $event)"
          @select="onSelect"
        />
      </div>
    </div>
  </ClickOutside>
</template>
