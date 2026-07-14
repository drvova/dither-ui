<script lang="ts">
/** Shared option shape for the selection kit pieces. */
export type Option = { value: string; label: string; disabled?: boolean }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { cssColor } from "./palette"
import type { PixelColor } from "./pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string
    placeholder?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Select…", color: "blue", disabled: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const rootRef = ref<HTMLDivElement | null>(null)
const open = ref(false)
const highlighted = ref(-1)

const selected = computed(
  () => props.options.find((o) => o.value === props.modelValue) ?? null
)
const marker = computed(() => cssColor(props.color))

function openPanel() {
  open.value = true
  const i = props.options.findIndex(
    (o) => o.value === props.modelValue && !o.disabled
  )
  highlighted.value = i >= 0 ? i : props.options.findIndex((o) => !o.disabled)
}

function pick(o: Option) {
  if (o.disabled) return
  emit("update:modelValue", o.value)
  open.value = false
}

function move(dir: number) {
  const n = props.options.length
  let i = highlighted.value
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!props.options[i].disabled) {
      highlighted.value = i
      return
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault()
      openPanel()
    }
    return
  }
  if (e.key === "ArrowDown") {
    e.preventDefault()
    move(1)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    move(-1)
  } else if (e.key === "Enter") {
    e.preventDefault()
    const o = props.options[highlighted.value]
    if (o) pick(o)
  } else if (e.key === "Escape") {
    e.preventDefault()
    open.value = false
  }
}

function onOutside(e: PointerEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node))
    open.value = false
}

onMounted(() => document.addEventListener("pointerdown", onOutside))
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside))
</script>

<template>
  <div ref="rootRef" :class="cn('relative', props.class)">
    <button
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="props.disabled"
      class="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-left font-mono text-[13px] focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      @click="open ? (open = false) : openPanel()"
      @keydown="onKeydown"
    >
      <span :class="selected ? 'text-foreground' : 'text-muted-foreground'">
        {{ selected?.label ?? props.placeholder }}
      </span>
      <span aria-hidden="true" class="text-muted-foreground">▾</span>
    </button>
    <div
      v-if="open"
      role="listbox"
      class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1"
    >
      <div
        v-for="(o, i) in props.options"
        :key="o.value"
        role="option"
        :aria-selected="o.value === props.modelValue"
        :aria-disabled="o.disabled || undefined"
        class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-[12px]"
        :class="[
          i === highlighted && !o.disabled ? 'bg-background' : '',
          o.disabled
            ? 'cursor-default opacity-40'
            : o.value === props.modelValue || i === highlighted
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-background hover:text-foreground',
        ]"
        @pointerenter="!o.disabled && (highlighted = i)"
        @click="pick(o)"
      >
        <span>{{ o.label }}</span>
        <span
          v-if="o.value === props.modelValue"
          aria-hidden="true"
          class="size-2 shrink-0"
          :style="{ backgroundColor: marker, imageRendering: 'pixelated' }"
        />
      </div>
    </div>
  </div>
</template>
