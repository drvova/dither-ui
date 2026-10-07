<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

/** Year + twelve-month grid: model is `YYYY-MM`, arrows roam the grid,
 * PageUp/PageDown shift the year, the current month gets a ring. */
const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string }>(),
  { modelValue: "", disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function parse(v: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(v)
  const now = new Date()
  return m
    ? { year: Number(m[1]), month: Number(m[2]) - 1 }
    : { year: now.getFullYear(), month: now.getMonth() }
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
  else if (e.key === "ArrowUp") next = (active.value + 9) % 12 // three columns
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
  <div
    :class="
      cn(
        'w-56 rounded-md border border-border bg-background/60 p-2',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
  >
    <div class="mb-1.5 flex items-center justify-between px-1">
      <button
        type="button"
        aria-label="Previous year"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        @click="shiftYear(-1)"
      >
        ‹
      </button>
      <span class="text-[13px] font-medium tabular-nums">{{ year }}</span>
      <button
        type="button"
        aria-label="Next year"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        @click="shiftYear(1)"
      >
        ›
      </button>
    </div>
    <div
      role="group"
      :aria-label="`Months of ${year}`"
      class="grid grid-cols-3 gap-1"
      @keydown="onKeydown"
    >
      <button
        v-for="(label, m) in MONTHS"
        :key="label"
        type="button"
        :tabindex="m === active ? 0 : -1"
        :aria-pressed="iso(m) === props.modelValue"
        class="rounded px-1 py-2 text-[12px] transition-colors motion-reduce:transition-none"
        :class="
          iso(m) === props.modelValue
            ? 'bg-accent/20 text-foreground ring-1 ring-accent/60'
            : m === now.getMonth() && year === now.getFullYear()
              ? 'text-foreground ring-1 ring-foreground/30 hover:bg-accent/10'
              : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
      "
        @click="choose(m)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>
