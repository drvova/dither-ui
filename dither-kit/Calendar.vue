<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { cn } from "./lib"

/** Month grid calendar: real grid semantics (`role="grid"`, arrows move the
 * day, PageUp/PageDown change month, Home/End jump to week edges), ISO
 * YYYY-MM-DD model so timezone math never enters the picture. Today gets a
 * ring, the selected day gets the fill. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    min?: string
    max?: string
    disabled?: boolean
    class?: string
  }>(),
  { modelValue: "", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "select", value: string): void
}>()

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function parseISO(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
function clampISO(iso: string): string {
  if (props.min && iso < props.min) return props.min
  if (props.max && iso > props.max) return props.max
  return iso
}

const cursor = ref(parseISO(props.modelValue) ?? new Date())
const view = computed(() => ({ year: cursor.value.getFullYear(), month: cursor.value.getMonth() }))

const MONTH_LABEL = computed(() =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(cursor.value),
)

const today = toISO(new Date())

const weeks = computed(() => {
  const first = new Date(view.value.year, view.value.month, 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  const rows: Array<Array<{ iso: string; day: number; inMonth: boolean }>> = []
  const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const row: Array<{ iso: string; day: number; inMonth: boolean }> = []
    for (let d = 0; d < 7; d++) {
      row.push({
        iso: toISO(cur),
        day: cur.getDate(),
        inMonth: cur.getMonth() === view.value.month,
      })
      cur.setDate(cur.getDate() + 1)
    }
    rows.push(row)
  }
  return rows
})

function isDisabled(iso: string): boolean {
  return (props.min && iso < props.min) || (props.max && iso > props.max) || props.disabled
    ? true
    : false
}

function moveMonth(delta: number) {
  cursor.value = new Date(view.value.year, view.value.month + delta, 1)
}

function pick(iso: string) {
  if (isDisabled(iso)) return
  emit("update:modelValue", iso)
  emit("select", iso)
}

function onKeydown(e: KeyboardEvent) {
  const base = parseISO(props.modelValue) ?? cursor.value
  const d = new Date(base)
  let moved = false
  if (e.key === "ArrowLeft") moved = (d.setDate(d.getDate() - 1), true)
  else if (e.key === "ArrowRight") moved = (d.setDate(d.getDate() + 1), true)
  else if (e.key === "ArrowUp") moved = (d.setDate(d.getDate() - 7), true)
  else if (e.key === "ArrowDown") moved = (d.setDate(d.getDate() + 7), true)
  else if (e.key === "PageUp") moved = (d.setMonth(d.getMonth() - 1), true)
  else if (e.key === "PageDown") moved = (d.setMonth(d.getMonth() + 1), true)
  else if (e.key === "Home") moved = (d.setDate(d.getDate() - ((d.getDay() + 6) % 7)), true)
  else if (e.key === "End") {
    moved = (d.setDate(d.getDate() + (6 - ((d.getDay() + 6) % 7))), true)
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    pick(clampISO(toISO(base)))
    return
  } else return
  if (!moved) return
  e.preventDefault()
  const next = clampISO(toISO(d))
  cursor.value = parseISO(next) ?? cursor.value
  if (!isDisabled(next) && next !== props.modelValue) emit("update:modelValue", next)
}

// a model that moves outside the visible month re-centers the grid
watch(
  () => props.modelValue,
  (v) => {
    const d = parseISO(v)
    if (!d) return
    if (d.getFullYear() !== cursor.value.getFullYear() || d.getMonth() !== cursor.value.getMonth()) {
      cursor.value = d
    }
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'w-64 rounded-md border border-border bg-background/60 p-2',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
  >
    <div class="mb-1 flex items-center justify-between px-1">
      <button
        type="button"
        aria-label="Previous month"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        @click="moveMonth(-1)"
      >
        ‹
      </button>
      <span class="text-[13px] font-medium">{{ MONTH_LABEL }}</span>
      <button
        type="button"
        aria-label="Next month"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        @click="moveMonth(1)"
      >
        ›
      </button>
    </div>
    <div role="grid" :aria-label="MONTH_LABEL" class="grid grid-cols-7 gap-0.5" @keydown="onKeydown">
      <span
        v-for="wd in WEEKDAYS"
        :key="wd"
        role="columnheader"
        class="py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground"
        >{{ wd }}</span
      >
      <template v-for="(row, wi) in weeks" :key="wi">
        <button
          v-for="cell in row"
          :id="`dk-cal-${cell.iso}`"
          :key="cell.iso"
          type="button"
          role="gridcell"
          :tabindex="cell.iso === (props.modelValue || today) ? 0 : -1"
          :aria-selected="cell.iso === props.modelValue"
          :aria-current="cell.iso === today ? 'date' : undefined"
          :disabled="isDisabled(cell.iso)"
          class="aspect-square rounded text-[12px] tabular-nums transition-colors motion-reduce:transition-none"
          :class="
            cell.iso === props.modelValue
              ? 'bg-accent/20 text-foreground ring-1 ring-accent/60'
              : cell.iso === today
                ? 'text-foreground ring-1 ring-foreground/30'
                : cell.inMonth
                  ? 'text-foreground/90 hover:bg-accent/10'
                  : 'text-muted-foreground/50 hover:bg-accent/10'
          "
          @click="pick(cell.iso)"
        >
          {{ cell.day }}
        </button>
      </template>
    </div>
  </div>
</template>
