<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
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

const open = ref(false)
const highlighted = ref(-1)

const selected = computed(
  () => props.options.find((o) => o.value === props.modelValue) ?? null
)
const marker = computed(() => cssColor(props.color))

const query = ref(selected.value?.label ?? "")
watch(
  () => props.modelValue,
  () => {
    query.value = selected.value?.label ?? ""
  }
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function openPanel() {
  open.value = true
  const i = filtered.value.findIndex(
    (o) => o.value === props.modelValue && !o.disabled
  )
  highlighted.value = i >= 0 ? i : filtered.value.findIndex((o) => !o.disabled)
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  highlighted.value = filtered.value.findIndex((o) => !o.disabled)
}

function pick(o: Option) {
  if (o.disabled) return
  emit("update:modelValue", o.value)
  query.value = o.label
  open.value = false
}

/** Blur / Escape — snap the text back to the last valid value. */
function revert() {
  open.value = false
  query.value = selected.value?.label ?? ""
}

function move(dir: number) {
  const list = filtered.value
  const n = list.length
  let i = highlighted.value
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!list[i].disabled) {
      highlighted.value = i
      return
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
    if (!open.value) openPanel()
    else move(e.key === "ArrowDown" ? 1 : -1)
  } else if (e.key === "Enter") {
    if (!open.value) return
    e.preventDefault()
    const o = filtered.value[highlighted.value]
    if (o) pick(o)
  } else if (e.key === "Escape" && open.value) {
    e.preventDefault()
    revert()
  }
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <input
      type="text"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :value="query"
      class="w-full rounded-md border border-border bg-background/60 px-3 py-2 pr-8 font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      @input="onInput"
      @click="open || openPanel()"
      @keydown="onKeydown"
      @blur="revert"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
      >▾</span
    >
    <div
      v-if="open"
      role="listbox"
      class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1"
    >
      <div
        v-if="!filtered.length"
        class="px-2 py-1.5 text-[12px] text-muted-foreground italic"
      >
        no matches
      </div>
      <div
        v-for="(o, i) in filtered"
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
        @pointerdown.prevent="pick(o)"
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
