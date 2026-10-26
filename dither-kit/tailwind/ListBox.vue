<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

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
    :class="
      cn(
        'grid max-h-56 w-full overflow-auto rounded-md border border-border bg-background/60 p-1 outline-none focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
    @keydown="onKeydown"
  >
    <li
      v-for="(option, i) in props.options"
      :id="optionId(i)"
      :key="option"
      role="option"
      :aria-selected="option === props.value"
      class="cursor-pointer rounded px-2.5 py-1.5 text-[13px] transition-colors motion-reduce:transition-none"
      :class="
        option === props.value
          ? 'bg-accent/15 text-foreground'
          : i === active
            ? 'bg-accent/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground'
      "
      @mousemove="active = i"
      @click="choose(i)"
    >
      {{ option }}
    </li>
  </ul>
</template>
