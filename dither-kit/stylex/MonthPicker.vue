<!-- Generated from ../tailwind/MonthPicker.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    width: "14rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  row: {
    marginBottom: "0.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "0.25rem",
  },
  button: {
    borderRadius: "0.25rem",
    padding: "0.375rem",
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
  text: { fontSize: "13px", fontWeight: "500", fontVariantNumeric: "   tabular-nums " },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.25rem" },
  button2: {
    borderRadius: "0.25rem",
    paddingInline: "0.25rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button3: {
    backgroundColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
    color: "var(--foreground)",
    boxShadow: "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--accent) 60%, transparent)",
  },
  textForeground: {
    color: "var(--foreground)",
    boxShadow: "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 30%, transparent)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

/** Year + twelve-month grid: model is `YYYY-MM`, arrows roam the grid,
 * PageUp/PageDown shift the year, the current month gets a ring. */
const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string; xstyle?: StyleProp }>(),
  {
    modelValue: "",
    disabled: false,
  },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parse(v: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(v)
  const now = new Date()
  return m ? { year: Number(m[1]), month: Number(m[2]) - 1 } : { year: now.getFullYear(), month: now.getMonth() }
}

const parsed = computed(() => parse(props.modelValue))
const year = ref(parsed.value.year)
const active = ref(parsed.value.month)
const now = new Date()

function iso(month: number, y = year.value): string {
  return `${y}-${String(month + 1).padStart(2, "0")}`
}

function shiftYear(delta: number) {
  year.value += delta
}

function choose(month: number) {
  active.value = month
  emit("update:modelValue", iso(month))
}

function onKeydown(e: KeyboardEvent) {
  let next = active.value
  if (e.key === "ArrowLeft") next = (active.value + 11) % 12
  else if (e.key === "ArrowRight") next = (active.value + 1) % 12
  else if (e.key === "ArrowUp")
    next = (active.value + 9) % 12 // three columns
  else if (e.key === "ArrowDown") next = (active.value + 3) % 12
  else if (e.key === "PageUp") {
    e.preventDefault()
    shiftYear(-1)
    return
  } else if (e.key === "PageDown") {
    e.preventDefault()
    shiftYear(1)
    return
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    choose(active.value)
    return
  } else return
  e.preventDefault()
  active.value = next
  emit("update:modelValue", iso(next))
}
</script>

<template>
  <div :class="cn(styles.box, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)">
    <div v-bind="stylex.attrs(styles.row)">
      <button type="button" aria-label="Previous year" v-bind="stylex.attrs(styles.button)" @click="shiftYear(-1)">
        ‹
      </button>
      <span v-bind="stylex.attrs(styles.text)">{{ year }}</span>
      <button type="button" aria-label="Next year" v-bind="stylex.attrs(styles.button)" @click="shiftYear(1)">›</button>
    </div>
    <div role="group" :aria-label="`Months of ${year}`" v-bind="stylex.attrs(styles.grid)" @keydown="onKeydown">
      <button
        v-for="(label, m) in MONTHS"
        :key="label"
        type="button"
        :tabindex="m === active ? 0 : -1"
        :aria-pressed="iso(m) === props.modelValue"
        :class="
          cn(
            styles.button2,
            iso(m) === props.modelValue
              ? styles.button3
              : m === now.getMonth() && year === now.getFullYear()
                ? styles.textForeground
                : styles.textMutedForeground,
          )
        "
        @click="choose(m)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>
