<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"
import Icon from "./Icon.vue"

/** Tags as chips in one field: Enter or comma commits, Backspace on an empty
 * input pulls the last chip back in, per-chip × removes. Trimmed, case-
 * deduped, `max`-capped (the oldest chip stays put when full). */
const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    placeholder?: string
    max?: number
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Add tag…", max: Infinity, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

const draft = ref("")

function add(raw: string) {
  const tag = raw.trim()
  if (!tag || props.disabled) return
  const current = props.modelValue ?? []
  if (current.length >= props.max) return
  if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) {
    draft.value = ""
    return
  }
  emit("update:modelValue", [...current, tag])
  draft.value = ""
}

function remove(index: number) {
  const next = (props.modelValue ?? []).filter((_, i) => i !== index)
  emit("update:modelValue", next)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault()
    add(draft.value)
  } else if (e.key === "Backspace" && draft.value === "") {
    const current = props.modelValue ?? []
    if (current.length > 0) remove(current.length - 1)
  }
}
</script>

<template>
  <div
    :class="
      cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20 motion-reduce:transition-none',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
  >
    <span
      v-for="(tag, i) in props.modelValue ?? []"
      :key="`${tag}-${i}`"
      class="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-1.5 py-0.5 text-[12px]"
    >
      {{ tag }}
      <button
        type="button"
        :aria-label="`Remove ${tag}`"
        class="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        @click="remove(i)"
      >
        <Icon name="Close" :size="10" />
      </button>
    </span>
    <input
      v-if="!props.disabled"
      v-model="draft"
      :placeholder="(props.modelValue ?? []).length === 0 ? props.placeholder : ''"
      class="min-w-20 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
      @keydown="onKeydown"
      @blur="add(draft)"
    />
  </div>
</template>
